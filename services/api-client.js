/**
 * Клиент backend API (см. contracts/api.md). Все запросы подписаны Telegram initData.
 */

import { API_BASE_URL } from "../config.js";

function initData() {
  // window.__DEV_INIT_DATA__ — заглушка из dev-mock.js для локального тестирования вне Telegram.
  return window.__DEV_INIT_DATA__ || window.Telegram?.WebApp?.initData || "";
}

// Приоритет: ?api=... (только для локальной разработки, см. dev-mock.js) → config.js
// (прод-адрес backend на Render, см. ../config.js) → относительный путь как последний фолбэк.
function apiBaseUrl() {
  return window.__API_BASE_URL__ || API_BASE_URL || "";
}

async function request(path, options = {}) {
  const url = `${apiBaseUrl()}${path}`;
  const authHeader = `tma ${initData()}`;
  console.log("[diag] запрос:", url, "Authorization длина:", authHeader.length);

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
      ...(options.headers || {}),
    },
  });

  if (!response.ok && response.status !== 409) {
    // TODO(debug): текст ошибки от backend в сообщении — временно, для диагностики без консоли.
    const detail = await response.text().catch(() => "");
    console.log("[diag] ответ backend:", response.status, detail);
    throw new Error(`${path} -> ${response.status} ${detail}`);
  }
  return { status: response.status, body: await response.json() };
}

export const apiClient = {
  getStatus() {
    return request("/api/game/status");
  },
  createSession() {
    return request("/api/game/sessions", { method: "POST" });
  },
  revealSession(sessionId) {
    return request(`/api/game/sessions/${sessionId}/reveal`, { method: "POST" });
  },
};
