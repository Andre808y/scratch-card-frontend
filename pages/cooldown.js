/**
 * Экран кулдауна: показывается, когда попытка на сегодня уже использована (FR-007, FR-011).
 */

function formatRemaining(nextEligibleAtIso) {
  if (!nextEligibleAtIso) return "чуть позже";
  const diffMs = new Date(nextEligibleAtIso).getTime() - Date.now();
  const hours = Math.max(0, Math.ceil(diffMs / (60 * 60 * 1000)));
  return hours <= 1 ? "меньше чем через час" : `через ${hours} ч.`;
}

export function renderCooldown(root, { nextEligibleAt }) {
  root.innerHTML = "";
  const card = document.createElement("div");
  card.className = "result-card no-win";
  card.innerHTML = `
    <h2 class="title">Ты уже играл сегодня</h2>
    <p class="hint">Следующая попытка будет доступна ${formatRemaining(nextEligibleAt)}.
    Заходи снова!</p>
  `;
  root.appendChild(card);
}
