/**
 * Dev-заглушка Telegram WebApp SDK — ТОЛЬКО для локального тестирования интерфейса в обычном
 * браузере, вне Telegram. Активируется явно параметром ?dev=1 в URL и только если реального
 * initData ещё нет (в настоящем Telegram-клиенте initData уже заполнен, и этот файл ничего не
 * трогает). Подписывает поддельный initData тем же алгоритмом, что и настоящий Telegram
 * (см. src/api/auth.py на backend), используя тестовый BOT_TOKEN — сервер должен быть запущен
 * с тем же значением BOT_TOKEN, иначе подпись не пройдёт проверку.
 */

const DEV_BOT_TOKEN = "test-bot-token";
const DEV_TELEGRAM_ID = 555000;

async function hmacSha256Hex(keyBytes, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function buildSignedInitData(telegramId, botToken) {
  const params = new URLSearchParams();
  params.set("auth_date", String(Math.floor(Date.now() / 1000)));
  params.set("user", JSON.stringify({ id: telegramId, first_name: "Dev" }));

  const sortedEntries = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = sortedEntries.map(([k, v]) => `${k}=${v}`).join("\n");

  // Тот же алгоритм, что и src/api/auth.py: secret_key = HMAC("WebAppData", bot_token),
  // hash = HMAC(secret_key, data_check_string).
  const secretKeyHex = await hmacSha256Hex(new TextEncoder().encode("WebAppData"), botToken);
  const secretKeyBytes = new Uint8Array(secretKeyHex.match(/.{2}/g).map((h) => parseInt(h, 16)));
  const hash = await hmacSha256Hex(secretKeyBytes, dataCheckString);

  params.set("hash", hash);
  return params.toString();
}

function isDevModeRequested() {
  return new URLSearchParams(window.location.search).get("dev") === "1";
}

// Позволяет указать адрес backend через ?api=http://host:port, когда frontend и backend подняты
// на разных портах локально (см. src/services/api-client.js). В проде параметр не передаётся,
// и используются относительные пути (один origin с backend).
const apiParam = new URLSearchParams(window.location.search).get("api");
if (apiParam) {
  window.__API_BASE_URL__ = apiParam;
}

async function activateDevMock() {
  // Namespace-объект, отдельный от window.Telegram.WebApp: свойства настоящего SDK (initData
  // и т. п.) в браузерах Telegram часто определены как non-configurable геттеры, и попытка их
  // переопределить бросает исключение. Поэтому dev-заглушка НЕ трогает window.Telegram вообще —
  // api-client.js и share.js сами знают проверить window.__DEV_INIT_DATA__ в первую очередь.
  if (window.Telegram?.WebApp?.initData) {
    // Уже есть настоящий initData (реальный Telegram-клиент) — ничего не подменяем.
    return;
  }

  const initData = await buildSignedInitData(DEV_TELEGRAM_ID, DEV_BOT_TOKEN);
  window.__DEV_INIT_DATA__ = initData;

  console.info(
    "[dev-mock] Активирован тестовый Telegram-пользователь",
    DEV_TELEGRAM_ID,
    "— initData подписан BOT_TOKEN =",
    DEV_BOT_TOKEN
  );
}

// Любая непредвиденная ошибка здесь (например, недоступен crypto.subtle в небезопасном
// контексте) не должна блокировать загрузку всего приложения — только dev-режим.
window.__devMockReady = isDevModeRequested()
  ? activateDevMock().catch((error) => {
      console.error("[dev-mock] не удалось активировать dev-режим:", error);
    })
  : Promise.resolve();
