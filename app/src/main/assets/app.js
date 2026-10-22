(function () {
  "use strict";

  /* ---------------- utilidades ---------------- */
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  var ICONS = {
    tv: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="3"/><path d="M8 3l4 4 4-4"/><polygon points="10.5,10.5 10.5,16 15,13.2" fill="currentColor" stroke="none"/></svg>',
    film: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 4v16M16 4v16M3 9h5M3 15h5M16 9h5M16 15h5"/></svg>',
    cal: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 5.800-8 11-8 11z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.800l-.1-.1a1.700 1.700 0 0 0-1.800-.3 1.700 1.700 0 0 0-1 1.500V21a2 2 0 1 1-4 0v-.1a1.700 1.700 0 0 0-1.100-1.500 1.700 1.700 0 0 0-1.800.3l-.1.1a2 2 0 1 1-2.800-2.800l.1-.1a1.700 1.700 0 0 0 .3-1.800 1.700 1.700 0 0 0-1.500-1H3a2 2 0 1 1 0-4h.1a1.700 1.700 0 0 0 1.500-1.100 1.700 1.700 0 0 0-.3-1.800l-.1-.1a2 2 0 1 1 2.800-2.800l.1.1a1.700 1.700 0 0 0 1.800.3h.1a1.700 1.700 0 0 0 1-1.500V3a2 2 0 1 1 4 0v.1a1.700 1.700 0 0 0 1 1.500 1.700 1.700 0 0 0 1.800-.3l.1-.1a2 2 0 1 1 2.800 2.800l-.1.1a1.700 1.700 0 0 0-.3 1.800v.1a1.700 1.700 0 0 0 1.500 1H21a2 2 0 1 1 0 4h-.1a1.700 1.700 0 0 0-1.500 1z"/></svg>',
    star: '<svg class="fav" viewBox="0 0 24 24"><path d="M12 3.500l2.600 5.400 5.900.8-4.300 4.100 1 5.900L12 17l-5.200 2.700 1-5.900L3.500 9.700l5.900-.8z"/></svg>'
  };

  /* ---------------- estado ---------------- */
  var TABS = [
    { id: "live", label: "TV ao Vivo", icon: "tv" },
    { id: "movies", label: "Filmes", icon: "film" },
    { id: "series", label: "Séries", icon: "cal" },
    { id: "fav", label: "Favoritos", icon: "heart" }
  ];

  var S = {
    all: [],
    tab: "live",
    cat: "Todos",
    query: "",
    shown: [],        // canais visíveis
    idx: 0,           // item focado na lista
    playing: null,    // canal tocando
    zone: "list",     // nav | chips | list
    navIdx: 0,        // 0..3 abas, 4 busca, 5 config
    chipIdx: 0,
    favs: store("rt_favs") || [],
    full: false,
    modal: null
  };

  /* ---------------- canais ---------------- */
  function loadDemo() {
    var d = window.DEMO_CHANNELS, st = window.DEMO_STREAMS;
    return d.map(function (c, i) {
      return { num: i + 1, id: "demo" + i, name: c[0], sub: c[1], cat: c[2], color: c[3], desc: c[4], shows: c[5], url: st[i % st.length], logo: "" };
    });
  }

  function hashColor(s) {
    var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return "hsl(" + (h % 360) + ",55%,38%)";
  }

  function parseM3U(text) {
    var lines = text.split(/\r?\n/), out = [], cur = null, n = 0;
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i].trim();
      if (!l) continue;
      if (l.indexOf("#EXTINF") === 0) {
        var name = l.substring(l.lastIndexOf(",") + 1).trim();
        var g = /group-title="([^"]*)"/i.exec(l), lg = /tvg-logo="([^"]*)"/i.exec(l), cn = /tvg-chno="([^"]*)"/i.exec(l);
        cur = { name: name || "Canal", cat: (g && g[1]) || "Outros", logo: (lg && lg[1]) || "", chno: cn && parseInt(cn[1], 10) };
      } else if (l.charAt(0) !== "#" && cur) {
        n++;
        out.push({
          num: cur.chno || n, id: "m3u" + n, name: cur.name, sub: "Ao vivo", cat: cur.cat, color: hashColor(cur.name),
          desc: "Canal da sua lista (" + cur.cat + ").", shows: [cur.name], url: l, logo: cur.logo
        });
        cur = null;
      }
    }
    return out;
  }

  /* fetch via Android (evita CORS); no navegador comum usa fetch normal */
  var cbs = {}, cbN = 0;
  window.__fetchDone = function (id, ok, b64) {
    var cb = cbs[id]; delete cbs[id]; if (!cb) return;
    if (!ok) return cb(new Error(b64 ? atob(b64) : "falha"));
    try { cb(null, decodeURIComponent(escape(atob(b64)))); } catch (e) { cb(null, atob(b64)); }
  };
  function fetchText(url, cb) {
    if (window.AndroidBridge && window.AndroidBridge.fetchText) {
      var id = "c" + (++cbN); cbs[id] = cb; window.AndroidBridge.fetchText(url, id);
    } else {
      fetch(url).then(function (r) { return r.text(); }).then(function (t) { cb(null, t); }, cb);
    }
  }

  function setChannels(list) {
    S.all = list;
    S.tab = "live"; S.cat = "Todos"; S.query = ""; S.idx = 0; S.chipIdx = 0;
    refresh(true);
  }

  /* ---------------- filtros ---------------- */
  function isFav(ch) { return S.favs.indexOf(ch.id) >= 0; }
  function baseList() {
    if (S.tab === "movies") return S.all.filter(function (c) { return /filme|cine|movie/i.test(c.cat); });
    if (S.tab === "series") return S.all.filter(function (c) { return /s[eé]rie|series/i.test(c.cat); });
    if (S.tab === "fav") return S.all.filter(isFav);
    return S.all;
  }
  function cats() {
    var seen = {}, out = ["Todos"];
    baseList().forEach(function (c) { if (!seen[c.cat]) { seen[c.cat] = 1; out.push(c.cat); } });
    return out;
  }
  function computeShown() {
    var q = S.query.toLowerCase();
    S.shown = baseList().filter(function (c) {
      return (S.cat === "Todos" || c.cat === S.cat) && (!q || c.name.toLowerCase().indexOf(q) >= 0 || c.sub.toLowerCase().indexOf(q) >= 0);
    });
    if (S.idx >= S.shown.length) S.idx = Math.max(0, S.shown.length - 1);
  }
  function cur() { return S.shown[S.idx] || null; }

  /* ---------------- render ---------------- */
  function initials(n) {
    var w = n.replace(/[^A-Za-zÀ-ÿ0-9 ]/g, "").trim().split(/\s+/);
    var s = w.length > 1 ? w.map(function (x) { return x.charAt(0); }).join("") : w[0].substring(0, 4);
    return s.substring(0, 4).toUpperCase();
  }
  function logo(ch, cls) {
    return '<div class="lg ' + (cls || "") + '" style="background:' + ch.color + '">' + esc(initials(ch.name)) +
      (ch.logo ? '<img src="' + esc(ch.logo) + '" onerror="this.remove()">' : "") + "</div>";
  }

  function renderTabs() {
    $("tabs").innerHTML = TABS.map(function (t, i) {
      return '<div class="tab' + (S.tab === t.id ? " active" : "") + (S.zone === "nav" && S.navIdx === i ? " focus" : "") + '">' + ICONS[t.icon] + "<span>" + t.label + "</span></div>";
    }).join("");
    $("btnSearch").innerHTML = ICONS.search; $("btnSettings").innerHTML = ICONS.gear;
    $("btnSearch").className = "tool" + (S.zone === "nav" && S.navIdx === 4 ? " focus" : "");
    $("btnSettings").className = "tool" + (S.zone === "nav" && S.navIdx === 5 ? " focus" : "");
  }

  function renderChips() {
    var cs = cats();
    if (S.chipIdx >= cs.length) S.chipIdx = 0;
    var html = cs.map(function (c, i) {
      return '<div class="chip' + (S.cat === c ? " active" : "") + (S.zone === "chips" && S.chipIdx === i ? " focus" : "") + '">' + esc(c) + "</div>";
    }).join("");
    $("chips").innerHTML = '<div class="inner" id="chipsInner">' + html + "</div>";
    var inner = $("chipsInner"), kids = inner.children, f = kids[S.chipIdx];
    if (f) { var off = Math.max(0, f.offsetLeft + f.offsetWidth - 470); inner.style.transform = "translateX(" + (-off) + "px)"; }
  }

  function renderList() {
    var L = $("list");
    if (!S.shown.length) {
      L.innerHTML = '<div class="empty">' + (S.tab === "fav" ? "Nenhum favorito ainda.<br>Segure OK em um canal para favoritar." : "Nenhum canal encontrado.") + "</div>"; return;
    }
    var html = S.shown.map(function (c, i) {
      var playing = S.playing && S.playing.id === c.id;
      return '<div class="row' + (i === S.idx ? " sel" : "") + (i === S.idx && S.zone === "list" ? " zoneList" : "") + '">' +
        '<div class="n">' + pad(c.num).replace(/^(\d{2})$/, "0$1") + "</div>" + logo(c) +
        '<div class="t"><b>' + esc(c.name) + "</b><span>" + esc(c.sub) + "</span></div>" +
        (isFav(c) ? ICONS.star : "") +
        (playing ? '<div class="eq"><i></i><i></i><i></i></div>' : "") + "</div>";
    }).join("");
    L.innerHTML = '<div id="listInner">' + html + "</div>";
    var top = Math.max(0, Math.min(S.idx - 4, S.shown.length - 10)) * 80;
    $("listInner").style.transform = "translateY(" + (-top) + "px)";
  }

  function renderInfo() {
    var c = cur() || S.playing; if (!c) { $("info").innerHTML = ""; return; }
    var live = S.playing && S.playing.id === c.id;
    $("info").innerHTML = logo(c, "big") + "<h1>" + esc(c.name) + "</h1><h2>" + esc(c.sub) + "</h2>" +
      '<div class="tags">' + (live ? '<span class="tag live">AO VIVO</span>' : "") + '<span class="tag">' + esc(c.cat) + "</span></div><p>" + esc(c.desc) + "</p>";
  }

  var WIN_MIN = 120, PPM = 1144 / 120, LEFT = 250;
  function renderEpg() {
    var now = new Date(), ws = new Date(now); ws.setMinutes(now.getMinutes() < 30 ? 0 : 30, 0, 0);
    var wsT = ws.getTime(), weT = wsT + WIN_MIN * 60000;
    var rl = "";
    for (var m = 0; m <= WIN_MIN - 30; m += 30) {
      var t = new Date(wsT + m * 60000);
      rl += '<span style="left:' + (m * PPM) + 'px">' + pad(t.getHours()) + ":" + pad(t.getMinutes()) + "</span>";
    }
    $("ruler").innerHTML = rl;

    // 5 linhas ao redor do canal focado
    var n = S.shown.length, rows = "";
    if (n) {
      var first = Math.max(0, Math.min(S.idx - 0, n - 5));
      if (S.idx - first > 4) first = S.idx - 4;
      for (var r = 0; r < 5 && first + r < n; r++) {
        var ch = S.shown[first + r], y = r * 51, pr = "";
        var hourStart = new Date(ws); hourStart.setMinutes(0, 0, 0);
        for (var h = -1; h <= 3; h++) {
          var st = hourStart.getTime() + h * 3600000, en = st + 3600000;
          if (en <= wsT || st >= weT) continue;
          var a = Math.max(st, wsT), b = Math.min(en, weT);
          var title = ch.shows[(Math.floor(st / 3600000) + ch.num) % ch.shows.length];
          if (h === 0 && ch.shows.length) title = ch.shows[(ch.num + new Date(st).getHours()) % ch.shows.length];
          if (h === 0 && ch.sub && ch.shows[0] === ch.sub && new Date(st).getHours() === now.getHours()) title = ch.sub;
          var sh = new Date(st), eh = new Date(en);
          var isNow = now.getTime() >= st && now.getTime() < en;
          pr += '<div class="prog' + (isNow && (first + r) === S.idx ? " now" : "") + '" style="left:' + (LEFT + (a - wsT) / 60000 * PPM + 3) + "px;width:" + ((b - a) / 60000 * PPM - 6) + 'px"><b>' + esc(title) + "</b><span>" + pad(sh.getHours()) + ":" + pad(sh.getMinutes()) + " - " + pad(eh.getHours()) + ":" + pad(eh.getMinutes()) + "</span></div>";
        }
        rows += '<div class="erow' + (first + r === S.idx ? " cur" : "") + '" style="top:' + y + 'px"><div class="ec"><span class="num">' + pad(ch.num).replace(/^(\d{2})$/, "0$1") +
          '</span><div class="mini" style="background:' + ch.color + '">' + esc(initials(ch.name)) + (ch.logo ? '<img src="' + esc(ch.logo) + '" onerror="this.remove()">' : "") + '</div><span class="nm">' + esc(ch.name) + "</span></div>" + pr + "</div>";
      }
    }
    $("epgRows").innerHTML = rows;
    var nl = $("nowline"); nl.style.left = (LEFT + (now.getTime() - wsT) / 60000 * PPM) + "px";
  }

  function renderClock() {
    var d = new Date(), D = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"], M = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    $("time").textContent = pad(d.getHours()) + ":" + pad(d.getMinutes());
    $("date").textContent = D[d.getDay()] + ", " + d.getDate() + " " + M[d.getMonth()];
  }

  function refresh(full) {
    computeShown();
    renderTabs(); renderChips(); renderList(); renderInfo(); renderEpg();
    if (full && !S.playing && S.shown.length) play(S.shown[0]);
  }
  function lite() { renderTabs(); renderChips(); renderList(); renderInfo(); renderEpg(); }

  /* ---------------- player ---------------- */
  var video = $("video"), vmsg = $("vmsg"), fsTimer = null;
  function msg(html) { if (!html) { vmsg.style.display = "none"; return; } vmsg.innerHTML = html; vmsg.style.display = "flex"; }
  function banner() {
    var b = $("fsbanner"), c = S.playing; if (!c) return;
    b.innerHTML = pad(c.num) + " &nbsp; " + esc(c.name) + "<small>" + esc(c.sub) + "</small>";
    b.className = "show"; clearTimeout(fsTimer); fsTimer = setTimeout(function () { b.className = ""; }, 4000);
  }
  function play(ch) {
    if (!ch) return;
    S.playing = ch; msg("Carregando…");
    video.src = ch.url;
    var p = video.play(); if (p && p.catch) p.catch(function () { });
    if (S.full) banner();
    lite();
  }
  video.addEventListener("playing", function () { msg(""); });
  video.addEventListener("waiting", function () { if (video.readyState < 3) msg("Carregando…"); });
  video.addEventListener("error", function () { msg("Sem sinal<small>Não foi possível abrir este canal.</small>"); });
  function setFull(v) { S.full = v; $("stage").className = v ? "full" : ""; if (v) banner(); else $("fsbanner").className = ""; }

  /* ---------------- favoritos ---------------- */
  function toggleFav(ch) {
    if (!ch) return;
    var i = S.favs.indexOf(ch.id);
    if (i >= 0) S.favs.splice(i, 1); else S.favs.push(ch.id);
    store("rt_favs", S.favs);
    var keep = ch.id; refresh(false);
    if (S.tab === "fav") { var k = S.shown.map(function (c) { return c.id; }).indexOf(keep); if (k >= 0) S.idx = k; refresh(false); }
  }

  /* ---------------- modais ---------------- */
  var mItems = [], mIdx = 0;
  function mFocus(i) {
    mIdx = (i + mItems.length) % mItems.length;
    mItems.forEach(function (e, k) { e.classList.toggle("focus", k === mIdx); });
    var e = mItems[mIdx]; if (e.tagName === "INPUT") e.focus(); else if (document.activeElement) document.activeElement.blur();
  }
  function openModal(kind) {
    S.modal = kind; var m = $("modal");
    if (kind === "settings") {
      m.innerHTML = '<div class="box"><h3>Configurações</h3><p>Cole a URL da sua lista de canais (M3U/M3U8). Sem lista, o app mostra canais de demonstração com vídeos de teste.</p>' +
        '<input id="mUrl" type="url" placeholder="https://exemplo.com/lista.m3u" value="' + esc(store("rt_m3u") || "") + '">' +
        '<div class="btns"><div class="btn" id="mSave">Salvar e carregar</div><div class="btn" id="mDemo">Usar demonstração</div><div class="btn" id="mClose">Fechar</div></div><div class="status" id="mStatus"></div></div>';
      mItems = [$("mUrl"), $("mSave"), $("mDemo"), $("mClose")];
    } else {
      m.innerHTML = '<div class="box"><h3>Buscar canal</h3><p>Digite o nome do canal ou do programa e aperte OK.</p><input id="mQ" type="text" value="' + esc(S.query) + '">' +
        '<div class="btns"><div class="btn" id="mGo">Buscar</div><div class="btn" id="mClear">Limpar</div><div class="btn" id="mClose">Fechar</div></div></div>';
      mItems = [$("mQ"), $("mGo"), $("mClear"), $("mClose")];
    }
    m.className = ""; mFocus(0);
  }
  function closeModal() { S.modal = null; $("modal").className = "hidden"; if (document.activeElement) document.activeElement.blur(); lite(); }
  function mStatus(t, err) { var s = $("mStatus"); if (s) { s.textContent = t; s.className = "status" + (err ? " err" : ""); } }
  function mAct() {
    var id = mItems[mIdx].id;
    if (id === "mClose") return closeModal();
    if (id === "mUrl" || id === "mQ") return mFocus(1);
    if (id === "mGo") { S.query = $("mQ").value.trim(); S.idx = 0; closeModal(); return refresh(false); }
    if (id === "mClear") { S.query = ""; S.idx = 0; closeModal(); return refresh(false); }
    if (id === "mDemo") { store("rt_m3u", ""); closeModal(); S.playing = null; return setChannels(loadDemo()); }
    if (id === "mSave") {
      var u = $("mUrl").value.trim();
      if (!u) return mStatus("Cole uma URL primeiro.", true);
      mStatus("Carregando lista…");
      fetchText(u, function (err, txt) {
        if (err) return mStatus("Erro ao baixar: " + (err.message || err), true);
        var l = parseM3U(txt);
        if (!l.length) return mStatus("Nenhum canal encontrado nessa lista.", true);
        store("rt_m3u", u); closeModal(); S.playing = null; setChannels(l);
      });
    }
  }
  function modalKey(e) {
    var k = e.key;
    if (k === "Escape" || k === "Backspace" && mItems[mIdx].tagName !== "INPUT" || k === "GoBack") { e.preventDefault(); return closeModal(); }
    if (k === "ArrowDown") { e.preventDefault(); return mFocus(mIdx + 1); }
    if (k === "ArrowUp") { e.preventDefault(); return mFocus(mIdx - 1); }
    var isInput = mItems[mIdx].tagName === "INPUT";
    if (!isInput && k === "ArrowRight") { e.preventDefault(); return mFocus(mIdx + 1 >= mItems.length ? 1 : mIdx + 1); }
    if (!isInput && k === "ArrowLeft") { e.preventDefault(); return mFocus(mIdx - 1 < 1 ? mItems.length - 1 : mIdx - 1); }
    if (k === "Enter") { e.preventDefault(); return mAct(); }
  }

  /* ---------------- teclado ---------------- */
  var pressTimer = null, pressFired = false, armed = false, numBuf = "", numTimer = null;

  function activate() {
    if (S.zone === "list") {
      var c = cur(); if (!c) return;
      if (S.playing && S.playing.id === c.id) setFull(true); else play(c);
    } else if (S.zone === "chips") {
      S.cat = cats()[S.chipIdx]; S.idx = 0; refresh(false);
    } else if (S.zone === "nav") {
      if (S.navIdx < 4) { S.tab = TABS[S.navIdx].id; S.cat = "Todos"; S.chipIdx = 0; S.idx = 0; refresh(false); }
      else if (S.navIdx === 4) openModal("search");
      else openModal("settings");
    }
  }

  function move(dir) {
    if (S.full) {
      if (dir === "up" || dir === "down") zap(dir === "up" ? -1 : 1);
      return;
    }
    if (S.zone === "list") {
      if (dir === "down" && S.idx < S.shown.length - 1) S.idx++;
      else if (dir === "up") { if (S.idx > 0) S.idx--; else S.zone = "chips"; }
      else if (dir === "left" || dir === "right") { /* sem ação */ }
    } else if (S.zone === "chips") {
      var n = cats().length;
      if (dir === "right") S.chipIdx = Math.min(n - 1, S.chipIdx + 1);
      else if (dir === "left") S.chipIdx = Math.max(0, S.chipIdx - 1);
      else if (dir === "up") S.zone = "nav";
      else if (dir === "down") S.zone = "list";
    } else if (S.zone === "nav") {
      if (dir === "right") S.navIdx = Math.min(5, S.navIdx + 1);
      else if (dir === "left") S.navIdx = Math.max(0, S.navIdx - 1);
      else if (dir === "down") S.zone = "chips";
    }
    lite();
  }

  function zap(d) {
    var all = S.shown.length ? S.shown : S.all; if (!all.length) return;
    var i = S.playing ? all.map(function (c) { return c.id; }).indexOf(S.playing.id) : S.idx;
    i = (i + d + all.length) % all.length; S.idx = i; play(all[i]);
  }

  function goNumber(buf) {
    var n = parseInt(buf, 10), f = S.all.filter(function (c) { return c.num === n; })[0];
    if (!f) return;
    S.tab = "live"; S.cat = "Todos"; S.query = ""; computeShown();
    S.idx = S.shown.indexOf(f); S.zone = "list"; play(f);
  }

  document.addEventListener("keydown", function (e) {
    if (S.modal) return modalKey(e);
    var k = e.key, kc = e.keyCode;
    if (/^[0-9]$/.test(k)) {
      numBuf += k; clearTimeout(numTimer);
      numTimer = setTimeout(function () { goNumber(numBuf); numBuf = ""; }, 1300);
      if (S.full) { var b = $("fsbanner"); b.innerHTML = numBuf; b.className = "show"; }
      return;
    }
    if (kc === 166 || k === "ChannelUp" || k === "PageUp") { e.preventDefault(); return zap(-1); }
    if (kc === 167 || k === "ChannelDown" || k === "PageDown") { e.preventDefault(); return zap(1); }
    if (k === "ContextMenu" || kc === 82 || k === "F2" || k === "*" || k === "Info") { e.preventDefault(); return toggleFav(cur()); }
    if (k === "Escape" || k === "Backspace" || k === "GoBack") { e.preventDefault(); return void window.onBack(); }
    var map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
    if (map[k]) { e.preventDefault(); return move(map[k]); }
    if (k === "Enter" || k === " ") {
      e.preventDefault(); if (e.repeat) return;
      if (S.full) { return; }
      if (S.zone === "list") {
        armed = true; pressFired = false;
        pressTimer = setTimeout(function () { pressFired = true; toggleFav(cur()); }, 700);
      } else activate();
    }
  });
  document.addEventListener("keyup", function (e) {
    if (S.modal) return;
    if (e.key === "Enter" || e.key === " ") {
      if (S.full) { setFull(false); return; }
      if (!armed) return; armed = false; clearTimeout(pressTimer);
      if (!pressFired) activate();
    }
  });

  /* botão voltar (chamado pelo Android) — true = consumido */
  window.onBack = function () {
    if (S.modal) { closeModal(); return true; }
    if (S.full) { setFull(false); return true; }
    if (S.zone !== "list") { S.zone = "list"; lite(); return true; }
    if (S.tab !== "live" || S.cat !== "Todos" || S.query) { S.tab = "live"; S.cat = "Todos"; S.query = ""; S.idx = 0; refresh(false); return true; }
    return false;
  };

  /* ---------------- start ---------------- */
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080), st = $("stage");
    st.style.transform = "scale(" + s + ")";
    st.style.left = (window.innerWidth - 1920 * s) / 2 + "px";
    st.style.top = (window.innerHeight - 1080 * s) / 2 + "px";
  }
  window.addEventListener("resize", fit); fit();
  renderClock(); setInterval(function () { renderClock(); renderEpg(); }, 30000);

  var saved = store("rt_m3u");
  setChannels(loadDemo());
  if (saved) {
    fetchText(saved, function (err, txt) {
      if (err) return;
      var l = parseM3U(txt);
      if (l.length) { S.playing = null; video.removeAttribute("src"); setChannels(l); }
    });
  }
})();
