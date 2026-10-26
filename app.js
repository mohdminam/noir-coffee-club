
(() => {
  const cfg = window.NOIR_CONFIG;
  const $ = id => document.getElementById(id);

  let menu = [];
  let cart = new Map();
  let category = "All";

  const money = n =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(Number(n) || 0);

  const ready = () =>
    cfg?.supabaseUrl &&
    cfg?.supabaseAnonKey &&
    !cfg.supabaseAnonKey.includes("PASTE_YOUR") &&
    cfg?.orderFunctionUrl;

  async function loadMenu() {
    if (!ready()) {
      $("menu-status").textContent =
        "Setup needed: check your Supabase settings in config.js.";
      return;
    }

    try {
      const r = await fetch(
        `${cfg.supabaseUrl}/rest/v1/menu_items?select=id,name,description,price,category,image_url,is_available&is_available=eq.true&order=id.asc`,
        {
          headers: {
            apikey: cfg.supabaseAnonKey,
            Authorization: `Bearer ${cfg.supabaseAnonKey}`
          }
        }
      );

      if (!r.ok) {
        throw Error(
          `Menu request failed (${r.status}). Check your Supabase key and menu permissions.`
        );
      }

      menu = await r.json();
      $("menu-status").textContent = menu.length
        ? ""
        : "No available menu items found.";

      renderMenu();
    } catch (e) {
      $("menu-status").textContent =
        e.message || "Could not load menu.";
    }
  }

  function renderMenu() {
    const grid = $("menu-grid");
    grid.innerHTML = "";

    menu
      .filter(item =>
        category === "All" || item.category === category
      )
      .forEach(item => {
        const card = document.createElement("article");
        card.className = "menu-card";

        const photo = document.createElement("div");
        photo.className = "menu-photo";
        photo.dataset.cat = item.category || "";

        if (item.image_url) {
          photo.style.backgroundImage =
            `linear-gradient(#0002,#0004),url("${String(item.image_url).replace(/["\\]/g, "")}")`;
          photo.style.backgroundSize = "cover";
          photo.style.backgroundPosition = "center";
        } else {
          const sym = document.createElement("span");
          sym.className = "product-symbol";
          sym.textContent =
            item.category === "Food" ? "✳" :
            item.category === "Desserts" ? "✧" :
            item.category === "Drinks" ? "◌" : "N.";
          photo.append(sym);
        }

        const body = document.createElement("div");
        body.className = "menu-card-body";

        const cat = document.createElement("p");
        cat.className = "product-category";
        cat.textContent = item.category || "NOIR MENU";

        const title = document.createElement("h3");
        title.textContent = item.name;

        const desc = document.createElement("p");
        desc.className = "product-description";
        desc.textContent =
          item.description || "Made with care, just for your pause.";

        const bottom = document.createElement("div");
        bottom.className = "product-bottom";

        const price = document.createElement("strong");
        price.className = "product-price";
        price.textContent = money(item.price);

        const add = document.createElement("button");
        add.className = "add-button";
        add.type = "button";
        add.textContent = cart.has(item.id)
          ? `Added (${cart.get(item.id)}) +`
          : "Add to order +";

        add.onclick = () => {
          cart.set(
            item.id,
            Math.min(20, (cart.get(item.id) || 0) + 1)
          );
          renderMenu();
          renderCart();
        };

        bottom.append(price, add);
        body.append(cat, title, desc, bottom);
        card.append(photo, body);
        grid.append(card);
      });
  }

  function renderCart() {
    const entries = [...cart.entries()]
      .map(([id, q]) => ({
        item: menu.find(x => Number(x.id) === Number(id)),
        q
      }))
      .filter(x => x.item);

    const count = entries.reduce((s, x) => s + x.q, 0);
    const total = entries.reduce(
      (s, x) => s + Number(x.item.price) * x.q,
      0
    );

    $("cart-count").textContent = count;
    $("bag-count").textContent =
      `${count} item${count === 1 ? "" : "s"}`;
    $("cart-total").textContent = money(total);

    const root = $("cart-items");
    root.innerHTML = "";

    if (!entries.length) {
      const p = document.createElement("p");
      p.className = "empty-cart";
      p.textContent =
        "Your bag is taking a little nap. Add something from the menu.";
      root.append(p);
      return;
    }

    entries.forEach(({ item, q }) => {
      const row = document.createElement("div");
      row.className = "cart-row";

      const info = document.createElement("div");
      const name = document.createElement("strong");
      const detail = document.createElement("small");

      name.textContent = item.name;
      detail.textContent =
        `${money(item.price)} each · ${money(Number(item.price) * q)}`;

      info.append(name, detail);

      const controls = document.createElement("div");
      controls.className = "quantity-controls";

      const minus = document.createElement("button");
      minus.type = "button";
      minus.textContent = "−";

      minus.onclick = () => {
        if (q <= 1) {
          cart.delete(item.id);
        } else {
          cart.set(item.id, q - 1);
        }

        renderMenu();
        renderCart();
      };

      const num = document.createElement("span");
      num.textContent = q;

      const plus = document.createElement("button");
      plus.type = "button";
      plus.textContent = "+";
      plus.disabled = q >= 20;

      plus.onclick = () => {
        if (q < 20) {
          cart.set(item.id, q + 1);
        }

        renderMenu();
        renderCart();
      };

      controls.append(minus, num, plus);
      row.append(info, controls);
      root.append(row);
    });
  }

  $("category-filters").addEventListener("click", e => {
    const b = e.target.closest("button[data-category]");
    if (!b) return;

    category = b.dataset.category;

    document.querySelectorAll(".filter").forEach(x =>
      x.classList.toggle("active", x === b)
    );

    renderMenu();
  });

  $("checkout-form").addEventListener("submit", async e => {
    e.preventDefault();

    // FIX: Save the form before any asynchronous operation.
    const form = e.currentTarget;

    $("checkout-status").textContent = "";

    if (!ready()) {
      $("checkout-status").textContent =
        "Setup needed: check your Supabase settings in config.js.";
      return;
    }

    if (!cart.size) {
      $("checkout-status").textContent =
        "Add at least one item first.";
      return;
    }

    const button = form.querySelector('button[type="submit"]');

    button.disabled = true;
    button.textContent = "Sending your order…";

    const fd = new FormData(form);

    const payload = {
      customer_name: String(fd.get("customer_name") || "").trim(),
      customer_phone: String(fd.get("customer_phone") || "").trim(),
      delivery_address: String(fd.get("delivery_address") || "").trim(),
      items: [...cart.entries()].map(
        ([menu_item_id, quantity]) => ({
          menu_item_id: Number(menu_item_id),
          quantity
        })
      )
    };

    try {
      const r = await fetch(cfg.orderFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: cfg.supabaseAnonKey,
          Authorization: `Bearer ${cfg.supabaseAnonKey}`
        },
        body: JSON.stringify(payload)
      });

      const data = await r.json().catch(() => ({}));

      if (!r.ok) {
        throw Error(data.error || `Order failed (${r.status}).`);
      }

      $("checkout-status").textContent =
        `Order #${data.order.id} placed! Total: ${money(data.order.total_amount)}. Status: ${data.order.order_status}.`;

      cart.clear();

      // FIX: Reset the saved form, not e.currentTarget.
      form.reset();

      renderMenu();
      renderCart();

    } catch (err) {
      $("checkout-status").textContent =
        err.message || "Could not place order. Please try again.";
    } finally {
      button.disabled = false;
      button.innerHTML = 'Place test order <span>↗</span>';
    }
  });

  $("year").textContent = new Date().getFullYear();

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      const target = document.querySelector(a.getAttribute("href"));

      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  renderCart();
  loadMenu();
})();
