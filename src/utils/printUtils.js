export const IN_PER_MM = 1 / 25.4;
export const PRESET_SIZES = {
  "ID-1/CR80": { w_mm: 85.6, h_mm: 54.0 },
  A4: { w_mm: 210, h_mm: 297 },
  Letter: { w_mm: 215.9, h_mm: 279.4 },
  Legal: { w_mm: 215.9, h_mm: 355.6 },
  Tabloid: { w_mm: 279.4, h_mm: 431.8 },
};

export const mmToPx = (mm, dpi) => Math.round((mm * IN_PER_MM) * dpi);
export const pxToMm = (px, dpi) => (px / dpi) / IN_PER_MM;

export function drawCropMarks(ctx, W, H, markLenPx, offsetPx, stroke = "#000", lw = 1) {
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(offsetPx, 0); ctx.lineTo(offsetPx, markLenPx);
  ctx.moveTo(0, offsetPx); ctx.lineTo(markLenPx, offsetPx); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - offsetPx, 0); ctx.lineTo(W - offsetPx, markLenPx);
  ctx.moveTo(W - markLenPx, offsetPx); ctx.lineTo(W, offsetPx); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(offsetPx, H - markLenPx); ctx.lineTo(offsetPx, H);
  ctx.moveTo(0, H - offsetPx); ctx.lineTo(markLenPx, H - offsetPx); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - offsetPx, H - markLenPx); ctx.lineTo(W - offsetPx, H);
  ctx.moveTo(W - markLenPx, H - offsetPx); ctx.lineTo(W, H - offsetPx); ctx.stroke();
  ctx.restore();
}

export function drawRegistrationMark(ctx, cx, cy, size = 10, lw = 1, stroke = "#000") {
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.arc(cx, cy, size, 0, Math.PI * 2);
  ctx.moveTo(cx - size * 1.5, cy); ctx.lineTo(cx + size * 1.5, cy);
  ctx.moveTo(cx, cy - size * 1.5); ctx.lineTo(cx, cy + size * 1.5);
  ctx.stroke();
  ctx.restore();
}
