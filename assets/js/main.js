/* ==========================================================
   BARRA CHOPP — main.js
   Vanilla, ~1KB. Sem bibliotecas.
   - Nav ganha fundo ao rolar (sem backdrop-filter pesado)
   - Menu mobile com lock de scroll
   - Scroll reveals via IntersectionObserver (uma vez só)
   - Ano automático no rodapé
   ========================================================== */
(function () {
  "use strict";

  var nav = document.querySelector("[data-nav]");
  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-menu]");

  /* Vídeo autoplay: respeita prefers-reduced-motion */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll("video[autoplay]").forEach(function (v) {
      v.removeAttribute("autoplay");
      v.pause();
    });
  }

  /* Nav: estado de rolagem (passivo, barato) */
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* Menu mobile */
  if (toggle && menu) {
    var closeMenu = function () {
      document.body.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 959) closeMenu();
    });
  }

  /* Scroll reveal — respeita prefers-reduced-motion */
  var items = document.querySelectorAll("[data-reveal]");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduced && "IntersectionObserver" in window && items.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* Ano no rodapé */
  var year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ===== Carrosséis das edições ===== */
  var carousels = document.querySelectorAll("[data-carousel]");
  carousels.forEach(function (car) {
    var track = car.querySelector("[data-track]");
    var slides = Array.prototype.slice.call(track.children);
    var countEl = car.querySelector("[data-count]");
    var labelEl = car.querySelector("[data-label]");
    var pos = 0;

    function update() {
      var w = car.querySelector(".carousel-viewport").clientWidth || 1;
      track.style.transform = "translateX(" + -pos * w + "px)";
      if (countEl) countEl.textContent = (pos + 1) + " / " + slides.length;
      if (labelEl && slides[pos]) {
        var ed = slides[pos].getAttribute("data-ed");
        if (ed) labelEl.textContent = ed;
      }
    }
    function go(n) {
      pos = Math.max(0, Math.min(slides.length - 1, pos + n));
      update();
    }

    var prev = car.querySelector("[data-prev]");
    var next = car.querySelector("[data-next]");
    if (prev) prev.addEventListener("click", function () { go(-1); });
    if (next) next.addEventListener("click", function () { go(1); });
    window.addEventListener("resize", update);

    car._slides = slides;
    update();
  });

  /* ===== Lightbox (tela cheia) ===== */
  var lb = document.querySelector(".lightbox");
  if (lb) {
    var lbImg = lb.querySelector(".lightbox-img");
    var lbLabel = lb.querySelector("[data-lb-label]");
    var lbSlides = [];
    var lbPos = 0;

    function lbShow() {
      var img = lbSlides[lbPos].querySelector("img");
      lbImg.src = img.src;
      lbImg.alt = img.alt || "";
      if (lbLabel) lbLabel.textContent = lbSlides[lbPos].getAttribute("data-ed") || "";
    }
    function lbOpen(slides, i) {
      lbSlides = slides;
      lbPos = i;
      lbShow();
      lb.hidden = false;
      document.body.style.overflow = "hidden";
    }
    function lbClose() {
      lb.hidden = true;
      document.body.style.overflow = "";
    }

    lb.querySelector(".lightbox-close").addEventListener("click", lbClose);
    lb.addEventListener("click", function (e) { if (e.target === lb) lbClose(); });
    lb.querySelector(".lightbox-prev").addEventListener("click", function () {
      lbPos = (lbPos - 1 + lbSlides.length) % lbSlides.length;
      lbShow();
    });
    lb.querySelector(".lightbox-next").addEventListener("click", function () {
      lbPos = (lbPos + 1) % lbSlides.length;
      lbShow();
    });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") lbClose();
      if (e.key === "ArrowLeft") lb.querySelector(".lightbox-prev").click();
      if (e.key === "ArrowRight") lb.querySelector(".lightbox-next").click();
    });

    document.querySelectorAll("[data-full]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var car = btn.closest("[data-carousel]");
        if (car && car._slides) lbOpen(car._slides, car._slides.indexOf(btn));
      });
    });
  }
})();
