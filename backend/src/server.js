require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getPool } = require('./config/database');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const customersRouter = require('./routes/customers');
const returnsRouter = require('./routes/returns');
const refundsRouter = require('./routes/refunds');


const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await getPool().query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

app.use('/api/products', productsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/refunds', refundsRouter);
app.use('/api/returns', returnsRouter);

app.listen(port, () => {
  console.log(`Backend API listening on http://localhost:${port}`);
});