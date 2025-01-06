const app = require('express')();
const ping_pong = require('./src/ping-pong');
const cors = require('cors');
app.use(ping_pong);

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

const api = require('./src/api');

app.use(api);

app.use('/hi', (req, res) => res.send('Hi from server 1'));

app.use((req, res) => res.send('Hello from server 1'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} successfully`);
});
