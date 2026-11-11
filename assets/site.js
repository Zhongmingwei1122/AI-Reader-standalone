/* ============================================================
   AI Pocket Reader — official site prototype
   Static interactions, mock cart, no network requests.
   ============================================================ */

(function () {
  "use strict";

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) =>
    Array.from((root || document).querySelectorAll(selector));

  const CART_KEY = "apr_site_cart_v1";
  let cart = loadCart();

  function loadCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (error) {
      /* Prototype: storage can be unavailable. */
    }
    updateCartCount();
  }

  function formatPrice(value) {
    return "¥" + Number(value).toLocaleString("zh-CN");
  }

  function cartCount() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }

  function updateCartCount() {
    const count = cartCount();
    $$("[data-cart-count]").forEach((el) => {
      el.textContent = String(count);
    });
  }

  /* ---------------- toast ---------------- */

  let toastTimer = null;

  function toast(message) {
    let el = $(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      el.hidden = true;
    }, 2600);
  }

  /* ---------------- announcement / menu ---------------- */

  const announcement = $("#announcement");
  if (announcement && sessionStorage.getItem("apr_notice_closed") === "1") {
    announcement.classList.add("is-hidden");
  }

  const announcementClose = $("[data-announcement-close]");
  if (announcementClose) {
    announcementClose.addEventListener("click", () => {
      announcement.classList.add("is-hidden");
      try {
        sessionStorage.setItem("apr_notice_closed", "1");
      } catch (error) {
        /* ignore */
      }
    });
  }

  const menuToggle = $("[data-menu-toggle]");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });
    $$(".main-nav a").forEach((link) => {
      link.addEventListener("click", () => {
        document.body.classList.remove("menu-open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------- cart drawer ---------------- */

  if (!document.getElementById("cart-drawer")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <div class="cart-overlay" data-cart-overlay></div>
      <aside class="cart-drawer" id="cart-drawer" aria-label="购物车" aria-hidden="true">
        <div class="cart-head">
          <h2>购物车</h2>
          <button class="cart-close" type="button" data-cart-close aria-label="关闭购物车">×</button>
        </div>
        <div class="cart-body">
          <div class="cart-items" data-cart-items></div>
          <div class="cart-empty" data-cart-empty>
            <h3>购物车是空的</h3>
            <p>先从产品页或商店选一件喜欢的东西。</p>
            <a class="button small secondary" href="store.html">去商店 <span class="arrow">→</span></a>
          </div>
        </div>
        <div class="cart-foot" data-cart-foot>
          <div class="cart-total"><span>合计</span><strong data-cart-total>¥0</strong></div>
          <a class="button" href="checkout.html">去结账 <span class="arrow">→</span></a>
          <p class="cart-note">演示购物车 · 不会产生真实订单</p>
        </div>
      </aside>
    `
    );
  }

  const drawer = $("#cart-drawer");
  const overlay = $("[data-cart-overlay]");
  const itemsEl = $("[data-cart-items]");
  const emptyEl = $("[data-cart-empty]");
  const footEl = $("[data-cart-foot]");
  const totalEl = $("[data-cart-total]");

  function openCart() {
    if (!drawer) return;
    document.body.classList.add("cart-open");
    drawer.setAttribute("aria-hidden", "false");
    renderCart();
    const close = $("[data-cart-close]");
    if (close) close.focus();
  }

  function closeCart() {
    document.body.classList.remove("cart-open");
    if (drawer) drawer.setAttribute("aria-hidden", "true");
  }

  function renderCart() {
    if (!itemsEl) return;
    itemsEl.innerHTML = cart
      .map(
        (item, index) => `
        <div class="cart-item">
          <img src="${item.image}" alt="">
          <div class="grow">
            <h4>${item.name}</h4>
            <div class="variant">${item.variant || ""}</div>
            <div class="qty" aria-label="数量">
              <button type="button" data-cart-minus="${index}" aria-label="减少数量">−</button>
              <span>${item.qty}</span>
              <button type="button" data-cart-plus="${index}" aria-label="增加数量">+</button>
            </div>
            <button class="cart-remove" type="button" data-cart-remove="${index}">移除</button>
          </div>
          <div class="line-price">${formatPrice(item.price * item.qty)}</div>
        </div>
      `
      )
      .join("");

    const hasItems = cart.length > 0;
    if (emptyEl) emptyEl.hidden = hasItems;
    if (footEl) footEl.hidden = !hasItems;
    if (totalEl) {
      totalEl.textContent = formatPrice(
        cart.reduce((sum, item) => sum + item.price * item.qty, 0)
      );
    }

    $$("[data-cart-plus]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.cartPlus);
        cart[i].qty += 1;
        saveCart();
        renderCart();
      });
    });

    $$("[data-cart-minus]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.cartMinus);
        if (cart[i].qty > 1) {
          cart[i].qty -= 1;
        } else {
          cart.splice(i, 1);
        }
        saveCart();
        renderCart();
      });
    });

    $$("[data-cart-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        cart.splice(Number(btn.dataset.cartRemove), 1);
        saveCart();
        renderCart();
      });
    });
  }

  function addToCart(item) {
    const existing = cart.find((entry) => entry.id === item.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...item, qty: 1 });
    }
    saveCart();
    renderCart();
    openCart();
  }

  $$("[data-cart-open]").forEach((btn) => {
    btn.addEventListener("click", openCart);
  });
  $$("[data-cart-close]").forEach((btn) => {
    btn.addEventListener("click", closeCart);
  });
  if (overlay) overlay.addEventListener("click", closeCart);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCart();
      if (document.body.classList.contains("menu-open") && menuToggle) {
        document.body.classList.remove("menu-open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    }
  });

  updateCartCount();
  renderCart();

  /* ---------------- generic add to cart ---------------- */

  $$("[data-add-to-cart]").forEach((btn) => {
    btn.addEventListener("click", () => {
      addToCart({
        id: btn.dataset.id,
        name: btn.dataset.name,
        variant: btn.dataset.variant || "",
        price: Number(btn.dataset.price),
        image: btn.dataset.image || "assets/img/reader.png",
      });
      toast("已加入购物车");
    });
  });

  /* ---------------- product page ---------------- */

  const productLayout = $(".product-layout");
  if (productLayout) {
    const galleryImage = $("#gallery-image");
    $$("[data-gallery]").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        $$("[data-gallery]").forEach((el) => el.classList.remove("is-active"));
        thumb.classList.add("is-active");
        if (galleryImage) galleryImage.src = thumb.dataset.gallery;
      });
    });

    let selectedColor = "墨黑";
    let selectedBundle = "标准套装";
    let selectedPrice = 1299;

    function refreshProduct() {
      const colorLabel = $("[data-selected-color]");
      const bundleLabel = $("[data-selected-bundle]");
      const priceEl = $("[data-product-price]");
      if (colorLabel) colorLabel.textContent = selectedColor;
      if (bundleLabel) bundleLabel.textContent = selectedBundle;
      if (priceEl) priceEl.textContent = formatPrice(selectedPrice);
    }

    $$("[data-color]").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$("[data-color]").forEach((el) => el.classList.remove("is-active"));
        btn.classList.add("is-active");
        selectedColor = btn.dataset.color;
        refreshProduct();
      });
    });

    $$("[data-bundle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$("[data-bundle]").forEach((el) => el.classList.remove("is-active"));
        btn.classList.add("is-active");
        selectedBundle = btn.dataset.bundle;
        selectedPrice = Number(btn.dataset.price);
        refreshProduct();
      });
    });

    const addProduct = $("[data-product-add]");
    const buyProduct = $("[data-product-buy]");

    function productItem() {
      return {
        id: `reader-${selectedColor}-${selectedBundle}`,
        name: "AI Pocket Reader",
        variant: `${selectedColor} · ${selectedBundle}`,
        price: selectedPrice,
        image: "assets/img/reader.png",
      };
    }

    if (addProduct) {
      addProduct.addEventListener("click", () => {
        addToCart(productItem());
        toast("已加入购物车");
      });
    }
    if (buyProduct) {
      buyProduct.addEventListener("click", () => {
        addToCart(productItem());
        closeCart();
        window.location.href = "checkout.html";
      });
    }
  }

  /* ---------------- AI tabs ---------------- */

  const aiTabs = $$("[data-ai-tab]");
  if (aiTabs.length) {
    function activateAi(key, updateHash) {
      const valid = aiTabs.some((tab) => tab.dataset.aiTab === key);
      if (!valid) key = aiTabs[0].dataset.aiTab;
      aiTabs.forEach((tab) => {
        const active = tab.dataset.aiTab === key;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      $$("[data-ai-panel]").forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.aiPanel === key);
      });
      if (updateHash) {
        history.replaceState(null, "", "#" + key);
      }
    }

    aiTabs.forEach((tab) => {
      tab.addEventListener("click", () => activateAi(tab.dataset.aiTab, true));
    });

    const initial = location.hash.replace("#", "");
    activateAi(initial || "summary", false);
  }

  /* ---------------- AI ask demo ---------------- */

  const questionChips = $$("[data-question]");
  if (questionChips.length) {
    questionChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        questionChips.forEach((c) => c.classList.remove("is-active"));
        chip.classList.add("is-active");
        const q = $("#demo-question");
        const a = $("#demo-answer");
        const src = $("#demo-source");
        if (q) q.textContent = chip.dataset.question;
        if (a) a.textContent = chip.dataset.answer;
        if (src) src.textContent = chip.dataset.source;
      });
    });
  }

  /* ---------------- knowledge demo search ---------------- */

  const knowledgeForm = $("#knowledge-demo-form");
  if (knowledgeForm) {
    knowledgeForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = $("#knowledge-demo-input");
      const query = (input.value || "").trim();
      const results = $$(".knowledge-result");
      let shown = 0;
      results.forEach((result) => {
        const match = !query || result.textContent.includes(query);
        result.hidden = !match;
        if (match) shown += 1;
      });
      const empty = $("#knowledge-demo-empty");
      const count = $("#knowledge-demo-count");
      if (count) count.textContent = `${shown} 条结果`;
      if (empty) empty.hidden = shown > 0;
    });
  }

  /* ---------------- account tabs ---------------- */

  const accountTabs = $$("[data-account-tab]");
  if (accountTabs.length) {
    function activateAccount(key, updateHash) {
      const valid = accountTabs.some((tab) => tab.dataset.accountTab === key);
      if (!valid) key = accountTabs[0].dataset.accountTab;
      accountTabs.forEach((tab) => {
        const active = tab.dataset.accountTab === key;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      $$("[data-account-panel]").forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.accountPanel === key);
      });
      if (updateHash) {
        history.replaceState(null, "", "#" + key);
      }
    }

    accountTabs.forEach((tab) => {
      tab.addEventListener("click", () =>
        activateAccount(tab.dataset.accountTab, true)
      );
    });

    $$("[data-account-jump]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        activateAccount(link.dataset.accountJump, true);
      });
    });

    const initial = location.hash.replace("#", "");
    activateAccount(initial || "overview", false);
  }

  /* ---------------- checkout ---------------- */

  const checkoutPage = $(".checkout-page");
  if (checkoutPage) {
    const checkoutGrid = $("#checkout-grid");
    const checkoutEmpty = $("#checkout-empty");
    const success = $("#checkout-success");

    function renderCheckout() {
      const summary = $("#checkout-items");
      const subtotal = $("#checkout-subtotal");
      const total = $("#checkout-total");
      const hasItems = cart.length > 0;

      if (checkoutGrid) checkoutGrid.hidden = !hasItems;
      if (checkoutEmpty) checkoutEmpty.hidden = hasItems;

      if (!summary) return;
      summary.innerHTML = cart
        .map(
          (item) => `
          <div class="summary-item">
            <span>${item.name}<span class="sub">${item.variant || ""} × ${item.qty}</span></span>
            <span>${formatPrice(item.price * item.qty)}</span>
          </div>
        `
        )
        .join("");

      const value = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
      if (subtotal) subtotal.textContent = formatPrice(value);
      if (total) total.textContent = formatPrice(value);
    }

    renderCheckout();

    const checkoutForm = $("#checkout-form");
    if (checkoutForm) {
      checkoutForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!cart.length) return;
        const orderNo =
          "APR-" +
          new Date().getFullYear() +
          "-" +
          String(Math.floor(Math.random() * 900000) + 100000);
        const successOrder = $("#success-order");
        if (successOrder) successOrder.textContent = orderNo;
        cart = [];
        saveCart();
        renderCheckout();
        if (checkoutGrid) checkoutGrid.hidden = true;
        if (checkoutEmpty) checkoutEmpty.hidden = true;
        if (success) {
          success.hidden = false;
          success.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }
  }

  /* ---------------- demo forms ---------------- */

  $$("[data-demo-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const success = form.querySelector("[data-form-success]");
      if (success) {
        success.hidden = false;
      }
      const input = form.querySelector("input");
      if (input && form.dataset.demoForm === "waitlist") input.value = "";
    });
  });

  /* ---------------- FAQ search ---------------- */

  const faqSearch = $("#faq-search");
  if (faqSearch) {
    faqSearch.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = $("#faq-search-input");
      const query = (input.value || "").trim().toLowerCase();
      const items = $$("[data-faq]");
      let shown = 0;
      items.forEach((item) => {
        const match = !query || item.textContent.toLowerCase().includes(query);
        item.hidden = !match;
        if (match) shown += 1;
      });
      const status = $("#faq-status");
      if (status) {
        status.textContent = query
          ? `“${input.value.trim()}” · ${shown} 条结果`
          : "";
      }
    });
  }

  /* ---------------- order tracking demo ---------------- */

  const trackingForm = $("#tracking-form");
  if (trackingForm) {
    trackingForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const order = $("#tracking-order");
      const number = $("#tracking-number");
      if (order && number && order.value.trim()) {
        number.textContent = order.value.trim();
      }
      const result = $("#tracking-result");
      if (result) {
        result.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  /* ---------------- demo actions ---------------- */

  $$("[data-demo-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      toast(btn.dataset.demoAction || "这是演示操作");
    });
  });

  /* ---------------- footer year ---------------- */

  $$("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
})();
