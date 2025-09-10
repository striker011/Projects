const data = ['Apple', 'Banana', 'Blueberry', 'Cherry', 'Grape', 'Lemon', 'Mango', 'Orange', 'Peach', 'Strawberry'];
let stock_loading = false;
// Stock data initialization (with your real stocks as an example)
let stocks = [      
  { symbol: "SESG.PAR", entry: 8.00, current: 8.00, quantity: 12, currency: "EUR" },
  { symbol: "VANGUARD_FTSE_ALL_WORLD", entry: 120.00, current: 133.00, quantity: 20, currency: "EUR" }
];


function searchBoxInit() {
  const searchBox = document.getElementById('search-box');
  const suggestionsList = document.getElementById('suggestions');
  const API_KEY = apiKey; // Replace with your real API key if available
  const BASE_URL = 'https://www.alphavantage.co/query?function=SYMBOL_SEARCH';

  let debounceTimeout;

  searchBox.addEventListener('input', () => {
    const input = searchBox.value.trim();

    clearTimeout(debounceTimeout);

    if (input === '') {
      suggestionsList.innerHTML = '';
      return;
    }

    // Debounce API call
    debounceTimeout = setTimeout(() => {
      fetch(`${BASE_URL}&keywords=${encodeURIComponent(input)}&apikey=${API_KEY}`)
        .then(response => response.json())
        .then(data => {
          suggestionsList.innerHTML = '';

          if (!data.bestMatches || data.bestMatches.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No matches found';
            suggestionsList.appendChild(li);
            return;
          }

          data.bestMatches.forEach(match => {
            const li = document.createElement('li');
            li.textContent = `${match["1. symbol"]} - ${match["2. name"]} (${match["4. region"]})`;
            li.addEventListener('click', () => {
              searchBox.value = match["1. symbol"];
              suggestionsList.innerHTML = '';
            });
            suggestionsList.appendChild(li);
          });
        })
        .catch(err => {
          console.error('Error fetching suggestions:', err);
        });
    }, 300); // delay to reduce API calls
  });

  // Close suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchBox.contains(e.target) && !suggestionsList.contains(e.target)) {
      suggestionsList.innerHTML = '';
    }
  });
}




let apiReturn = [];

//let apiKey = 'CD3OSDESE8WB6KOL';
let fetchQuery = 'query?function=';
let fetchTicker = 'TIME_SERIES_INTRADAY'
let fetchSymbolQuery = 'symbol='
let fetchSymbol = 'IBM'
let fetchIntervalQuery = 'interval=';
let fetchInterval = '5';
let fetchApi = 'apikey=';
let fetchURL = 'https://www.alphavantage.co/' 
let fetchURLTest =  'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&apikey=CD3OSDESE8WB6KOL';

async function getLatestPriceFromSymbol(symbol) {
  let url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data && data["Global Quote"] && data["Global Quote"]["05. price"]) {
      return parseFloat(data["Global Quote"]["05. price"]);
    } else {
      console.warn("No price data for symbol:", symbol);
      return null;
    }
  } catch (err) {
    console.error("Error fetching price for symbol", symbol, err);
    return null;
  }
}

function assembleFetch(){
  let url = `${fetchURL}${fetchQuery}${fetchTicker}&${fetchSymbolQuery}${fetchSymbol}&${fetchIntervalQuery}${fetchInterval}min&${fetchApi}${apiKey}`; 
  console.log(url);
  return url;
}
async function fetchData(url){
 try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Fetched data:', data);
    return data;
  } catch (error) {
    console.error('ERROR fetching the JSON:', error);
    return null; // Ensure something is returned even on error
  }
}

let pieChartInstance = null;let totalPerformanceChart = null;


function byId(id){ return document.getElementById(id); }

async function loadStocksFromDB() {
  await DB.initDB();
  const { store } = await DB.tx('stocks');
  stocks = await DB.getAll(store);
  renderDashboard(stocks);
}
async function removeStock(index) {
  const stockToRemove = stocks[index];
  const { store } = await DB.tx('stocks', 'readwrite');
  await DB.del(store, stockToRemove.isin);
  await loadStocksFromDB(); // Refresh view
}
async function addOrUpdateStock(stock) {
  const { store } = await DB.tx('stocks', 'readwrite');
  await DB.put(store, stock);
  await loadStocksFromDB();
}


async function exportDashboard(){
  const { store } = await DB.tx('stocks');
  const stocksToExport = await DB.getAll(store);
  const dataStr = JSON.stringify(stocksToExport, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'stocks_export.json';
  a.click();
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]);
}

async function importDashboard(file) {

  const text = await file.text();
  let importedStocks;


  try {
    importedStocks = JSON.parse(text);
    if (!Array.isArray(importedStocks)) throw new Error("Invalid format");
  } catch (e) {
    alert("Import failed: Invalid JSON");
    return;
  }

  // Fetch all prices in parallel and enrich stocks
  const enrichedStocks = await Promise.all(importedStocks.map(async (stock) => {
    if (stock.symbol) {
      stock.symbol = stock.symbol.replace(':', '.');
      try {
        const price = await withTimeout(getLatestPriceFromSymbol(stock.symbol), 5000);
        if (price !== null) {
          stock.current = parseFloat(price);
        }
      } catch (e) {
        console.warn(`Could not fetch price for ${stock.symbol}:`, e);
      }
    }
    return stock;
  }));

  const { store } = await DB.tx('stocks', 'readwrite');
  for (const stock of enrichedStocks) {
    if (stock.isin) {
      await DB.put(store, stock);
    }
  }
  /*for (const stock of importedStocks) {
    if (stock.isin) {
      DB.put(store, stock); // Not awaited (assumed put is sync-like within the transaction)
    }
  }
  */
  await loadStocksFromDB();
}

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

  if (totalPerformanceChart) {
    totalPerformanceChart.destroy();
  }

  totalPerformanceChart = new Chart(ctx, {
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
    }
  });
}

function showGraph(){
  
}

// Exchange rate (this function uses a dummy fixed rate for now)
  async function getExchangeRate(fromCurrency, toCurrency) {
    // Use an exchange rate API or hardcode rates for now
    if (fromCurrency === "EUR" && toCurrency === "USD") {
      return 1.1;  // Example exchange rate (EUR to USD)
    }
    return 1;  // Default to 1 if no exchange
  }

// Convert stock values to selected currency (for now assume "EUR")
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



// Update pie chart with values in selected currency
function updatePieChart(labels, values) {
  const ctx = document.getElementById('pieChart').getContext('2d');
  if (pieChartInstance) pieChartInstance.destroy();

  console.log('PieLabels: '+labels);
  console.log('PieValues: '+values);
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

// Update the total value
async function updateTotalValue() {
  let totalValue = 0;
  let labels = [];
  let values = [];

  await convertToCurrency();  // Convert stock prices to selected currency

  stocks.forEach(stock => {
    totalValue += stock.current * stock.quantity;
    labels.push(stock.isin);
    values.push(stock.current*stock.quantity);
  });

  if(stocks.length == 0){
    document.getElementById("total-value").textContent = `0.00 EUR`;
  }else{
      document.getElementById("total-value").textContent = `${totalValue} ${stocks[0].currency}`;
  }
  updatePieChart(labels, values);
  updateTotalPerformanceChart(totalValue);
}

// Render dashboard with live data and current currency
async function renderDashboard(stockList_Objects) {
  await updateTotalValue();
  const stockList_HTML = document.getElementById("stock-list");
  stockList_HTML.innerHTML = "";

  stockList_Objects.forEach((stock, index) => {
    const perf = (((stock.current - stock.entry) / stock.entry) * 100).toFixed(2);

    let bool_symbol = '';
    if(stock.symbol != null){
      bool_symbol = stock.symbol;
    }
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${stock.isin}</td>
      <td>${bool_symbol}</td>
      <td>${stock.entry} ${stock.currency}</td>
      <td>${stock.quantity}</td>
      <td>${stock.current}</td>
      <td class="${perf >= 0 ? 'positive' : 'negative'}">${perf}%</td>
      <td>
        <button onclick="showGraph('${stock.isin}')">📊</button>
        <button onclick="removeStock(${index})">❌</button>
      </td>
    `;
    stockList_HTML.appendChild(row);
  });
}

// --- Init ---
document.addEventListener('DOMContentLoaded', async ()=>{


  //apiReturn = await fetchData(assembleFetch());
  //console.log('apiReturn next: ');
  //console.log(apiReturn);


  //fetchData(fetchURLTest);
  // Export / Import
  const btnExport = byId('dashboard_export');
  const btnImport = byId('dashboard_import');
  const fileImport = byId('dashboard_import_file');
  if (btnExport) btnExport.onclick = exportDashboard;
  if (btnImport && fileImport) {
    btnImport.onclick = ()=> fileImport.click();
    fileImport.onchange = async (e)=>{
      const f = e.target.files[0]; if (!f) return;
      await importDashboard(f);
    };
  }
  await loadStocksFromDB();
  const form = document.getElementById('addStockForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const isin = document.getElementById('stockIsin').value.trim().toUpperCase();
      const entry = parseFloat(document.getElementById('entryValue').value);
      const quantity = parseFloat(document.getElementById('quantity').value);
      const currency = document.getElementById('currency').value.trim().toUpperCase();

      if (!isin || isNaN(entry) || isNaN(quantity) || !currency) {
        alert("Please fill out all fields correctly.");
        return;
      }

      const stock = {
        isin,
        entry,
        current: entry, // Start with entry value as current, unless you fetch quotes elsewhere
        quantity,
        currency
      };

      const { store } = await DB.tx('stocks', 'readwrite');
      await DB.put(store, stock);

      // Clear form
      form.reset();

      // Refresh list
      await loadStocksFromDB();
    });
  }

  searchBoxInit();

  const proxyUrl = 'https://api.allorigins.win/get?url=';
  const targetUrl = encodeURIComponent('https://www.finanzen.net/etf/vanguard-ftse-all-world-etf-ie00b3rbwm25');

  fetch(proxyUrl + targetUrl)
    .then(response => response.json())
    .then(data => {
      console.log(data.contents);  // Log the raw HTML for debugging

      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');

      // Extracting the price, absolute change, and relative change
      const priceElement = doc.querySelector('.snapshot__value-current .snapshot__value');
      const absoluteChangeElement = doc.querySelector('.snapshot__value-absolute .snapshot__value');
      const relativeChangeElement = doc.querySelector('.snapshot__value-relative .snapshot__value');
      
      if (priceElement && absoluteChangeElement && relativeChangeElement) {
        const price = priceElement.textContent.trim();         // e.g., "135,00"
        const absoluteChange = absoluteChangeElement.textContent.trim();  // e.g., "+0,32"
        const relativeChange = relativeChangeElement.textContent.trim();  // e.g., "+0,24"
        
        console.log('Price:', price);
        console.log('Absolute Change:', absoluteChange);
        console.log('Relative Change:', relativeChange);
      } else {
        console.log('Could not find the expected elements');
      }
    })
    .catch(error => console.error('Error:', error));
});

