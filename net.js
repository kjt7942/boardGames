/* 보드게임 공용 온라인 모듈
 * Firebase Realtime Database(REST + EventSource)만 사용 — 라이브러리 없음.
 * 사용: BGNet.open({game, title, sizes:[{np:2,label:"2명"}], onStart(ctx), onClose()})
 * ctx: {me, order, names, np, isHost, send(ev), onEvent, onLeft, leave(), finish()}
 */
(function () {
  "use strict";
  const DB = (window.BG_DB_URL || "").replace(/\/+$/, "");
  const NOW = () => Date.now();
  const rs = () => Math.random().toString(36).slice(2, 10);
  const pad = n => String(n).padStart(6, "0");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let uid;
  try { uid = localStorage.getItem("bg_uid"); if (!uid) { uid = rs(); localStorage.setItem("bg_uid", uid); } } catch (e) { uid = rs(); }
  const getName = () => { try { return localStorage.getItem("bg_name") || ""; } catch (e) { return ""; } };
  const setName = n => { try { localStorage.setItem("bg_name", n); } catch (e) {} };

  // ---------- Firebase REST ----------
  async function req(method, path, body, keep) {
    const r = await fetch(`${DB}/${path}.json`, {
      method, keepalive: !!keep,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }
  const put = (p, v) => req("PUT", p, v);
  const patch = (p, v) => req("PATCH", p, v);
  const del = (p, keep) => req("DELETE", p, undefined, keep);
  const get = p => req("GET", p);

  function setAt(root, path, data) {
    const ps = path.split("/").filter(Boolean);
    if (!ps.length) return data;
    let o = root && typeof root === "object" ? root : {}; const top = o;
    for (let i = 0; i < ps.length - 1; i++) { const k = ps[i]; if (!o[k] || typeof o[k] !== "object") o[k] = {}; o = o[k]; }
    const last = ps[ps.length - 1];
    if (data === null || data === undefined) delete o[last]; else o[last] = data;
    return top;
  }
  function listen(path, cb, onErr) {
    let cache = null, es = null, closed = false;
    es = new EventSource(`${DB}/${path}.json`);
    es.addEventListener("put", e => {
      if (closed) return;
      const m = JSON.parse(e.data); cache = setAt(cache, m.path, m.data); cb(cache);
    });
    es.addEventListener("patch", e => {
      if (closed) return;
      const m = JSON.parse(e.data), base = m.path === "/" ? "" : m.path;
      for (const k in m.data) cache = setAt(cache, base + "/" + k, m.data[k]);
      cb(cache);
    });
    es.onerror = () => { if (!closed && es.readyState === 2 && onErr) onErr(); };
    return { close() { closed = true; es.close(); } };
  }
  async function hash(s) {
    if (!s) return "";
    try {
      const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("bgp:" + s));
      return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("").slice(0, 24);
    } catch (e) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return "x" + h; }
  }

  // ---------- UI ----------
  const css = `
.bgn{position:fixed;inset:0;background:#090d1af0;z-index:100;display:flex;align-items:center;justify-content:center;padding:14px;font-family:system-ui,-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:#e8eeff}
.bgn.hide{display:none}
.bgc{background:#1b2747;border:2px solid #4d7cff;border-radius:18px;padding:16px;width:100%;max-width:440px;max-height:100%;overflow:auto}
.bgh{display:flex;align-items:center;justify-content:space-between;font-size:20px;margin-bottom:8px}
.bgn button{font:inherit;border:0;border-radius:12px;padding:11px 10px;background:#4d7cff;color:#fff;font-weight:700;cursor:pointer}
.bgn button:disabled{opacity:.35;cursor:default}
.bgn button.sec{background:#ffffff22}
.bgn .bgx{background:none;font-size:18px;padding:4px 8px}
.bgn input{font:inherit;width:100%;padding:11px;border-radius:10px;border:2px solid #ffffff30;background:#0d1530;color:#fff;margin:4px 0 8px}
.bglbl{font-size:13px;opacity:.75;margin:10px 0 4px}
.bgr{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#ffffff12;border-radius:12px;padding:10px 12px;margin-bottom:6px}
.bgr small{display:block;opacity:.7;font-size:12px;margin-top:2px}
.bgempty{opacity:.65;text-align:center;padding:18px 0;font-size:14px}
.bgrow{display:flex;gap:6px}.bgrow button{flex:1}
.bgrow button.on{background:#4d7cff}.bgrow button:not(.on){background:#ffffff1a}
.bgm{min-height:20px;margin-top:8px;font-size:13px;color:#ffb3b3;text-align:center}
.bgp{display:flex;align-items:center;justify-content:space-between;background:#ffffff12;border-radius:12px;padding:12px;margin-bottom:6px;font-size:16px}
.bgp.ok{background:#1f5a3a}
.bgcd{text-align:center;font-size:30px;font-weight:800;min-height:46px;margin:10px 0}
.bgcd.s{font-size:14px;font-weight:600;opacity:.8;padding-top:14px}
.bgbig{width:100%;padding:15px 10px;font-size:17px}
.bgg{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}
.bgg button{flex:0 0 auto;padding:9px 12px;font-size:14px;background:#ffffff1a}
.bgg button.on{background:#4d7cff}
.bgpick{font-size:15px;text-align:center;margin:6px 0 2px}
#bgFrame{position:fixed;inset:0;width:100%;height:100%;border:0;z-index:150;background:#090d1a}
`;
  let root = null, bodyEl = null, titleEl = null;
  function ensureUI() {
    if (root) return;
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    root = document.createElement("div"); root.className = "bgn hide"; root.id = "bgnet";
    root.innerHTML = `<div class="bgc"><div class="bgh"><b id="bgTitle"></b><button class="bgx" data-a="close">✕</button></div><div id="bgBody"></div></div>`;
    document.body.appendChild(root);
    bodyEl = root.querySelector("#bgBody"); titleEl = root.querySelector("#bgTitle");
    root.addEventListener("click", onClick);
  }
  const $ = id => root.querySelector(id);
  const msg = t => { const m = $("#bgMsg"); if (m) m.textContent = t || ""; };

  let O = null;              // open() 옵션
  let L = { rooms: [], stream: null, timer: null, pw: null };
  let R = null;              // 현재 방 상태
  let C = { np: 2 };

  function open(opts) {
    ensureUI(); O = opts; titleEl.textContent = "🌐 온라인 · " + opts.title;
    if (opts.hub) O.game = "*";
    root.classList.remove("hide");
    if (!DB) { bodyEl.innerHTML = `<div class="bgempty">온라인 서버가 아직 설정되지 않았어요.<br><br><small>firebase-config.js 에 Realtime Database 주소를 넣어 주세요.</small></div><button class="sec bgbig" data-a="close">닫기</button>`; return; }
    viewList();
  }
  function close() {
    stopLobby(); if (R) leaveRoom();
    if (root) root.classList.add("hide");
    if (O && O.onClose) O.onClose();
  }

  // ----- 방 목록 -----
  function viewList() {
    stopLobby();
    bodyEl.innerHTML = `
      <div class="bglbl">내 이름</div><input id="bgName" maxlength="10" placeholder="이름" value="${esc(getName())}">
      <button class="bgbig" data-a="create">➕ 방 만들기</button>
      <div id="bgPwBox" class="hide" style="display:none"><div class="bglbl" id="bgPwT"></div><input id="bgPw" type="password" placeholder="비밀번호"><div class="bgrow"><button data-a="pwok">입장</button><button class="sec" data-a="pwcancel">취소</button></div></div>
      <div class="bglbl">열려 있는 방</div><div id="bgRooms"></div><div class="bgm" id="bgMsg"></div>`;
    L.rooms = []; L.pw = null; renderRooms();
    try {
      L.stream = listen("lobby", d => {
        const now = NOW(); const all = Object.entries(d || {}).map(([id, r]) => ({ id, ...r }));
        all.forEach(r => { if (now - (r.hb || 0) > 120000) { del("lobby/" + r.id).catch(() => {}); del("rooms/" + r.id).catch(() => {}); } });
        L.rooms = all.filter(r => r.g === O.game && now - (r.hb || 0) < 30000).sort((a, b) => b.t - a.t);
        renderRooms();
      }, () => msg("서버에 연결할 수 없어요"));
    } catch (e) { msg("서버에 연결할 수 없어요"); }
  }
  function stopLobby() { if (L.stream) { L.stream.close(); L.stream = null; } }
  function renderRooms() {
    const el = $("#bgRooms"); if (!el) return;
    el.innerHTML = L.rooms.length ? L.rooms.map(r => {
      const full = r.count >= r.np;
      return `<div class="bgr"><div><b>${esc(r.name)}</b>${r.ph ? " 🔒" : ""}<small>${esc(r.host)} · ${r.count}/${r.np}명</small></div><button data-a="join" data-id="${r.id}"${full ? " disabled" : ""}>${full ? "가득" : "입장"}</button></div>`;
    }).join("") : `<div class="bgempty">열려 있는 방이 없어요.<br>방을 만들어 보세요!</div>`;
  }
  const cleanName = () => {
    const i = $("#bgName"); let n = ((i && i.value) || getName() || "").trim().slice(0, 10);
    if (!n) n = "플레이어" + Math.floor(10 + Math.random() * 90);
    setName(n); return n;
  };

  // ----- 방 만들기 -----
  function viewCreate() {
    stopLobby(); const name = cleanName(); C.np = O.sizes[0].np;
    bodyEl.innerHTML = `
      <div class="bglbl">방 이름</div><input id="bgRN" maxlength="16" value="${esc(name)}의 방">
      <div class="bglbl">인원</div><div class="bgrow" id="bgSz">${O.sizes.map((s, i) => `<button data-a="size" data-np="${s.np}" class="${i === 0 ? "on" : ""}">${esc(s.label)}</button>`).join("")}</div>
      <div class="bglbl">비밀번호 (비우면 누구나 입장)</div><input id="bgRP" maxlength="20" placeholder="선택 사항">
      <div class="bgrow" style="margin-top:6px"><button data-a="make">만들기</button><button class="sec" data-a="back">뒤로</button></div><div class="bgm" id="bgMsg"></div>`;
  }
  async function makeRoom() {
    const name = cleanName(), rn = ($("#bgRN").value.trim() || name + "의 방").slice(0, 16), pw = $("#bgRP").value;
    const id = rs().slice(0, 6), ph = pw ? await hash(id + ":" + pw) : "", t = NOW();
    try {
      await put("rooms/" + id, { np: C.np, g: O.game, host: uid, pick: O.hub ? (hubGames(C.np)[0] || {}).k || "" : null, players: { [uid]: { n: name, t, ready: false, hb: t } } });
      await put("lobby/" + id, { g: O.game, name: rn, host: name, np: C.np, ph, count: 1, hb: t, t });
      enterRoom(id, true, rn);
    } catch (e) { msg("서버에 연결할 수 없어요"); }
  }

  // ----- 입장 -----
  async function tryJoin(r, pw) {
    const name = cleanName();
    try {
      if (r.ph && (await hash(r.id + ":" + pw)) !== r.ph) { msg("비밀번호가 달라요"); return; }
      const np = await get(`rooms/${r.id}/np`);
      if (typeof np !== "number") { msg("방이 사라졌어요"); return; }
      const cur = (await get(`rooms/${r.id}/players`)) || {};
      if (!cur[uid] && Object.keys(cur).length >= np) { msg("방이 가득 찼어요"); return; }
      const t = NOW();
      await put(`rooms/${r.id}/players/${uid}`, { n: name, t, ready: false, hb: t });
      enterRoom(r.id, false, r.name);
    } catch (e) { msg("서버에 연결할 수 없어요"); }
  }

  // ----- 대기방 -----
  function enterRoom(id, isHost, rname) {
    stopLobby();
    R = { id, isHost, rname, next: 0, round: 0, lastRound: 0, seen: {}, started: false, joined: false, order: [], players: {}, room: null, cd: null, cdLeft: 0, lastCount: 0, ctx: null, left: {} };
    bodyEl.innerHTML = `<div id="bgRoom"></div><div class="bgm" id="bgMsg"></div>`;
    R.stream = listen("rooms/" + id, onRoom, () => backToList("서버 연결이 끊겼어요"));
    R.hb = setInterval(heartbeat, 4000);
    R.chk = setInterval(checkStale, 3000);
    window.addEventListener("pagehide", onHide);
  }
  const onHide = () => { if (R) leaveRoom(true); };
  function heartbeat() {
    if (!R) return;
    if (R.players[uid] || R.started) patch(`rooms/${R.id}/players/${uid}`, { hb: NOW() }).catch(() => {});
    if (R.isHost && (!R.started || O.hub)) patch(`lobby/${R.id}`, { hb: NOW() }).catch(() => {});
  }
  function checkStale() {
    if (!R) return;
    const now = NOW();
    const hostUid = R.room && R.room.host;
    for (const u in R.seen) {
      if (u === uid || now - R.seen[u].at < 15000) continue;
      if (R.started) { reportLeft(u); continue; }
      if (R.isHost) { del(`rooms/${R.id}/players/${u}`).catch(() => {}); delete R.seen[u]; }
      else if (u === hostUid) { backToList("방장 연결이 끊겼어요"); return; }
    }
  }
  function reportLeft(u) {
    if (!R.ctx || R.left[u]) return; R.left[u] = 1;
    const i = R.ctx.order.indexOf(u);
    if (i >= 0 && R.ctx.onLeft) R.ctx.onLeft(i, R.ctx.names[i]);
  }
  function sortedOrder(pl) { return Object.keys(pl).sort((a, b) => (pl[a].t - pl[b].t) || (a < b ? -1 : 1)); }

  function onRoom(room) {
    if (!R) return;
    R.room = room;
    if (!room || typeof room.np !== "number") {
      if (R.started) { R.ctx.order.forEach(u => { if (u !== uid) reportLeft(u); }); return; }
      if (R.joined || R.isHost) backToList("방이 닫혔어요");
      else { del(`rooms/${R.id}/players/${uid}`).catch(() => {}); backToList("방이 사라졌어요"); }
      return;
    }
    R.hostUid = room.host;
    const pl = room.players || {}; R.players = pl;
    for (const u in pl) { const h = pl[u].hb; if (!R.seen[u] || R.seen[u].hb !== h) R.seen[u] = { hb: h, at: NOW() }; }
    for (const u in R.seen) if (!pl[u]) delete R.seen[u];

    if (R.started) {            // 대국 중: 이벤트 전달 + 나감 감지
      const ev = room[R.round ? "ev" + R.round : "ev"] || {};
      for (;;) {
        const e = ev["e" + pad(R.next)]; if (!e) break;
        R.next++;
        if (e.s !== R.ctx.me) R.ctx._push(e.d);
      }
      R.ctx.order.forEach(u => { if (u !== uid && !pl[u]) reportLeft(u); });
      return;
    }
    if (room.play && (room.play.round || 1) > R.lastRound) { startGame(room); return; }
    if (pl[uid]) R.joined = true;
    else if (R.joined) { backToList("방에서 나가졌어요"); return; }
    const order = sortedOrder(pl);
    if (R.joined && order.indexOf(uid) >= room.np) { del(`rooms/${R.id}/players/${uid}`).catch(() => {}); backToList("방이 가득 찼어요"); return; }
    R.order = order;
    renderRoom();
    if (R.isHost && order.length !== R.lastCount) { R.lastCount = order.length; patch("lobby/" + R.id, { count: order.length }).catch(() => {}); }
    updateCountdown();
  }
  function renderRoom() {
    const el = $("#bgRoom"); if (!el || !R.room) return;
    const np = R.room.np, pl = R.players, me = pl[uid];
    let h = `<div style="font-size:15px;opacity:.8;margin-bottom:8px">${esc(R.rname || "")} · ${R.order.length}/${np}명</div>`;
    if (O.hub) h += pickHtml(np);
    for (let i = 0; i < np; i++) {
      const u = R.order[i], p = u && pl[u];
      h += p ? `<div class="bgp${p.ready ? " ok" : ""}"><span>${u === R.hostUid ? "👑 " : ""}${esc(p.n)}${u === uid ? " (나)" : ""}</span><span>${p.ready ? "✅ 준비" : "대기"}</span></div>`
        : `<div class="bgp" style="opacity:.45"><span>비어 있음</span><span>…</span></div>`;
    }
    h += `<div class="bgcd s" id="bgCd"></div>
      <button class="bgbig" data-a="ready"${me ? "" : " disabled"}>${me && me.ready ? "준비 해제" : "✋ 준비"}</button>
      <button class="sec bgbig" style="margin-top:8px" data-a="leave">나가기</button>`;
    el.innerHTML = h; showCd();
  }
  function showCd() {
    const el = $("#bgCd"); if (!el) return;
    if (R && R.cd) { el.className = "bgcd"; el.textContent = R.cdLeft > 0 ? R.cdLeft : "시작!"; }
    else { el.className = "bgcd s"; el.textContent = R && R.room && R.order.length < R.room.np ? "상대를 기다리는 중…" : "모두 준비하면 3초 뒤 시작해요"; }
  }
  const allReady = () => R.room && R.order.length === R.room.np && R.order.every(u => R.players[u] && R.players[u].ready);
  function updateCountdown() {
    const all = allReady();
    if (all && !R.cd) {
      R.cdLeft = 3; showCd();
      R.cd = setInterval(() => {
        R.cdLeft--; showCd();
        if (R.cdLeft <= 0) { clearInterval(R.cd); R.cd = null; if (R.isHost) hostStart(); }
      }, 1000);
    } else if (!all && R.cd) { clearInterval(R.cd); R.cd = null; showCd(); }
  }
  function hostStart() {
    if (!R || R.started || !allReady()) { if (R) { R.cd = null; updateCountdown(); } return; }
    const pick = O.hub ? currentPick() : "";
    if (O.hub && !pick) { R.cd = null; updateCountdown(); return; }
    const round = O.hub ? ((R.room.play && R.room.play.round) || 0) + 1 : 0;
    put(`rooms/${R.id}/play`, O.hub ? { order: R.order, t: NOW(), game: pick, round } : { order: R.order, t: NOW() }).catch(() => msg("시작하지 못했어요"));
    if (!O.hub) del("lobby/" + R.id).catch(() => {});
  }

  // ----- 게임 시작 -----
  function startGame(room) {
    if (R.cd) { clearInterval(R.cd); R.cd = null; }
    const order = room.play.order || [], pl = room.players || {};
    if (order.indexOf(uid) < 0) { backToList("게임에 참여하지 못했어요"); return; }
    R.started = true; R.round = O.hub ? (room.play.round || 1) : 0; R.lastRound = room.play.round || 1; R.next = 0;
    let _onEv = null; const _buf = [];
    const ctx = R.ctx = {
      me: order.indexOf(uid), order, np: order.length, isHost: R.isHost,
      names: order.map(u => (pl[u] && pl[u].n) || "?"),
      send(ev) { const k = "e" + pad(R.next++); put(`rooms/${R.id}/${R.round ? "ev" + R.round : "ev"}/${k}`, { s: ctx.me, d: ev }).catch(() => {}); },
      get onEvent() { return _onEv; },
      set onEvent(f) { _onEv = f; if (f) while (_buf.length) f(_buf.shift()); },
      _push(e) { if (_onEv) _onEv(e); else _buf.push(e); },
      onLeft: null,
      leave() { if (O.hub) hubReturn(); else leaveRoom(); },
      finish() { if (O.hub) return; const id = R && R.id; if (R && R.isHost) setTimeout(() => del("rooms/" + id).catch(() => {}), 30000); }
    };
    root.classList.add("hide");
    if (O.hub) launchHub(ctx, room.play.game); else O.onStart(ctx);
    onRoom(room); // 이미 쌓인 이벤트 처리
  }

  // ----- 허브(대기실): 방은 유지한 채 게임을 바꿔 가며 -----
  const hubGames = np => (O.games || []).filter(g => g.np.indexOf(np) >= 0);
  const currentPick = () => { const r = R && R.room; const list = hubGames(r.np); const p = r.pick; return list.some(g => g.k === p) ? p : (list[0] || {}).k || ""; };
  function pickHtml(np) {
    const list = hubGames(np), cur = currentPick();
    if (R.isHost) return `<div class="bglbl">할 게임 고르기</div><div class="bgg">${list.map(g => `<button data-a="pick" data-k="${g.k}" class="${g.k === cur ? "on" : ""}">${g.icon || ""} ${esc(g.name)}</button>`).join("")}</div>`;
    const g = list.find(x => x.k === cur);
    return `<div class="bgpick">🎮 방장이 고른 게임: <b>${g ? (g.icon || "") + " " + esc(g.name) : "-"}</b></div>`;
  }
  function launchHub(ctx, key) {
    const old = document.getElementById("bgFrame"); if (old) old.remove();
    window.__BGHUB = { ctx, back: hubReturn };
    const f = document.createElement("iframe"); f.id = "bgFrame"; f.setAttribute("allow", "fullscreen");
    f.src = `${key}/index.html?hub=1`; document.body.appendChild(f);
  }
  function hubReturn() {
    const f = document.getElementById("bgFrame"); if (f) f.remove();
    window.__BGHUB = null;
    if (!R) return;
    R.started = false; R.ctx = null; R.next = 0; R.left = {};
    if (R.players[uid]) patch(`rooms/${R.id}/players/${uid}`, { ready: false }).catch(() => {});
    root.classList.remove("hide");
    bodyEl.innerHTML = `<div id="bgRoom"></div><div class="bgm" id="bgMsg"></div>`;
    R.order = Object.keys(R.players || {}); if (R.room) { R.order = sortedOrder(R.players); renderRoom(); }
  }

  // ----- 나가기 -----
  function leaveRoom(keep) {
    const r = R; if (!r) return; R = null;
    clearInterval(r.hb); clearInterval(r.chk); if (r.cd) clearInterval(r.cd);
    window.removeEventListener("pagehide", onHide);
    if (r.stream) r.stream.close();
    const others = Object.keys(r.players || {}).filter(u => u !== uid).length;
    if (r.isHost && !r.started) { del("rooms/" + r.id, keep).catch(() => {}); del("lobby/" + r.id, keep).catch(() => {}); }
    else {
      del(`rooms/${r.id}/players/${uid}`, keep).catch(() => {});
      if (!others) del("rooms/" + r.id, keep).catch(() => {});
    }
  }
  function backToList(text) { if (R) leaveRoom(); viewList(); if (text) msg(text); }

  // ----- 클릭 처리 -----
  function onClick(e) {
    const b = e.target.closest("[data-a]"); if (!b) return;
    const a = b.dataset.a;
    if (a === "close") close();
    else if (a === "create") viewCreate();
    else if (a === "back") viewList();
    else if (a === "size") { C.np = +b.dataset.np; [...$("#bgSz").children].forEach(x => x.classList.toggle("on", x === b)); }
    else if (a === "make") makeRoom();
    else if (a === "join") {
      const r = L.rooms.find(x => x.id === b.dataset.id); if (!r) return;
      if (r.ph) { L.pw = r; const box = $("#bgPwBox"); box.style.display = ""; $("#bgPwT").textContent = "🔒 " + r.name + " — 비밀번호"; $("#bgPw").value = ""; $("#bgPw").focus(); }
      else tryJoin(r, "");
    }
    else if (a === "pwok") { if (L.pw) tryJoin(L.pw, $("#bgPw").value); }
    else if (a === "pwcancel") { L.pw = null; $("#bgPwBox").style.display = "none"; }
    else if (a === "pick") { if (R && R.isHost) patch(`rooms/${R.id}`, { pick: b.dataset.k }).catch(() => msg("서버에 연결할 수 없어요")); }
    else if (a === "ready") { if (R && R.players[uid]) patch(`rooms/${R.id}/players/${uid}`, { ready: !R.players[uid].ready }).catch(() => msg("서버에 연결할 수 없어요")); }
    else if (a === "leave") backToList();
  }

  window.BGNet = { configured: !!DB, open, close, uid };

  // ----- 허브 안(iframe)에서 열린 게임 페이지: 방 정보를 부모에서 받아 바로 온라인으로 시작 -----
  try {
    if (window.parent !== window && window.parent.__BGHUB) {
      const H = window.parent.__BGHUB;
      window.BGNet.configured = true;
      window.BGNet.open = opts => { opts.onStart(H.ctx); };
      window.addEventListener("load", () => {
        const q = s => document.querySelector(s);
        const on = q('#optMode button[data-v="online"]'); if (on) on.click();
        const mode = q("#optMode"); if (mode) { mode.style.display = "none"; if (mode.previousElementSibling) mode.previousElementSibling.style.display = "none"; }
        const note = q("#olNote"); if (note) note.style.display = "none";
        const start = q("#startBtn");
        if (start) { if (H.ctx.isHost) start.textContent = "▶ 시작하기"; else start.click(); }
        const hb = q("#homeBtn"); if (hb) { hb.style.display = ""; hb.onclick = () => H.back(); }
      });
    }
  } catch (e) {}
})();
