import jsPDF from 'jspdf';

const mmToPx = (mm) => Math.round(mm * 11.811);
const safeColor = (value, fallback = '#111827') => {
  const v = String(value || '').trim();
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v)) return v;
  if (/^([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v)) return `#${v}`;
  return fallback;
};

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function renderIdCard(template, data = {}) {
  const width = mmToPx(template?.width || 54);
  const height = mmToPx(template?.height || 86);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const cardColor = safeColor(template?.styles?.cardColor, '#ffffff');
  const accent = safeColor(template?.styles?.accentColor, '#2563eb');
  const primary = safeColor(template?.styles?.primaryColor, '#0f172a');
  const textColor = safeColor(template?.styles?.textColor, '#111827');

  ctx.fillStyle = cardColor;
  ctx.fillRect(0, 0, width, height);

  if (template?.backgroundImage) {
    const bg = await loadImage(template.backgroundImage);
    if (bg) ctx.drawImage(bg, 0, 0, width, height);
  }

  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, width, Math.round(height * 0.16));
  ctx.fillStyle = primary;
  ctx.fillRect(0, height - Math.round(height * 0.1), width, Math.round(height * 0.1));

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 18px Arial';
  ctx.fillText(template?.title || 'STUDENT ID CARD', 16, 28);
  if (template?.subtitle) {
    ctx.font = '500 11px Arial';
    ctx.fillText(template.subtitle, 16, 45);
  }

  const photoX = template?.photoX || 18;
  const photoY = template?.photoY || 18;
  const photoWidth = template?.photoWidth || 60;
  const photoHeight = template?.photoHeight || 72;

  const pxX = photoX; const pxY = photoY + 28; const pxW = photoWidth; const pxH = photoHeight;
  ctx.fillStyle = '#e2e8f0';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  if (template?.photoShape === 'circle') {
    ctx.beginPath();
    ctx.arc(pxX + pxW / 2, pxY + pxH / 2, Math.min(pxW, pxH) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.roundRect(pxX, pxY, pxW, pxH, template?.photoShape === 'rounded' ? 12 : 0);
    ctx.fill();
    ctx.stroke();
  }

  const photo = await loadImage(data?.photoUrl || data?.photo || '');
  if (photo) {
    ctx.save();
    ctx.beginPath();
    if (template?.photoShape === 'circle') {
      ctx.arc(pxX + pxW / 2, pxY + pxH / 2, Math.min(pxW, pxH) / 2, 0, Math.PI * 2);
    } else {
      ctx.roundRect(pxX, pxY, pxW, pxH, template?.photoShape === 'rounded' ? 12 : 0);
    }
    ctx.clip();
    ctx.drawImage(photo, pxX, pxY, pxW, pxH);
    ctx.restore();
  } else {
    ctx.fillStyle = '#64748b';
    ctx.font = '600 11px Arial';
    ctx.fillText('PHOTO', pxX + 10, pxY + pxH / 2);
  }

  const fields = Array.isArray(template?.fields) ? template.fields : [];
  fields.forEach((field) => {
    const value = data?.[field.key] ?? data?.[field.label] ?? '';
    const label = field.label ? `${field.label}: ` : '';
    ctx.fillStyle = safeColor(field.color, textColor);
    ctx.font = `${field.fontWeight || '600'} ${field.fontSize || 12}px Arial`;
    ctx.fillText(`${label}${value || '-'}`, field.x || 20, (field.y || 20) + 38);
  });

  if (template?.footerText) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '500 10px Arial';
    ctx.fillText(template.footerText.slice(0, 60), 12, height - 14);
  }

  const imageDataUrl = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: template?.orientation === 'landscape' ? 'landscape' : 'portrait', unit: 'mm', format: [template?.height || 86, template?.width || 54] });
  pdf.addImage(imageDataUrl, 'PNG', 0, 0, template?.width || 54, template?.height || 86);
  const pdfDataUrl = pdf.output('datauristring');
  return { imageDataUrl, pdfDataUrl };
}

export async function renderReportCard(template, report = {}, school = {}) {
  const width = 1240;
  const height = 1754;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const headerColor = safeColor(template?.headerColor, '#1d4ed8');
  ctx.fillStyle = headerColor;
  ctx.fillRect(0, 0, width, 120);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 36px Arial';
  ctx.fillText(school?.schoolName || 'School Name', 40, 52);
  ctx.font = '600 24px Arial';
  ctx.fillText(template?.name || report?.examName || 'Report Card', 40, 90);

  ctx.fillStyle = '#111827';
  ctx.font = '600 24px Arial';
  const s = report?.studentSnapshot || {};
  ctx.fillText(`Student: ${s.studentName || '-'}`, 40, 170);
  ctx.fillText(`Class: ${report?.className || s.className || '-'}  Section: ${report?.section || s.section || '-'}`, 40, 208);
  ctx.fillText(`Roll No: ${s.rollNumber || '-'}  Academic Year: ${report?.academicYear || '-'}`, 40, 246);

  let y = 320;
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(40, y, width - 80, 46);
  ctx.fillStyle = '#111827';
  ctx.font = '700 20px Arial';
  ctx.fillText('Subject', 60, y + 30);
  ctx.fillText('Max', 560, y + 30);
  ctx.fillText('Obtained', 700, y + 30);
  ctx.fillText('Grade', 920, y + 30);
  y += 60;

  (report?.subjects || []).forEach((subj) => {
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(40, y - 24, width - 80, 46);
    ctx.fillStyle = '#111827';
    ctx.font = '500 20px Arial';
    ctx.fillText(String(subj.subject || ''), 60, y + 5);
    ctx.fillText(String(subj.maxMarks ?? ''), 560, y + 5);
    ctx.fillText(String(subj.obtainedMarks ?? ''), 720, y + 5);
    ctx.fillText(String(subj.grade || ''), 930, y + 5);
    y += 52;
  });

  y += 24;
  const totals = report?.totals || {};
  ctx.font = '700 22px Arial';
  ctx.fillText(`Total: ${totals.total ?? '-'}`, 40, y);
  ctx.fillText(`Obtained: ${totals.obtained ?? '-'}`, 300, y);
  ctx.fillText(`Percentage: ${totals.percentage ?? '-'}%`, 620, y);
  ctx.fillText(`Result: ${totals.result ?? '-'}`, 940, y);

  y += 70;
  ctx.font = '600 20px Arial';
  ctx.fillText(`Teacher Remarks: ${report?.teacherRemarks || '-'}`, 40, y);
  y += 40;
  ctx.fillText(`Principal Remarks: ${report?.principalRemarks || '-'}`, 40, y);

  const imageDataUrl = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [width, height] });
  pdf.addImage(imageDataUrl, 'PNG', 0, 0, width, height);
  const pdfDataUrl = pdf.output('datauristring');
  return { imageDataUrl, pdfDataUrl };
}
