document.documentElement.classList.remove("no-js");
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Hero intro
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add("loaded")));

  // Nav turns dark while it sits over the hero
  const nav = document.querySelector(".nav");
  const hero = document.querySelector("[data-dark]");
  // (measured on scroll: Safari never reports the zero-height IntersectionObserver root as intersecting)
  if (nav && hero) {
    let navQueued = false;
    const syncNav = () => {
      navQueued = false;
      nav.classList.toggle("on-dark", hero.getBoundingClientRect().bottom > nav.offsetHeight);
    };
    addEventListener("scroll", () => {
      if (!navQueued) { navQueued = true; requestAnimationFrame(syncNav); }
    }, { passive: true });
    addEventListener("resize", syncNav);
    syncNav();
  }

  // Geometric tiles: after they land, keep turning one tile at a time
  const tiles = [...document.querySelectorAll(".geo .tile")];
  if (tiles.length) {
    setTimeout(() => tiles.forEach((t) => t.classList.add("settled")), 2000);
    if (!reduce) {
      let last = -1;
      setInterval(() => {
        if (document.hidden) return;
        let i;
        do { i = Math.floor(Math.random() * tiles.length); } while (i === last);
        last = i;
        const t = tiles[i];
        const r = Number(t.style.getPropertyValue("--r") || 0) + 90;
        t.style.setProperty("--r", r);
      }, 1400);

      const geo = document.querySelector(".geo");
      hero.addEventListener("pointermove", (e) => {
        const x = (e.clientX / innerWidth - 0.5) * -16;
        const y = (e.clientY / innerHeight - 0.5) * -16;
        geo.style.setProperty("--gx", `${x}px`);
        geo.style.setProperty("--gy", `${y}px`);
      });
    }
  }

  // Reveal on scroll, with a small stagger for siblings revealed together
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries
          .filter((e) => e.isIntersecting)
          .forEach((e, i) => {
            const el = e.target;
            el.style.transitionDelay = `${i * 90}ms`;
            el.classList.add("in");
            // Clear the delay afterwards so hover transitions stay immediate
            setTimeout(() => (el.style.transitionDelay = ""), 1200 + i * 90);
            io.unobserve(el);
          });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add("in"));
  }

  // Statement: words light up as the paragraph scrolls through the viewport
  const statement = document.querySelector("[data-highlight]");
  if (statement && !reduce) {
    const words = statement.textContent.trim().split(/\s+/);
    statement.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(" ");
    statement.setAttribute("data-ready", "");
    const spans = statement.querySelectorAll(".w");
    let queued = false;
    const update = () => {
      queued = false;
      const r = statement.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the top enters the lower 80% of the screen, 1 when the bottom reaches 40%
      const start = vh * 0.8;
      const end = vh * 0.4;
      const p = Math.min(Math.max((start - r.top) / (start - end + r.height), 0), 1);
      const lit = Math.round(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle("on", i < lit));
    };
    addEventListener("scroll", () => {
      if (!queued) { queued = true; requestAnimationFrame(update); }
    }, { passive: true });
    addEventListener("resize", update);
    update();
  }
  // Analytics events (no-op until GA_ID is set in index.html)
  const track = (name, params) => { if (typeof window.gtag === "function") window.gtag("event", name, params); };
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    if (a.dataset.lang) {
      try { localStorage.setItem("lang", a.dataset.lang); } catch (err) {}
      track("select_content", { content_type: "language", item_id: a.dataset.lang });
      return;
    }
    const href = a.getAttribute("href") || "";
    if (href.startsWith("mailto:")) track("generate_lead", { method: "email", link_text: a.textContent.trim() });
    else if (href === "#contact") track("select_content", { content_type: "cta", item_id: a.textContent.trim() });
    else if (a.closest(".matter, .product, .logos, .career")) track("select_content", { content_type: "outbound_card", item_id: a.href });
  });
})();
