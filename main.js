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

  window.Telegram?.WebApp?.ready?.();
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
  console.error(error);
  showScreen("loading");
  screens.loading.querySelector(".hint").textContent =
    "Не удалось загрузить игру. Попробуй позже.";
});
