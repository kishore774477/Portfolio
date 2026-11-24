/**
 * Motion Engine — Ragunath Portfolio
 * Vanilla JS · rAF · IntersectionObserver · GPU transforms only
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function initHeader() {
    var header = document.querySelector("[data-site-header]");
    if (!header) return;
    var ticking = false;

    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  function initScrollProgress() {
    var bar = document.querySelector("[data-scroll-progress]");
    if (!bar || reduceMotion) return;
    var ticking = false;

    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = "scaleX(" + Math.min(Math.max(p, 0), 1).toFixed(4) + ")";
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  function initCursorGlow() {
    var glow = document.querySelector("[data-cursor-glow]");
    if (!glow || reduceMotion) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    var x = window.innerWidth / 2;
    var y = window.innerHeight / 2;
    var tx = x;
    var ty = y;
    var raf = 0;

    function tick() {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      glow.style.transform =
        "translate3d(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px, 0) translate(-50%, -50%)";
      raf = window.requestAnimationFrame(tick);
    }

    window.addEventListener(
      "pointermove",
      function (e) {
        tx = e.clientX;
        ty = e.clientY;
        glow.classList.add("is-on");
        if (!raf) raf = window.requestAnimationFrame(tick);
      },
      { passive: true }
    );

    document.addEventListener("pointerleave", function () {
      glow.classList.remove("is-on");
    });
  }

  function initHardLinks() {
    /* Guarantee page navigation for primary links (fixes cases where
       decorative layers / motion styles swallow the default click). */
    var selector =
      ".site-header a[href], a.btn-magnet[href], a.btn-ghost[href], a.brand-mark[href]";
    document.querySelectorAll(selector).forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (event.defaultPrevented) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (link.target && link.target !== "" && link.target !== "_self") return;

        var href = link.getAttribute("href");
        if (!href || href.charAt(0) === "#") return;
        if (/^(mailto:|tel:|javascript:)/i.test(href)) return;

        event.preventDefault();
        window.location.assign(link.href);
      });
    });
  }

  function initNavIndicator() {
    var track = document.querySelector("[data-nav-track]");
    var indicator = document.querySelector("[data-nav-indicator]");
    if (!track || !indicator) return;

    var links = Array.prototype.slice.call(track.querySelectorAll(".nav-link"));
    if (!links.length) return;

    function moveTo(link) {
      if (!link || window.matchMedia("(max-width: 991.98px)").matches) {
        indicator.classList.remove("is-ready");
        return;
      }
      var trackBox = track.getBoundingClientRect();
      var linkBox = link.getBoundingClientRect();
      var left = linkBox.left - trackBox.left + track.scrollLeft;
      var width = Math.max(18, linkBox.width * 0.55);
      var offset = (linkBox.width - width) / 2;
      indicator.style.width = width + "px";
      indicator.style.transform = "translate3d(" + (left + offset) + "px, 0, 0)";
      indicator.classList.add("is-ready");

      links.forEach(function (item) {
        item.classList.toggle("is-hot", item === link);
      });
    }

    var active =
      track.querySelector(".nav-link.is-active") ||
      links.find(function (link) {
        return link.getAttribute("aria-current") === "page";
      }) ||
      links[0];

    moveTo(active);

    links.forEach(function (link) {
      link.addEventListener("mouseenter", function () {
        moveTo(link);
      });
      link.addEventListener("focus", function () {
        moveTo(link);
      });
    });

    track.addEventListener("mouseleave", function () {
      moveTo(active);
    });

    window.addEventListener(
      "resize",
      function () {
        moveTo(active);
      },
      { passive: true }
    );
  }

  function initHeroReveal() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) return;
    function ready() {
      hero.classList.add("is-hero-ready");
    }
    if (reduceMotion) {
      ready();
      return;
    }
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(ready);
    });
    /* Failsafe so title/kicker never stay stuck mid-reveal */
    window.setTimeout(ready, 900);
  }

  function initPortraitParallax() {
    /* Portrait kept static aside from CSS bottom-fade animation */
  }

  function initMagnet() {
    /* Magnet translate removed — it shifted hit-targets and blocked reliable clicks.
       Pulse glow remains purely in CSS. */
    document.querySelectorAll("[data-magnet]").forEach(function (btn) {
      btn.style.transform = "";
      btn.classList.remove("is-magnetizing");
    });
  }

  function initReveals() {
    document.documentElement.classList.add("js-ready");
    var nodes = Array.prototype.slice.call(
      document.querySelectorAll("[data-reveal], [data-reveal-now], .img-reveal, .article-body")
    );
    if (!nodes.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach(function (el) {
        el.classList.add("is-inview");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-inview");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );

    nodes.forEach(function (el) {
      if (
        el.classList.contains("article-body") ||
        el.hasAttribute("data-reveal-now") ||
        el.classList.contains("img-reveal")
      ) {
        el.classList.add("is-inview");
        return;
      }
      observer.observe(el);
    });
  }

  function animateCount(el, target, duration) {
    var start = 0;
    var startTime = null;
    duration = duration || 1400;

    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(start + (target - start) * eased));
      if (progress < 1) window.requestAnimationFrame(step);
      else el.textContent = String(target);
    }

    window.requestAnimationFrame(step);
  }

  function initCounters() {
    var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
    if (!counters.length) return;

    function run(el) {
      if (el.dataset.counted === "1") return;
      el.dataset.counted = "1";
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      if (reduceMotion) {
        el.textContent = String(target);
        return;
      }
      animateCount(el, target, 1500);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(run);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            run(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initSkills() {
    var rows = Array.prototype.slice.call(document.querySelectorAll("[data-skill]"));
    if (!rows.length) return;

    function fill(row) {
      if (row.classList.contains("is-filled")) return;
      var level = parseFloat(row.getAttribute("data-skill")) || 0;
      row.style.setProperty("--level", String(level));
      row.classList.add("is-filled");

      var badge = row.querySelector("[data-skill-badge]");
      if (!badge) return;

      if (reduceMotion) {
        badge.textContent = Math.round(level) + "%";
        return;
      }

      var startTime = null;
      var duration = 1150;

      function step(ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        badge.textContent = Math.round(level * eased) + "%";
        if (progress < 1) window.requestAnimationFrame(step);
      }

      badge.textContent = "0%";
      window.requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      rows.forEach(fill);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            fill(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );

    rows.forEach(function (row) {
      observer.observe(row);
    });
  }

  function initCertFilters() {
    var toolbar = document.querySelector("[data-cert-filters]");
    var grid = document.querySelector("[data-cert-grid]");
    var moreBtn = document.querySelector("[data-cert-more]");
    if (!toolbar || !grid) return;

    var buttons = Array.prototype.slice.call(toolbar.querySelectorAll("[data-filter]"));
    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-category]"));
    var limit = 10;
    var activeFilter = "*";
    var expanded = false;

    function apply() {
      var matched = [];
      cards.forEach(function (card) {
        var cat = card.getAttribute("data-category") || "";
        var inFilter = activeFilter === "*" || cat === activeFilter;
        card.classList.toggle("is-hidden", !inFilter);
        card.classList.remove("is-overflow");
        if (inFilter) matched.push(card);
      });

      matched.forEach(function (card, index) {
        var overflow = !expanded && index >= limit;
        card.classList.toggle("is-overflow", overflow);
      });

      if (moreBtn) {
        var needsMore = matched.length > limit;
        moreBtn.hidden = !needsMore;
        moreBtn.textContent = expanded ? "Show less" : "Show more";
        moreBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeFilter = btn.getAttribute("data-filter") || "*";
        expanded = false;
        buttons.forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        apply();
      });
    });

    if (moreBtn) {
      moreBtn.addEventListener("click", function () {
        expanded = !expanded;
        apply();
      });
    }

    apply();
  }

  function initPortraitTilt() {
    if (reduceMotion) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    var frame = document.querySelector("[data-tilt]");
    if (!frame) return;

    var rect = null;
    var raf = 0;
    var tx = 0;
    var ty = 0;

    function paint() {
      frame.style.transform =
        "rotateY(" +
        tx.toFixed(2) +
        "deg) rotateX(" +
        ty.toFixed(2) +
        "deg) translate3d(0,0,18px)";
      raf = 0;
    }

    frame.addEventListener(
      "pointermove",
      function (e) {
        rect = frame.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        tx = px * 12;
        ty = py * -9;
        if (!raf) raf = window.requestAnimationFrame(paint);
      },
      { passive: true }
    );

    frame.addEventListener("pointerleave", function () {
      tx = 0;
      ty = 0;
      if (!raf) raf = window.requestAnimationFrame(paint);
    });
  }

  function initCertModal() {
    var modalEl = document.getElementById("certPreviewModal") || document.getElementById("certModal");
    var imgEl = document.getElementById("certPreviewImage");
    if (!modalEl || !imgEl || typeof bootstrap === "undefined") return;

    var modal = bootstrap.Modal.getOrCreateInstance(modalEl);

    document.querySelectorAll("[data-cert-src]").forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        imgEl.src = trigger.getAttribute("data-cert-src");
        imgEl.alt = trigger.getAttribute("data-cert-alt") || "Certificate preview";
        modal.show();
      });
    });

    modalEl.addEventListener("hidden.bs.modal", function () {
      imgEl.removeAttribute("src");
      imgEl.alt = "";
    });
  }

  
  function initContactForm() {
    var form = document.getElementById('contactForm');
    var status = document.getElementById('contactStatus');
    if (!form) return;

    // Self-hosted FastAPI backend (see /backend). Override before this script
    // loads with: <script>window.PORTFOLIO_API_BASE = "https://your-api.onrender.com";</script>
    var API_BASE = window.PORTFOLIO_API_BASE || 'http://localhost:8220';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var originalText = btn ? btn.innerHTML : 'Send message';

      var name = (form.querySelector('#name') || {}).value || '';
      var email = (form.querySelector('#email') || {}).value || '';
      var subject = (form.querySelector('#subject') || {}).value || 'Portfolio Contact';
      var message = (form.querySelector('#message') || {}).value || '';

      if (!name || !email || !message) {
        if (status) {
          status.className = 'contact-status-banner is-error';
          status.innerHTML = '<strong>Please fill all required fields</strong> (Name, Email, Message).';
        }
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-magnet__label">Sending...</span>';
      }

      function finish() {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      }

      function showFallback() {
        var mailtoUrl = 'mailto:kishore774477@gmail.com?subject=' + encodeURIComponent('[Portfolio] ' + subject) + '&body=' + encodeURIComponent("Hi Kishore,\n\n" + message + "\n\nFrom: " + name + " (" + email + ")");
        var gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1&to=kishore774477@gmail.com&su=' + encodeURIComponent('[Portfolio] ' + subject) + '&body=' + encodeURIComponent("Hi Kishore,\n\n" + message + "\n\nFrom: " + name + " (" + email + ")");

        if (status) {
          status.className = 'contact-status-banner is-success';
          status.innerHTML = '<strong>Ready to deliver!</strong> Click to send directly via: <a href="' + gmailUrl + '" target="_blank" class="btn btn-sm btn-outline-dark ms-2">Open Gmail</a> or <a href="' + mailtoUrl + '" class="btn btn-sm btn-outline-secondary ms-1">Email Client</a>';
        }
      }

      // Primary: self-hosted FastAPI backend (see /backend).
      fetch(API_BASE + '/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ name: name, email: email, subject: subject, message: message })
      })
      .then(function (res) {
        if (!res.ok) throw new Error('backend unavailable');
        return res.json();
      })
      .then(function () {
        finish();
        form.reset();
        if (status) {
          status.className = 'contact-status-banner is-success';
          status.innerHTML = '<strong>Message sent successfully!</strong> Thank you for reaching out, Kishore will respond shortly.<br><small>If you prefer direct email, you can also write to <a href="mailto:kishore774477@gmail.com">kishore774477@gmail.com</a>.</small>';
        }
      })
      .catch(function () {
        // Backend unreachable: try FormSubmit AJAX as a secondary path.
        fetch('https://formsubmit.co/ajax/kishore774477@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: name,
            email: email,
            _subject: '[Portfolio Message] ' + subject,
            message: message
          })
        })
        .then(function (res) { return res.json(); })
        .then(function () {
          finish();
          form.reset();
          if (status) {
            status.className = 'contact-status-banner is-success';
            status.innerHTML = '<strong>Message sent successfully!</strong> Thank you for reaching out, Kishore will respond shortly.<br><small>If you prefer direct email, you can also write to <a href="mailto:kishore774477@gmail.com">kishore774477@gmail.com</a>.</small>';
          }
        })
        .catch(function () {
          finish();
          showFallback();
        });
      });
    });
  }

  ready(function () {
    initHeader();
    initScrollProgress();
    initCursorGlow();
    initHardLinks();
    initNavIndicator();
    initHeroReveal();
    initPortraitParallax();
    initMagnet();
    initReveals();
    initCounters();
    initSkills();
    initCertFilters();
    initCertModal();
    initPortraitTilt();
    initContactForm();
  });
})();
