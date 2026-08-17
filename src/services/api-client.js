/**
 * Клиент backend API (см. contracts/api.md). Все запросы подписаны Telegram initData.
 */

function initData() {
  // window.__DEV_INIT_DATA__ — заглушка из dev-mock.js для локального тестирования вне Telegram.
  return window.__DEV_INIT_DATA__ || window.Telegram?.WebApp?.initData || "";
}

// В проде frontend и backend делят один origin (относительные пути). Для локальной разработки,
// когда backend поднят на другом порту, базовый URL можно передать через ?api=..., иначе
// используются относительные пути без изменений (см. dev-mock.js).
function apiBaseUrl() {
  return window.__API_BASE_URL__ || "";
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `tma ${initData()}`,
      ...(options.headers || {}),
    },
  });
  if (!response.ok && response.status !== 409) {
    throw new Error(`Request to ${path} failed with ${response.status}`);
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
