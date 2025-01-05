const api = require('express').Router();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, 'stockData.json');

const getCurrentIST = () => {
  const date = new Date().toLocaleString('en-GB', {
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
  const date = new Date();
  const currentDate = date.toISOString().split('T')[0];
  const day = date.getDay();
  const timeInMinutes = date.getHours() * 60 + date.getMinutes();
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
    '^BSESN',
    '^NSEI',
    'RELIANCE.NS',
    'RELIANCE.NS',
    'TCS.NS',
    'INFY.NS',
    'HDFCBANK.NS',
    'ICICIBANK.NS',
    'BAJFINANCE.NS',
  ];
  const results = await Promise.all(
    stockSymbols.map((symbol) =>
      fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=20m`
      )
        .then((res) => res.json())
        .then((data) => (data.chart.result ? data.chart.result[0] : null))
        .catch(() => null)
    )
  );
  return results.filter(Boolean);
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
  lastUpdated: getCurrentIST(),
  isMarketOpen: validateTime(),
  data: sanitizeData(data),
});

const saveDataToFile = (data) => {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(getFormattedAndSanitizedData(data))
  );
};

const loadDataFromFile = () => {
  if (fs.existsSync(DATA_FILE))
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  return null;
};

const getAllStoredMarketData = () => loadDataFromFile();

const getStoredMarketDataWithoutValues = () => {
  const data = loadDataFromFile();
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

(async () => saveDataToFile(await fetchStockData()))();

api.get('/MarketHealers/getMarketData', async (req, res) => {
  const requestTime = getCurrentIST();
  if (validateTime()) {
    const storedData = getAllStoredMarketData();
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
    const newStockData = await fetchStockData();
    saveDataToFile(newStockData);
    return res.json({
      requestTime,
      validateTime: true,
      data: getAllStoredMarketData(),
      fresh: true,
    });
  }
  return res.json({
    requestTime,
    validateTime: false,
    data: getStoredMarketDataWithoutValues(),
    fresh: false,
  });
});

module.exports = api;
