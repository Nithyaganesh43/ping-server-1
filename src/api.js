const api = require('express').Router();
const fs = require('fs').promises;
const path = require('path');
const STOCK_DATA_FILE = path.join(__dirname, 'stockData.json');
const NEWS_DATA_FILE = path.join(__dirname, 'newsData.json');

const getCurrentDateObj = (simulatedDate = null) => {
  const date = simulatedDate
    ? simulatedDate
    : new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour12: false,
      });
  const [datePart, timePart] = date.split(', ');
  return { date: datePart.replace(/\//g, '-'), time: timePart };
};

const validateTime = () => {
  const holidays = [
    '2025-01-01',
    '2025-01-20',
    '2025-02-17',
    '2025-04-18',
    '2025-05-26',
    '2025-07-04',
    '2025-09-01',
    '2025-11-27',
    '2025-12-25',
  ];

  const { date, time } = getCurrentDateObj();
  const [month, day, year] = date.split('-').map(Number);
  const currentDate = `${year}-${month.toString().padStart(2, '0')}-${day
    .toString()
    .padStart(2, '0')}`;
  const dayOfWeek = new Date(`${currentDate}T${time}-05:00`).getUTCDay();
  const [hours, minutes] = time.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;

  return !(
    holidays.includes(currentDate) ||
    dayOfWeek === 0 ||
    dayOfWeek === 6 ||
    timeInMinutes < 570 ||
    timeInMinutes > 960
  );
};


const isTimeDifferenceLessThan15Minutes = (obj1, obj2) => {
  const parseDate = ({ date, time }) =>
    new Date(`${date.split('-').reverse().join('-')}T${time}`);
  return Math.abs(parseDate(obj1) - parseDate(obj2)) / 60000 < 15;
};

const fetchStockData = async () => {
  console.log('fetched values');
  const stockSymbols = [
    // '^NSEI',
    'AAPL',
    'MSFT',
    'AMZN',
    'GOOGL',
    'TSLA',
    // 'NFLX',
    'NVDA',
    // 'META',
    // 'INTC',
    // 'BABA',
    // 'TSM',
  ];

  const results = await Promise.all(
    stockSymbols.map(async (symbol) => {
      await new Promise((resolve) => setTimeout(resolve, 250));
 
     return fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=15m`
      )
        .then((res) => res.json())
        .then((data) => (data.chart.result ? data.chart.result[0] : null))
        .catch(() => null);
    }
    )
  );

  return results.filter(Boolean);
}; 
const fetchNewsData = async () => {
  console.log('Fetching news...');
const urls = [
  'https://gnews.io/api/v4/search?q=stock+market&lang=en&country=in&topic=finance&max=10&apikey=b75a36291e6cfbe5de91e3228688c9ea',
  'https://gnews.io/api/v4/search?q=share+market&lang=en&country=in&topic=finance&max=10&apikey=b75a36291e6cfbe5de91e3228688c9ea',
  'https://gnews.io/api/v4/search?q=gold+prices&lang=en&country=in&topic=finance&max=10&apikey=b75a36291e6cfbe5de91e3228688c9ea',
  'https://gnews.io/api/v4/search?q=stock+market&lang=en&country=us&topic=finance&max=10&apikey=b75a36291e6cfbe5de91e3228688c9ea',
  'https://gnews.io/api/v4/search?q=share+market&lang=en&country=us&topic=finance&max=10&apikey=b75a36291e6cfbe5de91e3228688c9ea',
  'https://gnews.io/api/v4/search?q=gold+prices+and+silver+prices&lang=en&country=us&topic=finance&max=10&apikey=b75a36291e6cfbe5de91e3228688c9ea',
];

  const results = [];

  for (let index = 0; index < urls.length; index++) {
    const url = urls[index];  

    try {
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const res = await fetch(url);
      const data = await res.json();
 

      if (data?.articles) {
        results.push( [ data.articles ]);
      } 
    } catch (error) { 
     
    }
 
  
  } 
  return results;
};

const saveNewsDataToFile = async (data) => {
  await fs.writeFile(
    NEWS_DATA_FILE,
    JSON.stringify({ lastUpdated: getCurrentDateObj(), data: data })
  );
};

const sanitizeData = (inputData) =>
  inputData.map(({ meta, indicators, timestamp }) => ({
    meta: {
      fullExchangeName: meta.fullExchangeName,
      instrumentType: meta.instrumentType,
      regularMarketPrice: meta.regularMarketPrice,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      regularMarketDayHigh: meta.regularMarketDayHigh,
      regularMarketDayLow: meta.regularMarketDayLow,
      regularMarketVolume: meta.regularMarketVolume,
      longName: meta.longName,
    },
    values: {
      timestamp,
      high: indicators.quote[0]?.high || [],
      low: indicators.quote[0]?.low || [],
      open: indicators.quote[0]?.open || [],
      close: indicators.quote[0]?.close || [],
    },
  }));

const getFormattedAndSanitizedData = (data) => ({
  lastUpdated: getCurrentDateObj(),
  isMarketOpen: validateTime(),
  data: sanitizeData(data),
});

const saveStockDataToFile = async (data) => {
  await fs.writeFile(
    STOCK_DATA_FILE,
    JSON.stringify(getFormattedAndSanitizedData(data))
  );
};

const loadDataFromFile = async (FILE) => {
  try {
    await fs.access(FILE);
    const data = await fs.readFile(FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
};
const getNewsData = async () => {
  const data = await loadDataFromFile(NEWS_DATA_FILE);
  return data;
};
 
 
(async () => {
  const currentDate = getCurrentDateObj();
let newsData = await getNewsData(); 

   saveStockDataToFile(await fetchStockData()); 
 if (newsData.lastUpdated.date != currentDate.date){ 
   saveNewsDataToFile(await fetchNewsData());
 }
})();

let firstStockRequest = false;
api.get('/MarketHealers/getMarketData', async (req, res) => {
  const requestTime = getCurrentDateObj();
  const storedData = await loadDataFromFile(STOCK_DATA_FILE);
 
    if (
      storedData &&
      requestTime &&
      storedData.data.length != 0 &&
      isTimeDifferenceLessThan15Minutes(requestTime, storedData?.lastUpdated)
    ) {
      return res.json({
        requestTime, 
        data: storedData,
        fresh: false,
      });
    }

    if (!firstStockRequest) {
      firstStockRequest = true;
      await saveStockDataToFile(await fetchStockData());
      firstStockRequest = false;
    } else {
      function waitForCondition() {
        return new Promise((resolve) => {
          const check = () => {
            if (!firstStockRequest) {
              resolve();
            } else {
              setTimeout(check, 500);
            }
          };
          check();
        });
      }
      await waitForCondition();
    }

    return res.json({
      requestTime, 
      data: await loadDataFromFile(STOCK_DATA_FILE),
      fresh: true,
    });
 
});
let firstNewsRequest = false;

api.get('/MarketHealers/getNewsData', async (req, res) => {
  let newsData = await getNewsData(); 
  if ( !firstNewsRequest) {
    firstNewsRequest = true; 
    
  const currentDate = getCurrentDateObj();
    if (newsData.lastUpdated.date != currentDate.date) {
      saveNewsDataToFile(await fetchNewsData());
    }
    newsData = await getNewsData();
    firstNewsRequest = false;
  } else {
    function waitForCondition() {
      return new Promise((resolve) => {
        const check = () => {
          if (!firstNewsRequest) {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    }
    await waitForCondition();
  }

  return res.json({
    data: newsData,
  });
});


module.exports = api;
