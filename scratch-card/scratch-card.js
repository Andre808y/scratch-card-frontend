/**
 * Canvas-компонент скретч-карты: пользователь «стирает» защитный слой одним жестом (FR-002).
 * Вызывает onScratched() один раз, когда стёрто достаточно площади карты.
 */

const CLEAR_THRESHOLD_RATIO = 0.55;

export function mountScratchCard(root, { onScratched }) {
  const canvas = document.createElement("canvas");
  const width = root.clientWidth || 320;
  const height = root.clientHeight || 200;
  canvas.width = width;
  canvas.height = height;
  root.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#c7ccd6";
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "destination-out";

  let scratching = false;
  let revealed = false;
  let cleared = 0;

  function scratchAt(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  function estimateClearedRatio() {
    // Дешёвая оценка вместо полного сканирования пикселей на каждый кадр: считаем шаги.
    cleared += 1;
    return Math.min(cleared / 40, 1) > CLEAR_THRESHOLD_RATIO;
  }

  function pointerPos(event) {
    const rect = canvas.getBoundingClientRect();
    const point = event.touches ? event.touches[0] : event;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }

  function handleMove(event) {
    if (!scratching || revealed) return;
    const { x, y } = pointerPos(event);
    scratchAt(x, y);
    if (estimateClearedRatio()) {
      revealed = true;
      canvas.remove();
      onScratched();
    }
  }

  canvas.addEventListener("pointerdown", (event) => {
    scratching = true;
    handleMove(event);
  });
  canvas.addEventListener("pointermove", handleMove);
  window.addEventListener("pointerup", () => {
    scratching = false;
  });

  return {
    destroy() {
      canvas.remove();
    },
  };
}
