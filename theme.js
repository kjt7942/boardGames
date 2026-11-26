/* 공용 테마: 보라빛 카툰 스타일 (게임 시작 카드 · 규칙/결과 창 · 게임 화면 톤)
 * 각 게임 페이지에서 <script src="../theme.js"></script> 로 불러옵니다.
 * #setup 안의 기존 요소(id)는 그대로 두고 감싸거나 옮기기만 하므로 게임 로직은 바뀌지 않아요. */
(function () {
  if (window.BGTHEME) return;
  const SRC = (document.currentScript && document.currentScript.src) || location.href;
  const BASE = SRC.replace(/theme\.js.*$/, "");
  const IMG = n => BASE + "img/" + n + ".webp";
  // 게임 정보: t=제목(흰/금 두 부분), ban=배너 그림, c=문구 2줄, intro=소개, how=플레이 방식, pl=인원, d=난이도(1~3), tm=시간
  const META = {
    "magic-labyrinth": { t: ["마법의", "미로"], ic: "🧙", ban: "ban_maze", baked: 1, intro: "보이지 않는 벽을 기억하며 미로를 탐험하고, 마법 심볼을 먼저 모으세요!", how: "주사위 수만큼 이동 · 벽에 부딪히면 처음 자리로", pl: "2~4명", d: 2, tm: "20분" },
    "wall-go": { b: "ban_wallgo", t: ["벽", "바둑"], ic: "🧱", c: ["벽을 세워", "땅을 차지하세요!"], intro: "말을 움직이고 벽을 세워 더 넓은 영역을 차지하는 전략 대결!", how: "이동 후 벽 세우기 · 막힌 영역이 내 땅", pl: "2~3명", d: 3, tm: "15분" },
    "janggi": { b: "ban_janggi", t: ["", "장기"], ic: "♟️", art: "janggi", c: ["초와 한의", "한판 승부!"], intro: "차·포·마·상으로 상대 왕을 외통에 몰아넣는 우리 전통 장기!", how: "번갈아 기물 이동 · 장군을 피할 수 없으면 승리", pl: "2명 (1:1 대전)", d: 3, tm: "20분" },
    "baduk": { b: "ban_baduk", t: ["", "바둑"], ic: "⚫", art: "baduk", c: ["한 수 한 수", "집을 넓혀요!"], intro: "돌을 놓아 더 넓은 집을 차지하는 바둑. 9줄로 가볍게, 19줄로 본격적으로!", how: "번갈아 착수 · 둘러싼 돌은 따냄 · 집이 많으면 승리", pl: "2명 (1:1 대전)", d: 3, tm: "20분" },
    "omok": { b: "ban_omok", t: ["", "오목"], ic: "⚪", c: ["다섯 개를", "먼저 이어요!"], intro: "가로·세로·대각선으로 먼저 다섯 돌을 이으면 승리! 쉽고 빠른 한 판.", how: "번갈아 돌 놓기 · 5개 연속이면 승리", pl: "2명 (1:1 대전)", d: 1, tm: "10분" },
    "chess": { b: "ban_chess", t: ["", "체스"], ic: "♞", art: "chess", c: ["킹을 지키고", "체크메이트!"], intro: "킹을 지키며 상대 킹을 체크메이트로 몰아넣는 세계적인 전략 게임.", how: "번갈아 기물 이동 · 캐슬링·앙파상·프로모션", pl: "2명 (1:1 대전)", d: 3, tm: "20분" },
    "onecard": { b: "ban_onecard", t: ["원", "카드"], ic: "🃏", art: "th_cards", c: ["손패를 먼저", "비우세요!"], intro: "같은 무늬·숫자로 손패를 먼저 비우세요. 공격 카드와 기술 카드로 역전!", how: "같은 무늬/숫자 내기 · 공격(2·A·조커) · J·Q·K·7", pl: "2~4명", d: 1, tm: "10분" },
    "thief": { b: "ban_thief", t: ["도둑", "잡기"], ic: "🦹", art: "th_cards", c: ["조커를 피해", "짝을 맞춰요!"], intro: "짝을 버리고 상대 카드를 뽑아요. 마지막까지 조커를 들고 있으면 도둑!", how: "짝 버리기 · 옆 사람 카드 뽑기", pl: "2~4명", d: 1, tm: "5분" },
    "blackjack": { b: "ban_blackjack", t: ["블랙", "잭"], ic: "♠️", art: "th_cards", c: ["21에 가깝게!", "딜러를 이겨요"], intro: "카드 합을 21에 가깝게! 딜러를 이겨 칩을 모으는 8판 승부.", how: "베팅 · 히트/스탠드/더블 · 21 넘으면 버스트", pl: "1~4명", d: 2, tm: "15분" },
    "minhwatu": { b: "ban_minhwatu", t: ["민", "화투"], ic: "🎴", c: ["같은 달끼리", "맞춰 먹어요!"], intro: "같은 달 화투를 맞춰 먹고 광·열·띠·약 점수로 겨뤄요.", how: "같은 달 맞춰 먹기 · 족보(약) 점수", pl: "2~3명", d: 2, tm: "10분" },
    "matgo": { b: "ban_matgo", t: ["", "맞고"], ic: "🌸", c: ["고? 스톱?", "화투 2인 대결!"], intro: "뻑·따닥·쪽·쓸! 7점이 넘으면 고 또는 스톱을 외치는 화투 대결.", how: "같은 달 먹기 · 7점부터 고/스톱", pl: "2명 (1:1 대전)", d: 2, tm: "10분" },
    "codebreak": { b: "ban_codebreak", t: ["코드", "추리"], ic: "🔐", c: ["숨은 숫자를", "맞혀 보세요!"], intro: "상대의 숨은 숫자 타일을 추리로 맞혀 모두 공개시키면 승리!", how: "타일 고르고 숫자 맞히기 · 틀리면 내 타일 공개", pl: "2~4명", d: 2, tm: "15분" },
    "memory": { b: "ban_memory", t: ["짝", "맞추기"], ic: "🐾", c: ["같은 그림을", "찾아라!"], intro: "같은 그림 두 장을 찾아라! 기억력으로 겨루는 카드 뒤집기.", how: "두 장 뒤집기 · 짝이면 한 번 더", pl: "1~4명", d: 1, tm: "10분" },
  };
  const key = location.pathname.split("/").find(p => META[p]);
  const M = META[key];
  window.BGTHEME = { META, IMG, key };
  if (!M) return;

  // 글꼴 (제목용 둥근 글꼴)
  const fl = document.createElement("link"); fl.rel = "stylesheet"; fl.href = "https://fonts.googleapis.com/css2?family=Jua&display=swap"; document.head.appendChild(fl);

  const P = "html body ";
  const css = `
${P}{background:radial-gradient(ellipse at 50% -10%,#7b4dff 0%,#4a23b8 32%,#2a1270 62%,#160a3d 100%) fixed!important;color:#f3efff}
html body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:-1;opacity:.55;background-image:radial-gradient(1.5px 1.5px at 12% 18%,#fff,transparent),radial-gradient(1px 1px at 72% 12%,#fff,transparent),radial-gradient(1.5px 1.5px at 88% 42%,#fff,transparent),radial-gradient(1px 1px at 30% 70%,#fff,transparent),radial-gradient(1.5px 1.5px at 55% 88%,#fff,transparent),radial-gradient(1px 1px at 8% 92%,#fff,transparent);animation:tmTw 4s ease-in-out infinite alternate}
@keyframes tmTw{to{opacity:.2}}
${P}button{background:linear-gradient(180deg,#b27bff,#7c3aed 60%,#6a2bd9);color:#fff;border-radius:14px;box-shadow:inset 0 2px 0 #ffffff55,0 4px 0 #4c1d95,0 6px 12px #0005;text-shadow:0 1px 0 #0004;transition:transform .1s}
${P}button:active:not(:disabled){transform:translateY(3px);box-shadow:inset 0 2px 0 #ffffff55,0 1px 0 #4c1d95}
${P}button.sec{background:linear-gradient(180deg,#ffffff2a,#ffffff10);box-shadow:inset 0 1px 0 #ffffff33,0 3px 0 #0004}
${P}#menu button{background:linear-gradient(160deg,#9b6bff,#5b21b6);border:3px solid #fff;box-shadow:0 4px 0 #3b0f8c,0 6px 14px #0006;width:46px;height:46px}
${P}.panel,${P}.seat{background:linear-gradient(160deg,#ffffff1c,#1c0b4a99)!important;backdrop-filter:blur(6px);box-shadow:inset 0 1px 0 #ffffff26,0 6px 18px #0005}
${P}#bigmsg{background:linear-gradient(180deg,#2b1270e6,#1a0a4ae6);border-radius:20px;box-shadow:inset 0 1px 0 #ffffff26,0 6px 18px #0006;font-weight:800}
${P}.felt{background:radial-gradient(ellipse at 50% 50%,#6d3fe055 0%,#3a1a9a33 45%,transparent 72%);border-radius:28px}
${P}.ov{background:#12063acc!important;backdrop-filter:blur(6px)}
/* ── 창(시작·규칙·결과) ── */
${P}.ov .card,${P}.ov .cd{background:linear-gradient(180deg,#5d2fd0 0%,#3d1a9c 26%,#2b0f78 100%);border:4px solid #9a6bff;border-radius:28px;box-shadow:0 0 0 3px #3b0f8c,0 0 40px #8b5cf688,0 20px 50px #000a;color:#f3efff;text-align:left}
${P}.ov .card h2,${P}.ov .cd h2{font-family:"Jua",system-ui,sans-serif;font-weight:400;font-size:28px;text-align:center;color:#fff;text-shadow:0 3px 0 #3b0f8c,0 0 14px #b27bff}
${P}.ov .rules li{line-height:1.6}
${P}.ov .note{background:#ffffff12;border-radius:12px;padding:8px 10px}
${P}#win .card,${P}#win .cd{text-align:center}
${P}#againBtn,${P}#winHome,${P}#ruleClose{font-family:"Jua",system-ui,sans-serif;font-weight:400;font-size:20px;border-radius:999px}
/* 시작 카드 */
${P}.ov .tmCard{padding:0 0 14px;max-width:440px;overflow-x:hidden}
.tmHead{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:8px;padding:12px 12px 10px;background:linear-gradient(180deg,#7a45ff,#5527d4);border-bottom:3px solid #9a6bff;box-shadow:0 6px 14px #0004}
.tmHead .ic{width:46px;height:46px;flex:none;border-radius:50%;display:grid;place-items:center;font-size:26px;background:radial-gradient(circle at 35% 30%,#fff6,transparent 55%),linear-gradient(160deg,#4fb3ff,#2a5fe0);border:3px solid #fff;box-shadow:0 3px 0 #1d3f99}
.tmHead h2{flex:1;margin:0!important;font-size:clamp(26px,7.5vw,34px)!important;line-height:1.05;text-align:center}
.tmHead h2 em{font-style:normal;color:#ffd84d;text-shadow:0 3px 0 #b86b00,0 0 14px #ffb800}
html body .tmHead .x{width:44px;height:44px;flex:none;border-radius:50%;padding:0;font-size:22px;border:3px solid #fff;background:linear-gradient(160deg,#9b6bff,#5b21b6)}
.tmBan{position:relative;margin:12px 12px 0;border-radius:20px;overflow:hidden;aspect-ratio:848/392;border:3px solid #ffffff55;box-shadow:0 8px 20px #0006;background:#4fa3ff}
.tmBan img{width:100%;height:100%;object-fit:cover;display:block;animation:tmZoom 9s ease-in-out infinite alternate}
@keyframes tmZoom{to{transform:scale(1.07)}}
.tmBan img.mas{position:absolute;left:0;top:0;width:auto;height:100%;object-fit:cover;-webkit-mask-image:linear-gradient(90deg,#000 62%,transparent);mask-image:linear-gradient(90deg,#000 62%,transparent);animation:none}
.tmBan.art .mas{display:none}
.tmBan .badge{position:absolute;left:6%;top:50%;transform:translateY(-50%);font-size:clamp(54px,17vw,84px);filter:drop-shadow(0 6px 8px #0007);animation:tmBob 2.6s ease-in-out infinite}
.tmBan.art .badge{display:none}
@keyframes tmBob{50%{transform:translateY(-6px) rotate(-3deg)}}
.tmBan.art .mas,.tmBan.mascot .badge{display:none}
.tmBan .bub{position:absolute;right:4%;top:50%;transform:translateY(-50%) rotate(-3deg);max-width:58%;word-break:keep-all;text-align:center;font-family:"Jua",system-ui,sans-serif;font-size:clamp(17px,5vw,25px);line-height:1.15;color:#fff;background:linear-gradient(160deg,#3d5bff,#2a2fbf);padding:10px 14px;border-radius:18px;border:3px solid #fff;box-shadow:0 5px 0 #1a1f7a,0 8px 16px #0006;text-shadow:0 2px 0 #0005}
.tmBan .bub b{display:block;color:#ffd84d;font-weight:400;text-shadow:0 2px 0 #a86200}
.tmSec{margin:12px 12px 0;padding:12px 14px;border-radius:18px;background:linear-gradient(160deg,#ffffff16,#1c0b4a66);box-shadow:inset 0 1px 0 #ffffff22}
.tmSec .h{display:inline-flex;align-items:center;gap:6px;font-family:"Jua",system-ui,sans-serif;font-size:20px;color:#fff;margin-bottom:4px}
.tmSec p{margin:0;font-size:14.5px;line-height:1.55;color:#e9e2ff}
.tmGrid{display:grid;grid-template-columns:repeat(3,1fr);margin:10px 12px 0;border-radius:18px;background:linear-gradient(160deg,#ffffff16,#1c0b4a66);box-shadow:inset 0 1px 0 #ffffff22}
.tmGrid div{text-align:center;padding:10px 4px;font-size:12.5px;color:#cfc3ff}
.tmGrid div+div{border-left:1px solid #ffffff1f}
.tmGrid b{display:block;margin-top:3px;font-family:"Jua",system-ui,sans-serif;font-weight:400;font-size:19px;color:#fff}
.tmGrid .st{color:#ffd84d;letter-spacing:1px;text-shadow:0 2px 0 #a86200}.tmGrid .st i{font-style:normal;color:#ffffff40;text-shadow:none}
.tmHow{margin:10px 12px 0;padding:10px 14px;border-radius:16px;background:#1c0b4a88;font-size:13px;color:#e9e2ff;display:flex;gap:8px;align-items:center;box-shadow:inset 0 0 0 1px #ffffff14}
.tmHow b{flex:none;color:#fff;font-family:"Jua",system-ui,sans-serif;font-weight:400;font-size:16px}
.tmRow{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:8px 12px 0;padding:8px 10px;border-radius:16px;background:#1c0b4a88;box-shadow:inset 0 0 0 1px #ffffff14}
.tmRow .k{flex:0 0 auto;min-width:86px;display:flex;align-items:center;gap:6px;line-height:1.15;font-family:"Jua",system-ui,sans-serif;font-size:16px;color:#fff}
.tmRow .k i{font-style:normal;font-size:20px}.tmRow .k small{display:block;font-family:system-ui,sans-serif;font-size:11px;color:#cfc3ff}
html body .tmRow .opt{flex:1 1 210px;margin:0!important;gap:6px;flex-wrap:wrap}
html body .tmRow .opt button{flex:1;min-width:58px;border-radius:999px;padding:9px 6px;font-size:14px;background:#ffffff14;box-shadow:inset 0 0 0 1px #ffffff1f}
html body .tmRow .opt button.on{background:linear-gradient(180deg,#b27bff,#7c3aed);box-shadow:inset 0 2px 0 #ffffff55,0 3px 0 #4c1d95}
.tmCard .tmSub{margin:8px 14px 0;font-size:12.5px;color:#cfc3ff;text-align:center}
html body .tmCard #olNote,html body .tmCard #onNote{margin:6px 14px 0;text-align:center}
html body #startBtn.tmStart{position:sticky;bottom:10px;z-index:4;display:block;width:calc(100% - 40px)!important;margin:14px auto 4px!important;padding:16px!important;border-radius:999px;font-family:"Jua",system-ui,sans-serif;font-weight:400;font-size:26px;background:linear-gradient(180deg,#c08bff,#8b4dff 45%,#6a2bd9);box-shadow:inset 0 3px 0 #ffffff66,0 6px 0 #4c1d95,0 10px 24px #8b5cf688;animation:tmPulse 1.8s ease-in-out infinite}
html body #startBtn.tmStart::before{content:"▶ "}
@keyframes tmPulse{50%{box-shadow:inset 0 3px 0 #ffffff66,0 6px 0 #4c1d95,0 10px 34px #b27bffcc}}
.tmWinM{display:block;width:min(64%,220px);margin:-6px auto 4px;filter:drop-shadow(0 8px 14px #0008);animation:tmPop .6s cubic-bezier(.2,1.6,.4,1)}
@keyframes tmPop{from{transform:scale(.3) rotate(-10deg);opacity:0}}
.tmLeaf{position:absolute;bottom:-6px;font-size:40px;pointer-events:none;filter:drop-shadow(0 3px 4px #0006)}
`;
  const st = document.createElement("style"); st.id = "bgTheme"; st.textContent = css;
  const put = () => document.head.appendChild(st); put();

  function stars(n) { return "★".repeat(n) + `<i>${"☆".repeat(3 - n)}</i>`; }
  const LBL_IC = { "플레이 방식": "🎮", "플레이어": "👥", "실력": "📶", "모드": "🎮", "인원": "👥", "난이도": "📶", "판 크기": "🧩", "내 돌": "⚫", "내 진영": "🏯", "내 색": "🎨", "선공": "🎲", "판": "🧩" };
  function enhance() {
    const ov = document.getElementById("setup"); if (!ov || ov.dataset.tm) return;
    const card = ov.querySelector(".card,.cd"); if (!card) return;
    ov.dataset.tm = 1; card.classList.add("tmCard");
    const h2 = card.querySelector("h2");
    const head = document.createElement("div"); head.className = "tmHead";
    head.innerHTML = `<span class="ic">${M.ic}</span><h2>${M.t[0] ? M.t[0] + " " : ""}<em>${M.t[1]}</em></h2><button class="x" type="button" title="게임 목록">✕</button>`;
    head.querySelector(".x").onclick = () => { const hb = document.getElementById("homeBtn"); if (hb && hb.offsetParent !== null) hb.click(); else location.href = BASE; };
    // 원래 부제(h2 다음 작은 설명)는 작게 유지
    const sub = h2 && h2.nextElementSibling && !h2.nextElementSibling.classList.contains("lbl") && h2.nextElementSibling.tagName === "DIV" ? h2.nextElementSibling : null;
    if (h2) h2.replaceWith(head); else card.prepend(head);
    const ban = document.createElement("div");
    if (M.baked) { ban.className = "tmBan art"; ban.innerHTML = `<img src="${IMG(M.ban)}" alt="">`; }
    else if (M.b) { ban.className = "tmBan art"; ban.innerHTML = `<img src="${IMG(M.b)}" alt=""><div class="bub">${M.c[0]}<b>${M.c[1]}</b></div>`; }
    else if (M.art) { ban.className = "tmBan art"; ban.innerHTML = `<img src="${IMG(M.art)}" alt=""><div class="bub">${M.c[0]}<b>${M.c[1]}</b></div>`; }
    else { ban.className = "tmBan"; ban.style.background = "radial-gradient(circle at 80% 30%,#ffffff55,transparent 40%),linear-gradient(160deg,#7fd0ff,#4f8dff 55%,#6a4cff)"; ban.innerHTML = `<img class="mas" src="${IMG("mascot")}" alt=""><div class="bub">${M.c[0]}<b>${M.c[1]}</b></div>`; }
    const intro = document.createElement("div"); intro.className = "tmSec"; intro.innerHTML = `<div class="h">🎮 게임 소개</div><p>${M.intro}</p>`;
    const grid = document.createElement("div"); grid.className = "tmGrid";
    grid.innerHTML = `<div>👥 플레이어 수<b>${M.pl.replace(/ \(.*/, "")}</b></div><div>⭐ 난이도<b class="st">${stars(M.d)}</b></div><div>⏱ 예상 시간<b>${M.tm}</b></div>`;
    const how = document.createElement("div"); how.className = "tmHow"; how.innerHTML = `<b>▶ 플레이 방식</b><span>${M.how}</span>`;
    head.after(ban); ban.after(intro); intro.after(grid); grid.after(how);
    if (sub) { sub.className = "tmSub"; sub.removeAttribute("style"); how.after(sub); }
    // 옵션: .lbl + 다음 .opt → 한 줄(row)
    card.querySelectorAll(".lbl").forEach(l => {
      const o = l.nextElementSibling; if (!o || !o.classList.contains("opt")) return;
      const row = document.createElement("div"); row.className = "tmRow";
      const t = l.textContent.trim(); const ic = LBL_IC[t] || Object.entries(LBL_IC).find(([k]) => t.includes(k))?.[1] || "⚙️";
      l.before(row); const m2 = t.match(/^(.*?)\s*\((.*)\)\s*$/); row.innerHTML = `<span class="k"><i>${ic}</i><span>${m2 ? m2[1] + "<small>(" + m2[2] + ")</small>" : t}</span></span>`; row.appendChild(o); l.remove();
    });
    const sb = document.getElementById("startBtn"); if (sb) sb.classList.add("tmStart");
    // 첫 화면 축하 반짝이
    if (window.FX) setTimeout(() => { const r = ban.getBoundingClientRect(); if (r.width) FX.burst(r.left + r.width / 2, r.top + r.height / 2, { n: 22, color: ["#ffd84d", "#fff", "#c08bff"], speed: 6, g: .05, size: 5, life: 45, shape: "star" }); }, 350);
  }
  // 결과 창: 이기면 트로피 마스코트, 지면 '다음엔 이긴다!' 마스코트
  function winMascot() {
    const w = document.getElementById("win"); if (!w || w.classList.contains("hide")) return;
    const card = w.querySelector(".card,.cd"); if (!card) return;
    const t = (card.querySelector("h2") || card).textContent;
    const kind = /무승부|🤝/.test(t) ? "" : /🎉|승리했|이겼|1등|축하/.test(t) ? "win" : "lose";
    let m = card.querySelector(".tmWinM");
    if (!kind) { if (m) m.remove(); return; }
    if (!m) { m = document.createElement("img"); m.className = "tmWinM"; card.prepend(m); }
    if (m.dataset.k !== kind) { m.dataset.k = kind; m.src = IMG(kind + "_mascot"); }
  }
  new MutationObserver(winMascot).observe(document.documentElement, { attributes: true, attributeFilter: ["class"], subtree: true, childList: true, characterData: true });
  // cardkit 게임은 화면을 나중에 만들기 때문에 지켜보다가 적용
  const tryAll = () => { enhance(); if (st.parentNode !== document.head || document.head.lastElementChild !== st) put(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tryAll); else tryAll();
  new MutationObserver(() => { if (!document.querySelector("#setup[data-tm]")) enhance(); }).observe(document.documentElement, { childList: true, subtree: true });
})();
