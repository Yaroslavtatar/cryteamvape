import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import axios from 'axios';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('shop.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    telegram_id INTEGER UNIQUE,
    username TEXT,
    password TEXT, -- For admin login
    first_name TEXT,
    last_name TEXT,
    photo_url TEXT,
    role TEXT DEFAULT 'user',
    balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Add password column if it doesn't exist (for existing databases)
try {
  db.prepare('SELECT password FROM users LIMIT 1').get();
} catch (e: any) {
  if (e.message && e.message.includes('no such column: password')) {
    db.exec('ALTER TABLE users ADD COLUMN password TEXT');
    console.log('Migration: Added password column to users table');
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    slug TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    name TEXT,
    description TEXT,
    price REAL,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    nicotine TEXT,
    volume TEXT,
    flavor TEXT,
    is_sale INTEGER DEFAULT 0,
    is_used INTEGER DEFAULT 0,
    FOREIGN KEY(category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    status TEXT DEFAULT 'pending',
    total_price REAL,
    items TEXT, -- JSON string
    delivery_method TEXT,
    delivery_address TEXT,
    delivery_fee REAL DEFAULT 0,
    guarantee_paid INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER,
    product_id INTEGER,
    PRIMARY KEY(user_id, product_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );
`);

// Seed initial categories if empty
const categoryCount = db.prepare('SELECT count(*) as count FROM categories').get() as { count: number };
if (categoryCount.count === 0) {
  const categories = [
    { name: 'Жижи', slug: 'liquids' },
    { name: 'Подики', slug: 'pods' },
    { name: 'Одноразки', slug: 'disposables' },
    { name: 'Никотиновые пластинки', slug: 'nicotine-pouches' },
    { name: 'Испарители', slug: 'coils' },
    { name: 'Шайбы', slug: 'snus' },
    { name: 'SALE', slug: 'sale' }
  ];
  const insert = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)');
  categories.forEach(c => insert.run(c.name, c.slug));

  // Seed initial products
  const products = [
    { category_id: 1, name: 'Husky Double Ice - Chilly Kiwi', price: 450, stock: 50, nicotine: '20мг', volume: '30мл', flavor: 'Киви', image_url: 'https://picsum.photos/seed/husky/400/400' },
    { category_id: 2, name: 'Vaporesso XROS 3 Nano', price: 2800, stock: 15, nicotine: 'N/A', volume: 'N/A', flavor: 'N/A', image_url: 'https://picsum.photos/seed/xros/400/400' },
    { category_id: 3, name: 'Lost Mary BM5000 - Сахарная вата', price: 950, stock: 30, nicotine: '2%', volume: '14мл', flavor: 'Сахарная вата', image_url: 'https://picsum.photos/seed/lostmary/400/400' },
    { category_id: 7, name: 'Старый завоз - Рандомный микс', price: 200, stock: 5, nicotine: '20мг', volume: '30мл', flavor: 'Микс', is_sale: 1, image_url: 'https://picsum.photos/seed/sale/400/400' },
    { category_id: 1, name: 'Maxwell\'s - Shoria', price: 550, stock: 20, nicotine: '12мг', volume: '30мл', flavor: 'Хвоя, мята, ягоды', image_url: 'https://picsum.photos/seed/shoria/400/400' },
    { category_id: 2, name: 'GeekVape Aegis Nano 2', price: 3200, stock: 10, nicotine: 'N/A', volume: 'N/A', flavor: 'N/A', image_url: 'https://picsum.photos/seed/aegis/400/400' }
  ];
  const insertProduct = db.prepare(`
    INSERT INTO products (category_id, name, price, stock, nicotine, volume, flavor, image_url, is_sale) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  products.forEach(p => insertProduct.run(p.category_id, p.name, p.price, p.stock, p.nicotine, p.volume, p.flavor, p.image_url, p.is_sale || 0));
}

// Seed initial settings if empty
const settingsCount = db.prepare('SELECT count(*) as count FROM settings').get() as { count: number };
if (settingsCount.count === 0) {
  const defaultSettings = [
    { key: 'yookassa_shop_id', value: '' },
    { key: 'yookassa_api_key', value: '' },
    { key: 'ton_payment_enabled', value: '0' },
    { key: 'ton_wallet_address', value: '' }
  ];
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  defaultSettings.forEach(s => insertSetting.run(s.key, s.value));
}

// Seed default admin if no users exist
const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  db.prepare(`
    INSERT INTO users (telegram_id, username, first_name, role, password)
    VALUES (?, ?, ?, ?, ?)
  `).run(0, 'admin', 'Администратор', 'admin', 'admin123');
  console.log('--- DEFAULT ADMIN CREATED ---');
  console.log('Login: admin');
  console.log('Password: admin123');
  console.log('-----------------------------');
}

const app = express();
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || 'pickle-rick-secret';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
};

// API Routes
app.post('/api/auth/admin', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username = ? AND role = 'admin'").get(username) as any;
  
  // In a real app we would use bcrypt, but for this Rick & Morty theme we'll allow simple comparison
  // or a specific hardcoded admin if none exists
  if (user && user.password === password) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
    res.cookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    return res.json({ user });
  }
  
  res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/auth/twa', (req, res) => {
  const { initData } = req.body;

  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  const userParam = urlParams.get('user');

  if (!hash || !userParam) {
    return res.status(400).json({ error: 'Invalid initData' });
  }

  const dataCheckString = Array.from(urlParams.entries())
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (computedHash !== hash) {
    return res.status(401).json({ error: 'Invalid authentication' });
  }

  const telegramUser = JSON.parse(userParam);
  const { id, first_name, last_name, username, photo_url } = telegramUser;

  // Upsert user
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  const role = userCount.count === 0 ? 'admin' : 'user';

  const upsertUser = db.prepare(`
    INSERT INTO users (telegram_id, username, first_name, last_name, photo_url, role)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(telegram_id) DO UPDATE SET
      username = excluded.username,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      photo_url = excluded.photo_url
    RETURNING *
  `);

  const user = upsertUser.get(id, username, first_name, last_name, photo_url, role) as any;
  
  const token = jwt.sign({ id: user.id, telegram_id: user.telegram_id, role: user.role }, JWT_SECRET);
  res.cookie('auth_token', token, { 
    httpOnly: true, 
    secure: true, 
    sameSite: 'none' 
  });
  res.json({ user });
});

app.post('/api/auth/telegram', (req, res) => {
  const { id, first_name, last_name, username, photo_url, hash, auth_date } = req.body;

  if (!BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Verify Telegram Hash
  const dataCheckString = Object.keys(req.body)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => `${key}=${req.body[key]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (hmac !== hash) {
    return res.status(401).json({ error: 'Invalid authentication' });
  }

  // Upsert user
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  const role = userCount.count === 0 ? 'admin' : 'user';

  const upsertUser = db.prepare(`
    INSERT INTO users (telegram_id, username, first_name, last_name, photo_url, role)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(telegram_id) DO UPDATE SET
      username = excluded.username,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      photo_url = excluded.photo_url
    RETURNING *
  `);

  const user = upsertUser.get(id, username, first_name, last_name, photo_url, role) as any;
  
  // Set default password for first admin if they don't have one
  if (user.role === 'admin' && !user.password) {
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run('admin123', user.id);
  }

  const token = jwt.sign({ id: user.id, telegram_id: user.telegram_id, role: user.role }, JWT_SECRET);

  res.cookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  res.json({ user });
});

app.get('/api/me', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.json({ user: null });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    res.json({ user });
  } catch (err) {
    res.json({ user: null });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

app.get('/api/products', (req, res) => {
  const products = db.prepare(`
    SELECT p.*, c.name as category_name 
    FROM products p 
    JOIN categories c ON p.category_id = c.id
  `).all();
  res.json(products);
});

app.get('/api/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories').all();
  res.json(categories);
});

app.get('/api/orders/my', authenticate, (req: any, res) => {
  const orders = db.prepare(`
    SELECT * FROM orders 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `).all(req.user.id);
  res.json(orders);
});

// Admin Routes
app.post('/api/admin/products', authenticate, isAdmin, (req, res) => {
  const { category_id, name, description, price, image_url, stock, nicotine, volume, flavor, is_sale, is_used } = req.body;
  const result = db.prepare(`
    INSERT INTO products (category_id, name, description, price, image_url, stock, nicotine, volume, flavor, is_sale, is_used)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(category_id, name, description, price, image_url, stock, nicotine, volume, flavor, is_sale, is_used);
  res.json({ id: result.lastInsertRowid });
});

app.get('/api/admin/orders', authenticate, isAdmin, (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, u.username, u.first_name 
    FROM orders o 
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `).all();
  res.json(orders);
});

app.patch('/api/admin/orders/:id', authenticate, isAdmin, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// Settings Management
app.get('/api/settings', (req, res) => {
  const settings = db.prepare('SELECT * FROM settings').all() as { key: string, value: string }[];
  const publicKeys = ['ton_payment_enabled', 'ton_wallet_address', 'welcome_message'];
  const settingsMap = settings
    .filter(s => publicKeys.includes(s.key))
    .reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
  res.json(settingsMap);
});

app.get('/api/admin/settings', authenticate, isAdmin, (req, res) => {
  const settings = db.prepare('SELECT * FROM settings').all() as { key: string, value: string }[];
  const settingsMap = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
  res.json(settingsMap);
});

app.post('/api/admin/settings', authenticate, isAdmin, (req, res) => {
  const { settings } = req.body; // Expecting an object { key: value }
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
  
  db.transaction(() => {
    Object.entries(settings).forEach(([key, value]) => {
      upsert.run(key, String(value));
    });
  })();
  
  res.json({ success: true });
});

app.get('/api/admin/stats', authenticate, isAdmin, (req, res) => {
  const totalSales = db.prepare("SELECT SUM(total_price) as total FROM orders WHERE status = 'completed'").get() as any;
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get() as any;
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  res.json({ totalSales: totalSales.total || 0, orderCount: orderCount.count, userCount: userCount.count });
});

app.get('/api/admin/users', authenticate, isAdmin, (req, res) => {
  const users = db.prepare(`
    SELECT u.*, 
    (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as total_orders,
    (SELECT SUM(total_price) FROM orders WHERE user_id = u.id AND status = 'completed') as total_spent
    FROM users u
  `).all();
  res.json(users);
});

// Checkout
app.post('/api/orders', authenticate, async (req: any, res) => {
  const { items, total_price, delivery_method, delivery_address, delivery_fee, payment_method } = req.body;
  const result = db.prepare(`
    INSERT INTO orders (user_id, total_price, items, delivery_method, delivery_address, delivery_fee)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.user.id, total_price, JSON.stringify(items), delivery_method, delivery_address, delivery_fee || 0);
  
  const orderId = result.lastInsertRowid as number;

  if (payment_method === 'traditional') {
    // Attempt to create Yookassa payment
    const shopId = db.prepare('SELECT value FROM settings WHERE key = ?').get('yookassa_shop_id') as { value: string };
    const apiKey = db.prepare('SELECT value FROM settings WHERE key = ?').get('yookassa_api_key') as { value: string };

    if (shopId?.value && apiKey?.value) {
      try {
        const auth = Buffer.from(`${shopId.value}:${apiKey.value}`).toString('base64');
        const paymentRes = await axios.post('https://api.yookassa.ru/v3/payments', {
          amount: {
            value: "50.00", // Fix 50 RUB for guarantee as per client description
            currency: "RUB"
          },
          confirmation: {
            type: "redirect",
            return_url: `${process.env.APP_URL || ''}/profile`
          },
          capture: true,
          description: `Заказ #${orderId} - Гарантия оплаты`,
          metadata: {
            order_id: orderId
          }
        }, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Idempotence-Key': crypto.randomUUID(),
            'Content-Type': 'application/json'
          }
        });

        return res.json({ id: orderId, confirmation_url: paymentRes.data.confirmation.confirmation_url });
      } catch (error: any) {
        console.error('Yookassa Error:', error?.response?.data || error.message);
        // Fallback to order ID if payment creation fails
        return res.json({ id: orderId, error: 'Payment service unavailable' });
      }
    }
  }

  res.json({ id: orderId });
});

// Favorites
app.get('/api/favorites', authenticate, (req: any, res) => {
  const favorites = db.prepare(`
    SELECT p.*, c.name as category_name 
    FROM products p 
    JOIN categories c ON p.category_id = c.id
    JOIN favorites f ON p.id = f.product_id
    WHERE f.user_id = ?
  `).all(req.user.id);
  res.json(favorites);
});

app.post('/api/favorites/toggle', authenticate, (req: any, res) => {
  const { productId } = req.body;
  const existing = db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND product_id = ?').get(req.user.id, productId);
  
  if (existing) {
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND product_id = ?').run(req.user.id, productId);
    res.json({ favorited: false });
  } else {
    db.prepare('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)').run(req.user.id, productId);
    res.json({ favorited: true });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
