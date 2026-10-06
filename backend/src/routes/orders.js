const express = require('express');
const { getPool } = require('../config/database');

const router = express.Router();

// VIEW ORDERS
router.get('/', async (req, res) => {
  try {
    const customerId = req.query.customer_id;
    const values = [];
    let sql = `
      SELECT
        order_id,
        customer_id,
        product_id,
        order_date,
        quantity,
        total_amount,
        status
      FROM orders`;

    if (customerId !== undefined && customerId !== '') {
      sql += ' WHERE customer_id = ?';
      values.push(Number(customerId));
    }

    sql += ' ORDER BY order_id DESC';

    const [orders] = await getPool().query(sql, values);
    res.json(orders);
  } catch (error) {
    console.error('Could not load orders:', error);

    res.status(503).json({
      error: 'Orders are temporarily unavailable.',
      details: error.message,
    });
  }
});

// CREATE ORDER
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const customerId = body.customer_id ?? body.customer?.customer_id ?? null;
    const items = Array.isArray(body.items) ? body.items : [];
    const status = body.status || 'Pending';

    if (customerId === null || customerId === undefined || customerId === '') {
      return res.status(400).json({
        error: 'customer_id is required.',
      });
    }

    if (items.length === 0) {
      const legacyProductId = body.product_id;
      const legacyQuantity = body.quantity;
      const legacyTotalAmount = body.total_amount;

      if (
        legacyProductId === undefined ||
        legacyQuantity === undefined ||
        legacyTotalAmount === undefined
      ) {
        return res.status(400).json({
          error: 'items array or product_id, quantity and total_amount are required.',
        });
      }

      items.push({
        product_id: legacyProductId,
        quantity: legacyQuantity,
        unit_price: body.unit_price ?? 0,
      });
    }

    const createdOrders = [];

    for (const item of items) {
      const productId = Number(item.product_id ?? item.productId);
      const quantity = Number(item.quantity ?? 1);
      const unitPrice = Number(item.unit_price ?? item.price ?? 0);
      const totalAmount = Number(
        item.total_amount ??
          item.totalAmount ??
          (Number.isFinite(unitPrice) ? unitPrice * quantity : 0)
      );

      if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({ error: 'Each item must include a valid product_id.' });
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'Each item must include a quantity greater than zero.' });
      }

      const [result] = await getPool().query(
        `INSERT INTO orders
          (customer_id, product_id, quantity, total_amount, status)
         VALUES (?, ?, ?, ?, ?)`,
        [customerId, productId, quantity, totalAmount, status]
      );

      const [rows] = await getPool().query(
        `SELECT
          order_id,
          customer_id,
          product_id,
          order_date,
          quantity,
          total_amount,
          status
         FROM orders
         WHERE order_id = ?`,
        [result.insertId]
      );

      createdOrders.push(rows[0]);
    }

    res.status(201).json(createdOrders.length === 1 ? createdOrders[0] : createdOrders);
  } catch (error) {
    console.error('Could not create order:', error);

    res.status(500).json({
      error: 'Could not create order.',
      details: error.message,
    });
  }
});

module.exports = router;