from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='static')
CORS(app)  # Allow cross-origin requests

# Example sales data
sales_data = [
    {"sale_id": "S001", "product": "Rice 10kg", "quantity": 1, "payment_method": "cash", "final_total": "29500", "timestamp": "2025-07-23T10:00:00Z"},
    {"sale_id": "S002", "product": "Beans 5kg", "quantity": 2, "payment_method": "mpesa", "final_total": "18000", "timestamp": "2025-07-24T12:00:00Z"}
]

@app.route('/api/sales')
def get_sales():
    return jsonify(sales_data)

# Serve static files (JS, CSS, images, etc.)
@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory(app.static_folder, filename)

# Catch-all: serve index.html for all non-API routes (SPA support)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    # If the path is a file in static, serve it
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    # Otherwise, serve index.html (SPA entry point)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True)