"""
Local development server for the edgartools financials API.
Run with: python api/local_server.py
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import traceback
from urllib.parse import urlparse, parse_qs

# Import the fetch logic from financials.py
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from financials import fetch_financials


class LocalHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path != "/api/financials":
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Not found"}).encode())
            return

        params = parse_qs(parsed.query)
        ticker = params.get("ticker", [None])[0]
        years = int(params.get("years", ["5"])[0])

        if not ticker:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Missing 'ticker' parameter"}).encode())
            return

        ticker = ticker.upper().strip()
        years = max(1, min(years, 10))

        try:
            print(f"  Fetching {ticker} ({years} years)...")
            data = fetch_financials(ticker, years)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(data).encode())
            print(f"  Done! Income: {len(data['income_statement'])} items, Balance: {len(data['balance_sheet'])} items, CashFlow: {len(data['cash_flow'])} items")
        except ValueError as e:
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
            print(f"  Error: {e}")
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({
                "error": f"Internal server error: {str(e)}",
                "trace": traceback.format_exc()
            }).encode())
            print(f"  Error: {e}")
            traceback.print_exc()


if __name__ == "__main__":
    port = 3001
    server = HTTPServer(("0.0.0.0", port), LocalHandler)
    print(f"\n  edgartools API running at http://localhost:{port}")
    print(f"  Test: http://localhost:{port}/api/financials?ticker=AAPL&years=5\n")
    server.serve_forever()
