# Руководство по деплою Baraholka Shop

Этот проект использует стек **Express + Vite + SQLite**.

## 1. Требования к серверу
- **OC**: Linux (рекомендуется Ubuntu 22.04+)
- **Node.js**: v18 или выше
- **Nginx**: для настройки прокси и SSL

## 2. Подготовка проекта на сервере

1. **Клонируйте репозиторий** (или загрузите файлы):
   ```bash
   git clone <your-repo-url>
   cd baraholka-shop
   ```

2. **Установите зависимости**:
   ```bash
   npm install
   ```

3. **Настройте переменные окружения**:
   Создайте файл `.env` в корне проекта:
   ```bash
   cp .env.example .env
   ```
   Отредактируйте `.env` и вставьте ваш `TELEGRAM_BOT_TOKEN` (получите у @BotFather) и придумайте `JWT_SECRET`.

4. **Соберите фронтенд**:
   ```bash
   npm run build
   ```

## 3. Запуск приложения

Для постоянной работы приложения в фоне рекомендуется использовать **PM2**:

1. **Установите PM2**:
   ```bash
   sudo npm install -g pm2
   ```

2. **Запустите сервер**:
   ```bash
   NODE_ENV=production pm2 start server.ts --interpreter ./node_modules/.bin/tsx --name baraholka-shop
   ```

## 4. Настройка Nginx

Чтобы сайт открывался по домену, настройте прокси в Nginx:

1. Создайте конфиг `/etc/nginx/sites-available/shop`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

2. Рестартаните Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/shop /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

3. **Настройте SSL (HTTPS)**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 5. Важное примечание по Telegram
В настройках вашего бота в Telegram через @BotFather обязательно укажите **Domain** вашего сайта в разделе `Bot Settings` -> `Domain`. Без этого авторизация через виджет работать не будет.
