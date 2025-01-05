const express = require('express');
const cors = require('cors');
const app = express();
const ping_pong = require('./src/ping-pong');
const api = require('./api');
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(ping_pong);
app.use(api);

app.use('/hi',(req, res) => res.send('Hi from server 1'));

app.use((req, res) => res.send('Hello from server 1'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
