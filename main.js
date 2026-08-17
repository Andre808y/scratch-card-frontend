/**
 * Точка входа Mini App: оркестрирует экраны loading → scratch → cooldown
 * (см. quickstart.md, сценарии User Story 1 и 2).
 *
 * Экран scratch содержит и стирание карты, и сам приз: результат запрашивается у backend
 * сразу при переходе на этот экран и рендерится ПОД canvas (см. pages/result.js) — стирая
 * слой, пользователь физически открывает уже готовый приз, а не переходит на другой экран.
 */

import { apiClient } from "./services/api-client.js";
import { mountScratchCard } from "./scratch-card/scratch-card.js";
import { renderScratchReveal } from "./pages/result.js";
import { renderCooldown } from "./pages/cooldown.js";

const screens = {
  loading: document.getElementById("screen-loading"),
  scratch: document.getElementById("screen-scratch"),
  cooldown: document.getElementById("screen-cooldown"),
};

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.hidden = key !== name;
  });
}

async function startScratchCard(sessionId) {
  showScreen("scratch");
  const root = document.getElementById("scratch-card-root");
  const hint = document.getElementById("scratch-hint");

  const { body: result } = await apiClient.revealSession(sessionId);
  renderScratchReveal(root, result);

  mountScratchCard(root, {
    onScratched: () => {
      if (hint) hint.hidden = true;
    },
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

  const sessionId = status.active_session
    ? status.active_session.session_id
    : (await apiClient.createSession()).body.session_id;

  await startScratchCard(sessionId);
}

bootstrap().catch((error) => {
  console.error(error);
  showScreen("loading");
  screens.loading.querySelector(".hint").textContent =
    "Не удалось загрузить игру. Попробуй позже.";
});
