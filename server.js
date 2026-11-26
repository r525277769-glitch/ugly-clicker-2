
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
    { name: "Суперкар", price: 10000000 },
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

const businessCatalog = [
  { key: "kiosk", name: "Ларёк", price: 1000, income: 10 },
  { key: "cafe", name: "Кафе", price: 15000, income: 150 },
  { key: "hookah", name: "Кальянка", price: 50000, income: 300 },
  { key: "tech_store", name: "Магазин техники", price: 100000, income: 1000 },
  { key: "wb_network", name: "Сеть пунктов выдачи WB", price: 400000, income: 5000 },
  { key: "basement_club", name: "Стрипуха в подвале", price: 700000, income: 10000 },
  { key: "gta_club", name: "Стрипуха из GTA 6", price: 1000000, income: 20000 },
  { key: "tiktok_company", name: "Компания TikTok", price: 5000000, income: 50000 },
  { key: "ferrari_sales", name: "Продажа транспорта Ferrari", price: 12000000, income: 150000 }
];

const upgrades = {
  x2: { price: 5000, multiplier: 2, duration: 180000 },
  x4: { price: 12000, multiplier: 4, duration: 180000 },
  x10: { price: 2000000, multiplier: 10, permanent: true }
};

// =====================================================
// ПОСТОЯННЫЕ УЛУЧШЕНИЯ КЛИКА
// =====================================================

const clickUpgrades = [
  { key: "click_2", name: "+$2 за клик", amount: 2, price: 1000 },
  { key: "click_10", name: "+$10 за клик", amount: 10, price: 12000 },
  { key: "click_50", name: "+$50 за клик", amount: 50, price: 150000 },
  { key: "click_150", name: "+$150 за клик", amount: 150, price: 500000 },
  { key: "click_1000", name: "+$1 000 за клик", amount: 1000, price: 1500000 },
  { key: "click_10000", name: "+$10 000 за клик", amount: 10000, price: 7500000 }
];

// =====================================================
// BATTLE PASS: НАСТРОЙКИ
// =====================================================

const BP_CONFIG = {
  seasonDays: 30,
  maxLevel: 100,
  xpPerLevel: 200,
  freeTaskXP: 75,
  premiumTaskXP: 150,
  premiumDollarPrice: 300000,
  premiumGrammPrice: 30000
};

const BP_TASKS = [
  {
    key: "click_dollars",
    title: "Заработать $2 000 кликами",
    target: 2000
  },
  {
    key: "business_profit",
    title: "Получить прибыль от бизнеса",
    target: 1
  },
  {
    key: "gramm_50",
    title: "Сделать 50 кликов в GRAMM CLICKER",
    target: 50
  },
  {
    key: "gramm_75",
    title: "Сделать 75 кликов в GRAMM CLICKER",
    target: 75
  },
  {
    key: "gramm_100",
    title: "Сделать 100 кликов в GRAMM CLICKER",
    target: 100
  },
  {
    key: "shop_purchase",
    title: "Купить любой предмет в магазине",
    target: 1
  }
];

// =====================================================
// БАЗА ДАННЫХ
// =====================================================

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

    ALTER TABLE players
      ADD COLUMN IF NOT EXISTS gramm_balance BIGINT NOT NULL DEFAULT 0;

    ALTER TABLE players
      ADD COLUMN IF NOT EXISTS bonus_x2_until TIMESTAMPTZ;

    ALTER TABLE players
      ADD COLUMN IF NOT EXISTS bonus_x4_until TIMESTAMPTZ;

    ALTER TABLE players
      ADD COLUMN IF NOT EXISTS x10_unlocked BOOLEAN NOT NULL DEFAULT FALSE;

    ALTER TABLE players
      ADD COLUMN IF NOT EXISTS business_balance BIGINT NOT NULL DEFAULT 0;

    CREATE TABLE IF NOT EXISTS player_businesses (
      id BIGSERIAL PRIMARY KEY,
      telegram_id BIGINT NOT NULL REFERENCES players(telegram_id),
      business_key TEXT NOT NULL,
      business_name TEXT NOT NULL,
      purchase_price BIGINT NOT NULL,
      hourly_income BIGINT NOT NULL,
      purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_accrued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_player_businesses_telegram_id
      ON player_businesses(telegram_id);

    -- ПОСТОЯННЫЕ УЛУЧШЕНИЯ КЛИКА

    CREATE TABLE IF NOT EXISTS player_click_upgrades (
      id BIGSERIAL PRIMARY KEY,
      telegram_id BIGINT NOT NULL REFERENCES players(telegram_id),
      upgrade_key TEXT NOT NULL,
      amount BIGINT NOT NULL,
      purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (telegram_id, upgrade_key)
    );

    CREATE INDEX IF NOT EXISTS idx_player_click_upgrades_telegram_id
      ON player_click_upgrades(telegram_id);

    -- BATTLE PASS: сезоны

    CREATE TABLE IF NOT EXISTS battle_pass_seasons (
      id BIGSERIAL PRIMARY KEY,
      starts_at TIMESTAMPTZ NOT NULL,
      ends_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- BATTLE PASS: прогресс игроков

    CREATE TABLE IF NOT EXISTS player_battle_pass (
      telegram_id BIGINT NOT NULL REFERENCES players(telegram_id),
      season_id BIGINT NOT NULL REFERENCES battle_pass_seasons(id),
      bp_xp BIGINT NOT NULL DEFAULT 0,
      bp_level INTEGER NOT NULL DEFAULT 1,
      premium BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (telegram_id, season_id)
    );

    -- BATTLE PASS: ежедневные задания

    CREATE TABLE IF NOT EXISTS battle_pass_tasks (
      id BIGSERIAL PRIMARY KEY,
      telegram_id BIGINT NOT NULL REFERENCES players(telegram_id),
      season_id BIGINT NOT NULL REFERENCES battle_pass_seasons(id),
      task_date DATE NOT NULL,
      task_key TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      completed_at TIMESTAMPTZ,
      UNIQUE (telegram_id, season_id, task_date, task_key)
    );

    CREATE INDEX IF NOT EXISTS idx_bp_tasks_player_date
      ON battle_pass_tasks(telegram_id, season_id, task_date);

    -- BATTLE PASS: полученные награды

    CREATE TABLE IF NOT EXISTS battle_pass_claims (
      id BIGSERIAL PRIMARY KEY,
      telegram_id BIGINT NOT NULL REFERENCES players(telegram_id),
      season_id BIGINT NOT NULL REFERENCES battle_pass_seasons(id),
      bp_level INTEGER NOT NULL,
      track TEXT NOT NULL,
      dollars BIGINT NOT NULL,
      gramm BIGINT NOT NULL,
      claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (telegram_id, season_id, bp_level, track)
    );
  `);

  databaseReady = true;
  console.log("Database ready");
}

// =====================================================
// BATTLE PASS: СЕЗОНЫ И ПРОГРЕСС
// =====================================================

async function getActiveBPSeason(client) {
  let result = await client.query(
    `SELECT id, starts_at, ends_at
     FROM battle_pass_seasons
     WHERE ends_at > NOW()
     ORDER BY id DESC
     LIMIT 1`
  );

  if (result.rows.length) {
    return result.rows[0];
  }

  await client.query("SELECT pg_advisory_xact_lock(20261126)");

  result = await client.query(
    `SELECT id, starts_at, ends_at
     FROM battle_pass_seasons
     WHERE ends_at > NOW()
     ORDER BY id DESC
     LIMIT 1`
  );

  if (result.rows.length) {
    return result.rows[0];
  }

  const created = await client.query(
    `INSERT INTO battle_pass_seasons (starts_at, ends_at)
     VALUES (NOW(), NOW() + INTERVAL '30 days')
     RETURNING id, starts_at, ends_at`
  );

  return created.rows[0];
}

async function getOrCreateBPPlayer(client, telegramId, seasonId) {
  await client.query(
    `INSERT INTO player_battle_pass
      (telegram_id, season_id)
     VALUES ($1, $2)
     ON CONFLICT (telegram_id, season_id) DO NOTHING`,
    [telegramId, seasonId]
  );

  const result = await client.query(
    `SELECT bp_xp, bp_level, premium
     FROM player_battle_pass
     WHERE telegram_id = $1 AND season_id = $2
     FOR UPDATE`,
    [telegramId, seasonId]
  );

  return result.rows[0];
}

function getBPReward(level, track) {
  const freeDollars = level * 1000;
  const freeGramm = level * 10;

  const multiplier = track === "premium" ? 2 : 1;

  return {
    dollars: freeDollars * multiplier,
    gramm: freeGramm * multiplier
  };
}

async function addBPExperience(client, telegramId, seasonId, amount) {
  const result = await client.query(
    `UPDATE player_battle_pass
     SET bp_xp = LEAST(
       $3,
       bp_xp + $4
     ),
     bp_level = LEAST(
       100,
       FLOOR(LEAST($3, bp_xp + $4)::numeric / 200)::integer + 1
     )
     WHERE telegram_id = $1 AND season_id = $2
     RETURNING bp_xp, bp_level`,
    [
      telegramId,
      seasonId,
      (BP_CONFIG.maxLevel - 1) * BP_CONFIG.xpPerLevel,
      amount
    ]
  );

  return result.rows[0];
}

async function trackBPTask(client, telegramId, taskKey, amount) {
  const task = BP_TASKS.find(item => item.key === taskKey);

  if (!task || amount <= 0) return;

  const season = await getActiveBPSeason(client);

  const bpPlayer = await getOrCreateBPPlayer(
    client,
    telegramId,
    season.id
  );

  const today = new Date().toISOString().slice(0, 10);

  await client.query(
    `INSERT INTO battle_pass_tasks
      (telegram_id, season_id, task_date, task_key, progress)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (telegram_id, season_id, task_date, task_key)
     DO UPDATE SET progress = LEAST(
       battle_pass_tasks.progress + EXCLUDED.progress,
       100000000
     )`,
    [telegramId, season.id, today, taskKey, amount]
  );

  const completed = await client.query(
    `UPDATE battle_pass_tasks
     SET completed_at = NOW()
     WHERE telegram_id = $1
       AND season_id = $2
       AND task_date = $3
       AND task_key = $4
       AND progress >= $5
       AND completed_at IS NULL
     RETURNING id`,
    [telegramId, season.id, today, taskKey, task.target]
  );

  if (completed.rows.length) {
    const xp = bpPlayer.premium
      ? BP_CONFIG.premiumTaskXP
      : BP_CONFIG.freeTaskXP;

    await addBPExperience(
      client,
      telegramId,
      season.id,
      xp
    );
  }
}

// =====================================================
// BATTLE PASS: API СОСТОЯНИЯ
// =====================================================

app.get("/api/battle-pass/state", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const season = await getActiveBPSeason(client);

    const player = await getOrCreateBPPlayer(
      client,
      req.player.id,
      season.id
    );

    const today = new Date().toISOString().slice(0, 10);

    const tasksResult = await client.query(
      `SELECT task_key, progress, completed_at
       FROM battle_pass_tasks
       WHERE telegram_id = $1
         AND season_id = $2
         AND task_date = $3`,
      [req.player.id, season.id, today]
    );

    const claimsResult = await client.query(
      `SELECT bp_level, track
       FROM battle_pass_claims
       WHERE telegram_id = $1 AND season_id = $2`,
      [req.player.id, season.id]
    );

    const taskMap = {};

    for (const row of tasksResult.rows) {
      taskMap[row.task_key] = row;
    }

    const claimed = claimsResult.rows.map(row => ({
      level: Number(row.bp_level),
      track: row.track
    }));

    const tasks = BP_TASKS.map(task => {
      const saved = taskMap[task.key];

      return {
        key: task.key,
        title: task.title,
        target: task.target,
        progress: saved ? Number(saved.progress) : 0,
        completed: Boolean(saved && saved.completed_at),
        xpReward: player.premium
          ? BP_CONFIG.premiumTaskXP
          : BP_CONFIG.freeTaskXP
      };
    });

    await client.query("COMMIT");

    const xp = Number(player.bp_xp);
    const level = Number(player.bp_level);

    res.json({
      success: true,
      season: {
        id: Number(season.id),
        startsAt: season.starts_at,
        endsAt: season.ends_at,
        days: BP_CONFIG.seasonDays
      },
      level,
      xp,
      xpPerLevel: BP_CONFIG.xpPerLevel,
      xpProgress: level >= BP_CONFIG.maxLevel
        ? BP_CONFIG.xpPerLevel
        : xp % BP_CONFIG.xpPerLevel,
      maxLevel: BP_CONFIG.maxLevel,
      premium: player.premium,
      premiumPrice: {
        dollars: BP_CONFIG.premiumDollarPrice,
        gramm: BP_CONFIG.premiumGrammPrice
      },
      tasks,
      claimed
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Battle Pass state error:", error);
    res.status(500).json({
      error: "Не удалось загрузить Battle Pass"
    });
  } finally {
    client.release();
  }
});

// =====================================================
// BATTLE PASS: ПОКУПКА PREMIUM
// =====================================================

app.post("/api/battle-pass/buy-premium", auth, async (req, res) => {
  const currency = req.body.currency;

  if (currency !== "usd" && currency !== "gramm") {
    return res.status(400).json({
      error: "Выбери оплату долларами или GRAMM"
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const season = await getActiveBPSeason(client);

    const bpPlayer = await getOrCreateBPPlayer(
      client,
      req.player.id,
      season.id
    );

    if (bpPlayer.premium) {
      throw new Error("Premium уже куплен");
    }

    const playerResult = await client.query(
      `SELECT balance, gramm_balance
       FROM players
       WHERE telegram_id = $1
       FOR UPDATE`,
      [req.player.id]
    );

    const player = playerResult.rows[0];

    if (currency === "usd") {
      if (
        BigInt(player.balance) <
        BigInt(BP_CONFIG.premiumDollarPrice)
      ) {
        throw new Error("Недостаточно долларов");
      }

      await client.query(
        `UPDATE players
         SET balance = balance - $1
         WHERE telegram_id = $2`,
        [BP_CONFIG.premiumDollarPrice, req.player.id]
      );
    } else {
      if (
        BigInt(player.gramm_balance) <
        BigInt(BP_CONFIG.premiumGrammPrice)
      ) {
        throw new Error("Недостаточно GRAMM");
      }

      await client.query(
        `UPDATE players
         SET gramm_balance = gramm_balance - $1
         WHERE telegram_id = $2`,
        [BP_CONFIG.premiumGrammPrice, req.player.id]
      );
    }

    await client.query(
      `UPDATE player_battle_pass
       SET premium = TRUE
       WHERE telegram_id = $1 AND season_id = $2`,
      [req.player.id, season.id]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      premium: true,
      message: "PREMIUM BATTLE PASS успешно куплен"
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
});

// =====================================================
// BATTLE PASS: ПОЛУЧЕНИЕ НАГРАД
// =====================================================

app.post("/api/battle-pass/claim", auth, async (req, res) => {
  const level = Number(req.body.level);
  const track = req.body.track;

  if (
    !Number.isInteger(level) ||
    level < 1 ||
    level > BP_CONFIG.maxLevel
  ) {
    return res.status(400).json({
      error: "Неверный уровень"
    });
  }

  if (track !== "free" && track !== "premium") {
    return res.status(400).json({
      error: "Неверная дорожка наград"
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const season = await getActiveBPSeason(client);

    const bpPlayer = await getOrCreateBPPlayer(
      client,
      req.player.id,
      season.id
    );

    if (level > Number(bpPlayer.bp_level)) {
      throw new Error("Этот уровень ещё не достигнут");
    }

    if (track === "premium" && !bpPlayer.premium) {
      throw new Error("Для этой награды нужен PREMIUM");
    }

    const reward = getBPReward(level, track);

    const claim = await client.query(
      `INSERT INTO battle_pass_claims
        (telegram_id, season_id, bp_level, track, dollars, gramm)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (telegram_id, season_id, bp_level, track)
       DO NOTHING
       RETURNING id`,
      [
        req.player.id,
        season.id,
        level,
        track,
        reward.dollars,
        reward.gramm
      ]
    );

    if (!claim.rows.length) {
      throw new Error("Эта награда уже получена");
    }

    await client.query(
      `UPDATE players
       SET balance = balance + $1,
           gramm_balance = gramm_balance + $2
       WHERE telegram_id = $3`,
      [reward.dollars, reward.gramm, req.player.id]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      level,
      track,
      dollars: reward.dollars,
      gramm: reward.gramm,
      message: "Награда Battle Pass получена"
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
});

// =====================================================
// TELEGRAM АВТОРИЗАЦИЯ
// =====================================================

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
    console.error("Authentication error:", error.message);
    res.status(401).json({ error: error.message });
  }
}

function getMultiplier(player) {
  const now = Date.now();

  let timedMultiplier = 1;

  if (
    player.bonus_x2_until &&
    new Date(player.bonus_x2_until).getTime() > now
  ) {
    timedMultiplier = Math.max(timedMultiplier, 2);
  }

  if (
    player.bonus_x4_until &&
    new Date(player.bonus_x4_until).getTime() > now
  ) {
    timedMultiplier = Math.max(timedMultiplier, 4);
  }

  const permanentMultiplier = player.x10_unlocked ? 10 : 1;

  return timedMultiplier * permanentMultiplier;
}

function getBonusState(player) {
  const now = Date.now();

  const x2Until = player.bonus_x2_until
    ? new Date(player.bonus_x2_until).getTime()
    : 0;

  const x4Until = player.bonus_x4_until
    ? new Date(player.bonus_x4_until).getTime()
    : 0;

  return {
    x2Active: x2Until > now,
    x2Seconds: Math.max(0, Math.ceil((x2Until - now) / 1000)),
    x4Active: x4Until > now,
    x4Seconds: Math.max(0, Math.ceil((x4Until - now) / 1000)),
    x10Unlocked: player.x10_unlocked
  };
}

// =====================================================
// API ПОСТОЯННЫХ УЛУЧШЕНИЙ КЛИКА
// =====================================================

// Получение списка улучшений и информации о покупках.

app.get("/api/click-upgrades", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT upgrade_key
       FROM player_click_upgrades
       WHERE telegram_id = $1`,
      [req.player.id]
    );

    const ownedKeys = result.rows.map(row => row.upgrade_key);

    const upgradesList = clickUpgrades.map(upgrade => ({
      ...upgrade,
      owned: ownedKeys.includes(upgrade.key)
    }));

    res.json({
      success: true,
      upgrades: upgradesList,
      owned: ownedKeys
    });
  } catch (error) {
    console.error("Click upgrades state error:", error);
    res.status(500).json({
      error: "Не удалось загрузить улучшения клика"
    });
  }
});

// Покупка постоянного улучшения.

app.post("/api/click-upgrades/buy", auth, async (req, res) => {
  const key = req.body.key;
  const upgrade = clickUpgrades.find(item => item.key === key);

  if (!upgrade) {
    return res.status(400).json({
      error: "Такого улучшения не существует"
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Блокируем строку игрока, чтобы исключить
    // одновременную повторную покупку.

    const playerResult = await client.query(
      `SELECT balance
       FROM players
       WHERE telegram_id = $1
       FOR UPDATE`,
      [req.player.id]
    );

    if (!playerResult.rows.length) {
      throw new Error("Игрок не найден");
    }

    const alreadyBought = await client.query(
      `SELECT id
       FROM player_click_upgrades
       WHERE telegram_id = $1 AND upgrade_key = $2`,
      [req.player.id, key]
    );

    if (alreadyBought.rows.length) {
      throw new Error("Это улучшение уже куплено");
    }

    if (BigInt(playerResult.rows[0].balance) < BigInt(upgrade.price)) {
      throw new Error("Недостаточно долларов");
    }

    await client.query(
      `UPDATE players
       SET balance = balance - $1
       WHERE telegram_id = $2`,
      [upgrade.price, req.player.id]
    );

    await client.query(
      `INSERT INTO player_click_upgrades
        (telegram_id, upgrade_key, amount)
       VALUES ($1, $2, $3)`,
      [req.player.id, upgrade.key, upgrade.amount]
    );

    const totalResult = await client.query(
      `SELECT COALESCE(SUM(amount), 0)::text AS total
       FROM player_click_upgrades
       WHERE telegram_id = $1`,
      [req.player.id]
    );

    const updatedPlayer = await client.query(
      `SELECT balance
       FROM players
       WHERE telegram_id = $1`,
      [req.player.id]
    );

    await client.query("COMMIT");

    const clickUpgradeBonus = Number(totalResult.rows[0].total);

    res.json({
      success: true,
      message: "Улучшение успешно куплено",
      balance: Number(updatedPlayer.rows[0].balance),
      purchased: upgrade.key,
      clickUpgradeBonus,
      clickBase: 1 + clickUpgradeBonus
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
});

// =====================================================
// БИЗНЕС: ПАССИВНЫЙ ДОХОД
// =====================================================

async function accrueBusinessIncome(client, telegramId) {
  const businesses = await client.query(
    `SELECT id, hourly_income, last_accrued_at
     FROM player_businesses
     WHERE telegram_id = $1
     FOR UPDATE`,
    [telegramId]
  );

  const now = Date.now();
  let totalIncome = 0n;

  for (const business of businesses.rows) {
    const lastTime = new Date(business.last_accrued_at).getTime();
    const elapsedMs = BigInt(Math.max(0, now - lastTime));
    const hourlyIncome = BigInt(business.hourly_income);

    const earned = (elapsedMs * hourlyIncome) / 3600000n;

    if (earned > 0n) {
      const creditedMs = (earned * 3600000n) / hourlyIncome;
      const newLastTime = new Date(
        lastTime + Number(creditedMs)
      );

      await client.query(
        `UPDATE player_businesses
         SET last_accrued_at = $1
         WHERE id = $2 AND telegram_id = $3`,
        [newLastTime, business.id, telegramId]
      );

      totalIncome += earned;
    }
  }

  if (totalIncome > 0n) {
    await client.query(
      `UPDATE players
       SET business_balance = business_balance + $1
       WHERE telegram_id = $2`,
      [totalIncome.toString(), telegramId]
    );

    await trackBPTask(client, telegramId, "business_profit", 1);
  }

  return totalIncome.toString();
}

// =====================================================
// СТАТУС СЕРВЕРА И КАТАЛОГИ
// =====================================================

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

app.get("/api/businesses/catalog", auth, (req, res) => {
  res.json(businessCatalog);
});

// =====================================================
// СОСТОЯНИЕ ИГРОКА
// =====================================================

app.get("/api/state", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `SELECT telegram_id FROM players
       WHERE telegram_id = $1 FOR UPDATE`,
      [req.player.id]
    );

    await accrueBusinessIncome(client, req.player.id);

    const player = await client.query(
      `SELECT balance, gramm_balance, business_balance,
              experience, level, last_daily,
              bonus_x2_until, bonus_x4_until, x10_unlocked
       FROM players WHERE telegram_id = $1`,
      [req.player.id]
    );

    const inventory = await client.query(
      `SELECT id, category, item_name, purchase_price, purchased_at
       FROM inventory WHERE telegram_id = $1
       ORDER BY purchased_at DESC`,
      [req.player.id]
    );

    const businesses = await client.query(
      `SELECT id, business_key, business_name,
              purchase_price, hourly_income, purchased_at
       FROM player_businesses
       WHERE telegram_id = $1
       ORDER BY purchased_at DESC`,
      [req.player.id]
    );

    const income = await client.query(
      `SELECT COALESCE(SUM(hourly_income), 0)::text AS total
       FROM player_businesses
       WHERE telegram_id = $1`,
      [req.player.id]
    );

    // Сумма всех приобретённых улучшений клика.

    const clickUpgradeResult = await client.query(
      `SELECT
         COALESCE(SUM(amount), 0)::text AS total,
         COALESCE(
           ARRAY_AGG(upgrade_key),
           ARRAY[]::text[]
         ) AS owned
       FROM player_click_upgrades
       WHERE telegram_id = $1`,
      [req.player.id]
    );

    await client.query("COMMIT");

    const p = player.rows[0];
    const clickUpgradeBonus = Number(clickUpgradeResult.rows[0].total);
    const clickBase = 1 + clickUpgradeBonus;
    const multiplier = getMultiplier(p);

    res.json({
      balance: Number(p.balance),
      grammBalance: Number(p.gramm_balance),
      businessBalance: Number(p.business_balance),
      businessIncomePerHour: Number(income.rows[0].total),
      businesses: businesses.rows,
      experience: Number(p.experience),
      level: p.level,
      lastDaily: p.last_daily,
      inventory: inventory.rows,
      bonuses: getBonusState(p),
      multiplier,

      // Новые данные улучшений клика.
      clickUpgradeBonus,
      clickBase,
      clickReward: clickBase * multiplier,
      ownedClickUpgrades: clickUpgradeResult.rows[0].owned
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("State error:", error);
    res.status(500).json({ error: "Could not load game data" });
  } finally {
    client.release();
  }
});

// =====================================================
// ОСНОВНОЙ КЛИКЕР
// =====================================================

app.post("/api/click", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const player = await client.query(
      `SELECT balance, experience, level, bonus_x2_until,
              bonus_x4_until, x10_unlocked
       FROM players WHERE telegram_id = $1 FOR UPDATE`,
      [req.player.id]
    );

    const p = player.rows[0];

    // Получаем сумму всех постоянных улучшений.

    const clickUpgradeResult = await client.query(
      `SELECT COALESCE(SUM(amount), 0)::text AS total
       FROM player_click_upgrades
       WHERE telegram_id = $1`,
      [req.player.id]
    );

    const clickUpgradeBonus = Number(clickUpgradeResult.rows[0].total);
    const clickBase = 1 + clickUpgradeBonus;

    // Сначала рассчитываем множитель,
    // затем применяем его к общей сумме клика.

    const multiplier = getMultiplier(p);
    const clickReward = clickBase * multiplier;

    const result = await client.query(
      `UPDATE players
       SET balance = balance + $1,
           experience = experience + $1,
           level = FLOOR((experience + $1) / 1000) + 1,
           last_active = NOW()
       WHERE telegram_id = $2
       RETURNING balance, experience, level`,
      [clickReward, req.player.id]
    );

    // Battle Pass учитывает фактически заработанные доллары.

    await trackBPTask(
      client,
      req.player.id,
      "click_dollars",
      clickReward
    );

    await client.query("COMMIT");

    res.json({
      balance: Number(result.rows[0].balance),
      experience: Number(result.rows[0].experience),
      level: result.rows[0].level,
      multiplier,
      clickBase,
      clickUpgradeBonus,
      clickReward
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Click error:", error);
    res.status(500).json({ error: "Click failed" });
  } finally {
    client.release();
  }
});

// =====================================================
// GRAMM CLICKER
// =====================================================

app.post("/api/gramm/click", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const player = await client.query(
      `SELECT bonus_x2_until, bonus_x4_until, x10_unlocked
       FROM players WHERE telegram_id = $1 FOR UPDATE`,
      [req.player.id]
    );

    const multiplier = getMultiplier(player.rows[0]);

    const result = await client.query(
      `UPDATE players
       SET gramm_balance = gramm_balance + $1,
           last_active = NOW()
       WHERE telegram_id = $2
       RETURNING gramm_balance`,
      [multiplier, req.player.id]
    );

    await trackBPTask(client, req.player.id, "gramm_50", 1);
    await trackBPTask(client, req.player.id, "gramm_75", 1);
    await trackBPTask(client, req.player.id, "gramm_100", 1);

    await client.query("COMMIT");

    res.json({
      grammBalance: Number(result.rows[0].gramm_balance),
      multiplier
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("GRAMM click error:", error);
    res.status(500).json({ error: "GRAMM click failed" });
  } finally {
    client.release();
  }
});

// =====================================================
// ПОКУПКА СТАРЫХ УЛУЧШЕНИЙ x2, x4, x10
// =====================================================

app.post("/api/upgrades/buy", auth, async (req, res) => {
  const { type } = req.body;
  const upgrade = upgrades[type];

  if (!upgrade) {
    return res.status(400).json({ error: "Invalid upgrade" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT balance, bonus_x2_until, bonus_x4_until, x10_unlocked
       FROM players WHERE telegram_id = $1 FOR UPDATE`,
      [req.player.id]
    );

    const player = result.rows[0];

    if (type === "x10" && player.x10_unlocked) {
      throw new Error("Улучшение x10 уже куплено");
    }

    if (Number(player.balance) < upgrade.price) {
      throw new Error("Недостаточно денег");
    }

    if (type === "x10") {
      await client.query(
        `UPDATE players
         SET balance = balance - $1,
             x10_unlocked = TRUE
         WHERE telegram_id = $2`,
        [upgrade.price, req.player.id]
      );
    } else {
      const column = type === "x2"
        ? "bonus_x2_until"
        : "bonus_x4_until";

      await client.query(
        `UPDATE players
         SET balance = balance - $1,
             ${column} = GREATEST(
               COALESCE(${column}, NOW()), NOW()
             ) + INTERVAL '3 minutes'
         WHERE telegram_id = $2`,
        [upgrade.price, req.player.id]
      );
    }

    await client.query("COMMIT");

    const updated = await pool.query(
      `SELECT balance, bonus_x2_until, bonus_x4_until, x10_unlocked
       FROM players WHERE telegram_id = $1`,
      [req.player.id]
    );

    res.json({
      success: true,
      balance: Number(updated.rows[0].balance),
      bonuses: getBonusState(updated.rows[0]),
      multiplier: getMultiplier(updated.rows[0])
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
});

// =====================================================
// ОБМЕН ДОЛЛАРОВ И GRAMM
// =====================================================

app.post("/api/gramm/exchange", auth, async (req, res) => {
  const { direction, amount } = req.body;
  const value = Number(amount);

  if (!Number.isSafeInteger(value) || value <= 0) {
    return res.status(400).json({
      error: "Укажи целое положительное число"
    });
  }

  if (direction !== "toGramm" && direction !== "toDollars") {
    return res.status(400).json({
      error: "Неверное направление обмена"
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT balance, gramm_balance
       FROM players WHERE telegram_id = $1 FOR UPDATE`,
      [req.player.id]
    );

    const player = result.rows[0];

    if (direction === "toGramm") {
      const cost = value * 10;

      if (!Number.isSafeInteger(cost) || Number(player.balance) < cost) {
        throw new Error("Недостаточно долларов");
      }

      await client.query(
        `UPDATE players
         SET balance = balance - $1,
             gramm_balance = gramm_balance + $2
         WHERE telegram_id = $3`,
        [cost, value, req.player.id]
      );
    } else {
      if (Number(player.gramm_balance) < value) {
        throw new Error("Недостаточно GRAMM");
      }

      const dollars = value * 10;

      if (!Number.isSafeInteger(dollars)) {
        throw new Error("Слишком большая сумма");
      }

      await client.query(
        `UPDATE players
         SET gramm_balance = gramm_balance - $1,
             balance = balance + $2
         WHERE telegram_id = $3`,
        [value, dollars, req.player.id]
      );
    }

    await client.query("COMMIT");

    const updated = await pool.query(
      `SELECT balance, gramm_balance
       FROM players WHERE telegram_id = $1`,
      [req.player.id]
    );

    res.json({
      success: true,
      balance: Number(updated.rows[0].balance),
      grammBalance: Number(updated.rows[0].gramm_balance),
      rate: 10
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
});

// =====================================================
// ПОКУПКА БИЗНЕСА
// =====================================================

app.post("/api/businesses/buy", auth, async (req, res) => {
  const { key } = req.body;
  const business = businessCatalog.find(item => item.key === key);

  if (!business) {
    return res.status(400).json({ error: "Такого бизнеса нет" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const player = await client.query(
      `SELECT balance FROM players
       WHERE telegram_id = $1 FOR UPDATE`,
      [req.player.id]
    );

    await accrueBusinessIncome(client, req.player.id);

    if (BigInt(player.rows[0].balance) < BigInt(business.price)) {
      throw new Error("Недостаточно долларов для покупки");
    }

    await client.query(
      `UPDATE players
       SET balance = balance - $1
       WHERE telegram_id = $2`,
      [business.price, req.player.id]
    );

    await client.query(
      `INSERT INTO player_businesses
       (telegram_id, business_key, business_name,
        purchase_price, hourly_income)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.player.id,
        business.key,
        business.name,
        business.price,
        business.income
      ]
    );

    await client.query("COMMIT");

    const updated = await pool.query(
      `SELECT balance, business_balance
       FROM players WHERE telegram_id = $1`,
      [req.player.id]
    );

    res.json({
      success: true,
      message: "Бизнес успешно куплен",
      balance: Number(updated.rows[0].balance),
      businessBalance: Number(updated.rows[0].business_balance)
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
});

// =====================================================
// ПРОДАЖА БИЗНЕСА
// =====================================================

app.post("/api/businesses/sell", auth, async (req, res) => {
  const businessId = Number(req.body.businessId);

  if (!Number.isSafeInteger(businessId) || businessId <= 0) {
    return res.status(400).json({ error: "Неверный номер бизнеса" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `SELECT telegram_id FROM players
       WHERE telegram_id = $1 FOR UPDATE`,
      [req.player.id]
    );

    await accrueBusinessIncome(client, req.player.id);

    const result = await client.query(
      `SELECT id, purchase_price, business_name
       FROM player_businesses
       WHERE id = $1 AND telegram_id = $2
       FOR UPDATE`,
      [businessId, req.player.id]
    );

    if (!result.rows.length) {
      throw new Error("Бизнес не найден");
    }

    const business = result.rows[0];
    const refund = (
      BigInt(business.purchase_price) * 70n
    ) / 100n;

    await client.query(
      `DELETE FROM player_businesses
       WHERE id = $1 AND telegram_id = $2`,
      [businessId, req.player.id]
    );

    await client.query(
      `UPDATE players
       SET balance = balance + $1
       WHERE telegram_id = $2`,
      [refund.toString(), req.player.id]
    );

    await client.query("COMMIT");

    const updated = await pool.query(
      `SELECT balance, business_balance
       FROM players WHERE telegram_id = $1`,
      [req.player.id]
    );

    res.json({
      success: true,
      businessName: business.business_name,
      refund: Number(refund),
      balance: Number(updated.rows[0].balance),
      businessBalance: Number(updated.rows[0].business_balance)
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
});

// =====================================================
// ВЫВОД С БИЗНЕС-СЧЁТА
// =====================================================

app.post("/api/businesses/withdraw", auth, async (req, res) => {
  const { destination, amount } = req.body;
  const value = Number(amount);

  if (!Number.isSafeInteger(value) || value <= 0) {
    return res.status(400).json({
      error: "Укажи целую положительную сумму"
    });
  }

  const toGramm =
    destination === "gramm" || destination === "toGramm";

  const toDollars =
    destination === "usd" || destination === "toDollars";

  if (!toGramm && !toDollars) {
    return res.status(400).json({
      error: "Неверное направление перевода"
    });
  }

  if (toGramm && value % 10 !== 0) {
    return res.status(400).json({
      error: "Для перевода в GRAMM сумма должна делиться на 10"
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `SELECT telegram_id FROM players
       WHERE telegram_id = $1 FOR UPDATE`,
      [req.player.id]
    );

    await accrueBusinessIncome(client, req.player.id);

    const result = await client.query(
      `SELECT balance, gramm_balance, business_balance
       FROM players
       WHERE telegram_id = $1
       FOR UPDATE`,
      [req.player.id]
    );

    const player = result.rows[0];
    const businessBalance = BigInt(player.business_balance);

    if (businessBalance < BigInt(value)) {
      throw new Error("Недостаточно денег на бизнес-счёте");
    }

    if (toDollars) {
      await client.query(
        `UPDATE players
         SET business_balance = business_balance - $1,
             balance = balance + $1
         WHERE telegram_id = $2`,
        [value, req.player.id]
      );
    } else {
      const grammAmount = value / 10;

      await client.query(
        `UPDATE players
         SET business_balance = business_balance - $1,
             gramm_balance = gramm_balance + $2
         WHERE telegram_id = $3`,
        [value, grammAmount, req.player.id]
      );
    }

    await client.query("COMMIT");

    const updated = await pool.query(
      `SELECT balance, gramm_balance, business_balance
       FROM players WHERE telegram_id = $1`,
      [req.player.id]
    );

    res.json({
      success: true,
      balance: Number(updated.rows[0].balance),
      grammBalance: Number(updated.rows[0].gramm_balance),
      businessBalance: Number(updated.rows[0].business_balance),
      rate: 10
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
});

// =====================================================
// ПОКУПКА ПРЕДМЕТОВ
// =====================================================

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

    await trackBPTask(client, req.player.id, "shop_purchase", 1);

    await client.query("COMMIT");

    const updated = await pool.query(
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

// =====================================================
// ПРОДАЖА ПРЕДМЕТОВ
// =====================================================

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

    const updated = await pool.query(
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

// =====================================================
// ЕЖЕДНЕВНАЯ НАГРАДА ИГРЫ
// =====================================================

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

// =====================================================
// РЕЙТИНГ ИГРОКОВ
// =====================================================

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

// =====================================================
// ЗАПУСК СЕРВЕРА
// =====================================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`UGLY CLICKER 2.0 running on port ${PORT}`);

  initDatabase().catch(error => {
    databaseReady = false;
    console.error("Database initialization failed:", error);
  });
});

