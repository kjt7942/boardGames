/* 공용 이펙트·효과음 모듈 (파일 없이 WebAudio 합성 + 캔버스 파티클)
 * FX.sfx(name, opt)  효과음      FX.burst(x,y,opt)  파티클 폭발
 * FX.ring(x,y,color) 퍼지는 원   FX.float(x,y,text,color) 떠오르는 글자
 * FX.banner(text,color,sub)     화면 가운데 큰 글자
 * FX.confetti()  꽃가루          FX.shake(el,amp)   흔들기     FX.vib(ms) 진동
 * FX.center(el) -> {x,y}        FX.on (소리 켜짐 여부, localStorage bgSnd 공유)
 */
(function () {
  if (window.FX) return;
  const FX = {};
  // ── 소리 ──
  let AC = null, NB = null, master = null;
  Object.defineProperty(FX, "on", {
    get() { try { return localStorage.getItem("bgSnd") !== "0"; } catch (e) { return true; } },
    set(v) { try { localStorage.setItem("bgSnd", v ? "1" : "0"); } catch (e) { } }
  });
  function ac() {
    try {
      if (!AC) {
        AC = new (window.AudioContext || window.webkitAudioContext)();
        master = AC.createDynamicsCompressor(); master.connect(AC.destination);
        const n = AC.sampleRate * 1 | 0; NB = AC.createBuffer(1, n, AC.sampleRate); const d = NB.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      }
      if (AC.state === "suspended") AC.resume();
    } catch (e) { AC = null; }
    return AC;
  }
  ["pointerdown", "keydown", "touchstart"].forEach(t => window.addEventListener(t, ac, { once: true, passive: true }));
  function tone(f, d, o) {
    o = o || {}; const t = AC.currentTime + (o.at || 0), os = AC.createOscillator(), g = AC.createGain();
    os.type = o.type || "sine"; os.frequency.setValueAtTime(f, t);
    if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + d);
    const v = o.v || .2; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + (o.a || .005)); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    os.connect(g); g.connect(master); os.start(t); os.stop(t + d + .02);
  }
  function noise(d, o) {
    o = o || {}; const t = AC.currentTime + (o.at || 0), s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = NB; f.type = o.ft || "bandpass"; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f || 1000, t); if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + d);
    const v = o.v || .3; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + (o.a || .004)); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * .5); s.stop(t + d + .02);
  }
  const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
  const S = {
    tap: () => { tone(900, .05, { type: "triangle", v: .12 }); },
    hover: () => { tone(1400, .03, { v: .05 }); },
    place: () => { tone(180, .18, { type: "sine", to: 90, v: .45 }); noise(.06, { f: 2500, q: .7, v: .25 }); tone(620, .06, { type: "triangle", v: .1, at: .01 }); },
    slide: () => { noise(.22, { f: 600, f2: 2200, q: 1.2, v: .22, a: .05 }); },
    whoosh: () => { noise(.25, { f: 500, f2: 3200, q: 1.4, v: .26, a: .05 }); },
    wall: () => { tone(110, .28, { type: "sine", to: 45, v: .6 }); noise(.12, { f: 300, ft: "lowpass", v: .5 }); tone(1800, .04, { type: "square", v: .05, at: .005 }); noise(.35, { f: 4000, q: .5, v: .06, at: .03 }); },
    crash: () => { noise(.6, { f: 1500, f2: 300, q: .6, v: .55 }); tone(80, .4, { type: "sawtooth", to: 35, v: .3 }); for (let i = 0; i < 6; i++) tone(2000 + Math.random() * 3000, .05, { type: "square", v: .04, at: .05 + i * .04 }); },
    gain: o => { const k = Math.min(8, (o && o.n) || 3), base = 72; [0, 4, 7, 12, 16, 19, 24, 28].slice(0, Math.max(3, Math.min(8, k))).forEach((s, i) => tone(NOTE(base + s), .25, { type: "triangle", v: .16, at: i * .06 })); },
    ok: o => { const c = (o && o.combo) || 1, b = 72 + Math.min(c - 1, 6) * 2; [0, 4, 7, 12].forEach((s, i) => tone(NOTE(b + s), .22, { type: "triangle", v: .18, at: i * .07 })); tone(NOTE(b + 24), .6, { v: .08, at: .28 }); },
    no: () => { tone(220, .22, { type: "sawtooth", v: .16 }); tone(160, .4, { type: "sawtooth", v: .16, at: .18 }); noise(.3, { f: 300, ft: "lowpass", v: .2 }); },
    tick: () => { tone(1500, .03, { type: "square", v: .06 }); },
    drum: o => { const n = (o && o.n) || 5; for (let i = 0; i < n; i++) { noise(.06, { f: 180, ft: "lowpass", v: .35, at: i * .09 }); tone(90, .07, { v: .25, at: i * .09 }); } },
    flip: () => { noise(.09, { f: 3000, q: 2, v: .25 }); tone(700, .08, { type: "triangle", to: 1100, v: .1 }); },
    turn: () => { tone(NOTE(79), .15, { v: .12 }); tone(NOTE(84), .25, { v: .12, at: .1 }); },
    bad: () => { tone(180, .12, { type: "square", v: .08 }); tone(150, .15, { type: "square", v: .08, at: .1 }); },
    boom: () => { tone(70, .9, { type: "sine", to: 30, v: .7 }); noise(.8, { f: 200, ft: "lowpass", v: .5 }); },
    win: () => { [[72, 0], [76, .12], [79, .24], [84, .36], [79, .52], [84, .64]].forEach(([n, t]) => tone(NOTE(n), .3, { type: "triangle", v: .18, at: t })); [72, 76, 79, 84].forEach(n => tone(NOTE(n), 1.2, { type: "triangle", v: .08, at: .8 })); for (let i = 0; i < 8; i++) noise(.08, { f: 6000, q: .5, v: .05, at: .8 + i * .07 }); },
    lose: () => { [[67, 0], [66, .3], [65, .6]].forEach(([n, t]) => tone(NOTE(n), .35, { type: "sawtooth", v: .09, at: t })); tone(NOTE(64), 1, { type: "sawtooth", v: .09, at: .9, to: NOTE(60) }); },
    stone: () => { tone(2200, .05, { type: "sine", to: 900, v: .35 }); noise(.05, { f: 4500, q: 1.5, v: .35 }); tone(420, .12, { type: "triangle", to: 300, v: .18, at: .005 }); },
    wood: () => { tone(260, .12, { type: "triangle", to: 160, v: .35 }); noise(.05, { f: 1800, q: 1, v: .3 }); },
    capture: o => { const n = Math.min(6, (o && o.n) || 1); for (let i = 0; i < n + 1; i++) { tone(1800 + Math.random() * 900, .05, { to: 800, v: .18, at: i * .06 }); noise(.04, { f: 4000, q: 1.5, v: .2, at: i * .06 }); } tone(160, .25, { to: 70, v: .35 }); },
    hit: () => { tone(150, .25, { type: "triangle", to: 60, v: .5 }); noise(.18, { f: 900, f2: 200, q: .8, v: .45 }); tone(900, .06, { type: "square", v: .06 }); },
    check: () => { [0, .14].forEach(t => { tone(NOTE(81), .12, { type: "square", v: .1, at: t }); tone(NOTE(86), .12, { type: "square", v: .07, at: t + .06 }); }); tone(90, .4, { type: "sawtooth", v: .12, to: 60 }); },
    alert: () => { tone(NOTE(76), .1, { type: "square", v: .08 }); tone(NOTE(83), .16, { type: "square", v: .08, at: .1 }); },
    dice: () => { noise(.04, { f: 2500, q: 2, v: .2 }); tone(500 + Math.random() * 400, .03, { type: "square", v: .04 }); },
    step: o => { const k = (o && o.k) || 0; tone(NOTE(76 + [0, 2, 4, 7, 9, 12][k % 6]), .14, { type: "sine", v: .14 }); tone(NOTE(88 + [0, 2, 4, 7, 9, 12][k % 6]), .1, { v: .05, at: .02 }); },
    magic: () => { for (let i = 0; i < 9; i++) tone(NOTE(84 + [0, 4, 7, 11, 12, 16, 19, 23, 24][i]), .3, { v: .07, at: i * .04 }); },
    poof: () => { noise(.4, { f: 3000, f2: 400, q: .7, v: .3 }); tone(600, .3, { to: 150, v: .1 }); },
    pop: () => { tone(500, .08, { to: 1200, v: .15 }); },
  };
  FX.sfx = (n, o) => { if (!FX.on || !ac() || !S[n]) return; try { S[n](o); } catch (e) { } };
  FX.vib = ms => { try { if (FX.on && navigator.vibrate) navigator.vibrate(ms); } catch (e) { } };

  // ── 화면 효과 ──
  const st = document.createElement("style");
  st.textContent = `
#fxCv{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:120}
.fxFloat{position:fixed;z-index:121;pointer-events:none;font:900 22px system-ui,sans-serif;color:#fff;text-shadow:0 2px 0 #0008,0 0 12px var(--c,#fff);transform:translate(-50%,-50%);animation:fxUp 1.2s ease-out forwards;white-space:nowrap}
@keyframes fxUp{0%{opacity:0;transform:translate(-50%,-30%) scale(.5)}15%{opacity:1;transform:translate(-50%,-60%) scale(1.25)}30%{transform:translate(-50%,-70%) scale(1)}100%{opacity:0;transform:translate(-50%,-190%)}}
.fxBanner{position:fixed;left:50%;top:42%;z-index:122;pointer-events:none;text-align:center;transform:translate(-50%,-50%);animation:fxBan 1.5s cubic-bezier(.2,1.4,.4,1) forwards}
.fxBanner b{display:block;font:900 clamp(34px,9vw,72px)/1.05 system-ui,sans-serif;color:#fff;-webkit-text-stroke:2px #0006;text-shadow:0 4px 0 var(--c,#4d7cff),0 0 30px var(--c,#4d7cff),0 8px 20px #000a;letter-spacing:-1px}
.fxBanner small{display:block;margin-top:6px;font:800 clamp(15px,3.5vw,22px) system-ui,sans-serif;color:#fff;text-shadow:0 2px 6px #000}
@keyframes fxBan{0%{opacity:0;transform:translate(-50%,-50%) scale(2.2) rotate(-6deg)}18%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(-2deg)}75%{opacity:1;transform:translate(-50%,-50%) scale(1.04) rotate(-2deg)}100%{opacity:0;transform:translate(-50%,-80%) scale(.9) rotate(-2deg)}}
.fxFlash{position:fixed;inset:0;z-index:119;pointer-events:none;background:radial-gradient(circle,var(--c) 0%,transparent 70%);animation:fxFl .5s ease-out forwards}
@keyframes fxFl{from{opacity:.45}to{opacity:0}}`;
  document.head.appendChild(st);
  let cv = null, cx = null, P = [], raf = 0;
  function canvas() {
    if (!cv || !cv.isConnected) { cv = document.createElement("canvas"); cv.id = "fxCv"; document.body.appendChild(cv); cx = cv.getContext("2d"); }
    const d = devicePixelRatio || 1, w = innerWidth, h = innerHeight;
    if (cv.width !== w * d || cv.height !== h * d) { cv.width = w * d; cv.height = h * d; cx.setTransform(d, 0, 0, d, 0, 0); }
    return cx;
  }
  function loop() {
    const c = canvas(); c.clearRect(0, 0, innerWidth, innerHeight);
    P = P.filter(p => p.life > 0);
    for (const p of P) {
      p.life -= 1; p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag; p.rot += p.vr;
      const a = Math.min(1, p.life / p.fade);
      c.globalAlpha = a; c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
      if (p.shape === "ring") { c.strokeStyle = p.color; c.lineWidth = 4 * a; c.beginPath(); c.arc(0, 0, p.r0 + (p.max - p.life) * p.grow, 0, 7); c.stroke(); }
      else if (p.shape === "rect") { c.fillStyle = p.color; c.fillRect(-p.s, -p.s * .45, p.s * 2, p.s * .9); }
      else if (p.shape === "star") { c.fillStyle = p.color; c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? p.s * .45 : p.s, t = i * Math.PI / 5; c.lineTo(Math.cos(t) * r, Math.sin(t) * r); } c.fill(); }
      else { c.fillStyle = p.color; c.shadowColor = p.color; c.shadowBlur = p.glow ? 10 : 0; c.beginPath(); c.arc(0, 0, p.s * a + .5, 0, 7); c.fill(); }
      c.restore();
    }
    c.globalAlpha = 1;
    raf = P.length ? requestAnimationFrame(loop) : 0;
    if (!P.length) c.clearRect(0, 0, innerWidth, innerHeight);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  const R = (a, b) => a + Math.random() * (b - a);
  FX.burst = (x, y, o) => {
    o = o || {}; const n = o.n || 18, cols = [].concat(o.color || "#fff");
    for (let i = 0; i < n; i++) {
      const a = o.dir != null ? o.dir + R(-(o.spread || .6), o.spread || .6) : R(0, Math.PI * 2), v = R(.3, 1) * (o.speed || 6), life = R(.6, 1) * (o.life || 45);
      P.push({ x: x + R(-(o.w || 0), o.w || 0) / 2, y: y + R(-(o.h || 0), o.h || 0) / 2, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up || 0), g: o.g != null ? o.g : .18, drag: o.drag || .96, s: R(.6, 1) * (o.size || 4), color: cols[i % cols.length], life, fade: life * .6, rot: R(0, 6), vr: R(-.3, .3), shape: o.shape || "dot", glow: o.glow });
    }
    kick();
  };
  FX.ring = (x, y, color, o) => { o = o || {}; const life = o.life || 30; P.push({ x, y, vx: 0, vy: 0, g: 0, drag: 1, s: 0, color, life, max: life, fade: life, rot: 0, vr: 0, shape: "ring", r0: o.r0 || 6, grow: o.grow || 2.4 }); kick(); };
  FX.confetti = (o) => {
    o = o || {}; const cols = o.colors || ["#ff5d73", "#ffd24d", "#4dabff", "#5ee08a", "#c77dff", "#fff"];
    for (let k = 0; k < 2; k++) FX.burst(k ? innerWidth * .85 : innerWidth * .15, innerHeight * .9, { n: 70, color: cols, speed: 16, dir: k ? -Math.PI * .62 : -Math.PI * .38, spread: .35, g: .25, drag: .985, life: 140, size: 7, shape: "rect" });
    setTimeout(() => FX.burst(innerWidth / 2, innerHeight * .25, { n: 50, color: cols, speed: 9, g: .15, drag: .98, life: 130, size: 6, shape: "star" }), 350);
  };
  FX.svgXY = (svg, x, y) => { const m = svg.getScreenCTM(); if (!m) return { x: 0, y: 0, k: 1 }; return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f, k: m.a }; };
  // 요소 하나를 '쿵' 내려놓기 / 이전 위치에서 미끄러지기 (SVG 요소면 사용자 좌표 단위)
  FX.drop = (el, o) => { if (!el || !el.animate) return; o = o || {}; el.style.transformBox = "fill-box"; el.style.transformOrigin = "center"; el.animate([{ transform: `translateY(${o.dy || -40}px) scale(${o.s || 1.5})`, opacity: 0 }, { transform: "scale(.9)", opacity: 1, offset: .7 }, { transform: "none" }], { duration: o.dur || 300, easing: "cubic-bezier(.5,0,.6,1.3)" }); };
  FX.slide = (el, dx, dy, o) => { if (!el || !el.animate) return; o = o || {}; el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: `translate(${dx * .45}px,${dy * .45 - (o.hop || 0)}px) scale(${o.s || 1.12})`, offset: .5 }, { transform: "none" }], { duration: o.dur || 300, easing: "cubic-bezier(.3,.1,.3,1)" }); };
  FX.center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; };
  FX.float = (x, y, text, color) => {
    const e = document.createElement("div"); e.className = "fxFloat"; e.textContent = text; e.style.left = x + "px"; e.style.top = y + "px"; e.style.setProperty("--c", color || "#fff");
    document.body.appendChild(e); setTimeout(() => e.remove(), 1300);
  };
  FX.banner = (text, color, sub) => {
    document.querySelectorAll(".fxBanner").forEach(e => e.remove());
    const e = document.createElement("div"); e.className = "fxBanner"; e.style.setProperty("--c", color || "#4d7cff");
    e.innerHTML = `<b></b>${sub ? "<small></small>" : ""}`; e.firstChild.textContent = text; if (sub) e.lastChild.textContent = sub;
    document.body.appendChild(e); setTimeout(() => e.remove(), 1600);
  };
  FX.flash = color => { const e = document.createElement("div"); e.className = "fxFlash"; e.style.setProperty("--c", color || "#fff"); document.body.appendChild(e); setTimeout(() => e.remove(), 550); };
  FX.shake = (el, amp) => {
    if (!el || !el.animate) return; const a = amp || 6, k = [];
    for (let i = 0; i < 8; i++) { const f = (1 - i / 8) * a; k.push({ transform: `translate(${R(-f, f)}px,${R(-f, f)}px)` }); }
    k.push({ transform: "none" }); el.animate(k, { duration: 380, easing: "linear" });
  };
  FX.countUp = (el, from, to, dur) => {
    if (!el || from === to) return; const t0 = performance.now(), d = dur || 600;
    (function f(t) { const p = Math.min(1, (t - t0) / d); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0);
    el.animate && el.animate([{ transform: "scale(1.5)", color: "#fff" }, { transform: "scale(1)" }], { duration: 500, easing: "cubic-bezier(.2,1.6,.4,1)" });
  };
  window.FX = FX;
})();
