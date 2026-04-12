export function renderCardHtml(student, template) {
  const photo = student.photoUrl || 'https://via.placeholder.com/160x160?text=Photo';
  const fieldHtml = (template.fields || []).map((field) => {
    const value = student[field.key] || '';
    return `<div style="position:absolute;left:${field.x}px;top:${field.y}px;font-size:${field.fontSize}px;font-weight:${field.bold ? 700 : 400};color:${field.color};width:${field.width}px;">${field.label}: ${value}</div>`;
  }).join('');

  return `
    <div id="card" style="position:relative;width:${template.width}px;height:${template.height}px;background:${template.backgroundColor};overflow:hidden;border-radius:24px;border:1px solid #dbe2ea;font-family:Arial, sans-serif;">
      ${template.backgroundImageUrl ? `<img src="${template.backgroundImageUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" />` : ''}
      ${template.logoUrl ? `<img src="${template.logoUrl}" style="position:absolute;top:18px;left:18px;width:56px;height:56px;object-fit:contain;" />` : ''}
      <img src="${photo}" style="position:absolute;left:${template.photo?.x || 108}px;top:${template.photo?.y || 44}px;width:${template.photo?.width || 124}px;height:${template.photo?.height || 124}px;object-fit:cover;border-radius:${template.photo?.borderRadius || 18}px;border:3px solid #fff;box-shadow:0 4px 16px rgba(0,0,0,.12);" />
      ${fieldHtml}
    </div>
  `;
}
