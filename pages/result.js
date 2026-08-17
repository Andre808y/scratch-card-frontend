/**
 * Экран результата раунда: приз (промокод) или дружелюбное сообщение об отсутствии выигрыша
 * (FR-005, FR-011). Стилизован под фирменный вид магазина электроники (styles.css).
 */

import { renderShareButton } from "./share.js";

function formatDate(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString("ru-RU");
}

export function renderResult(root, result) {
  root.innerHTML = "";

  const card = document.createElement("div");

  if (result.outcome === "win") {
    card.className = "result-card win";
    card.innerHTML = `
      <h2 class="title">🎉 Ты выиграл!</h2>
      <p class="hint">${result.prize.discount_value}</p>
      <div class="prize-code">${result.prize.code}</div>
      <p class="hint">Покажи этот код продавцу в магазине, чтобы получить приз.
      Действует до ${formatDate(result.prize.expires_at)}</p>
    `;
  } else {
    card.className = "result-card no-win";
    card.innerHTML = `
      <h2 class="title">Почти повезло!</h2>
      <p class="hint">В этот раз без приза. Загляни снова через 24 часа — новая карта уже
      готовится.</p>
    `;
  }

  root.appendChild(card);
  root.appendChild(renderShareButton());
}
