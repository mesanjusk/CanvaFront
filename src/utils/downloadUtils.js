export async function downloadPDF(canvas, canvasWidth, canvasHeight) {
  if (!canvas) return;
  const { jsPDF } = await import('jspdf');
  const prevVpt = canvas.viewportTransform.slice();
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  const dataUrl = canvas.toDataURL({ format: 'png' });
  const pdf = new jsPDF('l', 'px', [canvasWidth, canvasHeight]);
  pdf.addImage(dataUrl, 'PNG', 0, 0, canvasWidth, canvasHeight);
  pdf.save('design.pdf');
  canvas.setViewportTransform(prevVpt);
}

export function downloadHighRes(canvas, width, height, filename = 'canvas-image.png') { 
  if (!canvas) return;
  canvas.discardActiveObject();
  canvas.renderAll();
  const prevVpt = canvas.viewportTransform.slice();
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  requestAnimationFrame(() => {
    const dataUrl = canvas.toDataURL({
      format: 'png',
      multiplier: 2,
      enableRetinaScaling: false,
       width,
      height,
    });
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
        canvas.setViewportTransform(prevVpt);
    canvas.requestRenderAll();
  });
}
