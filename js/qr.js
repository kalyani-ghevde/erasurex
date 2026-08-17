/* ==========================================================
   ErasureX — deterministic "verification pattern" generator
   NOTE: This is a lightweight, dependency-free visual stand-in
   for a real QR code so the prototype works fully offline.
   For production, swap in a standards-compliant QR library
   (e.g. qrcode.js) encoding the verification URL — see README.
   ========================================================== */

function seededGrid(text, gridSize) {
  // simple deterministic hash -> pseudo-random grid
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) >>> 0;
  }
  const cells = [];
  for (let i = 0; i < gridSize * gridSize; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    cells.push((h >>> 16) % 2 === 0);
  }
  return cells;
}

function drawVerificationPattern(canvas, text) {
  const size = 140;
  const grid = 17;
  const cell = size / grid;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  const cells = seededGrid(text, grid);
  ctx.fillStyle = "#0C447C";
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (cells[y * grid + x]) {
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }

  // finder patterns (corners) — mimics real QR anchors
  function finder(px, py) {
    ctx.fillStyle = "#0C447C";
    ctx.fillRect(px, py, cell * 3, cell * 3);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(px + cell * 0.5, py + cell * 0.5, cell * 2, cell * 2);
    ctx.fillStyle = "#0C447C";
    ctx.fillRect(px + cell, py + cell, cell, cell);
  }
  finder(0, 0);
  finder(size - cell * 3, 0);
  finder(0, size - cell * 3);
}
