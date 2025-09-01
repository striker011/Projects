// Stock data initialization (with your real stocks as an example)
let stocks = JSON.parse(localStorage.getItem('trackedStocks')) || [
  { symbol: "SES", entry: 8.00, current: 8.00, quantity: 12, currency: "EUR" },  // SES S.A x12 entry at 8 EUR
  { symbol: "VANGUARD_FTSE_ALL_WORLD", entry: 120.00, current: 120.00, quantity: 20, currency: "EUR" }, // Vanguard FTSE x20 entry at 120 EUR
];

// Get latest stock value from API (simulating this in place of a real stock API)
async function fetchStockPrice(symbol) {
  const url = `https://api.example.com/stock/${symbol}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.price;  // Assume the API returns a price field
}

// Handle adding stock with automatic fetch
document.getElementById("addStockForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const symbol = document.getElementById("stockSymbol").value.toUpperCase();
  const entry = parseFloat(document.getElementById("entryValue").value);
  const current = await fetchStockPrice(symbol);  // Auto-fetch current stock value
  
  if (!symbol || isNaN(entry) || isNaN(current)) return;

  stocks.push({ symbol, entry, current, quantity: 1, currency: "EUR" }); // Default currency is EUR
  saveStocks();
  renderDashboard();
  e.target.reset();
});

// Handle currency change
function changeCurrency(newCurrency) {
  localStorage.setItem('currency', newCurrency);
  window.location.reload();  // Reload to fetch new prices in the selected currency
}

// Fetch the exchange rate for the selected currency
async function getExchangeRate(baseCurrency, targetCurrency) {
  const url = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.rates[targetCurrency];
}

// Convert stock values to selected currency
async function convertToCurrency() {
  const selectedCurrency = localStorage.getItem('currency') || "EUR";
  const exchangeRate = await getExchangeRate("EUR", selectedCurrency); // Convert from EUR
  stocks = stocks.map(stock => ({
    ...stock,
    current: (stock.current * exchangeRate).toFixed(2),
    entry: (stock.entry * exchangeRate).toFixed(2),
    currency: selectedCurrency,
  }));
}

// Save stock data to localStorage
function saveStocks() {
  localStorage.setItem('trackedStocks', JSON.stringify(stocks));
}

// Update total value with currency
async function updateTotalValue() {
  let totalValue = 0;
  let labels = [];
  let values = [];

  // Convert all stocks to the selected currency
  await convertToCurrency();

  stocks.forEach(stock => {
    totalValue += stock.current * stock.quantity;
    labels.push(stock.symbol);
    values.push(stock.current);
  });

  document.getElementById("total-value").textContent = `${totalValue} ${stocks[0].currency}`;
  updatePieChart(labels, values);
  updateTotalPerformanceChart(totalValue);
}

// Update pie chart with values in selected currency
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

// Render dashboard with live data and current currency
async function renderDashboard() {
  await updateTotalValue();
  const stockList = document.getElementById("stock-list");
  stockList.innerHTML = "";

  stocks.forEach((stock, index) => {
    const perf = (((stock.current - stock.entry) / stock.entry) * 100).toFixed(2);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${stock.symbol}</td>
      <td>${stock.entry} ${stock.currency}</td>
      <td>${stock.current} ${stock.currency}</td>
      <td class="${perf >= 0 ? 'positive' : 'negative'}">${perf}%</td>
      <td>
        <button onclick="showGraph('${stock.symbol}')">📊</button>
        <button onclick="removeStock(${index})">❌</button>
      </td>
    `;
    stockList.appendChild(row);
  });
}

// Initial render
renderDashboard();