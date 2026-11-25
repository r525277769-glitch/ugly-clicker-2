
const express = require("express");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000
});

let databaseReady = false;

const catalog = {
  house: [
    { name: "Маленький дом", price: 100000 },
    { name: "Особняк", price: 1000000 },
    { name: "Роскошная вилла", price: 10000000 },
    { name: "Дворец", price: 50000000 }
  ],
  car: [
    { name: "Спортивный автомобиль", price: 50000 },
    { name: "Премиум автомобиль", price: 500000 },
    { name: "Суперкар", price: 5000000 },
    { name: "Гиперкар", price: 10000000 }
  ],
  watch: [
    { name: "Классические часы", price: 10000 },
    { name: "Золотые часы", price: 250000 },
    { name: "Люксовые часы", price: 5000000 }
  ],
  painting: [
    { name: "Картина", price: 5000 },
    { name: "Редкая картина", price: 250000 },
    { name: "Шедевр", price: 2000000 }
  ],
  yacht: [
    { name: "Малая яхта", price: 5000000 },
    { name: "Суперъяхта", price: 50000000 },
    { name: "Мегаъяхта", price: 100000000 }
  ],
  island: [
    { name: "Небольшой остров", price: 50000000 },
    { name: "Тропический остров", price: 250000000 },
    { name: "Частный архипелаг", price: 1000000000 }
  ]
};

async function initDatabase() {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (
      telegram_id BIGINT PRIMARY KEY,
      username TEXT,
      balance BIGINT NOT NULL DEFAULT 0,
      experience BIGINT NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      last_daily DATE,
      last_active TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id BIGSERIAL PRIMARY KEY,
      telegram_id BIGINT REFERENCES players(telegram_id),
      category TEXT NOT NULL,
      item_name TEXT NOT NULL,
      purchase_price BIGINT NOT NULL,
      purchased_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id BIGSERIAL PRIMARY KEY,
      referrer_id BIGINT REFERENCES players(telegram_id),
      referred_id BIGINT UNIQUE REFERENCES players(telegram_id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pvp (
      id BIGSERIAL PRIMARY KEY,
      player1 BIGINT REFERENCES players(telegram_id),
      player2 BIGINT REFERENCES players(telegram_id),
      winner BIGINT REFERENCES players(telegram_id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  databaseReady = true;
  console.log("Database ready");
}

function authenticate(initData) {
  if (!BOT_TOKEN || !initData) {
    throw new Error("Telegram authentication is not configured");
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) throw new Error("Invalid Telegram data");

  params.delete("hash");

  const authDate = Number(params.get("auth_date"));
  const now = Math.floor(Date.now() / 1000);

  if (!authDate || now - authDate > 86400 || authDate > now + 60) {
    throw new Error("Telegram session expired");
  }

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(BOT_TOKEN)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(calculatedHash, "hex");

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error("Telegram authentication failed");
  }

  const user = JSON.parse(params.get("user") || "{}");

  if (!user.id) throw new Error("Player not found");

  return user;
}

async function auth(req, res, next) {
  try {
    if (!databaseReady) {
      return res.status(503).json({ error: "Database is starting" });
    }

    req.player = authenticate(req.headers["x-telegram-init-data"]);

    await pool.query(
      `INSERT INTO players (telegram_id, username)
       VALUES ($1, $2)
       ON CONFLICT (telegram_id)
       DO UPDATE SET username = EXCLUDED.username`,
      [req.player.id, req.player.username || null]
    );

    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    game: "UGLY CLICKER 2.0",
    database: databaseReady ? "connected" : "connecting"
  });
});

app.get("/api/catalog", (req, res) => {
  res.json(catalog);
});

app.get("/api/state", auth, async (req, res) => {
  try {
    const playerId = req.player.id;

    const player = await pool.query(
      `SELECT balance, experience, level, last_daily
       FROM players WHERE telegram_id = $1`,
      [playerId]
    );

    const inventory = await pool.query(
      `SELECT id, category, item_name, purchase_price, purchased_at
       FROM inventory WHERE telegram_id = $1
       ORDER BY purchased_at DESC`,
      [playerId]
    );

    res.json({
      balance: Number(player.rows[0].balance),
      experience: Number(player.rows[0].experience),
      level: player.rows[0].level,
      lastDaily: player.rows[0].last_daily,
      inventory: inventory.rows
    });
  } catch (error) {
    console.error("State error:", error);
    res.status(500).json({ error: "Could not load game data" });
  }
});

app.post("/api/click", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE players
       SET balance = balance + 1,
           experience = experience + 1,
           level = FLOOR((experience + 1) / 1000) + 1
       WHERE telegram_id = $1
       RETURNING balance, experience, level`,
      [req.player.id]
    );

    res.json({
      balance: Number(result.rows[0].balance),
      experience: Number(result.rows[0].experience),
      level: result.rows[0].level
    });
  } catch (error) {
    console.error("Click error:", error);
    res.status(500).json({ error: "Click failed" });
  }
});

app.post("/api/shop/buy", auth, async (req, res) => {
  const { category, index } = req.body;

  if (
    !catalog[category] ||
    !Number.isInteger(index) ||
    !catalog[category][index]
  ) {
    return res.status(400).json({ error: "Invalid item" });
  }

  const item = catalog[category][index];
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const player = await client.query(
      "SELECT balance FROM players WHERE telegram_id = $1 FOR UPDATE",
      [req.player.id]
    );

    if (!player.rows.length || Number(player.rows[0].balance) < item.price) {
      throw new Error("Недостаточно денег");
    }

    await client.query(
      "UPDATE players SET balance = balance - $1 WHERE telegram_id = $2",
      [item.price, req.player.id]
    );

    await client.query(
      `INSERT INTO inventory
       (telegram_id, category, item_name, purchase_price)
       VALUES ($1, $2, $3, $4)`,
      [req.player.id, category, item.name, item.price]
    );

    await client.query("COMMIT");

    const updated = await client.query(
      "SELECT balance FROM players WHERE telegram_id = $1",
      [req.player.id]
    );

    res.json({
      success: true,
      balance: Number(updated.rows[0].balance)
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.post("/api/shop/sell", auth, async (req, res) => {
  const itemId = Number(req.body.itemId);

  if (!Number.isSafeInteger(itemId) || itemId <= 0) {
    return res.status(400).json({ error: "Invalid item" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const item = await client.query(
      `SELECT id, purchase_price FROM inventory
       WHERE id = $1 AND telegram_id = $2 FOR UPDATE`,
      [itemId, req.player.id]
    );

    if (!item.rows.length) {
      throw new Error("Предмет не найден");
    }

    const refund = Math.floor(Number(item.rows[0].purchase_price) * 0.7);

    await client.query(
      "DELETE FROM inventory WHERE id = $1",
      [itemId]
    );

    await client.query(
      "UPDATE players SET balance = balance + $1 WHERE telegram_id = $2",
      [refund, req.player.id]
    );

    await client.query("COMMIT");

    const updated = await client.query(
      "SELECT balance FROM players WHERE telegram_id = $1",
      [req.player.id]
    );

    res.json({
      success: true,
      refund,
      balance: Number(updated.rows[0].balance)
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.post("/api/daily", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE players
       SET balance = balance + 1000,
           last_daily = CURRENT_DATE
       WHERE telegram_id = $1
         AND (last_daily IS NULL OR last_daily < CURRENT_DATE)
       RETURNING balance`,
      [req.player.id]
    );

    if (!result.rows.length) {
      throw new Error("Ежедневная награда уже получена");
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      reward: 1000,
      balance: Number(result.rows[0].balance)
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    if (!databaseReady) {
      return res.status(503).json({ error: "Database is starting" });
    }

    const result = await pool.query(
      `SELECT username, balance, level
       FROM players
       ORDER BY balance DESC
       LIMIT 20`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ error: "Leaderboard failed" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`UGLY CLICKER 2.0 running on port ${PORT}`);

  initDatabase().catch(error => {
    databaseReady = false;
    console.error("Database initialization failed:", error);
  });
});
