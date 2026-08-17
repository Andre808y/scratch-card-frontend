/**
 * Точка входа Mini App: оркестрирует экраны loading → scratch → result/cooldown
 * (см. quickstart.md, сценарии User Story 1 и 2).
 */

import { apiClient } from "./services/api-client.js";
import { mountScratchCard } from "./scratch-card/scratch-card.js";
import { renderResult } from "./pages/result.js";
import { renderCooldown } from "./pages/cooldown.js";

const screens = {
  loading: document.getElementById("screen-loading"),
  scratch: document.getElementById("screen-scratch"),
  result: document.getElementById("screen-result"),
  cooldown: document.getElementById("screen-cooldown"),
};

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.hidden = key !== name;
  });
}

// TODO(debug): временная on-screen диагностика бага "не удалось загрузить игру" на реальных
// устройствах, где нет доступа к консоли браузера. Убрать вместе с #debug-panel в index.html
// и .debug-panel в styles.css после того, как причина найдена и подтверждена.
function setDebugPanel(text) {
  const panel = document.getElementById("debug-panel");
  if (panel) panel.textContent = text;
}

function collectInitDataDiagnostics() {
  const webApp = window.Telegram?.WebApp;
  const rawInitData = window.__DEV_INIT_DATA__ || webApp?.initData || "";
  const lines = [
    "[DEBUG] initData:",
    `  window.Telegram есть: ${Boolean(window.Telegram)}`,
    `  window.Telegram.WebApp есть: ${Boolean(webApp)}`,
    `  initData пустой: ${rawInitData.length === 0}`,
    `  initData длина: ${rawInitData.length}`,
    `  platform: ${webApp?.platform ?? "—"}, version: ${webApp?.version ?? "—"}`,
  ];
  return { rawInitData, lines };
}

async function revealAndShowResult(sessionId) {
  const { body } = await apiClient.revealSession(sessionId);
  showScreen("result");
  renderResult(screens.result, body);
}

function startScratchCard(sessionId) {
  showScreen("scratch");
  const root = document.getElementById("scratch-card-root");
  mountScratchCard(root, {
    onScratched: () => revealAndShowResult(sessionId),
  });
}

async function bootstrap() {
  // В dev-режиме (?dev=1, вне Telegram) дожидаемся, пока dev-mock.js подготовит подписанный
  // initData, прежде чем делать первый запрос к API — в реальном Telegram-клиенте это уже
  // готовый resolved-промис (см. dev-mock.js).
  await window.__devMockReady;

  const { lines: initDataLines } = collectInitDataDiagnostics();
  console.log("[diag]", initDataLines.join("\n"));
  setDebugPanel([...initDataLines, "", "Запрос GET /api/game/status..."].join("\n"));

  window.Telegram?.WebApp?.ready?.();
  showScreen("loading");

  let status;
  try {
    const result = await apiClient.getStatus();
    status = result.body;
    setDebugPanel(
      [...initDataLines, "", `GET /status -> ${result.status}`, JSON.stringify(result.body)].join(
        "\n"
      )
    );
  } catch (error) {
    setDebugPanel([...initDataLines, "", "GET /status упал:", error.message].join("\n"));
    throw error;
  }

  if (!status.eligible && !status.active_session) {
    showScreen("cooldown");
    renderCooldown(screens.cooldown, { nextEligibleAt: status.next_eligible_at });
    return;
  }

  if (status.active_session) {
    startScratchCard(status.active_session.session_id);
    return;
  }

  const { body: session } = await apiClient.createSession();
  startScratchCard(session.session_id);
}

bootstrap().catch((error) => {
  console.error("[diag] bootstrap упал:", error);
  showScreen("loading");
  // TODO(debug): показываем техническую деталь прямо на экране, чтобы не нужен был доступ к
  // консоли браузера для первичной диагностики. Убрать текст ошибки из UI после отладки.
  screens.loading.querySelector(".hint").textContent =
    `Не удалось загрузить игру. ${error.message || error}`;
});
