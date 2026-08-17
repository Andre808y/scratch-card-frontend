// Unit-тест действия «поделиться» (T043). Запуск: node frontend/tests/unit/test_share.js
// Без внешнего test-раннера — используется встроенный node:test (Node.js >= 18).

import assert from "node:assert/strict";
import { test } from "node:test";

function installFakeDom() {
  const listeners = {};
  globalThis.document = {
    createElement: () => ({
      addEventListener: (event, handler) => {
        listeners[event] = handler;
      },
      set textContent(_v) {},
      className: "",
      type: "",
    }),
  };
  return listeners;
}

test("shareBotLink calls Telegram switchInlineQuery when available", async () => {
  installFakeDom();
  const calls = [];
  globalThis.window = {
    Telegram: {
      WebApp: {
        switchInlineQuery: (text, targets) => calls.push({ text, targets }),
      },
    },
  };

  const { shareBotLink } = await import("../../pages/share.js");
  shareBotLink();

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].targets, ["users", "groups"]);
  assert.match(calls[0].text, /приз/);
});

test("shareBotLink does nothing without Telegram WebApp context", async () => {
  installFakeDom();
  globalThis.window = {};

  const { shareBotLink } = await import("../../pages/share.js?no-telegram");

  assert.doesNotThrow(() => shareBotLink());
});
