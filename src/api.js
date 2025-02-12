const api = require('express').Router();
const fs = require('fs').promises;
const path = require('path');
const STOCK_DATA_FILE = path.join(__dirname, 'stockData.json');
let NEWS_DATA_FILE;

const getCurrentDateObj = (simulatedDate = null) => {
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(simulatedDate ? new Date(simulatedDate) : new Date());

  const [datePart, timePart] = date.split(', ');
  return { date: datePart.replace(/\//g, '-'), time: timePart };
};


const validateTime = () => {
  const holydays = [
    '2025-02-26',
    '2025-03-14',
    '2025-03-31',
    '2025-04-10',
    '2025-04-14',
    '2025-04-18',
    '2025-05-01',
    '2025-08-15',
    '2025-08-27',
    '2025-10-02',
    '2025-10-21',
    '2025-10-22',
    '2025-11-05',
    '2025-12-25',
  ];
  const { date, time } = getCurrentDateObj();
  const currentDate = date;
  const day = new Date(
    `${date.split('-').reverse().join('-')}T${time}`
  ).getDay();
  const timeInMinutes =
    parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
  return !(
    holydays.includes(currentDate) ||
    [0, 6].includes(day) ||
    timeInMinutes < 570 ||
    timeInMinutes > 915
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
    '^NSEI',
    'RELIANCE.NS',
    'TCS.NS',
    'INFY.NS',
    'HDFCBANK.NS',
    'ICICIBANK.NS',
  ];
  const results = await Promise.all(
    stockSymbols.map(async (symbol) => {
      await new Promise((resolve) => setTimeout(resolve, 100));

      return fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=15m`
      )
        .then((res) => res.json())
        .then((data) => (data.chart.result ? data.chart.result[0] : null))
        .catch(() => null);
    })
  );

  return results.filter(Boolean);
};
function isFourHoursApart(dt1, dt2) {
  const formatDate = (d) => {
    let [day, month, year] = d.date.split('-');
    return `${year}-${month}-${day} ${d.time}`;
  };

  let t1 = new Date(formatDate(dt1));
  let t2 = new Date(formatDate(dt2));

  return Math.abs(t2 - t1) >= 4 * 60 * 60 * 1000;
}

const fetchNewsData = async () => {
  console.log('Fetching news...');
  const urls = [
    'https://gnews.io/api/v4/top-headlines?country=in&category=business&lang=en&apikey=b75a36291e6cfbe5de91e3228688c9ea',
    'https://gnews.io/api/v4/top-headlines?country=us&category=business&lang=en&apikey=b75a36291e6cfbe5de91e3228688c9ea',
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
        results.push([data.articles]);
      }
    } catch (error) {}
  }
  return results;
};

const saveNewsDataToFile = async (data) => {
    NEWS_DATA_FILE=JSON.stringify({ lastUpdated: getCurrentDateObj(), data: data })
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
      symbol: meta.symbol,
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
 return NEWS_DATA_FILE;
};

(async () => {
  const currentDate = getCurrentDateObj();
  let newsData = await getNewsData();

  // saveStockDataToFile(await fetchStockData());
  if(newsData){

    if (isFourHoursApart(newsData.lastUpdated, currentDate)) {
      saveNewsDataToFile(await fetchNewsData());
    }
  }else{
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

  if (!firstNewsRequest ) {
    firstNewsRequest = true;

    const currentDate = getCurrentDateObj();

    if (isFourHoursApart(newsData.lastUpdated, currentDate)) {
      saveNewsDataToFile(await fetchNewsData());
      newsData = await getNewsData();
    }
    firstNewsRequest = false;
  } else {
    await new Promise((resolve) => {
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

  return res.json({
    data: newsData,
  });
});

module.exports = api;
