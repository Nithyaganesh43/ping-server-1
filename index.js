require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const connectToDB = require('./src/config/database');
const ping_pong = require('./src/ping-pong');
const api = require('./src/api');
const signup = require('./src/router/signup');
const contact = require('./src/contact');
const app = express();
app.use(helmet());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://www.markethealers.com',
  'https://auth.markethealers.com',
  'https://server.markethealers.com',
  'https://markethealers.markethealers.com',
  'https://markethealers.com',
  'https://blog-app-home.vercel.app',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

 

app.use(
  rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    message: 'Too many requests, please try again later.',
  })
);
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(ping_pong);

app.use(contact);
app.use(api);
app.use(signup);

app.use((req, res) => {
  res.status(404).json({ error: '143 Page not found' });
});

app.use((err, req, res, next) => {
  console.error('Internal Server Error');
  res.status(500).json({ error: 'Internal Server Error' });
});

connectToDB()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT} successfully`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to database:', error);
  });
