require('dotenv').config();
const express = require('express');
const ping_pong = require('./src/ping-pong');
const app = express();
app.use(ping_pong);

const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(express.json());
const signup = require('./src/router/signup');
const connectToDB = require('./src/config/database');
console.log(process.env.FRONT_END_URL);

const cors = require('cors');
app.use(
  cors({
    origin: process.env.FRONT_END_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

const corsOptions = {
  origin: process.env.FRONT_END_URL,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

const api = require('./src/api');


app.use(signup);
app.use(api);

app.use((req, res) => res.send('Hello from server '));

connectToDB()
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT} successfully`);
    });
  })
  .catch((e) => {
    console.log(e);
  });
