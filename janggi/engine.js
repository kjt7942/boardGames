/* 장기 엔진: 규칙 + 알파베타 AI
 * 판: Int8Array(90), 인덱스 = r*9+c (r=0이 위쪽 한, r=9가 아래쪽 초)
 * 기물 코드 = 진영*8+종류  (진영 1=초(아래, 선공), 2=한(위))
 * 종류: 1 장(궁) 2 차 3 포 4 마 5 상 6 사 7 졸/병
 */
(function (root) {
  "use strict";
  const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const DIAGS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  const PAL = new Set(["0,3", "0,5", "1,4", "2,3", "2,5", "7,3", "7,5", "8,4", "9,3", "9,5"]);
  const VAL = [0, 0, 130, 70, 50, 30, 30, 20];      // 평가용
  const PTS = [0, 0, 13, 7, 5, 3, 3, 2];            // 계가 점수
  const INF = 100000;

  const palaceOf = (r, c) => (c < 3 || c > 5) ? 0 : (r >= 0 && r <= 2) ? 2 : (r >= 7 && r <= 9) ? 1 : 0;
  const dstep = (r, c, dr, dc) => {
    const nr = r + dr, nc = c + dc;
    return PAL.has(r + "," + c) && PAL.has(nr + "," + nc) && palaceOf(r, c) === palaceOf(nr, nc);
  };
  const inB = (r, c) => r >= 0 && r < 10 && c >= 0 && c < 9;

  function initialBoard() {
    const B = new Int8Array(90), code = (s, t) => s * 8 + t;
    const back = [2, 4, 5, 6, 0, 6, 5, 4, 2];       // 차 마 상 사 . 사 상 마 차 (마상상마 차림은 아래서 조정)
    back[1] = 4; back[2] = 5; back[6] = 5; back[7] = 4;
    for (let c = 0; c < 9; c++) {
      if (back[c]) { B[c] = code(2, back[c]); B[81 + c] = code(1, back[c]); }
    }
    B[1 * 9 + 4] = code(2, 1); B[8 * 9 + 4] = code(1, 1);
    B[2 * 9 + 1] = B[2 * 9 + 7] = code(2, 3);
    B[7 * 9 + 1] = B[7 * 9 + 7] = code(1, 3);
    for (let c = 0; c < 9; c += 2) { B[3 * 9 + c] = code(2, 7); B[6 * 9 + c] = code(1, 7); }
    return B;
  }

  // ---- 이동 생성 (의사 합법) : m = from<<7 | to ----
  function gen(B, s, out) {
    const fw = s === 1 ? -1 : 1;
    for (let i = 0; i < 90; i++) {
      const v = B[i]; if (!v || (v >> 3) !== s) continue;
      const t = v & 7, r = (i / 9) | 0, c = i - r * 9;
      if (t === 1 || t === 6) {
        for (const [dr, dc] of ORTH) {
          const nr = r + dr, nc = c + dc;
          if (palaceOf(nr, nc) === s) { const w = B[nr * 9 + nc]; if (!w || (w >> 3) !== s) out.push(i << 7 | (nr * 9 + nc)); }
        }
        for (const [dr, dc] of DIAGS) if (dstep(r, c, dr, dc)) {
          const nr = r + dr, nc = c + dc, w = B[nr * 9 + nc];
          if (palaceOf(nr, nc) === s && (!w || (w >> 3) !== s)) out.push(i << 7 | (nr * 9 + nc));
        }
      } else if (t === 2) {
        for (const [dr, dc] of ORTH) slideR(B, s, i, r, c, dr, dc, false, out);
        for (const [dr, dc] of DIAGS) if (dstep(r, c, dr, dc)) slideR(B, s, i, r, c, dr, dc, true, out);
      } else if (t === 3) {
        for (const [dr, dc] of ORTH) slideC(B, s, i, r, c, dr, dc, false, out);
        for (const [dr, dc] of DIAGS) if (dstep(r, c, dr, dc)) slideC(B, s, i, r, c, dr, dc, true, out);
      } else if (t === 4) {
        for (const [dr, dc] of ORTH) {
          const mr = r + dr, mc = c + dc;
          if (!inB(mr, mc) || B[mr * 9 + mc]) continue;
          for (const d of [-1, 1]) {
            const nr = dr !== 0 ? r + 2 * dr : r + d, nc = dr !== 0 ? c + d : c + 2 * dc;
            if (inB(nr, nc)) { const w = B[nr * 9 + nc]; if (!w || (w >> 3) !== s) out.push(i << 7 | (nr * 9 + nc)); }
          }
        }
      } else if (t === 5) {
        for (const [dr, dc] of ORTH) {
          const mr = r + dr, mc = c + dc;
          if (!inB(mr, mc) || B[mr * 9 + mc]) continue;
          for (const d of [-1, 1]) {
            const m2r = dr !== 0 ? mr + dr : mr + d, m2c = dr !== 0 ? mc + d : mc + dc;
            if (!inB(m2r, m2c) || B[m2r * 9 + m2c]) continue;
            const nr = dr !== 0 ? m2r + dr : m2r + d, nc = dr !== 0 ? m2c + d : m2c + dc;
            if (inB(nr, nc)) { const w = B[nr * 9 + nc]; if (!w || (w >> 3) !== s) out.push(i << 7 | (nr * 9 + nc)); }
          }
        }
      } else if (t === 7) {
        const tg = [[r + fw, c], [r, c - 1], [r, c + 1]];
        for (const [nr, nc] of tg) if (inB(nr, nc)) { const w = B[nr * 9 + nc]; if (!w || (w >> 3) !== s) out.push(i << 7 | (nr * 9 + nc)); }
        for (const dc of [-1, 1]) if (dstep(r, c, fw, dc)) {
          const nr = r + fw, nc = c + dc, w = B[nr * 9 + nc];
          if (!w || (w >> 3) !== s) out.push(i << 7 | (nr * 9 + nc));
        }
      }
    }
    return out;
  }
  function slideR(B, s, i, r, c, dr, dc, diag, out) {
    let nr = r + dr, nc = c + dc;
    while (inB(nr, nc)) {
      const j = nr * 9 + nc, w = B[j];
      if (!w) out.push(i << 7 | j); else { if ((w >> 3) !== s) out.push(i << 7 | j); break; }
      if (diag && !dstep(nr, nc, dr, dc)) break;
      nr += dr; nc += dc;
    }
  }
  function slideC(B, s, i, r, c, dr, dc, diag, out) {
    let nr = r + dr, nc = c + dc, jumped = false;
    while (inB(nr, nc)) {
      const j = nr * 9 + nc, w = B[j];
      if (!jumped) { if (w) { if ((w & 7) === 3) break; jumped = true; } }
      else { if (!w) out.push(i << 7 | j); else { if ((w >> 3) !== s && (w & 7) !== 3) out.push(i << 7 | j); break; } }
      if (diag && !dstep(nr, nc, dr, dc)) break;
      nr += dr; nc += dc;
    }
  }

  // ---- 진행/되돌리기 ----
  const KP = [0, 0, 0];
  function locateKings(B) { for (let i = 0; i < 90; i++) { const v = B[i]; if (v && (v & 7) === 1) KP[v >> 3] = i; } }
  function make(B, m) {
    const f = m >> 7, t = m & 127, cap = B[t];
    B[t] = B[f]; B[f] = 0;
    if ((B[t] & 7) === 1) KP[B[t] >> 3] = t;
    return cap;
  }
  function unmake(B, m, cap) {
    const f = m >> 7, t = m & 127;
    B[f] = B[t]; B[t] = cap;
    if ((B[f] & 7) === 1) KP[B[f] >> 3] = f;
  }
  function facing(B) {
    const a = KP[1], b = KP[2];
    if (a % 9 !== b % 9) return false;
    for (let j = b + 9; j < a; j += 9) if (B[j]) return false;
    return true;
  }
  function inCheck(B, s) {
    locateKings(B);
    const k = KP[s], mv = []; gen(B, 3 - s, mv);
    for (const m of mv) if ((m & 127) === k) return true;
    return false;
  }
  function legalMoves(B, s) {
    locateKings(B);
    const mv = [], out = []; gen(B, s, mv);
    for (const m of mv) {
      const cap = make(B, m);
      let ok = !facing(B);
      if (ok) { const k = KP[s], om = []; gen(B, 3 - s, om); for (const x of om) if ((x & 127) === k) { ok = false; break; } }
      unmake(B, m, cap);
      if (ok) out.push(m);
    }
    return out;
  }
  function score(B) {      // 계가 점수 (초, 한+1.5 덤)
    const p = [0, 0, 1.5];
    for (let i = 0; i < 90; i++) { const v = B[i]; if (v) p[v >> 3] += PTS[v & 7]; }
    return { 1: p[1], 2: p[2] };
  }

  // ---- 평가/탐색 ----
  function evalSide(B, s) {
    let sc = 0;
    for (let i = 0; i < 90; i++) {
      const v = B[i]; if (!v) continue;
      const side = v >> 3, t = v & 7, r = (i / 9) | 0, c = i % 9;
      let x = VAL[t];
      if (t === 7) { const adv = side === 1 ? 6 - r : r - 3; x += 3 * Math.max(0, adv); }
      else if (t === 4 || t === 5 || t === 3) x += 4 - Math.abs(c - 4) * 0.8;
      sc += side === s ? x : -x;
    }
    return sc;
  }
  let nodes = 0, deadline = 0, stopped = false;
  function ordered(B, mv) {
    const o = mv.map(m => { const v = B[m & 127]; return [v ? 10 * VAL[v & 7] + 5 - (B[m >> 7] & 7) : 0, m]; });
    o.sort((a, b) => b[0] - a[0]);
    return o.map(x => x[1]);
  }
  function qs(B, alpha, beta, s, qd) {
    const stand = evalSide(B, s);
    if (qd <= 0) return stand;
    if (stand >= beta) return stand;
    if (stand > alpha) alpha = stand;
    const mv = []; gen(B, s, mv);
    const caps = mv.filter(m => B[m & 127]);
    for (const m of ordered(B, caps)) {
      const cap = B[m & 127];
      if ((cap & 7) === 1) return INF;
      const c2 = make(B, m);
      if (facing(B)) { unmake(B, m, c2); continue; }
      const sc = -qs(B, -beta, -alpha, 3 - s, qd - 1);
      unmake(B, m, c2);
      if (sc >= beta) return sc;
      if (sc > alpha) alpha = sc;
    }
    return alpha;
  }
  function ab(B, depth, alpha, beta, s, ply) {
    if ((++nodes & 511) === 0 && Date.now() > deadline) stopped = true;
    if (stopped) return 0;
    if (depth <= 0) return qs(B, alpha, beta, s, 3);
    const mv = []; gen(B, s, mv);
    let best = -INF, any = false;
    for (const m of ordered(B, mv)) {
      const cap = B[m & 127];
      if (cap && (cap & 7) === 1) return INF - ply;
      const c2 = make(B, m);
      if (facing(B)) { unmake(B, m, c2); continue; }
      any = true;
      const sc = -ab(B, depth - 1, -beta, -alpha, 3 - s, ply + 1);
      unmake(B, m, c2);
      if (stopped) return 0;
      if (sc > best) { best = sc; if (sc > alpha) alpha = sc; if (alpha >= beta) break; }
    }
    return any ? best : evalSide(B, s);
  }
  const LV = {
    easy:   { d: 1, t: 300,  margin: 40, rand: 0.3 },
    normal: { d: 3, t: 900,  margin: 6,  rand: 0 },
    hard:   { d: 6, t: 2200, margin: 0,  rand: 0 }
  };
  function chooseMove(B0, s, lv, timeScale) {
    const B = Int8Array.from(B0); locateKings(B);
    const legal = legalMoves(B, s); if (!legal.length) return null;
    const cfg = LV[lv] || LV.normal;
    if (Math.random() < cfg.rand) return legal[(Math.random() * legal.length) | 0];
    deadline = Date.now() + cfg.t * (timeScale || 1); stopped = false; nodes = 0;
    let order = legal.slice().sort(() => Math.random() - 0.5), res = order.map(m => ({ m, sc: 0 }));
    for (let d = 1; d <= cfg.d; d++) {
      let alpha = -INF, best = -INF; const cur = [];
      for (const o of order.map(m => m)) {
        const cap = make(B, o);
        const sc = -ab(B, d - 1, -INF, -alpha, 3 - s, 1);
        unmake(B, o, cap);
        if (stopped) break;
        cur.push({ m: o, sc });
        if (sc > best) { best = sc; alpha = Math.max(alpha, best - cfg.margin - 1); }
      }
      if (stopped) break;
      res = cur.sort((a, b) => b.sc - a.sc);
      order = res.map(x => x.m).concat(order.filter(m => !res.some(x => x.m === m)));
      if (res[0].sc >= INF - 100) break;
    }
    const top = res[0].sc, pool = res.filter(x => x.sc >= top - cfg.margin);
    return pool[(Math.random() * pool.length) | 0].m;
  }

  const api = { initialBoard, gen, legalMoves, inCheck, make, unmake, locateKings, facing, score, chooseMove, palaceOf, dstep, PTS, VAL, LV };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Janggi = api;
})(typeof window !== "undefined" ? window : globalThis);
