/* 카드 그림(SVG) — 트럼프 54장, 화투 48장. 외부 이미지 없이 코드로 그려요. */
window.CA = (function () {
  const f = n => Math.round(n * 100) / 100;
  const circ = (x, y, r, fill, st, sw) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}"${st ? ` stroke="${st}" stroke-width="${sw || .8}"` : ""}/>`;
  const ell = (x, y, rx, ry, fill, rot, st) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"${rot ? ` transform="rotate(${rot} ${f(x)} ${f(y)})"` : ""}${st ? ` stroke="${st}" stroke-width=".7"` : ""}/>`;
  const path = (d, fill, st, sw) => `<path d="${d}" fill="${fill || "none"}"${st ? ` stroke="${st}" stroke-width="${sw || 1}" stroke-linecap="round" stroke-linejoin="round"` : ""}/>`;
  const line = (d, c, w) => path(d, "none", c, w);
  const leaf = (x, y, r, l, c) => `<path d="M0 0 Q${f(l * .3)} ${f(-l * .32)} ${l} 0 Q${f(l * .3)} ${f(l * .32)} 0 0Z" fill="${c}" transform="translate(${x} ${y}) rotate(${r})"/>`;
  const flower = (x, y, r, pc, cc, n) => { n = n || 5; let s = ""; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 - Math.PI / 2; s += circ(x + Math.cos(a) * r * .75, y + Math.sin(a) * r * .75, r * .55, pc, "#0003", .4); } return s + circ(x, y, r * .35, cc); };
  const g = (inner, tr) => `<g transform="${tr}">${inner}</g>`;
  const bird = (x, y, s, body, wing, beak, tail) => g(
    path("M-9 3 Q-14 8 -17 7 Q-13 3 -11 1Z", tail || wing) + ell(0, 1, 9, 5.5, body) + circ(8, -3, 4, body) + path("M11.5 -3.5 L16 -2.5 L11.5 -1.5Z", beak || "#f0a020") + path("M-5 0 Q0 -7 6 0 Q0 5 -5 0Z", wing) + circ(9.3, -4, .9, "#111") + line("M-3 6 L-4 10 M2 6 L2 10", "#a06020", .8), `translate(${x} ${y}) scale(${s})`);
  const ribbon = (col, txt) => path("M21 14 H39 V74 L30 68 L21 74Z", col, "#0006", .8) + (txt ? line("M25 24 H35 M25 30 H35 M25 36 H35 M25 42 H33", "#ffffffcc", 1.1) : "");

  // ── 월별 그림 ──
  const PL = {
    0(k) { // 소나무
      let s = line("M12 74 Q18 50 30 44 Q36 40 40 30", "#6b4326", 3.4) + line("M30 44 Q22 38 16 40", "#6b4326", 2.2);
      [[36, 28, 13], [18, 38, 11], [42, 46, 11], [26, 52, 10]].forEach(([x, y, w]) => { s += ell(x, y, w, 4.2, "#1f6b34") + ell(x, y - 2, w * .8, 2.6, "#2e8c47"); s += line(`M${x - w * .6} ${y} L${x - w * .9} ${y - 3} M${x} ${y - 1} L${x} ${y - 4} M${x + w * .6} ${y} L${x + w * .9} ${y - 3}`, "#154d25", .8); });
      return s;
    },
    1(k) { // 매화
      let s = line("M10 70 Q24 56 30 44 Q36 32 52 28", "#4a2f22", 3) + line("M30 44 Q40 48 50 44", "#4a2f22", 2);
      [[16, 62], [24, 52], [34, 38], [46, 30], [44, 46], [36, 50]].forEach(([x, y]) => s += flower(x, y, 5.4, "#ffc4d6", "#e0527a", 5));
      return s;
    },
    2(k) { // 벚꽃
      let s = line("M8 72 Q22 56 34 46 Q44 38 54 30", "#5a3a2a", 3);
      [[14, 64], [22, 54], [30, 46], [40, 40], [48, 32], [28, 36], [38, 54], [18, 46], [48, 46]].forEach(([x, y], i) => s += flower(x, y, 5.2 + (i % 3) * .5, "#ffd0dc", "#f08aa8", 5));
      return s;
    },
    3(k) { // 흑싸리
      let s = line("M8 18 Q30 14 54 22", "#3a2a22", 2.6);
      [14, 24, 34, 44].forEach((x, i) => { const L = 26 + (i % 2) * 8; s += line(`M${x} ${17 + i} Q${x + 2} ${17 + L / 2} ${x} ${17 + L}`, "#2a2030", 1.4); for (let j = 0; j < 7; j++)s += circ(x + (j % 2 ? 1.6 : -1.6), 22 + i + j * (L - 6) / 7, 2.2 - j * .12, j % 2 ? "#3d2a5a" : "#2a2038"); });
      s += leaf(10, 20, 40, 14, "#2e6a3a") + leaf(52, 24, 140, 14, "#2e6a3a") + leaf(30, 18, 20, 12, "#3a7f46");
      return s;
    },
    4(k) { // 난초(창포)
      let s = "";
      [[16, 74, -75], [24, 74, -85], [32, 74, -95], [40, 74, -105], [46, 74, -112]].forEach(([x, y, r]) => s += leaf(x, y, r, 40 - Math.abs(r + 95) * .3, "#2f8c4a"));
      s += flower(24, 32, 6, "#6a4fd8", "#ffe080", 3) + flower(40, 40, 6, "#8a6af0", "#ffe080", 3);
      s += line("M24 38 L26 66 M40 46 L38 66", "#2a7a3e", 1.4);
      return s;
    },
    5(k) { // 모란
      let s = leaf(16, 62, -30, 18, "#2a7a3e") + leaf(44, 62, -150, 18, "#2a7a3e") + leaf(30, 70, -90, 16, "#3a8c4e") + leaf(14, 40, 20, 14, "#2a7a3e") + leaf(46, 40, 160, 14, "#2a7a3e");
      s += circ(30, 44, 15, "#d02b58") + circ(30, 44, 11, "#ee5a80") + circ(30, 44, 7, "#ff9ab4") + circ(30, 44, 3, "#ffd24d");
      s += line("M24 38 Q30 32 36 38 M22 46 Q30 54 38 46", "#a01a40", .8);
      return s;
    },
    6(k) { // 홍싸리
      let s = line("M10 72 Q20 40 38 30 Q46 26 54 30", "#5a3a28", 2) + line("M24 56 Q34 46 50 50", "#5a3a28", 1.6) + line("M18 62 Q10 50 12 38", "#5a3a28", 1.6);
      for (let i = 0; i < 20; i++) { const t = i / 20; s += circ(14 + t * 38 + (i % 3) * 2, 62 - Math.sin(t * 3) * 28 - (i % 2) * 6, 2.2, i % 2 ? "#d83a3a" : "#ee5a5a"); }
      s += leaf(34, 36, -30, 10, "#3a8c4e") + leaf(46, 44, 20, 10, "#3a8c4e") + leaf(20, 46, 200, 10, "#3a8c4e");
      return s;
    },
    7(k) { // 공산: 언덕 + 달
      let s = "";
      if (k === "G") s += circ(30, 34, 16, "#e8361e");
      else if (k === "Y") s += circ(46, 22, 5, "#f4e6a0");
      s += path("M2 74 Q16 48 30 60 Q44 46 58 72 L58 76 L2 76Z", "#2a2a3a") + path("M2 76 Q18 62 34 68 Q48 60 58 74 L58 78 L2 78Z", "#3a3a4e");
      if (k === "P") for (let i = 0; i < 9; i++)s += line(`M${8 + i * 6} 72 L${6 + i * 6} 56 M${10 + i * 6} 72 L${13 + i * 6} 54`, "#f0e6b4", 1);
      return s;
    },
    8(k) { // 국화
      let s = leaf(14, 66, -40, 18, "#2a7a3e") + leaf(46, 66, -140, 18, "#2a7a3e") + line("M30 70 L30 50", "#2a7a3e", 2);
      for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; s += ell(30 + Math.cos(a) * 9, 40 + Math.sin(a) * 9, 7, 2.4, i % 2 ? "#ffe070" : "#fff0a0", a * 180 / Math.PI, "#c9a000"); }
      s += circ(30, 40, 4.5, "#e8a000");
      return s;
    },
    9(k) { // 단풍
      const maple = (x, y, s, c) => g(path("M0 -9 L2.4 -4 L8 -6 L5.6 -1 L10 1 L4 3 L4.6 8 L0 5 L-4.6 8 L-4 3 L-10 1 L-5.6 -1 L-8 -6 L-2.4 -4Z", c, "#7a1a0a", .5) + line("M0 5 L0 10", "#7a1a0a", .8), `translate(${x} ${y}) scale(${s})`);
      let s = line("M54 20 Q36 24 22 40 Q14 52 8 72", "#4a2f22", 3);
      [[18, 40, 1.1, "#e8481e"], [30, 28, 1, "#f08a1e"], [44, 24, 1.1, "#d02a1a"], [14, 56, 1, "#e8481e"], [28, 48, .9, "#f0a01e"], [40, 38, .9, "#e8481e"]].forEach(a => s += maple(...a));
      return s;
    },
    10(k) { // 오동
      let s = line("M30 76 Q28 60 30 40", "#5a4a30", 2.2);
      s += ell(18, 54, 11, 8, "#3a8c5a", -20, "#1f5a3a") + ell(42, 54, 11, 8, "#3a8c5a", 20, "#1f5a3a") + ell(30, 66, 10, 7, "#4aa06a", 0, "#1f5a3a");
      [[26, 28], [34, 30], [30, 22], [26, 38], [34, 40], [30, 34]].forEach(([x, y]) => s += flower(x, y, 3.6, "#9a5ad8", "#f0e0ff", 5));
      return s;
    },
    11(k) { // 비: 버드나무
      let s = line("M2 16 Q30 6 58 16", "#4a3a28", 2.4);
      [8, 16, 24, 32, 40, 48, 54].forEach((x, i) => { s += line(`M${x} ${13 + (i % 3)} Q${x + 3} 34 ${x - 1} ${50 + (i % 3) * 5}`, "#4a9a4a", 1.4); for (let j = 0; j < 4; j++)s += leaf(x, 22 + j * 8, 100, 5, "#6ab86a"); });
      for (let i = 0; i < 12; i++)s += line(`M${6 + i * 5} ${24 + (i * 7) % 22} l-2 6`, "#6aa0e0", .9);
      return s;
    }
  };
  // ── 특별 그림(광·열끗) ──
  const EX = {
    "0G"() { return circ(46, 22, 7, "#e8361e") + g(
      path("M-12 4 Q-4 -2 4 2 Q10 -8 14 -16", "none", "#f4f4f4", 2.4) + ell(0, 4, 11, 5, "#f8f8f8", -10, "#999") + path("M-11 5 L-18 8 L-12 8Z", "#222") + circ(14, -17, 3.2, "#f8f8f8", "#999", .5) + circ(14.5, -19, 1.6, "#d02a1a") + path("M17 -17 L24 -16 L17 -15Z", "#d8a020") + line("M-2 9 L-3 18 M3 9 L3 18", "#c86040", 1), "translate(26 52) scale(1.15)"); },
    "1Y"() { return bird(40, 30, 1, "#a8c840", "#4a7a20", "#f0a020"); },
    "2G"() { let s = path("M0 14 H60 V26 H0Z", "#f4f0e0", "#222", .6); for (let i = 0; i < 6; i++)s += path(`M${i * 10} 14 H${i * 10 + 5} V26 H${i * 10}Z`, "#d02a2a"); s += line("M0 26 Q15 34 30 26 Q45 34 60 26", "#222", .8); return s; },
    "3Y"() { return bird(40, 56, 1.05, "#556", "#334", "#e8b030", "#223"); },
    "4Y"() { let s = path("M4 60 L18 52 L30 60 L42 52 L56 60 L56 64 L4 64Z", "#8a5a32", "#4a2f22", .8); s += line("M4 60 L4 72 M18 52 L18 72 M30 60 L30 72 M42 52 L42 72 M56 60 L56 72", "#4a2f22", 1.4); return s; },
    "5Y"() { const bf = (x, y, r) => g(path("M0 0 Q-9 -10 -4 -14 Q0 -8 0 0 Q9 -10 4 -14 Q0 -8 0 0Q-8 8 -3 11 Q0 5 0 0Q8 8 3 11", "#f0a020", "#7a4a10", .5) + line("M0 -3 L0 4", "#222", 1), `translate(${x} ${y}) rotate(${r})`); return bf(14, 24, -20) + bf(46, 22, 20) + bf(48, 60, 10); },
    "6Y"() { return g(ell(0, 0, 14, 8, "#7a5a3a") + path("M12 -2 Q20 -4 22 2 Q20 6 14 4Z", "#8a6a4a") + path("M17 3 L21 8 L18 4Z", "#fff") + path("M-14 -2 Q-18 -8 -16 -10", "none", "#3a2a1a", 2) + ell(-4, -9, 11, 3, "#4a3a2a") + line("M-8 6 L-9 14 M-2 8 L-2 14 M6 8 L6 14 M10 6 L11 14", "#3a2a1a", 2) + circ(15, -1, .9, "#111"), "translate(28 60) scale(1)"); },
    "7Y"() { let s = ""; [[16, 26, 0], [38, 20, 10], [30, 36, -8]].forEach(([x, y, r]) => s += g(path("M-9 2 Q-2 -6 0 2 Q2 -6 9 2 Q2 1 0 5 Q-2 1 -9 2Z", "#f4f0e0", "#555", .5) + circ(0, 3, 1.8, "#444"), `translate(${x} ${y}) rotate(${r})`)); return s; },
    "8Y"() { return g(path("M-8 -8 H8 L6 4 H-6Z", "#d02a2a", "#7a1a1a", .8) + path("M-3 4 H3 L4 9 H-4Z", "#e8c040") + line("M-6 -4 H6", "#ffe", .8) + circ(0, -2, 2, "#ffd0d0"), "translate(46 58) scale(1.25)"); },
    "9Y"() { return g(ell(0, 0, 11, 6, "#a8693a") + path("M9 -4 L19 -12 M10 -2 L20 -8", "none", "#4a2f22", 1.4) + ell(14, -1, 3, 4, "#a8693a") + circ(14, -3, 4, "#a8693a") + line("M16 -6 L24 -12 M18 -5 L26 -9", "#4a2f22", 1.2) + line("M-7 5 L-8 14 M-3 6 L-3 14 M5 6 L5 14 M8 4 L9 14", "#4a2f22", 1.6) + circ(-8, 0, 1.2, "#fff") + circ(-3, -2, 1.2, "#fff") + circ(2, 1, 1.2, "#fff"), "translate(28 56) scale(1.05)"); },
    "10G"() { return g(path("M-8 4 Q-14 -6 -6 -14 Q-2 -8 2 -14 Q6 -10 4 -2 Q12 -6 16 -2 Q12 2 6 4Q10 14 2 18 Q0 10 -4 8 Q-8 14 -14 14Q-10 8 -8 4Z", "#d02a2a", "#7a1a1a", .7) + circ(-1, -8, 3, "#d02a2a") + path("M-2 -14 Q-6 -22 0 -24 Q-2 -18 2 -18", "none", "#e8a020", 1.2) + path("M8 12 Q20 20 18 30 Q10 22 4 16", "#f0a020") + path("M0 14 Q4 26 -2 32 Q-4 22 -2 14", "#e8c020") + circ(-3, -9, 1, "#fff"), "translate(30 40) scale(1.1)"); },
    "11G"() { return g(ell(0, 14, 8, 11, "#2a6aa0", 0, "#123a60") + path("M-8 8 L-18 4 L-8 16Z M8 8 L18 4 L8 16Z", "#4a8ac0") + path("M-6 24 Q-4 36 0 38 Q4 36 6 24Z", "#8a3030", "#4a1010", .7) + circ(0, 2, 5, "#f6d5b0", "#7a5a30", .6) + path("M-10 4 H10 L0 -10Z", "#e8c040", "#7a5a10", .6) + line("M0 -4 L0 -16", "#6a4a2a", 1.6) + circ(-2, 3, .8, "#111") + circ(2, 3, .8, "#111"), "translate(30 40) scale(.95)"); },
    "11Y"() { return bird(34, 56, 1.1, "#4a4a58", "#2a2a38", "#e8b030", "#1a1a28"); },
    "11P"() { return ""; }
  };
  // ── 월 정보 ──
  const BG = { G: "#fff6cf", Y: "#eef7e2", T: "#fbeeee", P: "#f4efe2" };
  const BAND = { "홍": "#d8283b", "청": "#2f5fd0", "초": "#d8483b", "": "#a8603a" };
  const COMP = [["G", "T", "P", "P"], ["Y", "T", "P", "P"], ["G", "T", "P", "P"], ["Y", "T", "P", "P"], ["Y", "T", "P", "P"], ["Y", "T", "P", "P"], ["Y", "T", "P", "P"], ["G", "Y", "P", "P"], ["Y", "T", "P", "P"], ["Y", "T", "P", "P"], ["G", "P", "P", "P"], ["G", "Y", "T", "P"]];
  const DAN = m => [0, 1, 2].includes(m) ? "홍" : [5, 8, 9].includes(m) ? "청" : [3, 4, 6].includes(m) ? "초" : "";
  const isSS = c => ((c >> 2) === 10 && (c & 3) === 1) || ((c >> 2) === 11 && (c & 3) === 3);
  // 화투: 제공받은 그림(hwatu.webp, 8열×6행 스프라이트)을 사용. 카드 번호 c = 월*4 + 순번
  const SRC = (document.currentScript && document.currentScript.src) || "";
  const IMG = SRC.replace(/cardart\.js.*$/, "hwatu.webp");
  const st = document.createElement("style");
  st.textContent = `.hs{position:absolute;inset:0;background:url("${IMG}") no-repeat;background-size:800% 600%}`;
  document.head.appendChild(st);
  function hwatu(c) {
    return `<span class="hs" style="background-position:${f((c % 8) / 7 * 100)}% ${f(((c / 8) | 0) / 5 * 100)}%"></span>`;
  }

  // ── 트럼프 ──
  const SP = {
    0: s => `<path transform="scale(${s})" d="M0 -10 C-4 -4 -12 -1 -10 4 C-8 8 -3 7 -1.5 4 C-1.5 8 -2.5 10 -4.5 11 L4.5 11 C2.5 10 1.5 8 1.5 4 C3 7 8 8 10 4 C12 -1 4 -4 0 -10Z"/>`,
    1: s => `<path transform="scale(${s})" d="M0 10 C-14 0 -11 -9 -5.5 -9 C-2.5 -9 0 -6.5 0 -4.2 C0 -6.5 2.5 -9 5.5 -9 C11 -9 14 0 0 10Z"/>`,
    2: s => `<path transform="scale(${s})" d="M0 -11 L8 0 L0 11 L-8 0Z"/>`,
    3: s => `<g transform="scale(${s})"><circle cx="0" cy="-5" r="4.6"/><circle cx="-5.2" cy="2" r="4.6"/><circle cx="5.2" cy="2" r="4.6"/><path d="M0 0 L-2.6 11 L2.6 11Z"/></g>`
  };
  const suitAt = (su, x, y, s, rot, col) => `<g fill="${col}" transform="translate(${x} ${y})${rot ? " rotate(180)" : ""}">${SP[su](s)}</g>`;
  const PIPS = { // [x, y]
    1: [[50, 72]],
    2: [[50, 34], [50, 110]],
    3: [[50, 34], [50, 72], [50, 110]],
    4: [[33, 34], [67, 34], [33, 110], [67, 110]],
    5: [[33, 34], [67, 34], [50, 72], [33, 110], [67, 110]],
    6: [[33, 34], [67, 34], [33, 72], [67, 72], [33, 110], [67, 110]],
    7: [[33, 34], [67, 34], [50, 53], [33, 72], [67, 72], [33, 110], [67, 110]],
    8: [[33, 34], [67, 34], [50, 53], [33, 72], [67, 72], [50, 91], [33, 110], [67, 110]],
    9: [[33, 34], [67, 34], [33, 59], [67, 59], [50, 72], [33, 85], [67, 85], [33, 110], [67, 110]],
    10: [[33, 34], [67, 34], [50, 46], [33, 59], [67, 59], [33, 85], [67, 85], [50, 98], [33, 110], [67, 110]]
  };
  function halfFigure(r, col, col2) { // 위쪽 절반 (y 24~72)
    const robe = path("M26 72 L30 56 Q50 48 70 56 L74 72Z", col, "#0006", .8) + path("M44 54 L50 72 L56 54Z", col2) + line("M30 62 H70", col2, 1.4);
    const face = circ(50, 45, 8, "#f6d5b0", "#6a4a2a", .8) + circ(47, 44, .9, "#222") + circ(53, 44, .9, "#222") + line("M47.5 49 Q50 51 52.5 49", "#a03030", .9);
    let head = "";
    if (r === 13) head = path("M40 38 L39 27 L45 32 L50 24 L55 32 L61 27 L60 38Z", "#f0c040", "#8a6a10", .8) + circ(50, 24, 1.6, "#d02a2a") + path("M43 48 Q50 64 57 48 Q50 54 43 48Z", "#d8d8d8", "#777", .6) + line("M45 48 Q50 52 55 48", "#999", .8);
    else if (r === 12) head = path("M39 41 Q37 56 44 60 L45 48 Z M61 41 Q63 56 56 60 L55 48Z", "#6a3a1a") + path("M41 38 L42 29 L46 33 L50 27 L54 33 L58 29 L59 38Z", "#f0c040", "#8a6a10", .8) + circ(50, 28, 1.4, "#3a8ad8") + path("M44 36 Q50 32 56 36", "none", "#6a3a1a", 1.4);
    else head = path("M39 40 Q50 22 61 40 Q50 36 39 40Z", col2, "#0006", .8) + path("M58 31 Q72 22 68 42", "none", "#e8e8e8", 1.8) + path("M39 40 H61", "none", "#0006", .8);
    return robe + face + head;
  }
  function trump(c) {
    if (c >= 52) { // 조커
      const k = c === 53 ? "#d8283b" : "#222";
      return `<svg viewBox="0 0 100 145"><rect x="3" y="3" width="94" height="139" rx="9" fill="#fff"/>
        <g transform="translate(50 74)">${path("M-26 -8 Q-34 -40 -22 -52 Q-14 -38 -6 -18Z M26 -8 Q34 -40 22 -52 Q14 -38 6 -18Z M-8 -16 Q-2 -52 0 -56 Q2 -52 8 -16Z", k)}${circ(-22, -52, 4, "#f0c040", "#8a6a10", .8)}${circ(22, -52, 4, "#f0c040", "#8a6a10", .8)}${circ(0, -56, 4, "#f0c040", "#8a6a10", .8)}
        ${path("M-26 -8 Q0 -22 26 -8 L26 0 Q0 -12 -26 0Z", c === 53 ? "#f0c040" : "#e0e0e0", "#555", .8)}
        ${circ(0, 14, 24, "#f6d5b0", "#6a4a2a", 1.4)}${circ(-8, 8, 3, "#222")}${circ(8, 8, 3, "#222")}${path("M-10 20 Q0 32 10 20", "none", "#c02020", 2)}${circ(0, 14, 3, "#e05050")}
        ${path("M-24 38 L-16 56 L0 44 L16 56 L24 38 L10 34 Q0 40 -10 34Z", k)}${circ(-16, 56, 3, "#f0c040")}${circ(16, 56, 3, "#f0c040")}</g>
        <text font-size="9" font-weight="800" fill="${k}" font-family="sans-serif" text-anchor="middle" transform="rotate(-90 12 30)" x="12" y="30">JOKER</text>
        <text x="88" y="115" font-size="9" font-weight="800" fill="${k}" font-family="sans-serif" text-anchor="middle" transform="rotate(90 88 115)">JOKER</text></svg>`;
    }
    const su = (c / 13) | 0, r = c % 13 + 1, rd = su === 1 || su === 2, col = rd ? "#d8283b" : "#1c1c28";
    const RKT = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][r];
    let s = `<rect x="3" y="3" width="94" height="139" rx="9" fill="#fff"/>`;
    s += `<text x="13" y="26" font-size="${r === 10 ? 20 : 24}" font-weight="800" fill="${col}" font-family="Georgia,'Times New Roman',serif" text-anchor="middle">${RKT}</text>` + suitAt(su, 13, 40, .78, 0, col);
    s += `<g transform="rotate(180 50 72.5)"><text x="13" y="26" font-size="${r === 10 ? 20 : 24}" font-weight="800" fill="${col}" font-family="Georgia,'Times New Roman',serif" text-anchor="middle">${RKT}</text>${suitAt(su, 13, 40, .78, 0, col)}</g>`;
    if (r <= 10) {
      PIPS[r].forEach(([x, y]) => s += suitAt(su, x, y, r === 1 ? 2.6 : r >= 9 ? .92 : r >= 7 ? 1.02 : 1.12, y > 72 && r !== 1, col));
    } else {
      const c1 = rd ? "#d8283b" : "#2a3f8a", c2 = "#f0c040";
      s += `<rect x="24" y="26" width="52" height="93" rx="4" fill="#fffbe8" stroke="${col}" stroke-width="1.4"/>`;
      s += halfFigure(r, c1, c2) + `<g transform="rotate(180 50 72.5)">${halfFigure(r, c1, c2)}</g>`;
      s += line("M24 72.5 H76", col, 1) + suitAt(su, 33, 36, .62, 0, col) + suitAt(su, 67, 109, .62, 1, col);
    }
    return `<svg viewBox="0 0 100 145">${s}</svg>`;
  }
  return { hwatu, trump, isSS };
})();
