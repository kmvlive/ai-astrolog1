(function () {
  var API = "https://my.neiro-astro.ru";
  var SIGN_BASE = "horoscopes";

  function smartCut(text, limit) {
    text = String(text || "");
    if (text.length <= limit) return text;
    var cut = text.slice(0, limit), idx = -1;
    for (var i = cut.length - 1; i >= 0; i--) {
      if (".!?".indexOf(cut[i]) >= 0) { idx = i; break; }
    }
    if (idx > limit * 0.5) return cut.slice(0, idx + 1);
    var sp = cut.lastIndexOf(" ");
    return cut.slice(0, sp > 0 ? sp : limit) + "…";
  }

  var LINKS = {
    moon: "/moon", lunar: "/moon", horoscope: "/horoscopes", affirmation: "/affirmations",
    rune: "/runes", tarot: "/tarot", holiday: "/calendars/holidays", orthodox: "/calendars/orthodox",
    garden: "/calendars/gardener", nameday: "/calendars/names", dream: "/dreams"
  };

  var titles = {
    moon: "Фаза луны", horoscope: "Гороскоп", affirmation: "Аффирмация дня",
    rune: "Руна дня", tarot: "Карта дня Таро", holiday: "Праздники сегодня",
    orthodox: "Православные праздники", garden: "Календарь садовода",
    nameday: "Именины сегодня", lunar: "Лунный календарь", dream: "Сонник"
  };

  function styles() {
    if (document.getElementById("nai-styles")) return;
    var s = document.createElement("style");
    s.id = "nai-styles";
    s.textContent =
      ".nai-card{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:#0f0a1e;color:#e9e4f7;border:1px solid rgba(139,92,246,.35);border-radius:14px;padding:14px;max-width:340px;box-shadow:0 10px 30px rgba(0,0,0,.35);box-sizing:border-box}" +
      ".nai-card.nai-light{background:#ffffff;color:#1e1b2e;border-color:#d8cff0}" +
      ".nai-head{display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#a78bfa;margin-bottom:8px}" +
      ".nai-light .nai-head{color:#7c3aed}" +
      ".nai-title{font-size:16px;font-weight:700;margin-bottom:6px}" +
      ".nai-text{font-size:13px;line-height:1.45;margin-bottom:6px}" +
      ".nai-muted{font-size:12px;opacity:.75;font-style:italic}" +
      ".nai-img{width:84px;border-radius:8px;border:1px solid rgba(251,191,36,.5)}" +
      ".nai-row{display:flex;gap:10px;align-items:flex-start}" +
      ".nai-glyph{font-size:22px;color:#fbbf24}" +
      ".nai-link{display:inline-block;margin-top:8px;font-size:11px;color:#a78bfa;text-decoration:none}" +
      ".nai-light .nai-link{color:#7c3aed}" +
      ".nai-input{width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid rgba(139,92,246,.4);background:rgba(255,255,255,.06);color:inherit;font-size:13px}" +
      ".nai-light .nai-input{background:#f5f3ff;color:#1e1b2e}" +
      ".nai-btn{margin-top:6px;padding:7px 12px;border:0;border-radius:8px;background:linear-gradient(90deg,#f59e0b,#8b5cf6);color:#fff;font-size:13px;cursor:pointer}" +
      ".nai-list{margin:0;padding-left:16px;font-size:13px}" +
      ".nai-inline{font-family:system-ui,sans-serif;font-size:14px}";
    document.head.appendChild(s);
  }

  var LINK_TEXT = {
    moon: "Фазы луны", lunar: "Лунный календарь", affirmation: "Аффирмации дня",
    rune: "Руна дня и каталог рун", tarot: "Карта дня и расклады Таро",
    holiday: "Праздники сегодня", orthodox: "Православный календарь",
    garden: "Календарь садовода", nameday: "Именины и день ангела"
  };
  function link(d) {
    if (!LINK_TEXT[d.type]) return "";
    return '<a class="nai-link" href="' + API + (LINKS[d.type] || "") + '?utm_source=widget" target="_blank" rel="noopener" style="font-weight:600">' + LINK_TEXT[d.type] + " →</a>";
  }
  function esc(s) { return String(s == null ? "" : s).replace(/</g, "&lt;"); }
  function head(d) { return '<div class="nai-head"><span>' + (d.emoji || "🔮") + "</span><span>" + (titles[d.type] || "") + "</span></div>"; }

  function cardHtml(d) {
    switch (d.type) {
      case "moon":
        return head(d) + '<div class="nai-title">' + esc(d.phase) + '</div><div class="nai-text">' + d.day + "-й лунный день</div>" + link(d);
      case "lunar":
        return head(d) + '<div class="nai-title">' + d.emoji + " " + d.day + "-й лунный день</div><div class=\"nai-text\">" + esc(d.phase) + '</div><div class="nai-muted">' + esc(d.recommendation) + "</div>" + link(d);
      case "horoscope":
        return head(d) + '<div class="nai-title">' + d.emoji + " " + esc(d.sign_name || d.sign) + '</div><div class="nai-text">' + esc(smartCut(d.text, 400)) + '</div><a class="nai-link" href="' + API + "/" + SIGN_BASE + "/" + (d.sign_slug || d.sign) + '?utm_source=widget" target="_blank" rel="noopener" style="font-weight:600;color:#fbbf24">' + d.emoji + " Полный гороскоп: " + esc(d.sign_name || "") + " →</a>" + link(d);
      case "affirmation":
        return head(d) + '<div class="nai-title">💫 ' + esc(d.title) + '</div><div class="nai-muted">' + esc(smartCut(d.text, 300)) + "</div>" + link(d);
      case "rune":
        return head(d) + '<div class="nai-row"><img class="nai-img" src="' + API + "/storage/" + d.image + '" alt=""><div><div class="nai-title">' + esc(d.name) + ' <span class="nai-glyph">' + d.glyph + '</span></div><div class="nai-text">' + esc(d.meaning) + '</div><div class="nai-muted">💡 ' + esc(d.advice) + "</div></div></div>" + link(d);
      case "tarot":
        return head(d) + '<div class="nai-row"><img class="nai-img" src="' + API + "/storage/" + d.image + '" alt=""><div><div class="nai-title">🃏 ' + esc(d.name) + '</div><div class="nai-text">' + esc(smartCut(d.description, 300)) + "</div></div></div>" + link(d);
      case "holiday":
      case "orthodox":
        return head(d) + '<div class="nai-title">' + d.emoji + " " + esc(d.date) + '</div><ul class="nai-list">' + (d.holidays || []).map(function (h) { return "<li>" + esc(h.name) + "</li>"; }).join("") + "</ul>" + link(d);
      case "garden":
        return head(d) + '<div class="nai-title">🌱 ' + esc(d.title) + '</div><div class="nai-text">' + esc(smartCut(d.text, 250)) + '</div><ul class="nai-list">' + (d.works || []).map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul>" + link(d);
      case "nameday":
        return head(d) + '<div class="nai-title">🎂 Именины сегодня</div><div class="nai-text">' + esc((d.names || []).join(", ")) + "</div>" + link(d);
      case "dream":
        return head(d) + '<input class="nai-input" placeholder="Что приснилось? Например: вода"><button class="nai-btn">🔍 Толковать</button><div class="nai-dream-res"></div>' + link(d);
    }
    return "";
  }

  function inlineHtml(d) {
    switch (d.type) {
      case "moon": return d.phase + ", " + d.day + "-й лунный день";
      case "lunar": return d.emoji + " " + d.day + "-й лунный день — " + d.recommendation;
      case "horoscope": return d.emoji + " " + (d.sign_name || "") + ": " + (d.text || "").slice(0, 140) + "…";
      case "affirmation": return "💫 " + d.title;
      case "rune": return "ᚱ Руна дня: " + d.name + " " + d.glyph + " — " + d.meaning;
      case "tarot": return "🃏 Карта дня: " + d.name;
      case "holiday": return "🎉 Сегодня: " + (d.holidays || []).map(function (h) { return h.name; }).join(", ");
      case "orthodox": return "☦️ Сегодня: " + (d.holidays || []).map(function (h) { return h.name; }).join(", ");
      case "garden": return "🌱 " + (d.title || "");
      case "nameday": return "🎂 Именины: " + (d.names || []).join(", ");
      case "dream": return "💭 Сонник доступен в режиме card";
    }
    return "";
  }

  function bindDream(node) {
    var btn = node.querySelector(".nai-btn"), inp = node.querySelector(".nai-input"), res = node.querySelector(".nai-dream-res");
    if (!btn) return;
    btn.onclick = function () {
      var q = (inp.value || "").trim();
      if (!q) return;
      res.innerHTML = '<div class="nai-text">Ищу толкование…</div>';
      fetch(API + "/api/widgets/dream?q=" + encodeURIComponent(q))
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d.results || !d.results.length) {
            res.innerHTML = '<div class="nai-muted">Не найдено. Попробуйте другое слово.</div>';
            return;
          }
          res.innerHTML = d.results.map(function (s) {
            return '<div class="nai-text">• <b>' + esc(s.keyword || s.name || q) + "</b>" + (s.meaning || s.text ? " — " + esc((s.meaning || s.text || "").slice(0, 120)) + "…" : "") + "</div>";
          }).join("") +
          '<a class="nai-link" href="' + API + "/dreams?q=" + encodeURIComponent(q) + '" target="_blank" rel="noopener">Подробнее на AI Астролог →</a>';
        });
    };
  }

  function init() {
    styles();
    var nodes = document.querySelectorAll(".neiro-astro-informer");
    Array.prototype.forEach.call(nodes, function (node) {
      var type = node.getAttribute("data-type") || "moon";
      var mode = node.getAttribute("data-mode") || "card";
      var theme = node.getAttribute("data-theme") || "dark";
      var sign = node.getAttribute("data-sign") || "";
      var params = sign ? "sign=" + sign : "";

      fetch(API + "/api/widgets/" + type + (params ? "?" + params : ""))
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (mode === "inline") {
            node.classList.add("nai-inline");
            node.innerHTML = inlineHtml(d);
          } else {
            var card = document.createElement("div");
            card.className = "nai-card" + (theme === "light" ? " nai-light" : "");
            card.innerHTML = cardHtml(d);
            node.innerHTML = "";
            node.appendChild(card);
            if (d.type === "dream") bindDream(card);
          }
        })
        .catch(function () {});
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
