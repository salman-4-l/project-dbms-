const express = require('express');
const { getPool } = require('../config/database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const customerId = req.query.customer_id !== undefined ? Number(req.query.customer_id) : null;
    const orderId = req.query.order_id !== undefined ? Number(req.query.order_id) : null;

    let sql = `
      SELECT r.*, o.customer_id, c.name AS customer_name, c.email AS customer_email, p.product_name
      FROM returns r
      INNER JOIN orders o ON o.order_id = r.order_id
      LEFT JOIN customers c ON c.customer_id = o.customer_id
      LEFT JOIN products p ON p.product_id = o.product_id
    `;
    const params = [];
    const clauses = [];

    if (Number.isInteger(customerId) && customerId > 0) {
      clauses.push('o.customer_id = ?');
      params.push(customerId);
    }

    if (Number.isInteger(orderId) && orderId > 0) {
      clauses.push('r.order_id = ?');
      params.push(orderId);
    }

    if (clauses.length > 0) {
      sql += ` WHERE ${clauses.join(' AND ')}`;
    }

    sql += ' ORDER BY r.return_id DESC';

    const [returns] = await getPool().query(sql, params);
    res.json(returns);
  } catch (error) {
    console.error('Could not load returns:', error);

    res.status(503).json({
      error: 'Returns are temporarily unavailable.',
      details: error.message,
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const orderId = Number(req.body?.order_id);
    const customerId = req.body?.customer_id !== undefined ? Number(req.body.customer_id) : null;
    const reason = String(req.body?.reason ?? '').trim();

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'A valid order_id is required.' });
    }

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({ error: 'customer_id is required.' });
    }

    const [orderRows] = await getPool().query(
      'SELECT * FROM orders WHERE order_id = ? AND customer_id = ? LIMIT 1',
      [orderId, customerId]
    );

    if (!orderRows[0]) {
      return res.status(403).json({ error: 'This order does not belong to the logged in customer.' });
    }

    const [existingRows] = await getPool().query(
      'SELECT * FROM returns WHERE order_id = ? ORDER BY return_id DESC LIMIT 1',
      [orderId]
    );

    if (existingRows[0]) {
      return res.status(200).json(existingRows[0]);
    }

    const [result] = await getPool().query(
      'INSERT INTO returns (order_id, reason, status) VALUES (?, ?, ?)',
      [orderId, reason || 'No reason provided', 'Requested']
    );

    const [rows] = await getPool().query(
      'SELECT * FROM returns WHERE return_id = ? LIMIT 1',
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Could not create return:', error);

    res.status(500).json({
      error: 'Could not create return.',
      details: error.message,
    });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const returnId = Number(req.params.id);
    const status = String(req.body?.status ?? '').trim();

    if (!Number.isInteger(returnId) || returnId <= 0) {
      return res.status(400).json({ error: 'Invalid return ID.' });
    }

    if (!status) {
      return res.status(400).json({ error: 'status is required.' });
    }

    const [result] = await getPool().query(
      'UPDATE returns SET status = ? WHERE return_id = ?',
      [status, returnId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Return not found.' });
    }

    const [rows] = await getPool().query(
      'SELECT * FROM returns WHERE return_id = ? LIMIT 1',
      [returnId]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Could not update return status:', error);
    res.status(500).json({
      error: 'Could not update return status.',
      details: error.message,
    });
  }
});

module.exports = router;