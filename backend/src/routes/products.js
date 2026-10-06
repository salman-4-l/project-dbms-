const express = require('express');
const { getPool } = require('../config/database');

const router = express.Router();

// VIEW PRODUCTS
router.get('/', async (req, res) => {
  try {
    const [products] = await getPool().query(
      'SELECT product_id, product_name, price, stock FROM products ORDER BY product_id'
    );

    res.json(products);
  } catch (error) {
    console.error('Could not load products:', error);
    res.status(503).json({
      error: 'Products are temporarily unavailable.',
      details: error.message,
    });
  }
});

// INSERT PRODUCT
router.post('/', async (req, res) => {
  try {
    const { product_name, price, stock } = req.body;

    if (!product_name || price === undefined || stock === undefined) {
      return res.status(400).json({
        error: 'product_name, price and stock are required.',
      });
    }

    const [result] = await getPool().query(
      'INSERT INTO products (product_name, price, stock) VALUES (?, ?, ?)',
      [product_name, price, stock]
    );

    const [products] = await getPool().query(
      'SELECT product_id, product_name, price, stock FROM products WHERE product_id = ?',
      [result.insertId]
    );

    res.status(201).json(products[0]);
  } catch (error) {
    console.error('Could not create product:', error);
    res.status(500).json({
      error: 'Could not create product.',
      details: error.message,
    });
  }
});

// UPDATE PRODUCT
router.put('/:product_id', async (req, res) => {
  try {
    const productId = Number(req.params.product_id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Invalid product ID.' });
    }

    const updates = [];
    const values = [];

    if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'product_name')) {
      const productName = String(req.body.product_name ?? '').trim();
      if (!productName) {
        return res.status(400).json({ error: 'Product name cannot be empty.' });
      }
      updates.push('product_name = ?');
      values.push(productName);
    }

    if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'price')) {
      const price = Number(req.body.price);
      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ error: 'Price must be a valid number and cannot be negative.' });
      }
      updates.push('price = ?');
      values.push(price);
    }

    if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'stock')) {
      const stock = Number(req.body.stock);
      if (!Number.isInteger(stock) || stock < 0) {
        return res.status(400).json({ error: 'Stock must be a valid integer and cannot be negative.' });
      }
      updates.push('stock = ?');
      values.push(stock);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid product fields were provided for update.' });
    }

    values.push(productId);

    const [result] = await getPool().query(
      `UPDATE products SET ${updates.join(', ')} WHERE product_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const [rows] = await getPool().query(
      'SELECT product_id, product_name, price, stock FROM products WHERE product_id = ? LIMIT 1',
      [productId]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error('Could not update product:', error);
    res.status(500).json({
      error: 'Could not update product.',
      details: error.message,
    });
  }
});

// DELETE PRODUCT
router.delete('/:id', async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId)) {
      return res.status(400).json({
        error: 'Invalid product ID.',
      });
    }

    const [result] = await getPool().query(
      'DELETE FROM products WHERE product_id = ?',
      [productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Product not found.',
      });
    }

    res.json({
      message: 'Product deleted successfully.',
      product_id: productId,
    });
  } catch (error) {
    console.error('Could not delete product:', error);
    res.status(500).json({
      error: 'Could not delete product.',
      details: error.message,
    });
  }
});

module.exports = router;