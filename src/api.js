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

const fetchNewsData = async () => {
  const results = await Promise.all(
    ['in'].map(async (country) => {
      try {
        const res = await fetch(
          `https://gnews.io/api/v4/search?q=stock+market+OR+share+market+OR+gold&lang=en&country=${country}&topic=business&max=10&apikey=e7d52e6fffe5f02ba7f33d95e08fa0d6`
        );
        const data = await res.json();
        return data?.articles;
      } catch (e) {
        return console.log(e);
      }
    })
  );
  // console.log(results)
  return results.filter(Boolean);
};
const saveNewsDataToFile = async (data) => {
  await fs.writeFile(
    NEWS_DATA_FILE,
    JSON.stringify({ lastUpdated: getCurrentDateObj(), data: data[0] })
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
        isTimeDifferenceLessThan15Minutes(
          getCurrentDateObj(),
          storedData.lastUpdated
        )
      ) {  
        await saveStockDataToFile(await fetchStockData());
      }
    }
  }
  const newsData = await getNewsData();
  if (!newsData?.data?.length || newsData?.data?.length  == 0) {
    await saveNewsDataToFile(await fetchNewsData()); 
  } else {
    if (getCurrentDateObj().date != newsData?.lastUpdated?.date) {
      await saveNewsDataToFile(await fetchNewsData());
    }
  }
})();

api.get('/MarketHealers/getMarketData', async (req, res) => {
  const requestTime = getCurrentDateObj();
  if (validateTime()) {
    const storedData = await getAllStoredMarketData();
    if (
      isTimeDifferenceLessThan15Minutes(requestTime, storedData.lastUpdated)
    ) {
      return res.json({
        requestTime,
        validateTime: true,
        data: storedData,
        fresh: false,
      });
    }
    await saveStockDataToFile(await fetchStockData());
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

api.get('/MarketHealers/getNewsData', async (req, res) => {
  let newsData = await getNewsData();

  if (getCurrentDateObj().date != newsData?.lastUpdated?.date) {
    await saveNewsDataToFile(await fetchNewsData());
    newsData = await getNewsData();
  }
  return res.json({
    data: newsData,
  });
});

module.exports = api;
