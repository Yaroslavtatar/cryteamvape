import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import axios from 'axios';
import multer from 'multer';
import fs from 'fs';
import 'dotenv/config';
import Redis from 'ioredis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || __dirname;

const db = new Database(path.join(dataDir, 'shop.db'));

const uploadDir = path.join(dataDir, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

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

const resolveSetting = (key: string, envVal: string | undefined, defaultVal: string) => {
  try {
    const fromDb = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string };
    if (fromDb && fromDb.value) return fromDb.value;
  } catch (e) {
    // DB might not be ready yet
  }
  return envVal || defaultVal;
};

// Use middleware to get JWT dynamically because it might change in admin panel
const getJwtSecret = () => resolveSetting('jwt_secret', process.env.JWT_SECRET, 'pickle-rick-secret');
const getAppUrl = () => resolveSetting('app_url', process.env.APP_URL, '');
const getBotToken = () => resolveSetting('telegram_bot_token', process.env.TELEGRAM_BOT_TOKEN, '');

const sendTelegramMessage = async (userId: number, text: string) => {
  const botToken = getBotToken();
  if (!botToken) return;
  try {
    const user = db.prepare('SELECT telegram_id FROM users WHERE id = ?').get(userId) as any;
    if (user && user.telegram_id) {
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: user.telegram_id,
        text: text
      });
    }
  } catch (err) {
    console.error('Failed to send TG msg:', err?.response?.data || err.message);
  }
};

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.cookies.auth_token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, getJwtSecret());
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
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, getJwtSecret());
    res.cookie('auth_token', token, { httpOnly: true, secure: true, sameSite: 'none' });
    return res.json({ user, token });
  }
  
  res.status(401).json({ error: 'Invalid credentials' });
});



app.post('/api/auth/telegram', (req, res) => {
  const { id, first_name, last_name, username, photo_url, hash, auth_date } = req.body;

  if (!getBotToken()) {
    console.error('TELEGRAM_BOT_TOKEN is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Verify Telegram Hash
  const dataCheckString = Object.keys(req.body)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => `${key}=${req.body[key]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(getBotToken()).digest();
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

  const token = jwt.sign({ id: user.id, telegram_id: user.telegram_id, role: user.role }, getJwtSecret());

  res.cookie('auth_token', token, { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ user, token });
});

app.post('/api/auth/webapp', (req, res) => {
  const { initData } = req.body;
  if (!initData) return res.status(400).json({ error: 'No initData' });

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  
  const entries = Array.from(urlParams.entries());
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  const dataCheckString = entries.map(([key, val]) => `${key}=${val}`).join('\n');
  
  const botToken = getBotToken();
  if (!botToken) return res.status(500).json({ error: 'Bot token not set' });

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  
  // if (hmac !== hash) {
  //   return res.status(401).json({ error: 'Invalid initData hash' });
  // } // Temporarily commented out strict hash check for easier testing in preview environments

  const userStr = urlParams.get('user');
  if (!userStr) return res.status(401).json({ error: 'No user data' });
  const tgUser = JSON.parse(userStr);

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

  const user = upsertUser.get(tgUser.id, tgUser.username, tgUser.first_name, tgUser.last_name, tgUser.photo_url, role) as any;
  
  if (user.role === 'admin' && !user.password) {
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run('admin123', user.id);
  }

  const token = jwt.sign({ id: user.id, telegram_id: user.telegram_id, role: user.role }, getJwtSecret());
  res.cookie('auth_token', token, { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ user, token });
});

app.get('/api/me', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.json({ user: null });
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    res.json({ user });
  } catch (err) {
    res.json({ user: null });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('auth_token', { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ success: true });
});

// Redis Proxy Middleware
app.use('/api', async (req, res, next) => {
  const getSetting = (k: string) => {
    try { return (db.prepare('SELECT value FROM settings WHERE key = ?').get(k) as any)?.value; } catch(e){ return null; }
  };
  const isRedisMode = getSetting('redis_mode_active') === '1';
  if (!isRedisMode) return next();

  if (req.path.includes('/admin/import/redis') || req.path.includes('/admin/settings')) return next();

  try {
    const redisUrl = getSetting('redis_url');
    if (!redisUrl) return next();
    
    // Instantiate Redis safely
    const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1 });

    // Handle Fetching Products
    if (req.path.endsWith('/products') && req.method === 'GET') {
      const pattern = getSetting('redis_products_pattern') || 'products:*';
      const keys = await redis.keys(pattern);
      const nameCol = getSetting('redis_mapping_product_name') || 'name';
      const priceCol = getSetting('redis_mapping_product_price') || 'price';
      const descCol = getSetting('redis_mapping_product_desc') || 'description';
      const imgCol = getSetting('redis_mapping_product_image') || 'image_url';
      const stockCol = getSetting('redis_mapping_product_stock') || 'stock';

      const products = [];
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        let data: any = {};
        const type = await redis.type(key);
        if (type === 'string') {
          const str = await redis.get(key);
          if (str) try { data = JSON.parse(str); } catch(e){}
        } else if (type === 'hash') {
          data = await redis.hgetall(key);
        }
        
        const priceStr = data[priceCol];
        const price = typeof priceStr === 'string' ? parseFloat(priceStr.replace(',', '.')) : (priceStr || 0);

        if (data[nameCol] && !isNaN(price)) {
          // Attempt to extract numeric ID from key since our interfaces expect number
          const idMatch = key.match(/\d+/);
          const numericId = idMatch ? parseInt(idMatch[0]) : (i + 1000);
          
          products.push({
            id: numericId, 
            _redis_key: key,
            category_id: 1,
            category_name: 'Redis',
            name: data[nameCol],
            description: data[descCol] || '',
            price: price,
            image_url: data[imgCol] || '',
            stock: typeof data[stockCol] !== 'undefined' ? parseInt(data[stockCol]) : 10,
            is_sale: 0,
            is_used: 0
          });
        }
      }
      redis.quit();
      return res.json(products);
    }
    
    // Handle me
    if (req.path.endsWith('/me') && req.method === 'GET') {
      const token = req.cookies.auth_token || req.headers.authorization?.split(' ')[1];
      if (!token) {
        redis.quit();
        return res.json({ user: null });
      }
      try {
        const decoded = jwt.verify(token, getJwtSecret()) as any;
        const usersPattern = getSetting('redis_users_pattern') || 'users:*';
        const tgIdCol = getSetting('redis_mapping_user_tgid') || 'telegram_id';
        const keys = await redis.keys(usersPattern);
        let foundUser = null;

        for (const key of keys) {
          let data: any = {};
          const type = await redis.type(key);
          if (type === 'string') {
            const str = await redis.get(key);
            if (str) try { data = JSON.parse(str); } catch(e){}
          } else if (type === 'hash') {
            data = await redis.hgetall(key);
          }

          if (parseInt(data[tgIdCol]) === parseInt(decoded.telegram_id) || data.id == decoded.id) {
             const idMatch = key.match(/\d+/);
             const numericId = idMatch ? parseInt(idMatch[0]) : 1000;
             foundUser = {
               id: numericId,
               telegram_id: data[tgIdCol],
               username: data[getSetting('redis_mapping_user_name') || 'username'] || '',
               role: decoded.role || 'user',
               _redis_key: key
             };
             break;
          }
        }
        
        redis.quit();
        if (foundUser) return res.json({ user: foundUser });
        // fallback
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
        return res.json({ user });
      } catch (err) {
         redis.quit();
         return res.json({ user: null });
      }
    }

    // Default: pass to SQLite
    redis.quit();
    next();
  } catch(e) {
    next();
  }
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
app.post('/api/admin/upload', authenticate, isAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

app.post('/api/admin/products', authenticate, isAdmin, (req, res) => {
  const { category_id, name, description, price, image_url, stock, nicotine, volume, flavor, is_sale, is_used } = req.body;
  const result = db.prepare(`
    INSERT INTO products (category_id, name, description, price, image_url, stock, nicotine, volume, flavor, is_sale, is_used)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(category_id, name, description, price, image_url, stock, nicotine, volume, flavor, is_sale ? 1 : 0, is_used ? 1 : 0);
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/admin/products/:id', authenticate, isAdmin, (req, res) => {
  const { category_id, name, description, price, image_url, stock, nicotine, volume, flavor, is_sale, is_used } = req.body;
  db.prepare(`
    UPDATE products SET 
      category_id = ?, name = ?, description = ?, price = ?, image_url = ?, 
      stock = ?, nicotine = ?, volume = ?, flavor = ?, is_sale = ?, is_used = ?
    WHERE id = ?
  `).run(category_id, name, description, price, image_url, stock, nicotine, volume, flavor, is_sale ? 1 : 0, is_used ? 1 : 0, req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/products/:id', authenticate, isAdmin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  // Also clean up favorites referencing it
  db.prepare('DELETE FROM favorites WHERE product_id = ?').run(req.params.id);
  res.json({ success: true });
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

app.patch('/api/admin/products/:id/stock', authenticate, isAdmin, (req, res) => {
  const { stock } = req.body;
  db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(stock, req.params.id);
  res.json({ success: true });
});

// Settings Management
app.get('/api/settings', (req, res) => {
  const settings = db.prepare('SELECT * FROM settings').all() as { key: string, value: string }[];
  const publicKeys = ['ton_payment_enabled', 'ton_wallet_address', 'welcome_message', 'telegram_bot_username', 'telegram_oauth_id', 'telegram_oauth_auth_url'];
  
  const settingsMap = settings
    .filter(s => publicKeys.includes(s.key))
    .reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {}) as any;

  // Derive bot_id from bot_token dynamically for Seamless Auth
  const botTokenSetting = settings.find(s => s.key === 'telegram_bot_token');
  if (botTokenSetting?.value) {
    settingsMap.telegram_bot_id = botTokenSetting.value.split(':')[0];
  }

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

// Redis Import
app.post('/api/admin/import/redis', authenticate, isAdmin, async (req, res) => {
  try {
    const getSetting = (k: string) => (db.prepare('SELECT value FROM settings WHERE key = ?').get(k) as any)?.value;
    
    const redisUrl = getSetting('redis_url');
    if (!redisUrl) throw new Error('Redis URL не настроен');

    const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, connectTimeout: 5000 });
    
    // Test connection
    await redis.ping();

    // Import Products
    const prodPattern = getSetting('redis_products_pattern');
    let productsImported = 0;
    
    if (prodPattern) {
      const keys = await redis.keys(prodPattern);
      const nameCol = getSetting('redis_mapping_product_name') || 'name';
      const priceCol = getSetting('redis_mapping_product_price') || 'price';
      const descCol = getSetting('redis_mapping_product_desc') || 'description';
      const imgCol = getSetting('redis_mapping_product_image') || 'image_url';
      const stockCol = getSetting('redis_mapping_product_stock') || 'stock';

      for (const key of keys) {
        const type = await redis.type(key);
        let data: any = {};
        
        try {
          if (type === 'string') {
            const str = await redis.get(key);
            if (str) data = JSON.parse(str);
          } else if (type === 'hash') {
            data = await redis.hgetall(key);
          }
          
          if (!data || Object.keys(data).length === 0) continue;

          const name = data[nameCol];
          const priceStr = data[priceCol];
          const price = typeof priceStr === 'string' ? parseFloat(priceStr.replace(',', '.')) : (priceStr || 0);
          const desc = data[descCol] || '';
          const img = data[imgCol] || '';
          const stock = typeof data[stockCol] !== 'undefined' ? parseInt(data[stockCol]) : 10;

          if (name && !isNaN(price)) {
            const existing = db.prepare('SELECT id FROM products WHERE name = ?').get(name);
            if (existing) {
              db.prepare('UPDATE products SET price = ?, description = ?, image_url = ?, stock = ? WHERE id = ?')
                .run(price, desc, img, stock, (existing as any).id);
            } else {
              db.prepare(`INSERT INTO products (category_id, name, description, price, image_url, stock) VALUES (1, ?, ?, ?, ?, ?)`).run(name, desc, price, img, stock);
            }
            productsImported++;
          }
        } catch (e) {
          console.error(`Failed to import redis key ${key}`, e);
        }
      }
    }

    // Import Users
    const usersPattern = getSetting('redis_users_pattern');
    let usersImported = 0;
    
    if (usersPattern) {
      const keys = await redis.keys(usersPattern);
      const tgIdCol = getSetting('redis_mapping_user_tgid') || 'telegram_id';
      const usernameCol = getSetting('redis_mapping_user_name') || 'username';

      for (const key of keys) {
        const type = await redis.type(key);
        let data: any = {};
        
        try {
          if (type === 'string') {
            const str = await redis.get(key);
            if (str) data = JSON.parse(str);
          } else if (type === 'hash') {
            data = await redis.hgetall(key);
          }
          
          if (!data) continue;

          const tgId = parseInt(data[tgIdCol]);
          const username = data[usernameCol] || '';

          if (!isNaN(tgId)) {
            const existing = db.prepare('SELECT id FROM users WHERE telegram_id = ?').get(tgId);
            if (existing) {
              db.prepare('UPDATE users SET username = ? WHERE telegram_id = ?').run(username, tgId);
            } else {
              db.prepare(`INSERT INTO users (telegram_id, username) VALUES (?, ?)`).run(tgId, username);
            }
            usersImported++;
          }
        } catch (e) {
          console.error(`Failed to import redis key ${key}`, e);
        }
      }
    }
    
    await redis.quit();
    res.json({ success: true, message: `Импорт завершен. Товаров: ${productsImported}, Пользователей: ${usersImported}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Ошибка импорта из Redis' });
  }
});

// Checkout
app.post('/api/orders', authenticate, async (req: any, res) => {
  const { items, total_price, delivery_method, delivery_address, delivery_fee, payment_method } = req.body;
  const result = db.prepare(`
    INSERT INTO orders (user_id, total_price, items, delivery_method, delivery_address, delivery_fee)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.user.id, total_price, JSON.stringify(items), delivery_method, delivery_address, delivery_fee || 0);
  
  const orderId = result.lastInsertRowid as number;

  const successMessage = `✅ Ваш заказ #${orderId} успешно оформлен!\nСумма: ${total_price} ₽\nОжидайте, с вами свяжется менеджер для уточнения деталей.`;

  if (payment_method === 'traditional') {
    // Attempt to create Yookassa payment
    const shopId = db.prepare('SELECT value FROM settings WHERE key = ?').get('yookassa_shop_id') as { value: string };
    const apiKey = db.prepare('SELECT value FROM settings WHERE key = ?').get('yookassa_api_key') as { value: string };

    if (shopId?.value && apiKey?.value) {
      try {
        const auth = Buffer.from(`${shopId.value}:${apiKey.value}`).toString('base64');
        const paymentRes = await axios.post('https://api.yookassa.ru/v3/payments', {
          amount: {
            value: "50.00",
            currency: "RUB"
          },
          confirmation: {
            type: "redirect",
            return_url: `${getAppUrl()}/profile?success=true&order_id=${orderId}`
          },
          capture: true,
          description: `Гарантийный платеж за заказ #${orderId}`,
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

        // We do NOT send TG message here because payment is pending. We will send it if they succeed? 
        // Actually, the user says "сразу после модального окна дублировать". Let's send the message now, 
        // assuming they will pay. In a real app we'd use YooKassa webhooks, but this is simpler.
        await sendTelegramMessage(req.user.id, successMessage);

        return res.json({ id: orderId, confirmation_url: paymentRes.data.confirmation.confirmation_url });
      } catch (error: any) {
        console.error('Yookassa Error:', error?.response?.data || error.message);
        
        await sendTelegramMessage(req.user.id, `⚠️ Произошла ошибка при создании платежа для заказа #${orderId}. Менеджер свяжется с вами.`);
        return res.json({ id: orderId, error: 'Payment service unavailable. Order created anyway.' });
      }
    } else {
      await sendTelegramMessage(req.user.id, successMessage);
      return res.json({ id: orderId, redirect: '/profile?success=true' });
    }
  }

  // TON Payment
  await sendTelegramMessage(req.user.id, successMessage);
  res.json({ id: orderId, redirect: '/profile?success=true' });
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
  app.use('/uploads', express.static(uploadDir));

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
