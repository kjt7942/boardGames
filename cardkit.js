/* 카드·화투류 게임 공용 틀: 한 파일로 설정화면/규칙/결과/솔로(컴퓨터)/온라인(결정적 동기화)을 처리해요.
   게임은 def 객체만 만들어 CK.run(def) 하면 됩니다.
   def = { id,title,icon,color,rules:[html..],np:[2,3,4],levels:bool,
           init(seed,np)->S, turn(S)->다음에 입력할 플레이어(없으면 -1), apply(S,a), ai(S,p,lv)->a,
           click(S,me,dataset,ui)->a|'ui'|null, render(S,me,ui,names)->html, msg(S,me,names)->[text,cls],
           result(S,me,names)->[title,desc] }
   S 안에서 난수를 쓸 때는 CK.rnd(S)/CK.shuf(S,arr) (S.rs 는 init에서 seed로 시작) → 모든 기기에서 같은 결과 */
window.CK = (function () {
  const $ = (s, r = document) => r.querySelector(s);
  const SU = ["♠", "♥", "♦", "♣"], RK = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  function rnd(S) { let a = S.rs = (S.rs + 0x6D2B79F5) | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  function shuf(S, arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd(S) * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
  // 트럼프 카드 id: 0~51 (무늬 id/13: ♠♥♦♣, 숫자 id%13+1), 52·53 조커
  const suit = c => c >= 52 ? -1 : (c / 13) | 0, rank = c => c >= 52 ? 0 : c % 13 + 1;
  const red = c => c < 52 && (suit(c) === 1 || suit(c) === 2) || c === 53;
  function card(c, extra, data) {
    if (c < 0) return `<div class="pc back ${extra || ""}" ${data || ""}></div>`;
    if (c >= 52) return `<div class="pc joker ${c === 53 ? "red" : ""} ${extra || ""}" ${data || ""}><b>🃏</b><i>JOKER</i></div>`;
    return `<div class="pc ${red(c) ? "red" : ""} ${extra || ""}" ${data || ""}><b>${RK[rank(c)]}</b><i>${SU[suit(c)]}</i></div>`;
  }
  const CSS = `
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;height:100%;overflow:hidden}
body{background:radial-gradient(circle at 50% 40%,#1f5a45 0%,#10352a 60%,#08170f 100%);color:#e8eeff;font-family:system-ui,-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;user-select:none;touch-action:manipulation}
button{font:inherit;border:0;border-radius:12px;padding:10px 12px;background:#4d7cff;color:#fff;font-weight:700;cursor:pointer}
button:disabled{opacity:.3;cursor:default}button.sec{background:#ffffff22}
#stage{position:fixed;inset:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:6px;padding:8px}
#menu{display:flex;gap:8px;justify-content:center}
#menu button{width:44px;height:44px;border-radius:50%;padding:0;font-size:19px}
#table{min-height:0;overflow:auto;display:flex;flex-direction:column;gap:10px;align-items:stretch}
#bigmsg{white-space:pre-line;min-height:52px;display:flex;align-items:center;justify-content:center;text-align:center;border:3px solid var(--cc);border-radius:16px;background:#00000066;font-size:clamp(15px,2.2vw,26px);font-weight:800;padding:6px 12px;word-break:keep-all;line-height:1.3}
#bigmsg.bad{color:#ff9a9a}#bigmsg.good{color:#8dffb4}#bigmsg.warn{color:#ffd24d}
.ov{position:fixed;inset:0;background:#06100bee;display:flex;align-items:center;justify-content:center;z-index:50;padding:16px}
.ov.hide{display:none}
.cd{max-height:100%;overflow:auto;background:#1b2747;border:2px solid #4d7cff;border-radius:18px;padding:20px;max-width:420px;width:100%;text-align:center}
.cd h2{margin:0 0 4px}
.opt{display:flex;gap:6px;justify-content:center;margin:6px 0 14px}
.opt button{flex:1;background:#ffffff1a;padding:10px 4px;font-size:14px}.opt button.on{background:#4d7cff}
.lbl{font-size:13px;opacity:.75;margin-top:10px;text-align:left}
.rules ol{text-align:left;margin:8px 0 10px;padding-left:20px;font-size:13px;line-height:1.6}
.row{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center}
.seat{background:#00000055;border:3px solid #ffffff30;border-radius:14px;padding:6px 10px;text-align:center;min-width:92px}
.seat.cur{border-color:#ffd24d;box-shadow:0 0 16px #ffd24d88;background:#ffffff18}
.seat small{display:block;opacity:.8;font-size:12px}
.pc{width:var(--cw,56px);height:calc(var(--cw,56px)*1.45);background:#fff;color:#222;border-radius:8px;border:2px solid #0004;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;font-size:calc(var(--cw,56px)*.36);line-height:1;box-shadow:0 2px 6px #0007;position:relative}
.pc b{font-size:1.05em}.pc i{font-style:normal;font-size:1.1em}
.pc.red{color:#d8283b}
.pc.joker i{font-size:.4em;letter-spacing:.5px}
.pc.back{background:repeating-linear-gradient(45deg,#2a4d9a 0 6px,#1d377a 6px 12px);border:2px solid #fff}
.pc.ok{outline:3px solid #ffd24d;transform:translateY(-8px);cursor:pointer}
.pc.dim{opacity:.55}
.pc.sel{outline:3px solid #6cf;transform:translateY(-14px)}
.felt{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}
.hand{display:flex;flex-wrap:wrap;justify-content:center;gap:4px;padding:14px 4px 4px}
@keyframes pulse{to{opacity:.35}}.pulse{animation:pulse .7s infinite alternate}
@media (max-width:700px){:root{--cw:46px}}
`;
  function run(def) {
    document.title = def.title;
    const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    document.documentElement.style.setProperty("--cc", def.color || "#4d7cff");
    const lvHtml = def.levels ? `<div id="lvBox"><div class="lbl">난이도</div><div class="opt" id="optLv"><button data-v="easy">쉬움</button><button data-v="normal" class="on">보통</button><button data-v="hard">어려움</button></div></div>` : "";
    const npHtml = def.np.length > 1 ? `<div id="npBox"><div class="lbl">참가 인원 (나 + 컴퓨터)</div><div class="opt" id="optNp">${def.np.map((n, i) => `<button data-v="${n}"${i ? "" : ' class="on"'}>${n}명</button>`).join("")}</div></div>` : "";
    document.body.innerHTML = `
<div id="stage"><div id="menu">
 <button class="sec" id="homeBtn" title="게임 목록">🏠</button><button class="sec" id="fsBtn">⛶</button><button class="sec" id="ruleBtn">❓</button><button class="sec" id="newBtn">↻</button></div>
 <div id="table"></div><div id="bigmsg"></div></div>
<div class="ov" id="setup"><div class="cd"><h2>${def.icon} ${def.title}</h2>
 <div style="font-size:13px;opacity:.8">${def.tagline || ""}</div>
 <div class="lbl">모드</div><div class="opt" id="optMode"><button data-v="solo" class="on">🤖 혼자</button><button data-v="online">🌐 온라인</button></div>
 ${npHtml}${lvHtml}
 <div id="olNote" style="font-size:12px;color:#ffb3b3;min-height:16px"></div>
 <button id="startBtn" style="width:100%;margin-top:6px;padding:14px">게임 시작</button></div></div>
<div class="ov hide" id="rules"><div class="cd rules"><h2>${def.title} 규칙</h2><ol>${def.rules.map(r => `<li>${r}</li>`).join("")}</ol><button id="ruleClose" style="width:100%">닫기</button></div></div>
<div class="ov hide" id="win"><div class="cd"><h2 id="wt"></h2><div id="wd" style="margin:6px 0 14px;line-height:1.6"></div><button id="againBtn" style="width:100%;padding:14px">다시 하기</button></div></div>`;
    let S = null, me = 0, names = [], ctx = null, ui = {}, gen = 0;
    const sel = { mode: "solo", np: def.np[0], lv: "normal" };
    function draw() {
      $("#table").innerHTML = def.render(S, me, ui, names);
      const [t, c] = def.msg(S, me, names); const b = $("#bigmsg"); b.textContent = t; b.className = c || "";
    }
    function start(seed, n, nm) {
      S = def.init(seed, n); names = nm; ui = {}; gen++; $("#win").classList.add("hide"); draw(); next();
    }
    function next() {
      if (!S) return;
      const p = def.turn(S);
      if (p < 0) { const [t, d] = def.result(S, me, names); $("#wt").textContent = t; $("#wd").innerHTML = d; setTimeout(() => $("#win").classList.remove("hide"), 900); if (ctx) ctx.finish(); return; }
      if (!ctx && p !== me) {
        const g = gen;
        setTimeout(() => { if (g !== gen || !S || def.turn(S) !== p) return; act(def.ai(S, p, sel.lv)); }, 650 + ((Math.random() * 500) | 0));
      }
    }
    function act(a, remote) {
      if (!a) return;
      def.apply(S, a); if (ctx && !remote) ctx.send({ t: "a", a }); draw(); next();
    }
    $("#table").addEventListener("click", e => {
      const el = e.target.closest("[data-k]"); if (!el || !S || def.turn(S) !== me) return;
      const r = def.click(S, me, el.dataset, ui, names);
      if (r === "ui") draw(); else if (r) act(r);
    });
    function onNet(e) {
      if (e.t === "cfg") { start(e.seed, ctx.np, ctx.names); return; }
      if (e.t === "a" && S && def.turn(S) >= 0) act(e.a, true);
    }
    const again = () => { gen++; if (ctx) { ctx.leave(); ctx = null; } S = null; $("#win").classList.add("hide"); $("#setup").classList.remove("hide"); };
    $("#newBtn").onclick = again; $("#againBtn").onclick = again;
    $("#ruleBtn").onclick = () => $("#rules").classList.remove("hide");
    $("#ruleClose").onclick = () => $("#rules").classList.add("hide");
    function bindOpt(id, key, num) {
      const el = $(id); if (!el) return;
      el.addEventListener("click", e => {
        const b = e.target.closest("button"); if (!b) return;
        [...el.children].forEach(x => x.classList.remove("on")); b.classList.add("on"); sel[key] = num ? +b.dataset.v : b.dataset.v; sync();
      });
    }
    function sync() {
      const on = sel.mode === "online";
      const lv = $("#lvBox"); if (lv) lv.style.display = on ? "none" : "";
      const nb = $("#npBox"); if (nb) nb.style.display = on ? "none" : "";
      $("#startBtn").textContent = on ? "🌐 방 목록 열기" : "게임 시작";
      $("#olNote").textContent = on && !(window.BGNet && BGNet.configured) ? "온라인 서버 설정이 아직 안 되어 있어요" : "";
    }
    bindOpt("#optMode", "mode"); bindOpt("#optNp", "np", true); bindOpt("#optLv", "lv"); sync();
    $("#startBtn").onclick = () => {
      if (sel.mode === "online") {
        if (!window.BGNet) { $("#olNote").textContent = "온라인 모듈을 불러오지 못했어요 (저장소 주소로 열어 주세요)"; return; }
        $("#setup").classList.add("hide");
        BGNet.open({
          game: def.id, title: def.title, sizes: (def.onp || def.np).map(n => ({ np: n, label: n + "명" })),
          onStart: c => {
            ctx = c; me = c.me; $("#win").classList.add("hide"); S = null;
            $("#table").innerHTML = ""; $("#bigmsg").textContent = "방장이 시작하는 중…";
            c.onEvent = onNet;
            c.onLeft = (i, nm) => {
              if (!S || S.over) return; S.over = true; S.left = nm; S.leftIdx = i; S.done = true;
              $("#wt").textContent = "🚪 " + nm + " 님이 나갔어요"; $("#wd").textContent = "게임이 끝났어요";
              $("#win").classList.remove("hide"); gen++; ctx.finish();
            };
            if (c.isHost) { const seed = (Math.random() * 2 ** 31) | 0; c.send({ t: "cfg", seed }); start(seed, c.np, c.names); }
          },
          onClose: () => { $("#setup").classList.remove("hide"); }
        });
        return;
      }
      $("#setup").classList.add("hide"); ctx = null; me = 0;
      const n = sel.np; start((Math.random() * 2 ** 31) | 0, n, ["나", ...Array.from({ length: n - 1 }, (_, i) => "컴퓨터" + (i + 1))]);
    };
    (function () {
      const d = document, btn = $("#fsBtn"), isFs = () => !!(d.fullscreenElement || d.webkitFullscreenElement);
      btn.onclick = async () => { try { if (isFs()) await (d.exitFullscreen || d.webkitExitFullscreen).call(d); else { const f = d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen; if (!f) throw 0; await f.call(d.documentElement); } } catch (e) { $("#bigmsg").textContent = "이 환경에서는 전체화면을 쓸 수 없어요"; } };
      d.addEventListener("fullscreenchange", () => btn.textContent = isFs() ? "✕" : "⛶");
    })();
    $("#homeBtn").onclick = () => { location.href = "../"; };
  }
  return { run, rnd, shuf, card, suit, rank, red, SU, RK, $ };
})();
