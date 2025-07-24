// ===============================================
// Kivuyo360 -  Analytics Module
// ===============================================

let activeCharts = {};

function destroyAllCharts() {
    Object.values(activeCharts).forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });
    activeCharts = {};
}

function renderAnalytics(appData) {
    destroyAllCharts();
    if (!appData) {
        console.error("Analytics data not available.");
        return;
    }
    setupSalesOverTimeChart(appData.sales);
    setupSalesByProductChart(appData.sales);
}

// Helper options object to be reused by all charts
const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false, // THIS IS THE KEY FIX
    plugins: {
        legend: {
            position: 'top',
        },
    },
};

function setupSalesOverTimeChart(sales = []) {
    const ctx = document.getElementById('salesOverTimeChart');
    if (!ctx) return;
    sales.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const labels = sales.map(s => new Date(s.timestamp).toLocaleDateString());
    const data = sales.map(s => parseFloat(s.final_total || 0));
    
    activeCharts.salesOverTime = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{ label: 'Total Sales (TSh)', data: data, borderColor: '#006747', backgroundColor: 'rgba(0, 103, 71, 0.1)', fill: true, tension: 0.3 }]
        },
        options: { ...commonChartOptions, scales: { y: { beginAtZero: true } } }
    });
}

function setupSalesByProductChart(sales = []) {
    const ctx = document.getElementById('salesByProductChart');
    if (!ctx) return;
    const productSales = sales.reduce((acc, sale) => {
        const product = sale.product || 'Unknown';
        acc[product] = (acc[product] || 0) + parseInt(sale.quantity || 1);
        return acc;
    }, {});
    const sortedProducts = Object.entries(productSales).sort(([, a], [, b]) => b - a).slice(0, 10);
    const labels = sortedProducts.map(p => p[0]);
    const data = sortedProducts.map(p => p[1]);
    
    activeCharts.salesByProduct = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ label: 'Total Quantity Sold', data: data, backgroundColor: '#FF8C00', borderColor: '#E65100', borderWidth: 1 }]
        },
        options: { ...commonChartOptions, indexAxis: 'y', scales: { x: { beginAtZero: true } } }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    // Example data, replace with your real data from backend if needed
    const salesOverTimeLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const salesOverTimeData = [120000, 90000, 150000, 80000, 170000, 110000, 130000];

    const salesByProductLabels = ['Rice', 'Beans', 'Oil', 'Sugar', 'Salt'];
    const salesByProductData = [50, 30, 20, 15, 10];

    // Sales Over Time Chart
    const salesOverTimeCtx = document.getElementById('salesOverTimeChart');
    if (salesOverTimeCtx) {
        new Chart(salesOverTimeCtx, {
            type: 'line',
            data: {
                labels: salesOverTimeLabels,
                datasets: [{
                    label: 'Sales (TSh)',
                    data: salesOverTimeData,
                    borderColor: '#006747',
                    backgroundColor: 'rgba(0, 103, 71, 0.08)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 5,
                    pointBackgroundColor: '#006747'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'TSh ' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // Sales By Product Chart
    const salesByProductCtx = document.getElementById('salesByProductChart');
    if (salesByProductCtx) {
        new Chart(salesByProductCtx, {
            type: 'bar',
            data: {
                labels: salesByProductLabels,
                datasets: [{
                    label: 'Quantity Sold',
                    data: salesByProductData,
                    backgroundColor: [
                        '#006747', '#388E3C', '#FFA500', '#1976D2', '#D32F2F'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
});