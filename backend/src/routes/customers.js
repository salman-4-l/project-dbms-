const crypto = require('crypto');
const express = require('express');
const { getPool } = require('../config/database');

const router = express.Router();

const TABLE_ALIASES = ['customers', 'customer'];
const NAME_ALIASES = ['customer_name', 'full_name', 'name', 'customer_full_name', 'first_name'];
const EMAIL_ALIASES = ['email', 'email_address'];
const PASSWORD_ALIASES = ['password_hash', 'hashed_password', 'password', 'customer_password'];
const PHONE_ALIASES = ['phone', 'phone_number', 'mobile', 'telephone'];
const ADDRESS_ALIASES = ['address', 'shipping_address', 'street_address'];
const ID_ALIASES = ['customer_id', 'id', 'customerId'];

function quoteIdentifier(identifier) {
  return `\`${String(identifier).replace(/`/g, '``')}\``;
}

function pickColumn(columns, candidates) {
  const normalized = columns.map((column) => String(column).toLowerCase());

  for (const candidate of candidates) {
    const exact = columns.find((column) => String(column).toLowerCase() === candidate);
    if (exact) return exact;
  }

  for (const candidate of candidates) {
    const match = columns.find((column) => String(column).toLowerCase().includes(candidate));
    if (match) return match;
  }

  return null;
}

async function getCustomerTableName() {
  const [tables] = await getPool().query('SHOW TABLES');
  const names = tables.map((row) => Object.values(row)[0]);

  for (const alias of TABLE_ALIASES) {
    if (names.some((name) => String(name).toLowerCase() === alias)) {
      return alias;
    }
  }

  return 'customers';
}

async function getCustomerColumns(tableName) {
  const [rows] = await getPool().query(
    'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    [tableName]
  );

  return rows.map((row) => row.COLUMN_NAME);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 120000, 64, 'sha512')
    .toString('hex');

  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;

  if (!storedHash.includes(':')) {
    return storedHash === password;
  }

  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;

  const candidate = crypto
    .pbkdf2Sync(password, salt, 120000, 64, 'sha512')
    .toString('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
  } catch {
    return false;
  }
}

function sanitizeCustomer(record, columns) {
  if (!record || typeof record !== 'object') return null;

  const nameColumn = pickColumn(columns, NAME_ALIASES);
  const emailColumn = pickColumn(columns, EMAIL_ALIASES);
  const phoneColumn = pickColumn(columns, PHONE_ALIASES);
  const addressColumn = pickColumn(columns, ADDRESS_ALIASES);
  const idColumn = pickColumn(columns, ID_ALIASES);

  const publicRecord = {
    customer_id: record[idColumn || 'customer_id'] ?? record.customer_id ?? record.id,
    name: record[nameColumn || 'name'] ?? record.name ?? '',
    email: record[emailColumn || 'email'] ?? record.email ?? '',
    phone: record[phoneColumn || 'phone'] ?? record.phone ?? '',
    address: record[addressColumn || 'address'] ?? record.address ?? '',
  };

  return publicRecord;
}

router.get('/', async (req, res) => {
  try {
    const tableName = await getCustomerTableName();
    const columns = await getCustomerColumns(tableName);
    const idColumn = pickColumn(columns, ID_ALIASES) || 'customer_id';

    const [rows] = await getPool().query(
      `SELECT * FROM ${quoteIdentifier(tableName)} ORDER BY ${quoteIdentifier(idColumn)} DESC`
    );

    res.json(rows.map((customer) => sanitizeCustomer(customer, columns)));
  } catch (error) {
    console.error('Could not load customers:', error);
    res.status(500).json({
      error: 'Could not load customers.',
      details: error.message,
    });
  }
});

router.get('/me', async (req, res) => {
  const customerId = Number(req.query.customer_id);

  if (!Number.isInteger(customerId) || customerId <= 0) {
    return res.status(400).json({ error: 'A valid customer_id is required.' });
  }

  const tableName = await getCustomerTableName();
  const columns = await getCustomerColumns(tableName);
  const idColumn = pickColumn(columns, ID_ALIASES) || 'customer_id';
  const [rows] = await getPool().query(
    `SELECT * FROM ${quoteIdentifier(tableName)} WHERE ${quoteIdentifier(idColumn)} = ? LIMIT 1`,
    [customerId]
  );

  if (!rows[0]) {
    return res.status(404).json({ error: 'Customer not found.' });
  }

  res.json({ customer: sanitizeCustomer(rows[0], columns) });
});

router.get('/:id', async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({ error: 'Invalid customer ID.' });
    }

    const tableName = await getCustomerTableName();
    const columns = await getCustomerColumns(tableName);
    const idColumn = pickColumn(columns, ID_ALIASES) || 'customer_id';
    const [rows] = await getPool().query(
      `SELECT * FROM ${quoteIdentifier(tableName)} WHERE ${quoteIdentifier(idColumn)} = ? LIMIT 1`,
      [customerId]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    res.json({ customer: sanitizeCustomer(rows[0], columns) });
  } catch (error) {
    console.error('Could not load customer details:', error);
    res.status(500).json({
      error: 'Could not load customer details.',
      details: error.message,
    });
  }
});

router.get('/:id/orders', async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({ error: 'Invalid customer ID.' });
    }

    const [rows] = await getPool().query(
      `
        SELECT o.*, p.product_name
        FROM orders o
        LEFT JOIN products p ON p.product_id = o.product_id
        WHERE o.customer_id = ?
        ORDER BY o.order_id DESC
      `,
      [customerId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Could not load customer orders:', error);
    res.status(500).json({
      error: 'Could not load customer orders.',
      details: error.message,
    });
  }
});

router.get('/:id/returns', async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({ error: 'Invalid customer ID.' });
    }

    const [rows] = await getPool().query(
      `
        SELECT r.*, o.order_id, o.total_amount, p.product_name
        FROM returns r
        INNER JOIN orders o ON o.order_id = r.order_id
        LEFT JOIN products p ON p.product_id = o.product_id
        WHERE o.customer_id = ?
        ORDER BY r.return_id DESC
      `,
      [customerId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Could not load customer returns:', error);
    res.status(500).json({
      error: 'Could not load customer returns.',
      details: error.message,
    });
  }
});

router.get('/:id/refunds', async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({ error: 'Invalid customer ID.' });
    }

    const [rows] = await getPool().query(
      `
        SELECT f.*, r.return_id, r.order_id, o.total_amount, p.product_name
        FROM refunds f
        INNER JOIN returns r ON r.return_id = f.return_id
        INNER JOIN orders o ON o.order_id = r.order_id
        LEFT JOIN products p ON p.product_id = o.product_id
        WHERE o.customer_id = ?
        ORDER BY f.refund_id DESC
      `,
      [customerId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Could not load customer refunds:', error);
    res.status(500).json({
      error: 'Could not load customer refunds.',
      details: error.message,
    });
  }
});

router.get('/:id/history', async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({ error: 'Invalid customer ID.' });
    }

    const tableName = await getCustomerTableName();
    const columns = await getCustomerColumns(tableName);
    const idColumn = pickColumn(columns, ID_ALIASES) || 'customer_id';
    const [customerRows] = await getPool().query(
      `SELECT * FROM ${quoteIdentifier(tableName)} WHERE ${quoteIdentifier(idColumn)} = ? LIMIT 1`,
      [customerId]
    );

    if (!customerRows[0]) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const [orders] = await getPool().query(
      `SELECT o.*, p.product_name FROM orders o LEFT JOIN products p ON p.product_id = o.product_id WHERE o.customer_id = ? ORDER BY o.order_id DESC`,
      [customerId]
    );

    const [returns] = await getPool().query(
      `SELECT r.*, p.product_name FROM returns r INNER JOIN orders o ON o.order_id = r.order_id LEFT JOIN products p ON p.product_id = o.product_id WHERE o.customer_id = ? ORDER BY r.return_id DESC`,
      [customerId]
    );

    const [refunds] = await getPool().query(
      `SELECT f.*, r.return_id, r.order_id, o.total_amount, p.product_name FROM refunds f INNER JOIN returns r ON r.return_id = f.return_id INNER JOIN orders o ON o.order_id = r.order_id LEFT JOIN products p ON p.product_id = o.product_id WHERE o.customer_id = ? ORDER BY f.refund_id DESC`,
      [customerId]
    );

    res.json({
      customer: sanitizeCustomer(customerRows[0], columns),
      orders,
      returns,
      refunds,
    });
  } catch (error) {
    console.error('Could not load customer history:', error);
    res.status(500).json({
      error: 'Could not load customer history.',
      details: error.message,
    });
  }
});

router.post('/register', async (req, res) => {
  try {
    const fullName = String(req.body?.name ?? '').trim();
    const email = String(req.body?.email ?? '').trim();
    const password = String(req.body?.password ?? '');
    const phone = String(req.body?.phone ?? '').trim();
    const address = String(req.body?.address ?? '').trim();

    if (!fullName || !email || !password) {
      return res.status(400).json({
        error: 'name, email and password are required.',
      });
    }

    const tableName = await getCustomerTableName();
    const columns = await getCustomerColumns(tableName);
    const nameColumn = pickColumn(columns, NAME_ALIASES);
    const emailColumn = pickColumn(columns, EMAIL_ALIASES);
    const passwordColumn = pickColumn(columns, PASSWORD_ALIASES);
    const phoneColumn = pickColumn(columns, PHONE_ALIASES);
    const addressColumn = pickColumn(columns, ADDRESS_ALIASES);

    if (!nameColumn || !emailColumn || !passwordColumn) {
      return res.status(500).json({
        error: 'The customers table is missing required account columns.',
      });
    }

    const [existing] = await getPool().query(
      `SELECT 1 FROM ${quoteIdentifier(tableName)} WHERE LOWER(${quoteIdentifier(emailColumn)}) = LOWER(?) LIMIT 1`,
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account already exists for this email.' });
    }

    const insertColumns = [nameColumn, emailColumn, passwordColumn];
    const insertValues = [fullName, email, hashPassword(password)];

    if (phoneColumn) {
      insertColumns.push(phoneColumn);
      insertValues.push(phone || null);
    }

    if (addressColumn) {
      insertColumns.push(addressColumn);
      insertValues.push(address || null);
    }

    const [result] = await getPool().query(
      `INSERT INTO ${quoteIdentifier(tableName)} (${insertColumns.map(quoteIdentifier).join(', ')}) VALUES (${insertColumns.map(() => '?').join(', ')})`,
      insertValues
    );

    const idColumn = pickColumn(columns, ID_ALIASES) || 'customer_id';
    const [rows] = await getPool().query(
      `SELECT * FROM ${quoteIdentifier(tableName)} WHERE ${quoteIdentifier(idColumn)} = ? LIMIT 1`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Customer account created successfully.',
      customer: sanitizeCustomer(rows[0], columns),
    });
  } catch (error) {
    console.error('Could not register customer:', error);
    res.status(500).json({
      error: 'Could not create customer account.',
      details: error.message,
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email ?? '').trim();
    const password = String(req.body?.password ?? '');

    if (!email || !password) {
      return res.status(400).json({
        error: 'email and password are required.',
      });
    }

    const tableName = await getCustomerTableName();
    const columns = await getCustomerColumns(tableName);
    const emailColumn = pickColumn(columns, EMAIL_ALIASES);
    const passwordColumn = pickColumn(columns, PASSWORD_ALIASES);

    if (!emailColumn || !passwordColumn) {
      return res.status(500).json({
        error: 'The customers table is missing required login columns.',
      });
    }

    const [rows] = await getPool().query(
      `SELECT * FROM ${quoteIdentifier(tableName)} WHERE LOWER(${quoteIdentifier(emailColumn)}) = LOWER(?) LIMIT 1`,
      [email]
    );

    const customer = rows[0];
    if (!customer) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const storedHash = customer[passwordColumn];
    if (!verifyPassword(password, storedHash)) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    res.json({
      message: 'Login successful.',
      customer: sanitizeCustomer(customer, columns),
    });
  } catch (error) {
    console.error('Could not log in customer:', error);
    res.status(500).json({
      error: 'Could not log in.',
      details: error.message,
    });
  }
});

module.exports = router;
