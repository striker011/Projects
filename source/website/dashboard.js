// Load from localStorage or fallback
let stocks = JSON.parse(localStorage.getItem('trackedStocks')) || [
    { symbol: "AAPL", entry: 130.00, current: 175.00 },
    { symbol: "GOOGL", entry: 100.00, current: 145.00 },
    { symbol: "TSLA", entry: 250.00, current: 275.00 }
  ];
  
  let pieChartInstance;
  let totalChartInstance;
  
  // Save to localStorage
  function saveStocks() {
    localStorage.setItem('trackedStocks', JSON.stringify(stocks));
  }
  
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
  
  // Remove stock
  function removeStock(index) {
    if (confirm(`Are you sure you want to remove ${stocks[index].symbol}?`)) {
      stocks.splice(index, 1);
      saveStocks();
      renderDashboard();
    }
  }
  
  // Update total value display
  function updateTotalValue(totalValue) {
    document.getElementById("total-value").textContent = `$${totalValue.toFixed(2)}`;
  }
  
  // Update pie chart
  function updatePieChart(labels, values) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    if (pieChartInstance) pieChartInstance.destroy();
  
    pieChartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: ['#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0']
        }]
      }
    });
  }
  
  // Update total performance chart
  function updateTotalPerformanceChart(totalValue) {
    const historicalValues = Array.from({ length: 10 }, (_, i) =>
      (totalValue * (1 + (Math.sin(i / 2) + Math.random() * 0.1) * 0.05)).toFixed(2)
    );
  
    const first = parseFloat(historicalValues[0]);
    const last = parseFloat(historicalValues[historicalValues.length - 1]);
    const changePercent = (((last - first) / first) * 100).toFixed(2);
  
    const changeLabel = document.getElementById('total-change');
    changeLabel.textContent = `${changePercent > 0 ? '+' : ''}${changePercent}%`;
    changeLabel.className = changePercent >= 0 ? 'positive' : 'negative';
  
    const ctx = document.getElementById('totalChart').getContext('2d');
    if (totalChartInstance) totalChartInstance.destroy();
  
    totalChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array.from({ length: 10 }, (_, i) => `Day ${i + 1}`),
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
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { callback: val => `$${val}` } }
        }
      }
    });
  }
  
  // Render the dashboard
  function renderDashboard() {
    const stockList = document.getElementById("stock-list");
    stockList.innerHTML = "";
  
    let totalValue = 0;
    let labels = [];
    let values = [];
  
    stocks.forEach((stock, index) => {
      const perf = (((stock.current - stock.entry) / stock.entry) * 100).toFixed(2);
      totalValue += stock.current;
  
      labels.push(stock.symbol);
      values.push(stock.current);
  
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${stock.symbol}</td>
        <td>$${stock.entry.toFixed(2)}</td>
        <td>$${stock.current.toFixed(2)}</td>
        <td class="${perf >= 0 ? 'positive' : 'negative'}">${perf}%</td>
        <td>
          <button onclick="showGraph('${stock.symbol}')">📊</button>
          <button onclick="removeStock(${index})">❌</button>
        </td>
      `;
      stockList.appendChild(row);
    });
  
    updateTotalValue(totalValue);
    updatePieChart(labels, values);
    updateTotalPerformanceChart(totalValue);
  }
  
  // Show stock-specific graph
  function showGraph(symbol) {
    const chartContainer = document.getElementById("graph-container");
    chartContainer.classList.remove("hidden");
  
    const ctx = document.getElementById('stockChart').getContext('2d');
    if (window.stockChartInstance) window.stockChartInstance.destroy();
  
    const mockPrices = Array.from({ length: 10 }, () => Math.random() * 100 + 100);
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
  
  // Hide stock chart
  function toggleGraph() {
    document.getElementById("graph-container").classList.add("hidden");
  }
  
  // Drag and drop for modules
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
  
  // Initial render
  renderDashboard();
  