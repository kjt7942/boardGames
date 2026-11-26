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
  const NB = ((document.currentScript && document.currentScript.src) || location.href).replace(/net\.js.*$/, "");
  const TH = { "magic-labyrinth": "th_maze", baduk: "th_baduk", chess: "th_chess", janggi: "janggi", onecard: "th_cards", thief: "th_cards", blackjack: "th_cards" };
  const GI = { "magic-labyrinth": ["🧙", "마법의 미로", "#9d7cff"], "wall-go": ["🧱", "벽바둑", "#4dabff"], janggi: ["♟️", "장기", "#2fbf71"], baduk: ["⚫", "바둑", "#e0b84d"], omok: ["⚪", "오목", "#ff8a5c"], chess: ["♞", "체스", "#c9a14a"], onecard: ["🃏", "원카드", "#e0453a"], thief: ["🦹", "도둑잡기", "#8e5cf0"], blackjack: ["♠️", "블랙잭", "#2fbf71"], minhwatu: ["🎴", "민화투", "#d8283b"], matgo: ["🌸", "맞고", "#e0453a"], codebreak: ["🔐", "코드 추리", "#5ab0ff"], memory: ["🐾", "짝 맞추기", "#ff8a5c"] };
  const thumb = k => TH[k] ? `<img class="bgth" src="${NB}img/${TH[k]}.webp" alt="">` : `<span class="bgth" style="--c:${(GI[k] || [, , "#7c3aed"])[2]}">${(GI[k] || ["🎲"])[0]}</span>`;
  const css = `
.bgn{position:fixed;inset:0;background:#12063ae6;backdrop-filter:blur(6px);z-index:100;display:flex;align-items:center;justify-content:center;padding:12px;font-family:system-ui,-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:#f3efff}
.bgn.hide{display:none}
.bgc{position:relative;background:linear-gradient(180deg,#5d2fd0 0%,#3d1a9c 26%,#2b0f78 100%);border:4px solid #9a6bff;border-radius:28px;box-shadow:0 0 0 3px #3b0f8c,0 0 40px #8b5cf688,0 20px 50px #000a;width:100%;max-width:460px;max-height:100%;overflow:auto;padding:0 0 12px}
.bgh{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:8px;padding:10px 12px;background:linear-gradient(180deg,#7a45ff,#5527d4);border-bottom:3px solid #9a6bff;box-shadow:0 6px 14px #0004}
.bgic{width:46px;height:46px;flex:none;border-radius:50%;display:grid;place-items:center;font-size:26px;background:radial-gradient(circle at 35% 30%,#fff6,transparent 55%),linear-gradient(160deg,#4fb3ff,#2a5fe0);border:3px solid #fff;box-shadow:0 3px 0 #1d3f99}
#bgTitle{flex:1;text-align:center;font:400 clamp(24px,7vw,32px)/1.05 "Jua",system-ui,sans-serif;color:#fff;text-shadow:0 3px 0 #3b0f8c,0 0 14px #b27bff}
#bgTitle em{font-style:normal;color:#ffd84d;text-shadow:0 3px 0 #b86b00,0 0 14px #ffb800}
#bgBody{padding:0 12px}
.bgn button{font:inherit;border:0;border-radius:14px;padding:11px 10px;background:linear-gradient(180deg,#b27bff,#7c3aed 60%,#6a2bd9);color:#fff;font-weight:800;cursor:pointer;box-shadow:inset 0 2px 0 #ffffff55,0 4px 0 #4c1d95,0 6px 12px #0005;text-shadow:0 1px 0 #0004}
.bgn button:active:not(:disabled){transform:translateY(3px);box-shadow:inset 0 2px 0 #ffffff55,0 1px 0 #4c1d95}
.bgn button:disabled{opacity:.4;cursor:default}
.bgn button.sec{background:linear-gradient(180deg,#ffffff2a,#ffffff10);box-shadow:inset 0 1px 0 #ffffff33,0 3px 0 #0004}
.bgn .bgx{width:44px;height:44px;flex:none;border-radius:50%;padding:0;font-size:20px;border:3px solid #fff;background:linear-gradient(160deg,#9b6bff,#5b21b6)}
.bgn input{font:inherit;width:100%;padding:11px 14px;border-radius:14px;border:2px solid #ffffff30;background:#1c0b4acc;color:#fff;margin:4px 0 8px;outline:none}
.bgn input:focus{border-color:#ffd84d}
.bgban{display:block;width:100%;aspect-ratio:860/370;object-fit:cover;border-radius:20px;margin:12px 0 4px;border:3px solid #ffffff55;box-shadow:0 8px 20px #0006}
.bgsh{display:flex;align-items:center;gap:8px;margin:14px 2px 8px;font:400 21px "Jua",system-ui,sans-serif;color:#fff}
.bglbl{font-size:13px;color:#cfc3ff;margin:10px 2px 4px;font-weight:700}
.bgme{display:flex;gap:8px;align-items:center}.bgme input{margin:0;flex:1}.bgme button{flex:none;padding:12px 14px}
.bgr{display:flex;align-items:center;gap:10px;background:#1c0b4a99;border-radius:18px;padding:8px;margin-bottom:8px;box-shadow:inset 0 0 0 1px #ffffff1a,0 4px 12px #0004;animation:bgIn .35s ease-out}
@keyframes bgIn{from{transform:translateY(8px);opacity:0}}
.bgth{flex:none;width:74px;height:52px;border-radius:12px;object-fit:cover;border:2px solid #ffffff55;display:grid;place-items:center;font-size:30px;background:linear-gradient(150deg,color-mix(in srgb,var(--c) 55%,#fff),var(--c))}
.bgri{flex:1;min-width:0}
.bgri b{display:block;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bgri small{display:flex;align-items:center;gap:6px;margin-top:4px;font-size:13px;color:#d7ccff;flex-wrap:wrap}
.bgtag{font-size:11.5px;font-weight:800;border-radius:999px;padding:2px 9px;background:#2fbf71;color:#fff}
.bgtag.lk{background:#e0453a}.bgtag.gm{background:#3d5bff}
.bgr button{flex:none;padding:10px 14px;border-radius:14px;font-size:15px}
.bgempty{text-align:center;padding:18px 0;font-size:14px;color:#cfc3ff}
.bgrow{display:flex;gap:6px}.bgrow button{flex:1}
.bgrow button.on{background:linear-gradient(180deg,#b27bff,#7c3aed)}.bgrow button:not(.on){background:#ffffff14;box-shadow:inset 0 0 0 1px #ffffff1f}
.bgm{min-height:20px;margin-top:8px;font-size:13px;color:#ffb3b3;text-align:center}
.bgp{display:flex;align-items:center;justify-content:space-between;background:#1c0b4a99;border-radius:16px;padding:12px 14px;margin-bottom:6px;font-size:16px;box-shadow:inset 0 0 0 1px #ffffff1a}
.bgp.ok{background:linear-gradient(90deg,#1f7a4acc,#1c0b4a99);box-shadow:inset 0 0 0 2px #5ee08a}
.bgcd{text-align:center;font:400 34px "Jua",system-ui,sans-serif;min-height:46px;margin:10px 0;color:#ffd84d;text-shadow:0 3px 0 #a86200}
.bgcd.s{font:600 14px system-ui,sans-serif;color:#cfc3ff;padding-top:14px;text-shadow:none}
.bgbig{display:block;width:100%;padding:15px 10px;font:400 22px "Jua",system-ui,sans-serif!important;border-radius:999px!important}
.bgrf{margin:8px auto 0;width:78%!important}
.bgg{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.bgg button{flex:0 0 auto;padding:9px 12px;font-size:14px;background:#ffffff14;box-shadow:inset 0 0 0 1px #ffffff1f}
.bgg button.on{background:linear-gradient(180deg,#b27bff,#7c3aed);box-shadow:inset 0 2px 0 #ffffff55,0 3px 0 #4c1d95}
.bgpick{font-size:15px;text-align:center;margin:6px 0 8px;padding:10px;border-radius:14px;background:#1c0b4a99}
.bgst{display:flex;align-items:center;gap:10px;margin:12px 0 0;padding:10px 14px;border-radius:16px;background:#12063acc;box-shadow:inset 0 0 0 1px #ffffff1a;font-size:13px;color:#cfc3ff}
.bgst .on{color:#5ee08a;font-weight:800}.bgst .off{color:#ff8a8a;font-weight:800}.bgst i{opacity:.4;font-style:normal}
#bgBack{position:fixed;left:6px;top:6px;z-index:200;border:2px solid #fff;border-radius:18px;padding:7px 12px;font:700 13px system-ui,sans-serif;background:linear-gradient(160deg,#9b6bff,#5b21b6);color:#fff;cursor:pointer;box-shadow:0 3px 0 #3b0f8c}
#bgFrame{position:fixed;inset:0;width:100%;height:100%;border:0;z-index:150;background:#160a3d}
`;
  let root = null, bodyEl = null, titleEl = null;
  function ensureUI() {
    if (root) return;
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    if (!document.querySelector('link[href*="family=Jua"]')) { const fl = document.createElement("link"); fl.rel = "stylesheet"; fl.href = "https://fonts.googleapis.com/css2?family=Jua&display=swap"; document.head.appendChild(fl); }
    root = document.createElement("div"); root.className = "bgn hide"; root.id = "bgnet";
    root.innerHTML = `<div class="bgc"><div class="bgh"><span class="bgic">🌐</span><b id="bgTitle"></b><button class="bgx" data-a="close">✕</button></div><div id="bgBody"></div></div>`;
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
    ensureUI(); O = opts; titleEl.innerHTML = "온라인·<em>" + esc(opts.hub ? "대기실" : opts.title) + "</em>";
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
    bodyEl.innerHTML = `<img class="bgban" src="${NB}img/ban_lobby.webp" alt="지금, 다른 유저들과 함께해요!">
      <div class="bglbl">내 이름</div><div class="bgme"><input id="bgName" maxlength="10" placeholder="이름" value="${esc(getName())}"><button data-a="create">➕ 방 만들기</button></div>
      <div id="bgPwBox" class="hide" style="display:none"><div class="bglbl" id="bgPwT"></div><input id="bgPw" type="password" placeholder="비밀번호"><div class="bgrow"><button data-a="pwok">입장</button><button class="sec" data-a="pwcancel">취소</button></div></div>
      <div class="bgsh">👥 대기 중인 방 목록</div><div id="bgRooms"></div><div class="bgm" id="bgMsg"></div>
      <button class="bgbig bgrf" data-a="refresh">🔄 새로고침</button>
      <div class="bgst" id="bgSt"><span class="on">📶 온라인 접속 중</span><i>|</i><span id="bgCnt">열린 방 0개</span></div>`;
    L.rooms = []; L.pw = null; renderRooms();
    try {
      L.stream = listen("lobby", d => {
        const now = NOW(); const all = Object.entries(d || {}).map(([id, r]) => ({ id, ...r }));
        all.forEach(r => { if (now - (r.hb || 0) > 120000) { del("lobby/" + r.id).catch(() => {}); del("rooms/" + r.id).catch(() => {}); } });
        L.rooms = all.filter(r => r.g === O.game && now - (r.hb || 0) < 30000).sort((a, b) => b.t - a.t);
        renderRooms();
      }, () => { msg("서버에 연결할 수 없어요"); const s = $("#bgSt"); if (s) s.firstElementChild.outerHTML = '<span class="off">📵 연결 안 됨</span>'; });
    } catch (e) { msg("서버에 연결할 수 없어요"); }
  }
  function stopLobby() { if (L.stream) { L.stream.close(); L.stream = null; } }
  function renderRooms() {
    const el = $("#bgRooms"); if (!el) return;
    el.innerHTML = L.rooms.length ? L.rooms.map(r => {
      const full = r.count >= r.np, gk = O.hub ? r.pk : O.game, gi = GI[gk];
      return `<div class="bgr">${thumb(gk)}<div class="bgri"><b>${esc(r.name)}</b><small>👥 ${r.count} / ${r.np}명 ${r.ph ? '<span class="bgtag lk">🔒 비밀방</span>' : '<span class="bgtag">일반</span>'}${O.hub && gi ? `<span class="bgtag gm">${gi[1]}</span>` : ""}</small></div><button data-a="join" data-id="${r.id}"${full ? " disabled" : ""}>${full ? "가득" : "▶ 참여하기"}</button></div>`;
    }).join("") : `<div class="bgempty">열려 있는 방이 없어요.<br>방을 만들어 친구를 불러 보세요! 🎲</div>`;
    const c = $("#bgCnt"); if (c) c.textContent = `열린 방 ${L.rooms.length}개`;
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
      await put("lobby/" + id, { g: O.game, name: rn, host: name, np: C.np, ph, count: 1, hb: t, t, pk: O.hub ? (hubGames(C.np)[0] || {}).k || "" : "" });
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

    if (O.hub && R.started && room.play && (room.play.round || 1) > R.lastRound) { startGame(room); return; }
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
    let h = `<div style="font-size:15px;opacity:.85;margin:12px 2px 8px;font-weight:700">${esc(R.rname || "")} · ${R.order.length}/${np}명</div>`;
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
    rmFrame();
    window.__BGHUB = { ctx, back: hubReturn };
    const f = document.createElement("iframe"); f.id = "bgFrame"; f.setAttribute("allow", "fullscreen");
    f.src = `${key}/index.html?hub=1`; document.body.appendChild(f);
    // 어떤 게임 화면이든 항상 보이는 '대기실로' 버튼 (게임이 끝났을 때 갇히지 않도록)
    const b = document.createElement("button"); b.id = "bgBack"; b.textContent = "🚪 대기실로"; b.onclick = hubReturn; document.body.appendChild(b);
  }
  function rmFrame() { ["bgFrame", "bgBack"].forEach(i => { const e = document.getElementById(i); if (e) e.remove(); }); }
  function hubReturn() {
    rmFrame();
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
    rmFrame(); window.__BGHUB = null;
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
    else if (a === "pick") { if (R && R.isHost) { patch(`rooms/${R.id}`, { pick: b.dataset.k }).catch(() => msg("서버에 연결할 수 없어요")); patch("lobby/" + R.id, { pk: b.dataset.k }).catch(() => {}); } }
    else if (a === "refresh") { viewList(); }
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
