/* 체스 엔진: 규칙(캐슬링·앙파상·프로모션) + 알파-베타 AI
 * 보드 Int8Array(64), 인덱스 r*8+c (r=0이 8랭크, 백은 아래쪽). 백 +1..6, 흑 -1..-6 (P N B R Q K)
 * 수 = from | to<<6 | promo<<12 (promo: 2 N,3 B,4 R,5 Q)
 */
(function (root) {
  "use strict";
  const P = 1, N = 2, Bi = 3, R = 4, Q = 5, K = 6;
  const VAL = [0, 100, 320, 330, 500, 900, 20000];
  const KN = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  const KG = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  const DB = [[-1,-1],[-1,1],[1,-1],[1,1]], DR = [[-1,0],[1,0],[0,-1],[0,1]];
  // 위치 점수(백 기준, r=0이 8랭크)
  const PST = {
    1: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
    2: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
    3: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
    4: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
    5: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
    6: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20]
  };
  const PSTK_END = [-50,-30,-30,-30,-30,-30,-30,-50, -30,-20,-10,-10,-10,-10,-20,-30, -30,-10,20,30,30,20,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,20,30,30,20,-10,-30, -30,-30,0,0,0,0,-30,-30, -50,-30,-30,-30,-30,-30,-30,-50];

  function initial() {
    const b = new Int8Array(64), back = [R, N, Bi, Q, K, Bi, N, R];
    for (let c = 0; c < 8; c++) { b[c] = -back[c]; b[8 + c] = -P; b[48 + c] = P; b[56 + c] = back[c]; }
    return { b, side: 1, castle: 15, ep: -1, half: 0, full: 1, undo: [], keys: [] };
  }
  const clone = S => ({ b: Int8Array.from(S.b), side: S.side, castle: S.castle, ep: S.ep, half: S.half, full: S.full, undo: [], keys: S.keys.slice() });

  function attacked(b, sq, by) {      // by: +1/-1 색이 sq를 공격하는가
    const r = sq >> 3, c = sq & 7;
    const pr = r + (by === 1 ? 1 : -1);
    if (pr >= 0 && pr < 8) { if (c > 0 && b[pr * 8 + c - 1] === by * P) return true; if (c < 7 && b[pr * 8 + c + 1] === by * P) return true; }
    for (const [dr, dc] of KN) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === by * N) return true; }
    for (const [dr, dc] of KG) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === by * K) return true; }
    for (const [dr, dc] of DB) { let rr = r + dr, cc = c + dc; while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { const v = b[rr * 8 + cc]; if (v) { if (v === by * Bi || v === by * Q) return true; break; } rr += dr; cc += dc; } }
    for (const [dr, dc] of DR) { let rr = r + dr, cc = c + dc; while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { const v = b[rr * 8 + cc]; if (v) { if (v === by * R || v === by * Q) return true; break; } rr += dr; cc += dc; } }
    return false;
  }
  function kingSq(b, side) { for (let i = 0; i < 64; i++) if (b[i] === side * K) return i; return -1; }
  const inCheck = (S, side) => { side = side || S.side; const k = kingSq(S.b, side); return k >= 0 && attacked(S.b, k, -side); };

  function pseudo(S, capsOnly) {
    const b = S.b, side = S.side, out = [];
    for (let i = 0; i < 64; i++) {
      const v = b[i]; if (!v || (v > 0) !== (side > 0)) continue;
      const t = Math.abs(v), r = i >> 3, c = i & 7;
      if (t === P) {
        const dir = -side, start = side === 1 ? 6 : 1, last = side === 1 ? 0 : 7, r1 = r + dir;
        if (r1 < 0 || r1 > 7) continue;
        const add = (to) => { if ((to >> 3) === last) { for (const pr of [5, 4, 3, 2]) out.push(i | to << 6 | pr << 12); } else out.push(i | to << 6); };
        if (!b[r1 * 8 + c] && (!capsOnly || r1 === last)) { add(r1 * 8 + c); if (!capsOnly && r === start && !b[(r + 2 * dir) * 8 + c]) out.push(i | (r + 2 * dir) * 8 + c << 6); }
        for (const dc of [-1, 1]) {
          const cc = c + dc; if (cc < 0 || cc > 7) continue; const to = r1 * 8 + cc, tv = b[to];
          if ((tv && (tv > 0) !== (side > 0)) || to === S.ep) add(to);
        }
      } else if (t === N || t === K) {
        for (const [dr, dc] of (t === N ? KN : KG)) {
          const rr = r + dr, cc = c + dc; if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
          const to = rr * 8 + cc, tv = b[to]; if (tv && (tv > 0) === (side > 0)) continue;
          if (capsOnly && !tv) continue; out.push(i | to << 6);
        }
        if (t === K && !capsOnly) {          // 캐슬링
          const row = side === 1 ? 7 : 0, ks = side === 1 ? 1 : 4, qs = side === 1 ? 2 : 8;
          if (i === row * 8 + 4 && !attacked(b, i, -side)) {
            if ((S.castle & ks) && !b[row * 8 + 5] && !b[row * 8 + 6] && b[row * 8 + 7] === side * R && !attacked(b, row * 8 + 5, -side) && !attacked(b, row * 8 + 6, -side)) out.push(i | (row * 8 + 6) << 6);
            if ((S.castle & qs) && !b[row * 8 + 3] && !b[row * 8 + 2] && !b[row * 8 + 1] && b[row * 8] === side * R && !attacked(b, row * 8 + 3, -side) && !attacked(b, row * 8 + 2, -side)) out.push(i | (row * 8 + 2) << 6);
          }
        }
      } else {
        const dirs = t === Bi ? DB : t === R ? DR : DB.concat(DR);
        for (const [dr, dc] of dirs) {
          let rr = r + dr, cc = c + dc;
          while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) {
            const to = rr * 8 + cc, tv = b[to];
            if (tv) { if ((tv > 0) !== (side > 0)) out.push(i | to << 6); break; }
            if (!capsOnly) out.push(i | to << 6); rr += dr; cc += dc;
          }
        }
      }
    }
    return out;
  }
  function make(S, m) {
    const b = S.b, from = m & 63, to = (m >> 6) & 63, promo = m >> 12, v = b[from], t = Math.abs(v), side = S.side;
    const u = { m, cap: b[to], capSq: to, castle: S.castle, ep: S.ep, half: S.half, rook: null };
    b[to] = v; b[from] = 0;
    if (t === P && to === S.ep && !u.cap && (from & 7) !== (to & 7)) { u.capSq = to + (side === 1 ? 8 : -8); u.cap = b[u.capSq]; b[u.capSq] = 0; }
    if (promo) b[to] = side * promo;
    if (t === K && Math.abs((to & 7) - (from & 7)) === 2) {
      const row = from >> 3, rf = (to & 7) === 6 ? row * 8 + 7 : row * 8, rt = (to & 7) === 6 ? row * 8 + 5 : row * 8 + 3;
      b[rt] = b[rf]; b[rf] = 0; u.rook = [rf, rt];
    }
    S.ep = (t === P && Math.abs(to - from) === 16) ? (from + to) >> 1 : -1;
    if (t === K) S.castle &= side === 1 ? ~3 : ~12;
    for (const sq of [from, to]) { if (sq === 63) S.castle &= ~1; else if (sq === 56) S.castle &= ~2; else if (sq === 7) S.castle &= ~4; else if (sq === 0) S.castle &= ~8; }
    S.half = (t === P || u.cap) ? 0 : S.half + 1;
    if (side === -1) S.full++;
    S.side = -side; S.undo.push(u); return u;
  }
  function unmake(S) {
    const u = S.undo.pop(), m = u.m, b = S.b, from = m & 63, to = (m >> 6) & 63, promo = m >> 12;
    S.side = -S.side; const side = S.side; if (side === -1) S.full--;
    b[from] = promo ? side * P : b[to]; b[to] = 0;
    if (u.capSq === to) b[to] = u.cap; else { b[u.capSq] = u.cap; }
    if (u.rook) { b[u.rook[0]] = b[u.rook[1]]; b[u.rook[1]] = 0; }
    S.castle = u.castle; S.ep = u.ep; S.half = u.half;
  }
  function legal(S, capsOnly) {
    const side = S.side, out = [];
    for (const m of pseudo(S, capsOnly)) {
      make(S, m); const k = kingSq(S.b, side), ok = k >= 0 && !attacked(S.b, k, -side); unmake(S);
      if (ok) out.push(m);
    }
    return out;
  }
  const key = S => { let s = ""; for (let i = 0; i < 64; i++) s += String.fromCharCode(S.b[i] + 70); return s + S.side + S.castle + S.ep; };
  function insufficient(S) {
    const pcs = []; for (let i = 0; i < 64; i++) { const t = Math.abs(S.b[i]); if (t && t !== K) pcs.push(t); }
    if (!pcs.length) return true;
    if (pcs.length === 1 && (pcs[0] === N || pcs[0] === Bi)) return true;
    return false;
  }
  // 상태: "" 진행 중 / "mate"(현재 둘 차례가 체크메이트) / "stalemate" / "draw50" / "rep" / "insuf"
  function status(S) {
    if (!legal(S).length) return inCheck(S) ? "mate" : "stalemate";
    if (insufficient(S)) return "insuf";
    if (S.half >= 100) return "draw50";
    const k = key(S); let cnt = 0; for (const x of S.keys) if (x === k) cnt++;
    if (cnt >= 3) return "rep";
    return "";
  }
  function moveName(S, m) {      // 간단 표기(소리/로그용)
    const f = m & 63, t = (m >> 6) & 63, n = i => "abcdefgh"[i & 7] + (8 - (i >> 3));
    return n(f) + n(t);
  }

  // ---- 평가 / 탐색 ----
  function evaluate(S) {
    const b = S.b; let s = 0, mat = 0;
    for (let i = 0; i < 64; i++) if (b[i]) { const t = Math.abs(b[i]); if (t !== K && t !== P) mat += VAL[t]; }
    const end = mat < 2600;
    for (let i = 0; i < 64; i++) {
      const v = b[i]; if (!v) continue; const t = Math.abs(v), w = v > 0;
      const idx = w ? i : ((7 - (i >> 3)) * 8 + (i & 7));
      let p = (t === K && end) ? PSTK_END[idx] : PST[t][idx];
      const val = VAL[t] + p; s += w ? val : -val;
    }
    return S.side === 1 ? s : -s;
  }
  let nodes = 0, deadline = 0, stop = false;
  function order(S, ms) {
    const b = S.b;
    return ms.map(m => {
      const f = m & 63, t = (m >> 6) & 63, cap = Math.abs(b[t]), pc = Math.abs(b[f]);
      let sc = cap ? 10 * VAL[cap] - VAL[pc] + 10000 : 0;
      if ((m >> 12) === 5) sc += 8000; else if (m >> 12) sc += 100;
      return [sc, m];
    }).sort((x, y) => y[0] - x[0]).map(x => x[1]);
  }
  function qs(S, alpha, beta, ply) {
    const stand = evaluate(S);
    if (stand >= beta) return beta; if (stand > alpha) alpha = stand;
    if (ply > 6) return alpha;
    for (const m of order(S, legal(S, true))) {
      make(S, m); const sc = -qs(S, -beta, -alpha, ply + 1); unmake(S);
      if (sc >= beta) return beta; if (sc > alpha) alpha = sc;
    }
    return alpha;
  }
  function ab(S, depth, alpha, beta, ply) {
    if ((++nodes & 1023) === 0 && Date.now() > deadline) stop = true;
    if (stop) return 0;
    const ms = legal(S);
    if (!ms.length) return inCheck(S) ? -30000 + ply : 0;
    if (S.half >= 100) return 0;
    if (depth <= 0) return qs(S, alpha, beta, 0);
    if (inCheck(S)) depth++;
    for (const m of order(S, ms)) {
      make(S, m); const sc = -ab(S, depth - 1, -beta, -alpha, ply + 1); unmake(S);
      if (stop) return 0;
      if (sc >= beta) return beta; if (sc > alpha) alpha = sc;
    }
    return alpha;
  }
  const CFG = { easy: { d: 1, ms: 300, noise: 90, rand: 0.25 }, normal: { d: 3, ms: 1200, noise: 8, rand: 0 }, hard: { d: 5, ms: 3200, noise: 0, rand: 0 } };
  function chooseMove(S0, lv, scale) {
    const cfg = CFG[lv] || CFG.normal, S = clone(S0), ms = legal(S);
    if (!ms.length) return null;
    if (cfg.rand && Math.random() < cfg.rand) return ms[(Math.random() * ms.length) | 0];
    deadline = Date.now() + cfg.ms * (scale || 1); stop = false; nodes = 0;
    let best = ms[0], bestList = order(S, ms);
    for (let d = 1; d <= cfg.d; d++) {
      let bm = null, bs = -Infinity, scores = [];
      for (const m of bestList) {
        make(S, m);
        const rep = S.keys.length && 0; let sc = -ab(S, d - 1, -Infinity, Infinity, 1);
        unmake(S);
        if (stop) break;
        sc += cfg.noise ? (Math.random() - .5) * 2 * cfg.noise : 0;
        scores.push([sc, m]); if (sc > bs) { bs = sc; bm = m; }
      }
      if (stop) break;
      best = bm; scores.sort((a, b) => b[0] - a[0]); bestList = scores.map(x => x[1]);
      if (bs > 29000) break;
    }
    return best;
  }
  const api = { initial, clone, legal, make, unmake, inCheck, status, key, chooseMove, moveName, kingSq, VAL, CFG };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Chess = api;
})(typeof window !== "undefined" ? window : globalThis);
