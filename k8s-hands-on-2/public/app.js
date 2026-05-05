const icons = {
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 8h12l-1 13H7L6 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m18 6-12 12"/><path d="m6 6 12 12"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 18V6H3v12h2"/><path d="M15 9h4l2 3v6h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
  ruler: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m16 2 6 6L8 22l-6-6L16 2Z"/><path d="m7 17 2 2"/><path d="m10 14 2 2"/><path d="m13 11 2 2"/><path d="m16 8 2 2"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></svg>',
};

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const productGrid = document.querySelector("#productGrid");
const productTemplate = document.querySelector("#productTemplate");
const cartDrawer = document.querySelector("#cartDrawer");
const cartItems = document.querySelector("#cartItems");
const cartCount = document.querySelector("#cartCount");
const cartSubtotal = document.querySelector("#cartSubtotal");
const sellerForm = document.querySelector("#sellerForm");
const sellerMessage = document.querySelector("#sellerMessage");
const loginModal = document.querySelector("#loginModal");
const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const closeLoginBtn = document.querySelector("#closeLoginBtn");

let products = [];
let cart = [];
let activeFilter = "all";

const sessionId = getSessionId();

document.querySelectorAll("[data-icon]").forEach((node) => {
  node.innerHTML = icons[node.dataset.icon] || "";
});

document.querySelector("#cartBtn").addEventListener("click", openCart);
document.querySelector("#closeCartBtn").addEventListener("click", closeCart);
closeLoginBtn.addEventListener("click", () => loginModal.close());

cartDrawer.addEventListener("click", (event) => {
  if (event.target === cartDrawer) closeCart();
});

document.querySelector("#loginBtn").addEventListener("click", () => {
  loginMessage.textContent = "";
  loginModal.showModal();
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(loginForm);

  try {
    const user = await api("/api/login", {
      method: "POST",
      body: {
        email: String(data.get("email")),
        password: String(data.get("password")),
      },
    });

    localStorage.setItem("vanta-user", user.email);
    loginMessage.textContent = `Sesión iniciada como ${user.email}`;
    setTimeout(() => loginModal.close(), 850);
  } catch (error) {
    loginMessage.textContent = error.message;
  }
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderProducts();
  });
});

sellerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(sellerForm);
  const sizes = data.getAll("sizes");

  if (!sizes.length) {
    sellerMessage.textContent = "Selecciona al menos una talla.";
    return;
  }

  sellerMessage.textContent = "Publicando...";

  try {
    const product = await api("/api/products", {
      method: "POST",
      body: {
        name: String(data.get("name")).trim(),
        category: String(data.get("category")),
        price: Number(data.get("price")),
        image: String(data.get("image")).trim(),
        sizes,
      },
    });

    products = [product, ...products];
    sellerForm.reset();
    sellerMessage.textContent = "Prenda publicada en la base de datos.";
    activeFilter = "all";
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.toggle("active", item.dataset.filter === "all"));
    renderProducts();
  } catch (error) {
    sellerMessage.textContent = error.message;
  }
});

async function init() {
  productGrid.innerHTML = '<p class="cart-empty">Cargando catálogo...</p>';
  await Promise.all([loadProducts(), loadCart()]);
  renderProducts();
  renderCart();
}

async function loadProducts() {
  products = await api("/api/products");
}

async function loadCart() {
  cart = await api(`/api/cart?sessionId=${encodeURIComponent(sessionId)}`);
}

function renderProducts() {
  productGrid.innerHTML = "";
  const visibleProducts = activeFilter === "all" ? products : products.filter((product) => product.category === activeFilter);

  visibleProducts.forEach((product) => {
    const card = productTemplate.content.firstElementChild.cloneNode(true);
    const image = card.querySelector("img");
    const title = card.querySelector("h3");
    const price = card.querySelector(".price");
    const category = card.querySelector(".product-category");
    const sizes = card.querySelector(".sizes");
    const addButton = card.querySelector(".add-btn");
    let selectedSize = product.sizes[0];

    image.src = product.image;
    image.alt = product.name;
    title.textContent = product.name;
    price.textContent = money.format(product.price);
    category.textContent = product.category;

    product.sizes.forEach((size, index) => {
      const button = document.createElement("button");
      button.className = `size-chip${index === 0 ? " selected" : ""}`;
      button.type = "button";
      button.textContent = size;
      button.addEventListener("click", () => {
        selectedSize = size;
        sizes.querySelectorAll(".size-chip").forEach((chip) => chip.classList.remove("selected"));
        button.classList.add("selected");
      });
      sizes.append(button);
    });

    addButton.addEventListener("click", async () => {
      addButton.disabled = true;
      addButton.textContent = "Agregando...";

      try {
        const item = await api("/api/cart", {
          method: "POST",
          body: {
            sessionId,
            productId: product.id,
            size: selectedSize,
          },
        });
        cart.push(item);
        renderCart();
        openCart();
      } catch (error) {
        addButton.textContent = error.message;
      } finally {
        setTimeout(() => {
          addButton.disabled = false;
          addButton.textContent = "Agregar al carrito";
        }, 700);
      }
    });

    productGrid.append(card);
  });
}

function renderCart() {
  cartItems.innerHTML = "";

  if (!cart.length) {
    const empty = document.createElement("p");
    empty.className = "cart-empty";
    empty.textContent = "Tu carrito está vacío. Elige una prenda y selecciona la talla antes de agregarla.";
    cartItems.append(empty);
  }

  cart.forEach((item) => {
    const line = document.createElement("article");
    line.className = "cart-line";
    const image = document.createElement("img");
    const content = document.createElement("div");
    const title = document.createElement("h3");
    const size = document.createElement("p");
    const price = document.createElement("p");
    const remove = document.createElement("button");

    image.src = item.image;
    image.alt = item.name;
    title.textContent = item.name;
    size.textContent = `Talla ${item.size}`;
    price.textContent = money.format(item.price);
    remove.className = "remove-btn";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Quitar ${item.name}`);

    content.append(title, size, price);
    line.append(image, content, remove);

    remove.addEventListener("click", async () => {
      try {
        await api(`/api/cart/${encodeURIComponent(item.lineId)}?sessionId=${encodeURIComponent(sessionId)}`, {
          method: "DELETE",
        });
        cart = cart.filter((product) => product.lineId !== item.lineId);
        renderCart();
      } catch (error) {
        remove.textContent = "!";
        remove.title = error.message;
      }
    });

    cartItems.append(line);
  });

  cartCount.textContent = cart.length;
  cartSubtotal.textContent = money.format(cart.reduce((total, item) => total + Number(item.price), 0));
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "No se pudo completar la solicitud.");
  }

  return payload;
}

function getSessionId() {
  const existing = localStorage.getItem("vanta-session-id");
  if (existing) return existing;

  const id = crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}-${Math.random()}`;
  localStorage.setItem("vanta-session-id", id);
  return id;
}

function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
}

init().catch((error) => {
  productGrid.innerHTML = "";
  const message = document.createElement("p");
  message.className = "cart-empty";
  message.textContent = `No se pudo cargar la tienda: ${error.message}`;
  productGrid.append(message);
});
