/**
 * Единственное место, которое нужно поправить перед публикацией на GitHub Pages: адрес
 * backend API, задеплоенного на Render (или другом хостинге). Frontend и backend в этом
 * деплое живут на РАЗНЫХ доменах, поэтому относительный путь работать не будет — здесь
 * обязательно нужен полный URL с https://, без завершающего слэша.
 *
 * Пример: "https://scratch-card-backend.onrender.com"
 */
export const API_BASE_URL = "https://scratch-card-backend.onrender.com";
