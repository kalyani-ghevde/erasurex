/* ==========================================================
   ErasureX — tiny inline SVG icon set
   Avoids depending on an external icon font/CDN.
   ========================================================== */

const ICONS = {
  grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
  scan: '<path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3M4 12h16" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  list: '<path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linejoin="round"/>',
  check: '<path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  x: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
  hdd: '<rect x="3" y="9" width="18" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="7" cy="12.5" r="1.2" fill="currentColor"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><line x1="10" y1="18" x2="14" y2="18" stroke="currentColor" stroke-width="1.6"/>',
  chip: '<rect x="7" y="7" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="1.6" fill="none"/><line x1="9" y1="3" x2="9" y2="7" stroke="currentColor" stroke-width="1.6"/><line x1="15" y1="3" x2="15" y2="7" stroke="currentColor" stroke-width="1.6"/><line x1="9" y1="17" x2="9" y2="21" stroke="currentColor" stroke-width="1.6"/><line x1="15" y1="17" x2="15" y2="21" stroke="currentColor" stroke-width="1.6"/>'
};

function iconSVG(name, size) {
  size = size || 18;
  const body = ICONS[name] || ICONS.grid;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">${body}</svg>`;
}

function deviceIconName(type) {
  if (type === "Android") return "phone";
  if (type === "NVMe") return "chip";
  return "hdd";
}

function hydrateIcons(root) {
  (root || document).querySelectorAll("[data-ic]").forEach(el => {
    const size = el.getAttribute("data-size") || 18;
    el.innerHTML = iconSVG(el.getAttribute("data-ic"), size);
  });
}
