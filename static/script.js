document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_BASE = 'http://localhost:5000/api'; // Python backend
    
    // --- State ---
    let appData = { sales: [] };

    // --- Selectors ---
    const mainDashboard = document.getElementById('main-dashboard');
    const hamburger = document.querySelector('.hamburger');
    const tabsContainer = document.querySelector('.tabs');
    const salesForm = document.getElementById('sales-form');
    const salesInputs = salesForm
        ? salesForm.querySelectorAll('input[name="data[quantity]"], input[name="data[unit_price]"], input[name="data[discount]"]')
        : [];

    // --- Toast Notification ---
    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-times-circle'}"></i><div class="toast-content"><span>${message}</span></div>`;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    };

    // --- API Calls ---
    const apiFetch = async (sheetName) => {
        const loadingSpinner = document.getElementById(`${sheetName}-loading`);
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');
        try {
            const response = await fetch(`${API_BASE}/${sheetName}`);
            if (!response.ok) throw new Error(`Network response was not ok for ${sheetName}`);
            return await response.json();
        } catch (error) {
            console.error(`Fetch Error for ${sheetName}:`, error);
            showToast(`Could not load ${sheetName} data. Using sample.`, 'error');
            return getSampleData(sheetName);
        } finally {
            if (loadingSpinner) loadingSpinner.classList.add('hidden');
        }
    };

    const apiPost = async (sheetName, formData) => {
        try {
            formData.append('timestamp', new Date().toISOString());
            const plainData = {};
            for (let [key, value] of formData.entries()) {
                plainData[key.replace(/^data\[(.+)\]$/, '$1')] = value;
            }
            const response = await fetch(`${API_BASE}/${sheetName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(plainData)
            });
            if (!response.ok) throw new Error('Failed to submit data');
            return await response.json();
        } catch (error) {
            console.error('Submit Error:', error);
            showToast('Failed to save data. Please check connection.', 'error');
            return null;
        }
    };

    // --- Tab Navigation ---
    window.showTab = (tabName) => {
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
        document.querySelector(`.tab-button[onclick="showTab('${tabName}')"]`).classList.add('active');
        tabsContainer.classList.remove('mobile-visible');
        loadTabData(tabName);
    };

    // --- Data Loading and Rendering ---
    const loadTabData = (tabName) => {
        switch (tabName) {
            case 'dashboard':
                updateDashboard();
                break;
            case 'sales':
                loadAndRender('sales', renderSales);
                break;
            case 'analytics':
                if (typeof renderAnalytics === 'function') renderAnalytics(appData);
                break;
            case 'tax':
                renderTax();
                break;
        }
    };

    const loadAndRender = async (sheetName, renderer) => {
        appData[sheetName] = await apiFetch(sheetName);
        renderer(appData[sheetName]);
        updateDashboard();
    };

    const renderSales = (data) => {
        const table = document.getElementById('sales-table');
        if (!table) return;
        const rows = data
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(sale => `
                <tr>
                    <td>${sale.sale_id || 'N/A'}</td>
                    <td>${sale.product || 'N/A'}</td>
                    <td>${parseInt(sale.quantity).toLocaleString()}</td>
                    <td>${sale.payment_method || 'N/A'}</td>
                    <td><strong>TSh ${parseFloat(sale.final_total || 0).toLocaleString()}</strong></td>
                    <td>${new Date(sale.timestamp).toLocaleDateString()}</td>
                </tr>
            `).join('');
        table.innerHTML = `<thead><tr><th>ID</th><th>Product</th><th>Qty</th><th>Payment</th><th>Total</th><th>Date</th></tr></thead><tbody>${rows}</tbody>`;
    };

    const updateDashboard = () => {
        const sales = appData.sales;
        if (!sales || sales.length === 0) return;

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const weeklySales = sales
            .filter(s => new Date(s.timestamp) > oneWeekAgo)
            .reduce((sum, s) => sum + parseFloat(s.final_total || 0), 0);

        const monthlySales = sales
            .filter(s => new Date(s.timestamp) > oneMonthAgo)
            .reduce((sum, s) => sum + parseFloat(s.final_total || 0), 0);

        const productCounts = sales.reduce((acc, sale) => {
            acc[sale.product] = (acc[sale.product] || 0) + parseInt(sale.quantity || 1);
            return acc;
        }, {});

        const topProduct = Object.keys(productCounts).length > 0
            ? Object.keys(productCounts).reduce((a, b) => productCounts[a] > productCounts[b] ? a : b)
            : '-';

        const weeklySalesElem = document.getElementById('weekly-sales');
        const monthlySalesElem = document.getElementById('monthly-sales');
        const topProductElem = document.getElementById('top-product');
        if (weeklySalesElem) weeklySalesElem.textContent = `TSh ${weeklySales.toLocaleString()}`;
        if (monthlySalesElem) monthlySalesElem.textContent = `TSh ${monthlySales.toLocaleString()}`;
        if (topProductElem) topProductElem.textContent = topProduct;
    };

    const renderTax = () => {
        const reminder = document.getElementById('vat-reminder');
        if (!reminder) return;
        const dayOfMonth = new Date().getDate();
        if (dayOfMonth >= 1 && dayOfMonth <= 7) {
            reminder.classList.remove('hidden');
        } else {
            reminder.classList.add('hidden');
        }
    };

    // --- Sale Calculation (now handled by backend) ---
    const updateCalculationUI = (calc) => {
        const setText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };
        if (!calc) {
            const calcElem = document.getElementById('sale-calculation');
            if (calcElem) calcElem.classList.add('hidden');
            return;
        }
        setText('subtotal', Number(calc.subtotal).toLocaleString());
        setText('discount-percent-display', Number(calc.discount_percent));
        setText('discount-amount', Number(calc.discount_amount).toLocaleString());
        setText('vat', Number(calc.vat).toLocaleString());
        setText('final-total', Number(calc.final_total).toLocaleString());
        const calcElem = document.getElementById('sale-calculation');
        if (calcElem) calcElem.classList.remove('hidden');
    };

    const fetchCalculation = async () => {
        if (!salesForm) return null;
        const qty = parseFloat(salesForm.querySelector('input[name="data[quantity]"]').value) || 0;
        const price = parseFloat(salesForm.querySelector('input[name="data[unit_price]"]').value) || 0;
        const discountPercent = parseFloat(salesForm.querySelector('input[name="data[discount]"]').value) || 0;
        if (qty === 0 || price === 0) {
            updateCalculationUI(null);
            return null;
        }
        try {
            const response = await fetch(`${API_BASE}/calculate-sale`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quantity: qty,
                    unit_price: price,
                    discount_percent: discountPercent
                })
            });
            if (!response.ok) throw new Error('Calculation failed');
            const calc = await response.json();
            updateCalculationUI(calc);
            return calc;
        } catch (err) {
            updateCalculationUI(null);
            return null;
        }
    };

    if (salesInputs && salesInputs.length > 0) {
        salesInputs.forEach(input => input.addEventListener('input', fetchCalculation));
    }

    if (salesForm) {
        salesForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const calc = await fetchCalculation();
            if (!calc) {
                showToast('Please fill Quantity and Price to record a sale.', 'error');
                return;
            }
            const formData = new FormData(salesForm);
            // Only send raw input, backend will calculate and return all fields
            if (!formData.get('sale_id')) {
                formData.set('sale_id', `S${Date.now().toString().slice(-7)}`);
            }
            formData.append('timestamp', new Date().toISOString());
            // Optionally, you can send calculation fields if backend expects them, or just rely on backend calculation
            const result = await apiPost('sales', formData);
            if (result) {
                showToast('Sale recorded!', 'success');
                salesForm.reset();
                updateCalculationUI(null);
                loadAndRender('sales', renderSales);
            }
        });
    }

    // --- Initial Load ---
    const init = () => {
        if (hamburger && tabsContainer) {
            hamburger.addEventListener('click', () => tabsContainer.classList.toggle('mobile-visible'));
        }
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab) loadTabData(activeTab.id);
    };

    init();
});

// --- Fallback Sample Data ---
function getSampleData(sheetName) {
    const samples = {
        sales: [
            { sale_id: 'S001', product: 'Rice 10kg', quantity: 1, payment_method: 'cash', final_total: '29500', timestamp: '2025-07-23T10:00:00Z' }
        ]
    };
    return samples[sheetName] || [];
}