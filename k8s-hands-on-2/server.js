// API de Vanta Wear: Express sirve el frontend, valida datos y persiste catálogo/carrito en PostgreSQL.
const crypto = require("crypto");
const path = require("path");
const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = Number(process.env.PORT || 3000);

// Pool de conexiones configurado por variables de entorno inyectadas desde Kubernetes.
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "vanta",
  user: process.env.DB_USER || "vanta",
  password: process.env.DB_PASSWORD || "vanta_password",
});

const seedProducts = [
  // Datos iniciales para que la tienda tenga catálogo después del primer arranque.
  {
    id: "jacket-neo",
    name: "Chaqueta Neo Shell",
    category: "Chaquetas",
    price: 329000,
    sizes: ["S", "M", "L", "XL"],
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "tee-motion",
    name: "Camiseta Motion Dry",
    category: "Camisetas",
    price: 119000,
    sizes: ["XS", "S", "M", "L"],
    image: "https://images.unsplash.com/photo-1506629905607-d9f297d29f67?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "cargo-line",
    name: "Pantalón Cargo Line",
    category: "Pantalones",
    price: 259000,
    sizes: ["S", "M", "L"],
    image: "https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "runner-mineral",
    name: "Tenis Runner Mineral",
    category: "Calzado",
    price: 389000,
    sizes: ["40", "41", "42", "43"],
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "hoodie-graphite",
    name: "Hoodie Graphite Zip",
    category: "Chaquetas",
    price: 289000,
    sizes: ["XS", "S", "M", "XL"],
    image: "https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "wide-track",
    name: "Pantalón Wide Track",
    category: "Pantalones",
    price: 219000,
    sizes: ["S", "M", "L", "XL"],
    image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=900&q=80",
  },
];

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Healthcheck usado por readiness/liveness; valida también la conexión con PostgreSQL.
app.get("/healthz", asyncRoute(async (_request, response) => {
  try {
    await pool.query("SELECT 1");
    response.json({ ok: true });
  } catch (error) {
    response.status(503).json({ ok: false, error: error.message });
  }
}));

app.get("/api/products", asyncRoute(async (_request, response) => {
  const result = await pool.query("SELECT id, name, category, price, sizes, image FROM products ORDER BY created_at DESC");
  response.json(result.rows.map(mapProduct));
}));

// Crea prendas desde el formulario de vendedor y las guarda en la base de datos.
app.post("/api/products", asyncRoute(async (request, response) => {
  const product = validateProduct(request.body);
  const id = `custom-${crypto.randomUUID()}`;
  const result = await pool.query(
    "INSERT INTO products (id, name, category, price, sizes, image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, category, price, sizes, image",
    [id, product.name, product.category, product.price, product.sizes, product.image],
  );

  response.status(201).json(mapProduct(result.rows[0]));
}));

// Login simplificado para el laboratorio: crea o actualiza un usuario por email.
app.post("/api/login", asyncRoute(async (request, response) => {
  const email = String(request.body.email || "").trim().toLowerCase();
  const password = String(request.body.password || "");

  if (!email.includes("@") || password.length < 4) {
    response.status(400).json({ error: "Usa un correo válido y una contraseña de mínimo 4 caracteres." });
    return;
  }

  const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
  const result = await pool.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id, email`,
    [email, passwordHash],
  );

  response.json(result.rows[0]);
}));

// El carrito se separa por sessionId para simular sesiones sin autenticación completa.
app.get("/api/cart", asyncRoute(async (request, response) => {
  const sessionId = requireSessionId(request.query.sessionId);
  const result = await pool.query(
    `SELECT c.line_id, c.size, p.id, p.name, p.category, p.price, p.sizes, p.image
     FROM cart_items c
     JOIN products p ON p.id = c.product_id
     WHERE c.session_id = $1
     ORDER BY c.created_at ASC`,
    [sessionId],
  );

  response.json(result.rows.map(mapCartItem));
}));

app.post("/api/cart", asyncRoute(async (request, response) => {
  const sessionId = requireSessionId(request.body.sessionId);
  const productId = String(request.body.productId || "");
  const size = String(request.body.size || "");
  const productResult = await pool.query("SELECT id, sizes FROM products WHERE id = $1", [productId]);

  if (!productResult.rowCount) {
    response.status(404).json({ error: "La prenda no existe." });
    return;
  }

  if (!productResult.rows[0].sizes.includes(size)) {
    response.status(400).json({ error: "La talla seleccionada no está disponible." });
    return;
  }

  const lineId = crypto.randomUUID();
  await pool.query("INSERT INTO cart_items (line_id, session_id, product_id, size) VALUES ($1, $2, $3, $4)", [
    lineId,
    sessionId,
    productId,
    size,
  ]);

  const result = await pool.query(
    `SELECT c.line_id, c.size, p.id, p.name, p.category, p.price, p.sizes, p.image
     FROM cart_items c
     JOIN products p ON p.id = c.product_id
     WHERE c.line_id = $1`,
    [lineId],
  );

  response.status(201).json(mapCartItem(result.rows[0]));
}));

app.delete("/api/cart/:lineId", asyncRoute(async (request, response) => {
  const sessionId = requireSessionId(request.query.sessionId);
  await pool.query("DELETE FROM cart_items WHERE line_id = $1 AND session_id = $2", [request.params.lineId, sessionId]);
  response.json({ ok: true });
}));

app.use((error, _request, response, _next) => {
  response.status(error.status || 500).json({ error: error.message || "Error interno del servidor." });
});

// Inicializa tablas y datos semilla. retry permite esperar a que Postgres termine de arrancar.
async function initDb() {
  await retry(async () => {
    await pool.query("SELECT 1");
  }, 30);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL CHECK (price > 0),
      sizes TEXT[] NOT NULL,
      image TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      line_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      size TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS cart_items_session_idx ON cart_items(session_id);
  `);

  for (const product of seedProducts) {
    await pool.query(
      `INSERT INTO products (id, name, category, price, sizes, image)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [product.id, product.name, product.category, product.price, product.sizes, product.image],
    );
  }
}

function validateProduct(body) {
  // Normaliza entrada del cliente antes de validar reglas de negocio.
  const product = {
    name: String(body.name || "").trim(),
    category: String(body.category || "").trim(),
    price: Number(body.price),
    image: String(body.image || "").trim(),
    sizes: Array.isArray(body.sizes) ? body.sizes.map(String).filter(Boolean) : [],
  };

  const validCategories = new Set(["Chaquetas", "Camisetas", "Pantalones", "Calzado"]);
  if (!product.name || !validCategories.has(product.category) || !Number.isInteger(product.price) || product.price < 10000) {
    throw httpError(400, "Completa nombre, categoría y precio válido.");
  }

  if (!product.image.startsWith("http://") && !product.image.startsWith("https://")) {
    throw httpError(400, "La imagen debe ser una URL http o https.");
  }

  if (!product.sizes.length) {
    throw httpError(400, "Selecciona al menos una talla.");
  }

  return product;
}

function requireSessionId(value) {
  // Todas las operaciones del carrito necesitan una sesión del navegador.
  const sessionId = String(value || "").trim();
  if (!sessionId) {
    throw httpError(400, "Falta el identificador de sesión del carrito.");
  }
  return sessionId;
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function mapProduct(row) {
  // Convierte filas de PostgreSQL al contrato JSON que consume el frontend.
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    sizes: row.sizes,
    image: row.image,
  };
}

function mapCartItem(row) {
  return {
    ...mapProduct(row),
    lineId: row.line_id,
    size: row.size,
  };
}

function asyncRoute(handler) {
  // Wrapper para que errores async lleguen al middleware de errores de Express.
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

async function retry(operation, attempts) {
  // Reintentos simples para dependencias que pueden iniciar después de la app.
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

initDb()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`Vanta Wear running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
    process.exit(1);
  });

process.on("SIGTERM", async () => {
  // Cierre ordenado cuando Kubernetes termina el Pod.
  await pool.end();
  process.exit(0);
});
