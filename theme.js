/* 홈과 게임 설정에서 같은 게임 정보와 이미지를 사용합니다. */
(() => {
  const base = new URL("./", document.currentScript.src);
  const image = name => new URL("img/" + name + ".webp", base).href;
  const games = [
    { id: "magic-labyrinth", name: "마법의 미로", category: "보드", thumb: "th_maze", banner: "ban_maze", players: "2–4명", minutes: 20, online: [2, 3, 4], icon: "🧙", description: "보이지 않는 벽을 기억해 마법 심볼을 모으세요. 심볼 5개를 먼저 모으면 이겨요." },
    { id: "wall-go", name: "벽바둑", category: "보드", thumb: "th_wallgo", banner: "ban_wallgo", players: "2–3명", minutes: 15, online: [2, 3], icon: "🧱", description: "말을 움직이고 벽을 세워 상대보다 넓은 영역을 차지하세요." },
    { id: "janggi", name: "장기", category: "보드", thumb: "th_janggi", banner: "ban_janggi", players: "2명", minutes: 20, online: [2], icon: "♟️", description: "차·포·마·상으로 상대 왕을 외통에 몰아넣으세요. 아래쪽 초가 먼저 둡니다." },
    { id: "baduk", name: "바둑", category: "보드", thumb: "th_baduk", banner: "ban_baduk", players: "2명", minutes: 20, online: [2], icon: "⚫", description: "돌을 놓아 더 넓은 집을 차지하세요. 9줄, 13줄, 19줄에서 둘 수 있어요." },
    { id: "omok", name: "오목", category: "보드", thumb: "th_omok", banner: "ban_omok", players: "2명", minutes: 10, online: [2], icon: "⚪", description: "가로·세로·대각선으로 먼저 다섯 돌을 이으면 이겨요. 흑이 먼저 둡니다." },
    { id: "chess", name: "체스", category: "보드", thumb: "th_chess", banner: "ban_chess", players: "2명", minutes: 20, online: [2], icon: "♞", description: "킹을 지키며 상대 킹을 체크메이트에 몰아넣으세요. 백이 먼저 둡니다." },
    { id: "onecard", name: "원카드", category: "카드", thumb: "th_onecard", banner: "ban_onecard", players: "2–4명", minutes: 10, online: [2, 3, 4], icon: "🃏", description: "같은 무늬나 숫자의 카드를 내며 손패를 가장 먼저 비우세요." },
    { id: "thief", name: "도둑잡기", category: "카드", thumb: "th_thief", banner: "ban_thief", players: "2–4명", minutes: 5, online: [2, 3, 4], icon: "🦹", description: "상대 카드를 뽑아 짝을 버리세요. 마지막까지 조커를 들고 있으면 도둑이에요." },
    { id: "blackjack", name: "블랙잭", category: "카드", thumb: "th_blackjack", banner: "ban_blackjack", players: "1–4명", minutes: 15, online: [2, 3, 4], icon: "♠️", description: "카드 합을 21에 가깝게 맞춰 딜러를 이기세요. 여덟 판 동안 칩을 모아요." },
    { id: "minhwatu", name: "민화투", category: "화투", thumb: "th_minhwatu", banner: "ban_minhwatu", players: "2–3명", minutes: 10, online: [2, 3], icon: "🎴", description: "같은 달의 패를 맞춰 먹고 광·열·띠·약 점수로 겨뤄요." },
    { id: "matgo", name: "맞고", category: "화투", thumb: "th_matgo", banner: "ban_matgo", players: "2명", minutes: 10, online: [2], icon: "🌸", description: "같은 달의 패를 맞춰 점수를 모으세요. 7점부터 고 또는 스톱을 선택해요." },
    { id: "codebreak", name: "코드 추리", category: "추리", thumb: "th_codebreak", banner: "ban_codebreak", players: "2–4명", minutes: 15, online: [2, 3, 4], icon: "🔐", description: "상대의 숨은 숫자 타일을 추리해 모두 공개시키세요." },
    { id: "memory", name: "짝 맞추기", category: "추리", thumb: "th_memory", banner: "ban_memory", players: "1–4명", minutes: 10, online: [2, 3, 4], icon: "🐾", description: "같은 그림 두 장을 찾아요. 짝을 맞히면 한 번 더 뒤집을 수 있어요." }
  ];
  window.BGTHEME = { games, image };

  const gamePath = location.pathname.slice(base.pathname.length).split("/")[0];
  const game = games.find(({ id }) => id === gamePath);
  const setup = document.getElementById("setup");
  if (!game || !setup) return;

  const byId = id => document.getElementById(id);
  const element = (tag, className) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  };
  const home = byId("homeBtn");
  const goHome = () => home.click();
  if (!home.onclick) home.onclick = () => { location.href = base.href; };
  home.style.removeProperty("display");

  document.body.classList.add("bg-game");
  const stage = byId("stage");
  stage.tabIndex = -1;
  stage.setAttribute("role", "region");
  stage.setAttribute("aria-label", game.name + " 플레이 화면");

  const menu = byId("menu");
  if (!stage.querySelector(".p-tr")) {
    const stageTitle = element("h1", "bg-stage-title");
    stageTitle.textContent = game.name;
    menu.prepend(stageTitle);
  }
  const menuNames = { homeBtn: "게임 목록", fsBtn: "전체화면", sndBtn: "효과음", ruleBtn: "게임 규칙", newBtn: "새 게임" };
  for (const button of menu.querySelectorAll("button")) {
    button.setAttribute("aria-label", menuNames[button.id]);
    button.title = menuNames[button.id];
  }
  const sound = byId("sndBtn");
  const syncSound = () => sound.setAttribute("aria-pressed", String(sound.textContent.trim() === "🔊"));
  syncSound();
  new MutationObserver(syncSound).observe(sound, { childList: true, subtree: true, characterData: true });

  const message = byId("bigmsg");
  if (message) message.setAttribute("role", "status");

  const setupCard = setup.firstElementChild;
  const title = setupCard.querySelector("h2");
  const intro = title.nextElementSibling;
  const start = byId("startBtn");
  const settings = element("div", "bg-settings");
  settings.append(...Array.from(setupCard.children).filter(node => node !== title && node !== intro && node !== start));

  const header = element("div", "bg-dialog-header");
  title.textContent = game.name;
  title.id = "setup-title";
  const back = element("button", "bg-back sec");
  back.type = "button";
  back.textContent = "‹";
  back.title = "게임 목록";
  back.setAttribute("aria-label", back.title);
  back.onclick = goHome;
  const rulesButton = element("button", "sec bg-rules-button");
  rulesButton.type = "button";
  rulesButton.textContent = "규칙 보기";
  rulesButton.onclick = () => byId("ruleBtn").click();
  header.append(back, title, rulesButton);

  const layout = element("div", "bg-setup-layout");
  const overview = element("div", "bg-game-overview");
  const cover = element("img", "bg-game-cover");
  cover.src = image(game.id === "magic-labyrinth" ? game.thumb : game.banner);
  cover.alt = "";
  const details = element("div", "bg-game-details");
  const meta = element("p", "bg-game-meta");
  meta.textContent = game.category + " · " + game.players + " · 약 " + game.minutes + "분";
  const description = element("p", "bg-game-description");
  description.textContent = game.description;
  details.append(meta, description);
  overview.append(cover, details);
  layout.append(overview, settings);

  const footer = element("div", "bg-dialog-footer");
  start.removeAttribute("style");
  footer.append(start);
  setupCard.classList.add("bg-setup-card");
  setupCard.replaceChildren(header, layout, footer);

  const choiceGroups = settings.querySelectorAll(".opt");
  const syncChoices = () => {
    for (const group of choiceGroups) {
      for (const button of group.querySelectorAll("button")) {
        button.setAttribute("aria-pressed", String(button.classList.contains("on")));
      }
    }
  };
  const choiceObserver = new MutationObserver(syncChoices);
  for (const group of choiceGroups) {
    const label = group.previousElementSibling;
    if (label?.classList.contains("lbl")) {
      if (group.id === "optMode") label.textContent = "플레이 방식";
      label.id ||= group.id + "-label";
      group.setAttribute("role", "group");
      group.setAttribute("aria-labelledby", label.id);
    }
    choiceObserver.observe(group, { subtree: true, attributes: true, attributeFilter: ["class"] });
  }
  syncChoices();

  const win = byId("win");
  const result = win.firstElementChild;
  const resultTitle = result.querySelector("#wt, .wt:not(.rot)");
  const again = byId("againBtn");
  let resultHome = byId("winHome");
  if (!resultHome) {
    resultHome = element("button", "sec");
    resultHome.id = "winHome";
    resultHome.type = "button";
  }
  resultHome.textContent = "게임 목록";
  resultHome.onclick = goHome;
  resultHome.removeAttribute("style");
  again.removeAttribute("style");
  const resultActions = element("div", "bg-result-actions");
  result.append(resultActions);
  resultActions.append(resultHome, again);

  const mascot = element("img", "bg-result-mascot");
  mascot.alt = "";
  mascot.hidden = true;
  result.prepend(mascot);
  const syncResult = () => {
    const text = resultTitle.textContent;
    const kind = /무승부|🤝/.test(text) ? "draw"
      : /게임 종료|나갔어요/.test(text) ? ""
      : /😢|😵|🦹|컴퓨터 승리|졌어요|기권했어요|패배/.test(text) ? "lose"
      : /🏆|🎉|승리|이겼|1등|축하/.test(text) ? "win" : "";
    mascot.hidden = !kind;
    if (kind && mascot.dataset.kind !== kind) {
      mascot.src = image(kind + "_mascot");
      mascot.dataset.kind = kind;
    }
  };
  new MutationObserver(syncResult).observe(resultTitle, { childList: true, characterData: true, subtree: true });

  const rules = byId("rules");
  const dialogs = [setup, byId("promo"), rules, win].filter(Boolean);
  const dialogTitles = new Map(dialogs.map(dialog => [
    dialog, dialog === win ? resultTitle : dialog.querySelector("h2")
  ]));
  for (const [dialog, heading] of dialogTitles) {
    heading.id ||= dialog.id + "-title";
    heading.tabIndex = -1;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", heading.id);
  }

  let activeDialog;
  const returnFocus = new WeakMap();
  function syncDialogs() {
    const next = dialogs.findLast(dialog => !dialog.classList.contains("hide"));
    if (activeDialog === next) return;
    const previous = activeDialog;
    const focused = document.activeElement;
    if (next && !next.contains(focused) && (!previous || !previous.classList.contains("hide"))) {
      returnFocus.set(next, focused);
    }
    stage.inert = Boolean(next);
    for (const dialog of dialogs) dialog.inert = dialog !== next;
    activeDialog = next;
    const target = previous && returnFocus.get(previous);
    if (target?.isConnected && (next ? next.contains(target) : stage.contains(target))) {
      target.focus({ preventScroll: true });
    } else if (next) {
      dialogTitles.get(next).focus({ preventScroll: true });
    } else if (previous) {
      stage.focus({ preventScroll: true });
    }
  }

  const dialogObserver = new MutationObserver(syncDialogs);
  for (const dialog of dialogs) dialogObserver.observe(dialog, { attributes: true, attributeFilter: ["class"] });
  syncDialogs();

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && activeDialog === rules && rules.contains(document.activeElement)) {
      byId("ruleClose").click();
    }
  });
})();
