const express = require('express');
const { getPool } = require('../config/database');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const customerId = req.query.customer_id !== undefined ? Number(req.query.customer_id) : null;
    const returnId = req.query.return_id !== undefined ? Number(req.query.return_id) : null;

    let sql = `
      SELECT f.*, r.return_id, r.order_id, r.status AS return_status, o.customer_id, c.name AS customer_name, c.email AS customer_email, p.product_name
      FROM refunds f
      INNER JOIN returns r ON r.return_id = f.return_id
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

    if (Number.isInteger(returnId) && returnId > 0) {
      clauses.push('f.return_id = ?');
      params.push(returnId);
    }

    if (clauses.length > 0) {
      sql += ` WHERE ${clauses.join(' AND ')}`;
    }

    sql += ' ORDER BY f.refund_id DESC';

    const [refunds] = await getPool().query(sql, params);
    res.json(refunds);
  } catch (error) {
    console.error('Could not load refunds:', error);

    res.status(503).json({
      error: 'Refunds are temporarily unavailable.',
      details: error.message,
    });
  }
});

router.get('/preview', async (req, res) => {
  try {
    const returnId = Number(req.query.return_id);

    if (!Number.isInteger(returnId) || returnId <= 0) {
      return res.status(400).json({ error: 'A valid return_id is required.' });
    }

    const [rows] = await getPool().query(
      `
        SELECT r.return_id, r.status, o.total_amount AS refund_amount, o.customer_id
        FROM returns r
        INNER JOIN orders o ON o.order_id = r.order_id
        WHERE r.return_id = ?
        LIMIT 1
      `,
      [returnId]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Return not found.' });
    }

    if (rows[0].status !== 'Approved') {
      return res.status(400).json({ error: 'Only approved returns can be refunded.' });
    }

    res.json({
      return_id: rows[0].return_id,
      customer_id: rows[0].customer_id,
      amount: Number(rows[0].refund_amount),
      status: rows[0].status,
    });
  } catch (error) {
    console.error('Could not preview refund:', error);
    res.status(500).json({
      error: 'Could not preview refund.',
      details: error.message,
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const returnId = Number(req.body?.return_id);
    const customerId = req.body?.customer_id !== undefined ? Number(req.body.customer_id) : null;
    const amount = req.body?.amount !== undefined ? Number(req.body.amount) : null;
    const status = String(req.body?.status ?? 'Completed').trim() || 'Completed';

    if (!Number.isInteger(returnId) || returnId <= 0) {
      return res.status(400).json({ error: 'A valid return_id is required.' });
    }

    const [returnRows] = await getPool().query(
      `
        SELECT r.return_id, r.status, r.order_id, o.customer_id, o.total_amount
        FROM returns r
        INNER JOIN orders o ON o.order_id = r.order_id
        WHERE r.return_id = ?
        LIMIT 1
      `,
      [returnId]
    );

    if (!returnRows[0]) {
      return res.status(404).json({ error: 'Return not found.' });
    }

    if (customerId !== null && Number.isInteger(customerId) && customerId > 0 && returnRows[0].customer_id !== customerId) {
      return res.status(403).json({ error: 'This return does not belong to the logged in customer.' });
    }

    if (returnRows[0].status !== 'Approved') {
      return res.status(400).json({ error: 'Refunds can only be created for approved returns.' });
    }

    const [existingRows] = await getPool().query(
      'SELECT refund_id FROM refunds WHERE return_id = ? LIMIT 1',
      [returnId]
    );

    const refundAmount = Number.isFinite(amount) && amount > 0 ? amount : Number(returnRows[0].total_amount);

    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than zero.' });
    }

    if (existingRows[0]) {
      const [updateResult] = await getPool().query(
        'UPDATE refunds SET amount = ?, status = ? WHERE return_id = ?',
        [refundAmount, status, returnId]
      );

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ error: 'Refund not found.' });
      }

      const [rows] = await getPool().query(
        'SELECT * FROM refunds WHERE return_id = ? LIMIT 1',
        [returnId]
      );

      return res.status(200).json(rows[0]);
    }

    const [result] = await getPool().query(
      'INSERT INTO refunds (return_id, amount, status) VALUES (?, ?, ?)',
      [returnId, refundAmount, status]
    );

    const [rows] = await getPool().query(
      'SELECT * FROM refunds WHERE refund_id = ? LIMIT 1',
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Could not create refund:', error);

    res.status(500).json({
      error: 'Could not create refund.',
      details: error.message,
    });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const refundId = Number(req.params.id);
    const status = String(req.body?.status ?? '').trim();

    if (!Number.isInteger(refundId) || refundId <= 0) {
      return res.status(400).json({ error: 'Invalid refund ID.' });
    }

    if (!status) {
      return res.status(400).json({ error: 'status is required.' });
    }

    const [result] = await getPool().query(
      'UPDATE refunds SET status = ? WHERE refund_id = ?',
      [status, refundId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Refund not found.' });
    }

    const [rows] = await getPool().query(
      'SELECT * FROM refunds WHERE refund_id = ? LIMIT 1',
      [refundId]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Could not update refund status:', error);
    res.status(500).json({
      error: 'Could not update refund status.',
      details: error.message,
    });
  }
});

module.exports = router;