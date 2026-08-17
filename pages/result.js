/**
 * Приз (или сообщение об отсутствии выигрыша) — рендерится ПОД canvas скретч-карты
 * (см. scratch-card/scratch-card.js), а не отдельным экраном после стирания: физически
 * стирая слой, пользователь открывает именно этот контент, а не переходит на другой экран.
 */

import { renderShareButton } from "./share.js";

function formatDate(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString("ru-RU");
}

export function renderScratchReveal(root, result) {
  const reveal = document.createElement("div");
  reveal.className = "scratch-reveal";

  if (result.outcome === "win") {
    reveal.innerHTML = `
      <p class="title">🎉 ${result.prize.discount_value}</p>
      <div class="prize-code">${result.prize.code}</div>
      <p class="hint">Покажи этот код продавцу в магазине, чтобы получить приз.
      Действует до ${formatDate(result.prize.expires_at)}</p>
    `;
  } else {
    reveal.innerHTML = `
      <p class="title">Почти повезло!</p>
      <p class="hint">В этот раз без приза. Загляни снова через 24 часа — новая карта уже
      готовится.</p>
    `;
  }

  reveal.appendChild(renderShareButton());
  root.appendChild(reveal);
  return reveal;
}
