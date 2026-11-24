/* 오목 엔진: 5목 이상 승리(자유룰). 패턴 점수 + 난이도별 AI */
(function (root) {
  "use strict";
  const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];
  const newBoard = n => new Int8Array(n * n);
  function info(b, n, r, c, dr, dc, col) {      // idx에 col을 둔다고 가정한 한 방향의 {count, open}
    let count = 1, open = 0;
    for (const sgn of [1, -1]) {
      let k = 1, gap = false, rr, cc;
      for (;;) {
        rr = r + dr * sgn * k; cc = c + dc * sgn * k;
        if (rr < 0 || rr >= n || cc < 0 || cc >= n) { rr = -1; break; }
        const v = b[rr * n + cc];
        if (v === col) { count++; k++; continue; }
        if (v === 0 && !gap) {
          const r2 = rr + dr * sgn, c2 = cc + dc * sgn;
          if (r2 >= 0 && r2 < n && c2 >= 0 && c2 < n && b[r2 * n + c2] === col) { gap = true; k++; continue; }
        }
        break;
      }
      if (rr >= 0 && b[rr * n + cc] === 0) open++;
    }
    return { count, open };
  }
  function lineScore(count, open) {
    if (count >= 5) return 100000;
    if (count === 4) return open === 2 ? 10000 : open === 1 ? 4000 : 0;
    if (count === 3) return open === 2 ? 2000 : open === 1 ? 150 : 0;
    if (count === 2) return open === 2 ? 120 : open === 1 ? 15 : 0;
    return open === 2 ? 8 : 1;
  }
  function pointScore(b, n, idx, col) {
    const r = (idx / n) | 0, c = idx % n; let s = 0;
    for (const [dr, dc] of DIRS) { const i = info(b, n, r, c, dr, dc, col); s += lineScore(i.count, i.open); }
    return s;
  }
  // 정확히 이어진 5개 이상이면 승리 줄 반환
  function winLine(b, n, idx) {
    const col = b[idx]; if (!col) return null; const r = (idx / n) | 0, c = idx % n;
    for (const [dr, dc] of DIRS) {
      const cells = [idx];
      for (const sgn of [1, -1]) for (let k = 1; ; k++) {
        const rr = r + dr * sgn * k, cc = c + dc * sgn * k;
        if (rr < 0 || rr >= n || cc < 0 || cc >= n || b[rr * n + cc] !== col) break;
        cells.push(rr * n + cc);
      }
      if (cells.length >= 5) return cells;
    }
    return null;
  }
  function candidates(b, n) {
    const N = n * n, near = new Uint8Array(N); let any = false;
    for (let i = 0; i < N; i++) if (b[i]) {
      any = true; const r = (i / n) | 0, c = i % n;
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
        const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < n && cc >= 0 && cc < n) near[rr * n + cc] = 1;
      }
    }
    const out = [];
    if (!any) { out.push((n >> 1) * n + (n >> 1)); return out; }
    for (let i = 0; i < N; i++) if (!b[i] && near[i]) out.push(i);
    return out;
  }
  function scored(b, n, color) {
    const opp = 3 - color, out = [];
    for (const i of candidates(b, n)) {
      const a = pointScore(b, n, i, color), d = pointScore(b, n, i, opp);
      out.push({ idx: i, a, d, h: a + d * 0.95 });
    }
    out.sort((x, y) => y.h - x.h); return out;
  }
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;
  const CFG = { easy: { noise: 1800, rand: 0.2 }, normal: { noise: 60, rand: 0 }, hard: { noise: 20, rand: 0, look: 8 } };
  function think(b, n, color, lv) {
    const cfg = CFG[lv] || CFG.normal, list = scored(b, n, color);
    if (!list.length) return -1;
    if (cfg.rand && Math.random() < cfg.rand) return list[(Math.random() * Math.min(6, list.length)) | 0].idx;
    // 바로 이기거나 막아야 하면 (쉬움 제외) 반드시
    if (lv !== "easy") {
      for (const m of list) if (m.a >= 100000) return m.idx;
      for (const m of list) if (m.d >= 100000) return m.idx;
    }
    let pool = list.slice(0, cfg.look || 12);
    if (cfg.look) {
      const opp = 3 - color;
      for (const m of pool) {
        b[m.idx] = color;
        const rep = scored(b, n, opp)[0];
        b[m.idx] = 0;
        m.v = m.h - (rep && rep.a >= 4000 ? 1.1 * rep.a : 0);
      }
    } else for (const m of pool) m.v = m.h;
    for (const m of pool) m.v += gauss() * cfg.noise;
    pool.sort((x, y) => y.v - x.v);
    return pool[0].idx;
  }
  const api = { newBoard, winLine, think, pointScore };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Omok = api;
})(typeof window !== "undefined" ? window : globalThis);
