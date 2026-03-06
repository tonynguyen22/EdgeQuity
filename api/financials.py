"""Flask API — fetches standardized financials via edgartools.
Deploy on Render as a Web Service (Python).
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import traceback

# Set SEC EDGAR identity (required by edgartools / SEC fair-use policy)
identity = os.environ.get("EDGAR_IDENTITY", "valuwise-app admin@valuwise.app")

from edgar import set_identity, Company, MultiFinancials
set_identity(identity)

app = Flask(__name__)
CORS(app)


def _build_statement_items(df):
    """Convert an edgartools DataFrame to list of {label, values} dicts."""
    if df is None or df.empty:
        return [], []

    # Filter out abstract/header rows (they have no numeric data)
    if "abstract" in df.columns:
        df = df[~df["abstract"]].copy()

    # Identify value columns (not metadata columns)
    meta_cols = {"label", "level", "abstract", "parent_concept",
                 "parent_abstract_concept", "concept", "units", "decimals"}
    value_cols = [c for c in df.columns if c not in meta_cols]

    # Derive fiscal year labels from column names (e.g. "2024-09-28" -> "2024")
    period_map = {}
    for col in value_cols:
        try:
            year = str(col)[:4]
            period_map[col] = year
        except Exception:
            period_map[col] = str(col)

    # Build line items
    items = []
    seen_labels = set()
    for _, row in df.iterrows():
        lbl = str(row.get("label", "")).strip()
        if not lbl or lbl in seen_labels:
            continue
        seen_labels.add(lbl)

        values = {}
        for col in value_cols:
            raw = row.get(col)
            if raw is None or (isinstance(raw, float) and (raw != raw)):  # NaN check
                values[period_map[col]] = None
            else:
                try:
                    values[period_map[col]] = float(raw)
                except (ValueError, TypeError):
                    values[period_map[col]] = None
        items.append({"label": lbl, "values": values})

    periods = sorted(set(period_map.values()))
    return items, periods


@app.route("/api/financials")
def get_financials():
    ticker = (request.args.get("ticker", "") or "").strip().upper()

    if not ticker:
        return jsonify({"error": "Missing ?ticker= parameter"}), 400

    try:
        company = Company(ticker)

        # Get last 6 annual filings for multi-year view
        filings = company.get_filings(form="10-K").head(6)

        if len(filings) == 0:
            return jsonify({"error": f"No 10-K filings found for {ticker}"}), 404

        # Use MultiFinancials for multi-year stitched data
        multi = MultiFinancials.extract(filings)

        income_df = multi.income_statement().to_dataframe()
        balance_df = multi.balance_sheet().to_dataframe()
        cashflow_df = multi.cashflow_statement().to_dataframe()

        income_items, inc_periods = _build_statement_items(income_df)
        balance_items, bal_periods = _build_statement_items(balance_df)
        cashflow_items, cf_periods = _build_statement_items(cashflow_df)

        # Use the union of all periods, sorted
        all_periods = sorted(set(inc_periods) | set(bal_periods) | set(cf_periods))

        return jsonify({
            "ticker": ticker,
            "company_name": str(company.name) if hasattr(company, "name") else ticker,
            "cik": str(company.cik) if hasattr(company, "cik") else "",
            "income_statement": income_items,
            "balance_sheet": balance_items,
            "cash_flow": cashflow_items,
            "periods": all_periods,
        })

    except Exception as e:
        return jsonify({
            "error": str(e),
            "trace": traceback.format_exc(),
        }), 500


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
