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

  // TODO(debug): временная диагностика продакшен-бага "не удалось загрузить игру" — открой
  // консоль браузера (см. инструкцию в README) и пришли разработчику эти строки целиком.
  const webApp = window.Telegram?.WebApp;
  const rawInitData = window.__DEV_INIT_DATA__ || webApp?.initData || "";
  console.log("[diag] window.Telegram существует:", Boolean(window.Telegram));
  console.log("[diag] window.Telegram.WebApp существует:", Boolean(webApp));
  console.log("[diag] initData длина:", rawInitData.length);
  console.log("[diag] initData (сырое значение):", rawInitData);
  console.log("[diag] platform/version:", webApp?.platform, webApp?.version);

  webApp?.ready?.();
  showScreen("loading");

  const { body: status } = await apiClient.getStatus();

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
