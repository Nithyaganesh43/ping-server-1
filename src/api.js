const api = require('express').Router();
const fs = require('fs').promises;
const path = require('path');
const STOCK_DATA_FILE = path.join(__dirname, 'stockData.json');
const NEWS_DATA_FILE = path.join(__dirname, 'newsData.json');

const getCurrentDateObj = (simulatedDate = null) => {
  const date =
    simulatedDate ||
    new Date().toLocaleString('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
    });
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
    stockSymbols.map((symbol) =>
      fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=15m`
      )
        .then((res) => res.json())
        .then((data) => (data.chart.result ? data.chart.result[0] : null))
        .catch(() => null)
    )
  );

  return results.filter(Boolean);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchNewsData = async () => {
  console.log('Fetching news...');
  const urls = [
    'https://gnews.io/api/v4/search?q=stock+market&lang=en&country=in&topic=business&max=10&apikey=b75a36291e6cfbe5de91e3228688c9ea',
    'https://gnews.io/api/v4/search?q=share+market&lang=en&country=in&topic=business&max=10&apikey=b75a36291e6cfbe5de91e3228688c9ea',
    'https://gnews.io/api/v4/search?q=gold&lang=en&country=in&topic=business&max=10&apikey=b75a36291e6cfbe5de91e3228688c9ea',
    'https://gnews.io/api/v4/search?q=stock+market&lang=en&country=us&topic=business&max=10&apikey=b75a36291e6cfbe5de91e3228688c9ea',
    'https://gnews.io/api/v4/search?q=share+market&lang=en&country=us&topic=business&max=10&apikey=b75a36291e6cfbe5de91e3228688c9ea',
    'https://gnews.io/api/v4/search?q=gold&lang=en&country=us&topic=business&max=10&apikey=b75a36291e6cfbe5de91e3228688c9ea',
  ];

  const topics = ['stock market', 'share market', 'gold'];
  const countries = ['in', 'us'];

  const results = [];

  for (let index = 0; index < urls.length; index++) {
    const url = urls[index];
    const topic = topics[Math.floor(index / 2)];
    const country = countries[index % 2];

    try {
      const res = await fetch(url);
      const data = await res.json();

      console.log(`Response for ${country} ${topic}:`, data);

      if (data?.articles?.length > 0) {
        results.push({
          topic: `${country} ${topic} news data`,
          data: data.articles,
        });
      } else {
        console.warn(`No articles found for ${country} ${topic}`);
        results.push({ topic: `${country} ${topic} news data`, data: [] });
      }
    } catch (error) {
      console.error(`Error fetching ${country} ${topic} news:`, error);
      results.push({ topic: `${country} ${topic} news data`, data: [] });
    }

    if (index < urls.length - 1) {
      await sleep(5000);
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

const getAllStoredMarketData = async () => loadDataFromFile(STOCK_DATA_FILE);

const getStoredMarketDataWithoutValues = async () => {
  const data = await loadDataFromFile(STOCK_DATA_FILE);
  if (!data) return null;
  return {
    lastUpdated: data.lastUpdated,
    isMarketOpen: data.isMarketOpen,
    data: data.data.map(({ meta, values }) => ({
      meta,
      values: {
        timestamp: values.timestamp.at(-1),
        high: values.high.at(-1),
        low: values.low.at(-1),
        open: values.open.at(-1),
        close: values.close.at(-1),
      },
    })),
  };
};

(async () => {
  const storedData = await getAllStoredMarketData();

  if (!storedData?.data?.length || storedData?.data?.length == 0) {
    await saveStockDataToFile(await fetchStockData());
  } else {
    if (validateTime()) {
      const storedData = await getAllStoredMarketData();
      if (
        !isTimeDifferenceLessThan15Minutes(
          getCurrentDateObj(),
          storedData.lastUpdated
        )
      ) {
        await saveStockDataToFile(await fetchStockData());
      }
    }
  }
  const newsData = await getNewsData();
  if (!newsData?.data[0]?.data || newsData?.data[0]?.data.length == 0) {
    await saveNewsDataToFile(await fetchNewsData());
  } else {
    if (getCurrentDateObj().date != newsData?.lastUpdated?.date) {
      await saveNewsDataToFile(await fetchNewsData());
    }
  }
})();

let firstStockRequest = false;
api.get('/MarketHealers/getMarketData', async (req, res) => {
  const requestTime = getCurrentDateObj();
  const storedData = await getAllStoredMarketData();

  if (validateTime()) {
    if (
      storedData &&
      requestTime &&
      storedData.data.length != 0 &&
      isTimeDifferenceLessThan15Minutes(requestTime, storedData?.lastUpdated)
    ) {
      return res.json({
        requestTime,
        validateTime: true,
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
      validateTime: true,
      data: await getAllStoredMarketData(),
      fresh: true,
    });
  }

  return res.json({
    requestTime,
    validateTime: false,
    data: await getStoredMarketDataWithoutValues(),
    fresh: false,
  });
});

let firstNewsRequest = false;
api.get('/MarketHealers/getNewsData', async (req, res) => {
  let newsData = await getNewsData();

  if (
    getCurrentDateObj().date != newsData?.lastUpdated?.date &&
    firstNewsRequest == false
  ) {
    firstNewsRequest = true;
    await saveNewsDataToFile(await fetchNewsData());
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
 