/* 바둑 엔진: 착수/따냄/패/계가 + 몬테카를로 트리 탐색 AI
 * 상태 S = {n, b:Int8Array(n*n) 0빈 1흑 2백, ko:-1, passes:0, caps:[0,0,0] (caps[c]=c가 따낸 돌 수)}
 */
(function (root) {
  "use strict";
  const NB = {};
  function nbOf(n) {
    if (NB[n]) return NB[n];
    const out = [];
    for (let i = 0; i < n * n; i++) {
      const r = (i / n) | 0, c = i % n, a = [];
      if (r > 0) a.push(i - n); if (r < n - 1) a.push(i + n); if (c > 0) a.push(i - 1); if (c < n - 1) a.push(i + 1);
      out.push(a);
    }
    return (NB[n] = out);
  }
  const newState = n => ({ n, b: new Int8Array(n * n), ko: -1, passes: 0, caps: [0, 0, 0] });
  const clone = S => ({ n: S.n, b: Int8Array.from(S.b), ko: S.ko, passes: S.passes, caps: S.caps.slice() });

  let stamp = new Int32Array(361), stampN = 0, stack = new Int32Array(361), grp = new Int32Array(361);
  function ensure(n) { if (stamp.length < n * n) { stamp = new Int32Array(n * n); stack = new Int32Array(n * n); grp = new Int32Array(n * n); } }
  // 그룹 수집: grp[0..size) 에 담고 {size, libs} 반환 (libs는 최대 2까지만 정확, 0/1/2+)
  let _size = 0, _libs = 0, _lib = -1;
  function collect(b, nb, start) {
    const color = b[start]; stampN++; let sp = 0, size = 0, libs = 0, libMark = -1;
    stack[sp++] = start; stamp[start] = stampN;
    while (sp) {
      const x = stack[--sp]; grp[size++] = x;
      const ns = nb[x];
      for (let k = 0; k < ns.length; k++) {
        const y = ns[k], v = b[y];
        if (v === 0) { if (stamp[y] !== -stampN) { stamp[y] = -stampN; libs++; _lib = y; } }   // 빈 점은 음수 스탬프로 구분
        else if (v === color && stamp[y] !== stampN) { stamp[y] = stampN; stack[sp++] = y; }
      }
    }
    _size = size; _libs = libs;
  }
  // 착수. 합법이면 S 변경 후 잡힌 돌 목록 반환, 불법이면 null
  function play(S, idx, color) {
    const n = S.n, b = S.b, nb = nbOf(n); ensure(n);
    if (idx < 0) { S.passes++; S.ko = -1; return []; }
    if (b[idx] !== 0 || idx === S.ko) return null;
    const opp = 3 - color; b[idx] = color;
    const captured = [];
    for (const y of nb[idx]) {
      if (b[y] === opp) {
        collect(b, nb, y);
        if (_libs === 0) { for (let k = 0; k < _size; k++) { captured.push(grp[k]); } for (let k = 0; k < _size; k++) b[captured[captured.length - _size + k]] = 0; }
      }
    }
    collect(b, nb, idx);
    if (_libs === 0) { b[idx] = 0; for (const x of captured) b[x] = opp; return null; }
    S.ko = (captured.length === 1 && _size === 1 && _libs === 1) ? captured[0] : -1;
    S.passes = 0; S.caps[color] += captured.length;
    return captured;
  }
  function isLegal(S, idx, color) { const T = clone(S); return play(T, idx, color) !== null; }

  function isEye(b, n, nb, idx, color) {
    const ns = nb[idx];
    for (let k = 0; k < ns.length; k++) if (b[ns[k]] !== color) return false;
    const r = (idx / n) | 0, c = idx % n; let bad = 0, onB = 0;
    for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const rr = r + dr, cc = c + dc; if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
      onB++; const v = b[rr * n + cc]; if (v !== 0 && v !== color) bad++;
    }
    return onB < 4 ? bad > 0 : bad >= 2;
  }

  // 영역 점수(스톤+집), 죽은 돌 제거 포함. 반환 {black, white, terr:Int8Array(0중립 1흑 2백)}
  function territory(S, dead) {
    const n = S.n, nb = nbOf(n), b = Int8Array.from(S.b);
    if (dead) for (const i of dead) b[i] = 0;
    const own = new Int8Array(n * n), seen = new Uint8Array(n * n);
    let tb = 0, tw = 0, sb = 0, sw = 0;
    for (let i = 0; i < n * n; i++) {
      if (b[i] === 1) { sb++; own[i] = 1; } else if (b[i] === 2) { sw++; own[i] = 2; }
      else if (!seen[i]) {
        const cells = [i], st = [i]; seen[i] = 1; let touchB = false, touchW = false;
        while (st.length) { const x = st.pop(); for (const y of nb[x]) { if (b[y] === 1) touchB = true; else if (b[y] === 2) touchW = true; else if (!seen[y]) { seen[y] = 1; st.push(y); cells.push(y); } } }
        const o = touchB && !touchW ? 1 : touchW && !touchB ? 2 : 0;
        for (const x of cells) own[x] = o;
        if (o === 1) tb += cells.length; else if (o === 2) tw += cells.length;
      }
    }
    return { terr: own, tb, tw, sb, sw };
  }
  // 한국식 계가: 집 + 잡은 돌(사석 포함), 백 덤
  function scoreKorean(S, dead, komi) {
    const t = territory(S, dead);
    let deadB = 0, deadW = 0;
    if (dead) for (const i of dead) { if (S.b[i] === 1) deadB++; else deadW++; }
    const black = t.tb + S.caps[1] + deadW, white = t.tw + S.caps[2] + deadB + komi;
    return { black, white, tb: t.tb, tw: t.tw, capB: S.caps[1] + deadW, capW: S.caps[2] + deadB, komi, terr: t.terr };
  }
  const areaWinner = (S, komi) => { const t = territory(S); return t.sb + t.tb > t.sw + t.tw + komi ? 1 : 2; };

  // ---- 플레이아웃 ----
  function playout(S, toPlay, komi, maxMoves) {
    const n = S.n, nb = nbOf(n), N = n * n, b = S.b;
    let color = toPlay, moves = 0, passes = S.passes, last = -1;
    while (passes < 2 && moves < maxMoves) {
      let moved = false;
      if (last >= 0 && Math.random() < 0.85) {
        const h = atariMove(S, nb, last, color);
        if (h >= 0 && play(S, h, color) !== null) { moved = true; last = h; }
      }
      const start = (Math.random() * N) | 0;
      for (let t = 0; !moved && t < N; t++) {
        const idx = (start + t) % N;
        if (b[idx] !== 0 || idx === S.ko) continue;
        if (isEye(b, n, nb, idx, color)) continue;
        if (play(S, idx, color) !== null) { moved = true; last = idx; break; }
      }
      if (moved) passes = 0; else { passes++; S.ko = -1; last = -1; }
      color = 3 - color; moves++;
    }
    return areaWinner(S, komi);
  }

  // ---- MCTS ----
  function Node(parent, move, color) { this.parent = parent; this.move = move; this.color = color; this.kids = []; this.untried = null; this.w = 0; this.n = 0; }
  // 직전 수 주변: 상대 돌 단수면 따내기, 내 돌 단수면 늘려서 살리기
  function atariMove(S, nb, last, color) {
    const b = S.b, opp = 3 - color; let save = -1;
    for (const y of nb[last]) {
      if (b[y] === 0) continue;
      collect(b, nb, y);
      if (_libs === 1) { if (b[y] === opp) return _lib; save = _lib; }
    }
    return save;
  }
  // 둘 만한 곳만: 돌 근처(거리2), 가장자리 줄은 돌과 맞닿을 때만
  function candidates(S, color) {
    const n = S.n, nb = nbOf(n), N = n * n, b = S.b, out = [], near2 = new Uint8Array(N), near1 = new Uint8Array(N);
    let stones = 0;
    for (let i = 0; i < N; i++) if (b[i]) {
      stones++; const r = (i / n) | 0, c = i % n;
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
        const rr = r + dr, cc = c + dc; if (rr < 0 || rr >= n || cc < 0 || cc >= n) continue;
        near2[rr * n + cc] = 1; if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) near1[rr * n + cc] = 1;
      }
    }
    for (let i = 0; i < N; i++) {
      if (b[i] !== 0 || i === S.ko || isEye(b, n, nb, i, color)) continue;
      const r = (i / n) | 0, c = i % n, edge = r === 0 || c === 0 || r === n - 1 || c === n - 1;
      if (edge && !near1[i]) continue;
      if (stones >= 2 ? !near2[i] : (r < 2 || c < 2 || r > n - 3 || c > n - 3)) continue;
      out.push(i);
    }
    if (!out.length) for (let i = 0; i < N; i++) if (b[i] === 0 && i !== S.ko && !isEye(b, n, nb, i, color)) out.push(i);
    for (let i = out.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  }
  const CFG = {
    easy:   { noise: 16,  ms: 0 },
    normal: { noise: 1.2, ms: 0 },
    hard:   { noise: 0.2, ms: 0, look: 8 }
  };
  function komiFor(n) { return n === 9 ? 7 : 7.5; }

  // 세력 추정: 두 색 돌에서의 거리 비교로 칸 소유자 계산 → (내 칸 - 상대 칸)
  let dA = new Int16Array(361), dB2 = new Int16Array(361), qq = new Int16Array(361);
  function dist(b, nb, color, out) {
    const N = b.length; let h = 0, t = 0; out.fill(999, 0, N);
    for (let i = 0; i < N; i++) if (b[i] === color) { out[i] = 0; qq[t++] = i; }
    while (h < t) { const x = qq[h++], d = out[x] + 1; for (const y of nb[x]) if (out[y] > d) { out[y] = d; qq[t++] = y; } }
  }
  function influence(b, n, color) {
    const nb = nbOf(n), N = n * n; dist(b, nb, color, dA); dist(b, nb, 3 - color, dB2);
    let me = 0, op = 0;
    for (let i = 0; i < N; i++) { if (dA[i] < dB2[i]) me++; else if (dB2[i] < dA[i]) op++; }
    return me - op;
  }
  // 모든 후보의 휴리스틱 점수. 반환 [{idx, h}] 내림차순
  function scoreMoves(S, color, lim) {
    const n = S.n, nb = nbOf(n), N = n * n, opp = 3 - color, out = [];
    const base = influence(S.b, n, color);
    const libsBefore = new Int16Array(N);               // 내 돌 그룹이 단수였는지
    for (let i = 0; i < N; i++) if (S.b[i] === color) { collect(S.b, nb, i); libsBefore[i] = _libs; }
    let cl = candidates(S, color); if (lim && cl.length > lim) cl = cl.slice(0, lim);
    for (const idx of cl) {
      const T = clone(S), cap = play(T, idx, color); if (!cap) continue;
      let h = cap.length * 9;
      collect(T.b, nb, idx);
      if (_libs === 1) h -= 10 + 2 * _size; else if (_libs === 2) h -= 1; else h += 0.5;
      const seen = new Set();
      for (const y of nb[idx]) {
        if (T.b[y] === opp && !seen.has(y)) {
          collect(T.b, nb, y); for (let k = 0; k < _size; k++) seen.add(grp[k]);
          if (_libs === 1) h += 5 + _size;
        } else if (T.b[y] === color && !seen.has(y)) {
          const wasAtari = libsBefore[y] === 1;
          collect(T.b, nb, y); for (let k = 0; k < _size; k++) seen.add(grp[k]);
          if (wasAtari && _libs > 1) h += 7 * _size;
        }
      }
      h += influence(T.b, n, color) - base;
      const r = (idx / n) | 0, c = idx % n, e = Math.min(r, c, n - 1 - r, n - 1 - c);
      if (e === 0) h -= 3; else if (e === 1) h -= 0.3;
      out.push({ idx, h });
    }
    out.sort((a, b) => b.h - a.h); return out;
  }
  // 현재 형세(내 기준 집 차이, 덤 포함 시 + 이면 내가 유리)
  function lead(S, color) {
    const k = komiFor(S.n), v = influence(S.b, S.n, color);
    return color === 1 ? v - k : v + k;
  }
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;
  // 비동기: 한 수 선택. 반환 {move: idx 또는 -1(패스), win}
  async function think(S0, color, lv, scale) {
    const cfg = CFG[lv] || CFG.normal, n = S0.n, N = n * n, komi = komiFor(n);
    const list = scoreMoves(S0, color);
    let stones = 0; for (let i = 0; i < N; i++) if (S0.b[i]) stones++;
    if (!list.length) return { move: -1, win: 0.5 };
    const best = list[0].h, winning = lead(S0, color) > 0;
    if (stones > N * 0.12 && best < 1.2) return { move: -1, win: 0.5 };
    if (S0.passes >= 1 && winning && best < 4) return { move: -1, win: 0.5 };
    let pool = list.slice(0, cfg.k || 12);
    if (cfg.look) {                       // 2수 읽기: 내 점수 - 상대 최선 응수 점수
      pool = list.slice(0, n <= 9 ? cfg.look : 5); let lastYield = Date.now();
      for (const c of pool) {
        const T = clone(S0); play(T, c.idx, color);
        const reply = scoreMoves(T, 3 - color, 36);
        c.v = c.h - 0.85 * (reply.length ? Math.max(0, reply[0].h) : 0);
        if (Date.now() - lastYield > 40) { await new Promise(r => setTimeout(r, 0)); lastYield = Date.now(); }
      }
    } else for (const c of pool) c.v = c.h;
    for (const c of pool) c.v += gauss() * cfg.noise;
    pool.sort((a, b) => b.v - a.v);
    const pick = pool[0];
    return { move: pick.idx, win: pick.n ? pick.w / pick.n : 0.5 };
  }

  // 종국 후 자동 사석 제안: 무작위 끝까지 두기를 여러 번 해서 소유권을 추정
  function suggestDead(S, runs) {
    const n = S.n, N = n * n, komi = 7, cnt = new Float32Array(N); runs = runs || 120;
    for (let r = 0; r < runs; r++) {
      const T = clone(S); T.passes = 0; playout(T, 1, komi, N * 2);
      const t = territory(T);
      for (let i = 0; i < N; i++) { if (t.terr[i] === 1) cnt[i] += 1; else if (t.terr[i] === 2) cnt[i] -= 1; }
    }
    const dead = [];
    for (let i = 0; i < N; i++) {
      const v = S.b[i]; if (!v) continue;
      const own = cnt[i] / runs;          // +1 흑, -1 백
      if ((v === 1 && own < -0.6) || (v === 2 && own > 0.6)) dead.push(i);
    }
    return dead;
  }
  // 죽은 돌의 연결 그룹 전체 반환
  function groupOf(S, idx) {
    const nb = nbOf(S.n), b = S.b, color = b[idx], seen = new Set([idx]), st = [idx];
    while (st.length) { const x = st.pop(); for (const y of nb[x]) if (b[y] === color && !seen.has(y)) { seen.add(y); st.push(y); } }
    return [...seen];
  }

  const api = { newState, clone, play, isLegal, isEye, territory, scoreKorean, think, suggestDead, groupOf, komiFor, nbOf, CFG };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Baduk = api;
})(typeof window !== "undefined" ? window : globalThis);
