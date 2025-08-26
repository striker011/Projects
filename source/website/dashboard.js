
  
  // Load from localStorage or fallback
let stocks = JSON.parse(localStorage.getItem('trackedStocks')) || [
    { symbol: "AAPL", entry: 130.00, current: 175.00 },
    { symbol: "GOOGL", entry: 100.00, current: 145.00 },
    { symbol: "TSLA", entry: 250.00, current: 275.00 }
  ];
  

// Handle add stock form
document.getElementById("addStockForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const symbol = document.getElementById("stockSymbol").value.toUpperCase();
    const entry = parseFloat(document.getElementById("entryValue").value);
    const current = parseFloat(document.getElementById("currentValue").value);
  
    if (!symbol || isNaN(entry) || isNaN(current)) return;
  
    stocks.push({ symbol, entry, current });
    saveStocks();
    renderDashboard();
    e.target.reset();
  });

  // Save to localStorage
function saveStocks() {
    localStorage.setItem('trackedStocks', JSON.stringify(stocks));
  }
  // Fill table
  const table = document.getElementById("stock-table");
  let totalValue = 0;
  
  stocks.forEach(stock => {
    const perf = (((stock.current - stock.entry) / stock.entry) * 100).toFixed(2);
    totalValue += stock.current;
  
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${stock.symbol}</td>
      <td>$${stock.entry}</td>
      <td>$${stock.current}</td>
      <td>${perf}%</td>
      <td><button onclick="showGraph('${stock.symbol}')">View</button></td>
    `;
    table.appendChild(row);
  });
  
  // Show total
  document.getElementById("total-value").textContent = `$${totalValue.toFixed(2)}`;
  
  // Pie chart
  const pieCtx = document.getElementById('pieChart').getContext('2d');
  new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: stocks.map(s => s.symbol),
      datasets: [{
        data: stocks.map(s => s.current),
        backgroundColor: ['#4caf50','#2196f3','#ff9800','#e91e63','#9c27b0']
      }]
    }
  });

  function renderDashboard() {
    // Clear and rebuild the stock list
    const stockList = document.getElementById("stock-list");
    stockList.innerHTML = "";
  
    let totalValue = 0;
    let labels = [];
    let values = [];
  
    stocks.forEach(stock => {
      const performance = (((stock.current - stock.entry) / stock.entry) * 100).toFixed(2);
      const value = stock.current;
      totalValue += value;
  
      labels.push(stock.symbol);
      values.push(value);
  
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${stock.symbol}</td>
        <td>$${stock.entry.toFixed(2)}</td>
        <td>$${stock.current.toFixed(2)}</td>
        <td class="${performance >= 0 ? 'positive' : 'negative'}">${performance}%</td>
        <td><button onclick="toggleGraph('${stock.symbol}')">📊</button></td>
      `;
      stockList.appendChild(row);
    });
  
    // Update total value and other visuals
    updateTotalValue(totalValue);
    updatePieChart(labels, values);
    updateTotalPerformanceChart(totalValue);
  }
  
  function updateTotalValue(totalValue) {
    document.getElementById("total-value").textContent = `$${totalValue.toFixed(2)}`;
  }

  // Mock total value over time (simulate last 10 days)
const historicalValues = Array.from({length: 10}, (_, i) =>
(totalValue * (1 + (Math.sin(i / 2) + Math.random() * 0.1) * 0.05)).toFixed(2)
);

// Calculate % change
const firstValue = parseFloat(historicalValues[0]);
const lastValue = parseFloat(historicalValues[historicalValues.length - 1]);
const changePercent = (((lastValue - firstValue) / firstValue) * 100).toFixed(2);

const changeLabel = document.getElementById('total-change');
changeLabel.textContent = `${changePercent > 0 ? '+' : ''}${changePercent}%`;
changeLabel.classList.add(changePercent >= 0 ? 'positive' : 'negative');

// Draw line chart for total asset value
const totalChartCtx = document.getElementById('totalChart').getContext('2d');
new Chart(totalChartCtx, {
type: 'line',
data: {
  labels: Array.from({length: 10}, (_, i) => `Day ${i + 1}`),
  datasets: [{
    label: 'Total Value',
    data: historicalValues,
    fill: true,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderColor: '#2196f3',
    tension: 0.3
  }]
},
options: {
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      ticks: {
        callback: value => `$${value}`
      }
    }
  }
}
});
  
  // Graph display
  function showGraph(symbol) {
    const chartContainer = document.getElementById("graph-container");
    chartContainer.classList.remove("hidden");
  
    const ctx = document.getElementById('stockChart').getContext('2d');
    if (window.stockChartInstance) window.stockChartInstance.destroy();
  
    const mockPrices = Array.from({length: 10}, () => Math.random() * 100 + 100);
    window.stockChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [...Array(10).keys()],
        datasets: [{
          label: symbol + " Price",
          data: mockPrices,
          fill: false,
          borderColor: "#2196f3"
        }]
      }
    });
  }
  
  function toggleGraph() {
    document.getElementById("graph-container").classList.add("hidden");
  }
  
  // Drag-and-drop modules
  document.querySelectorAll('.module').forEach(module => {
    module.addEventListener('dragstart', e => {
      e.dataTransfer.setData("text/plain", e.target.id);
    });
  });
  
  document.querySelector('.dashboard').addEventListener('dragover', e => e.preventDefault());
  
  document.querySelector('.dashboard').addEventListener('drop', e => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const dragged = document.getElementById(id);
    e.target.closest('.dashboard').appendChild(dragged);
  });
  