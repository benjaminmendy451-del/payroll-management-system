const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'payroll.db');
const tokenStore = new Map();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database.');
  initDatabase();
});

function initDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'admin'
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        employee_id TEXT NOT NULL UNIQUE,
        department TEXT NOT NULL,
        base_salary REAL NOT NULL,
        overtime REAL DEFAULT 0,
        bonus REAL DEFAULT 0,
        allowances REAL DEFAULT 0,
        deductions REAL DEFAULT 0,
        health_insurance REAL DEFAULT 0,
        tax_rate REAL DEFAULT 0,
        pay_period TEXT DEFAULT 'Monthly',
        join_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const defaultPassword = bcrypt.hashSync('admin123', 10);
    db.run(
      `INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)`,
      ['admin', defaultPassword, 'admin'],
      (err) => {
        if (err) console.error(err.message);
        else console.log('Default admin user ready. Username: admin / Password: admin123');
      }
    );
  });
}

function authRequired(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !tokenStore.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function calculatePayroll(employee) {
  const base = Number(employee.base_salary || 0);
  const overtime = Number(employee.overtime || 0);
  const bonus = Number(employee.bonus || 0);
  const allowances = Number(employee.allowances || 0);
  const deductions = Number(employee.deductions || 0);
  const healthInsurance = Number(employee.health_insurance || 0);
  const taxRate = Number(employee.tax_rate || 0);

  const gross = base + overtime + bonus + allowances;
  const taxAmount = (gross * taxRate) / 100;
  const totalDeductions = deductions + healthInsurance + taxAmount;
  const net = gross - totalDeductions;

  return {
    gross,
    taxAmount,
    totalDeductions,
    net
  };
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken();
    tokenStore.set(token, { username: user.username, role: user.role });

    return res.json({
      token,
      user: { username: user.username, role: user.role }
    });
  });
});

app.get('/api/me', authRequired, (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = tokenStore.get(token);
  res.json({ user });
});

app.get('/api/employees', authRequired, (req, res) => {
  db.all('SELECT * FROM employees ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch employees' });
    }
    return res.json(rows);
  });
});

app.post('/api/employees', authRequired, (req, res) => {
  const {
    name,
    email,
    employee_id,
    department,
    base_salary,
    overtime,
    bonus,
    allowances,
    deductions,
    health_insurance,
    tax_rate,
    pay_period,
    join_date
  } = req.body;

  if (!name || !email || !employee_id || !department || !base_salary) {
    return res.status(400).json({ error: 'Required fields missing.' });
  }

  db.run(
    `INSERT INTO employees (
      name, email, employee_id, department, base_salary, overtime, bonus, allowances,
      deductions, health_insurance, tax_rate, pay_period, join_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      email,
      employee_id,
      department,
      Number(base_salary),
      Number(overtime || 0),
      Number(bonus || 0),
      Number(allowances || 0),
      Number(deductions || 0),
      Number(health_insurance || 0),
      Number(tax_rate || 0),
      pay_period || 'Monthly',
      join_date || new Date().toISOString().split('T')[0]
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      return res.status(201).json({ id: this.lastID, message: 'Employee added successfully' });
    }
  );
});

app.put('/api/employees/:id', authRequired, (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    department,
    base_salary,
    tax_rate
  } = req.body;

  db.run(
    `UPDATE employees SET name = ?, email = ?, department = ?, base_salary = ?, tax_rate = ? WHERE id = ?`,
    [name, email, department, Number(base_salary), Number(tax_rate), id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      return res.json({ message: 'Employee updated successfully' });
    }
  );
});

app.delete('/api/employees/:id', authRequired, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM employees WHERE id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.json({ message: 'Employee deleted successfully' });
  });
});

app.get('/api/payroll', authRequired, (req, res) => {
  db.all('SELECT * FROM employees ORDER BY department ASC, name ASC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch payroll' });
    }

    const payroll = rows.map((employee) => ({
      ...employee,
      ...calculatePayroll(employee)
    }));

    return res.json(payroll);
  });
});

app.get('/api/summary', authRequired, (req, res) => {
  db.all('SELECT * FROM employees', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch summary' });
    }

    const summary = rows.reduce((acc, emp) => {
      const payroll = calculatePayroll(emp);
      acc.totalEmployees += 1;
      acc.grossPayroll += payroll.gross;
      acc.totalDeductions += payroll.totalDeductions;
      acc.netPayroll += payroll.net;
      return acc;
    }, {
      totalEmployees: 0,
      grossPayroll: 0,
      totalDeductions: 0,
      netPayroll: 0
    });

    return res.json(summary);
  });
});

app.get('/api/departments', authRequired, (req, res) => {
  db.all('SELECT DISTINCT department FROM employees ORDER BY department ASC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch departments' });
    }
    return res.json(rows.map((row) => row.department));
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Payroll system running on http://localhost:${PORT}`);
});
