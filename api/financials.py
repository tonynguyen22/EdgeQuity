"""
Vercel Python serverless function: /api/financials?ticker=AAPL&years=5

Fetches financial statements from SEC EDGAR using edgartools.
Returns standardized Income Statement, Balance Sheet, and Cash Flow data.
"""

from http.server import BaseHTTPRequestHandler
import json
import traceback
from urllib.parse import urlparse, parse_qs

# In-memory cache to avoid re-fetching during warm invocations
_cache: dict[str, dict] = {}


def _extract_statement_data(statement) -> list[dict]:
    """Convert an edgartools financial statement to a list of line-item dicts."""
    rows = []
    if statement is None:
        return rows
    try:
        df = statement.to_dataframe()
        if df is None or df.empty:
            return rows
        # Each row is a line item; columns are fiscal periods
        for label, row_data in df.iterrows():
            item = {"label": str(label), "values": {}}
            for col in df.columns:
                val = row_data[col]
                # Convert to float, handling None/NaN
                if val is None:
                    item["values"][str(col)] = None
                else:
                    try:
                        item["values"][str(col)] = float(val)
                    except (ValueError, TypeError):
                        item["values"][str(col)] = None
            rows.append(item)
    except Exception:
        # Fallback: try to iterate the statement directly
        try:
            for line_item in statement:
                item = {"label": str(line_item.concept) if hasattr(line_item, 'concept') else str(line_item), "values": {}}
                if hasattr(line_item, 'value'):
                    item["values"]["latest"] = float(line_item.value) if line_item.value is not None else None
                rows.append(item)
        except Exception:
            pass
    return rows


def _get_periods(statement) -> list[str]:
    """Extract period/column labels from a statement."""
    try:
        df = statement.to_dataframe()
        if df is not None and not df.empty:
            return [str(c) for c in df.columns]
    except Exception:
        pass
    return []


def fetch_financials(ticker: str, years: int = 5) -> dict:
    """Fetch financial statements for a ticker using edgartools."""
    cache_key = f"{ticker}_{years}"
    if cache_key in _cache:
        return _cache[cache_key]

    from edgar import Company, set_identity

    # SEC requires a User-Agent with contact info
    set_identity("ValuWise App support@valuwise.app")

    company = Company(ticker)

    # Get the latest 10-K filings
    filings_10k = company.get_filings(form="10-K")
    if filings_10k is None or len(filings_10k) == 0:
        raise ValueError(f"No 10-K filings found for {ticker}")

    # Get the most recent filing and its XBRL financial data
    latest_filings = filings_10k.latest(min(years, len(filings_10k)))

    # Try to get financials from the most recent filing first
    result = {
        "ticker": ticker,
        "company_name": str(company.name) if hasattr(company, 'name') else ticker,
        "cik": str(company.cik) if hasattr(company, 'cik') else "",
        "income_statement": [],
        "balance_sheet": [],
        "cash_flow": [],
        "periods": [],
    }

    try:
        # Try to get the XBRL object from the latest filing
        if hasattr(latest_filings, '__iter__'):
            # Multiple filings — use the first one for structure
            filing = list(latest_filings)[0] if not hasattr(latest_filings, 'obj') else latest_filings
        else:
            filing = latest_filings

        tenk = filing.obj() if hasattr(filing, 'obj') else filing
        financials = tenk.financials if hasattr(tenk, 'financials') else None

        if financials is not None:
            # Extract each statement (edgartools uses property accessors, not methods)
            try:
                income = financials.income_statement
                result["income_statement"] = _extract_statement_data(income)
                if not result["periods"] and income is not None:
                    result["periods"] = _get_periods(income)
            except Exception:
                pass

            try:
                balance = financials.balance_sheet
                result["balance_sheet"] = _extract_statement_data(balance)
                if not result["periods"] and balance is not None:
                    result["periods"] = _get_periods(balance)
            except Exception:
                pass

            try:
                cashflow = financials.cash_flow_statement
                result["cash_flow"] = _extract_statement_data(cashflow)
                if not result["periods"] and cashflow is not None:
                    result["periods"] = _get_periods(cashflow)
            except Exception:
                pass
    except Exception as e:
        # If XBRL extraction fails, try Company Facts API as fallback
        raise ValueError(f"Failed to extract financials for {ticker}: {str(e)}")

    if not result["income_statement"] and not result["balance_sheet"] and not result["cash_flow"]:
        raise ValueError(f"No financial data could be extracted for {ticker}")

    # Cache the result
    _cache[cache_key] = result
    return result


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        """Handle GET /api/financials?ticker=AAPL&years=5"""
        self.send_header("Access-Control-Allow-Origin", "*")

        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        ticker = params.get("ticker", [None])[0]
        years = int(params.get("years", ["5"])[0])

        if not ticker:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Missing 'ticker' parameter"}).encode())
            return

        ticker = ticker.upper().strip()
        years = max(1, min(years, 10))

        try:
            data = fetch_financials(ticker, years)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(data).encode())
        except ValueError as e:
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": f"Internal server error: {str(e)}",
                "trace": traceback.format_exc()
            }).encode())
