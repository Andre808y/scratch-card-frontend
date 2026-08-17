/**
 * Действие «поделиться» (User Story 3, FR-009): полностью на клиенте через Telegram WebApp SDK,
 * без обращения к backend (см. contracts/api.md, раздел «Шеринг»).
 */

const BOT_SHARE_TEXT = "Я выиграл приз в скретч-карте магазина электроники — попробуй тоже!";

export function shareBotLink() {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;

  if (typeof webApp.switchInlineQuery === "function") {
    webApp.switchInlineQuery(BOT_SHARE_TEXT, ["users", "groups"]);
    return;
  }

  const botUsername = webApp.initDataUnsafe?.bot?.username;
  const shareUrl = botUsername ? `https://t.me/${botUsername}` : "";
  window.open(
    `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(BOT_SHARE_TEXT)}`,
    "_blank"
  );
}

export function renderShareButton() {
  const button = document.createElement("button");
  button.className = "btn btn-secondary";
  button.type = "button";
  button.textContent = "Поделиться с друзьями";
  button.addEventListener("click", shareBotLink);
  return button;
}
