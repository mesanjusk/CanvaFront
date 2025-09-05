import { fabric } from "fabric";

export const buildRegularPolygon = (sides, radius) => {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    pts.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
  }
  return pts;
};

export const buildStar = (points, outerR, innerR) => {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    pts.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
  }
  return pts;
};

export const buildHeartPath = (w, h) => {
  const path =
    "M 50 15 C 35 0, 0 0, 0 30 C 0 55, 25 70, 50 90 C 75 70, 100 55, 100 30 C 100 0, 65 0, 50 15 Z";
  const heart = new fabric.Path(path, {
    left: 0,
    top: 0,
    originX: "center",
    originY: "center",
    fill: "transparent",
  });
  heart.set({ scaleX: w / 100, scaleY: h / 90 });
  return heart;
};

export const buildClipShape = (shapeType, w, h, options = {}) => {
  const { rx = Math.min(w, h) * 0.12 } = options;
  switch (shapeType) {
    case "rect":
      return new fabric.Rect({
        width: w,
        height: h,
        originX: "center",
        originY: "center",
      });
    case "rounded":
      return new fabric.Rect({
        width: w,
        height: h,
        rx,
        ry: rx,
        originX: "center",
        originY: "center",
      });
    case "circle":
      return new fabric.Circle({
        radius: Math.min(w, h) / 2,
        originX: "center",
        originY: "center",
      });
    case "triangle":
      return new fabric.Polygon(
        [
          { x: 0, y: -h / 2 },
          { x: -w / 2, y: h / 2 },
          { x: w / 2, y: h / 2 },
        ],
        { originX: "center", originY: "center" }
      );
    case "hexagon":
      return new fabric.Polygon(buildRegularPolygon(6, Math.min(w, h) / 2), {
        originX: "center",
        originY: "center",
      });
    case "star":
      return new fabric.Polygon(
        buildStar(5, Math.min(w, h) / 2, Math.min(w, h) / 4),
        { originX: "center", originY: "center" }
      );
    case "heart":
      return buildHeartPath(w, h);
    default:
      return new fabric.Rect({ width: w, height: h, originX: "center", originY: "center" });
  }
};

export const buildOverlayShape = (
  shapeType,
  w,
  h,
  { rx, stroke, strokeWidth, dashed = false }
) => {
  let overlay;
  const common = {
    originX: "center",
    originY: "center",
    fill: "transparent",
    stroke,
    strokeWidth,
  };
  switch (shapeType) {
    case "rect":
      overlay = new fabric.Rect({ ...common, width: w, height: h });
      break;
    case "rounded":
      overlay = new fabric.Rect({ ...common, width: w, height: h, rx, ry: rx });
      break;
    case "circle":
      overlay = new fabric.Circle({ ...common, radius: Math.min(w, h) / 2 });
      break;
    case "triangle":
      overlay = new fabric.Polygon(
        [
          { x: 0, y: -h / 2 },
          { x: -w / 2, y: h / 2 },
          { x: w / 2, y: h / 2 },
        ],
        common
      );
      break;
    case "hexagon":
      overlay = new fabric.Polygon(buildRegularPolygon(6, Math.min(w, h) / 2), common);
      break;
    case "star":
      overlay = new fabric.Polygon(
        buildStar(5, Math.min(w, h) / 2, Math.min(w, h) / 4),
        common
      );
      break;
    case "heart": {
      const heart = buildHeartPath(w, h);
      heart.set({ ...common });
      overlay = heart;
      break;
    }
    default:
      overlay = new fabric.Rect({ ...common, width: w, height: h });
  }
  overlay.set({
    selectable: false,
    evented: false,
    hoverCursor: "default",
    excludeFromExport: false,
  });
  overlay.isFrameOverlay = false;
  overlay.isFrameSlot = !!dashed;
  if (dashed)
    overlay.set({
      strokeDashArray: [6, 4],
      selectable: true,
      evented: true,
      hoverCursor: "move",
    });
  return overlay;
};

export const moveOverlayAboveImage = (canvas, imageObj, overlay) => {
  const idx = canvas.getObjects().indexOf(imageObj);
  if (idx >= 0) canvas.moveTo(overlay, idx + 1);
};

export const applyMaskAndFrame = (canvas, imageObj, shapeType, options) => {
  const { stroke, strokeWidth, rx, absolute = false, followImage = true } =
    options || {};
  if (!imageObj || imageObj.type !== "image") return;

  if (imageObj.frameOverlay && canvas) {
    imageObj.frameOverlay.ownerImage = null;
    canvas.remove(imageObj.frameOverlay);
    imageObj.frameOverlay = null;
  }
  if (imageObj._overlayHandlers) {
    const { onMove, onScale, onRotate, onRemoved } = imageObj._overlayHandlers;
    imageObj.off("moving", onMove);
    imageObj.off("scaling", onScale);
    imageObj.off("rotating", onRotate);
    imageObj.off("removed", onRemoved);
    imageObj._overlayHandlers = null;
  }

  const w = imageObj.width;
  const h = imageObj.height;

  const clip = buildClipShape(
    shapeType,
    absolute ? imageObj.getScaledWidth() : w,
    absolute ? imageObj.getScaledHeight() : h,
    { rx }
  );
  clip.set({ originX: "center", originY: "center", left: 0, top: 0 });
  clip.absolutePositioned = !!absolute;
  imageObj.clipPath = clip;
  imageObj.shape = shapeType;

  const overlay = buildOverlayShape(shapeType, w, h, {
    rx,
    stroke,
    strokeWidth,
    dashed: false,
  });
  overlay.set({
    selectable: false,
    evented: false,
    hoverCursor: "default",
  });
  overlay.followImage = followImage;
  overlay.isFrameOverlay = true;
  overlay.isFrameSlot = false;
  overlay.ownerImage = imageObj;

  const syncOverlayGeom = () => {
    overlay.set({
      left: imageObj.left,
      top: imageObj.top,
      scaleX: imageObj.scaleX,
      scaleY: imageObj.scaleY,
      angle: imageObj.angle,
      originX: imageObj.originX,
      originY: imageObj.originY,
    });
    overlay.setCoords();
    moveOverlayAboveImage(canvas, imageObj, overlay);
  };

  if (!absolute) syncOverlayGeom();
  else {
    overlay.set({
      left: imageObj.left,
      top: imageObj.top,
      scaleX: imageObj.scaleX,
      scaleY: imageObj.scaleY,
      angle: imageObj.angle,
      originX: imageObj.originX,
      originY: imageObj.originY,
    });
    overlay.setCoords();
  }

  canvas.add(overlay);
  imageObj.frameOverlay = overlay;
  moveOverlayAboveImage(canvas, imageObj, overlay);

  if (!absolute && followImage) {
    const onMove = () => syncOverlayGeom();
    const onScale = () => syncOverlayGeom();
    const onRotate = () => syncOverlayGeom();
    const onRemoved = () => {
      if (imageObj.frameOverlay) {
        imageObj.frameOverlay.ownerImage = null;
        canvas.remove(imageObj.frameOverlay);
        imageObj.frameOverlay = null;
      }
      imageObj.off("moving", onMove);
      imageObj.off("scaling", onScale);
      imageObj.off("rotating", onRotate);
      imageObj.off("removed", onRemoved);
      imageObj._overlayHandlers = null;
    };
    imageObj.on("moving", onMove);
    imageObj.on("scaling", onScale);
    imageObj.on("rotating", onRotate);
    imageObj.on("removed", onRemoved);
    imageObj._overlayHandlers = { onMove, onScale, onRotate, onRemoved };
  }

  canvas.requestRenderAll();
};

export const removeMaskAndFrame = (canvas, imageObj, keepSlot = false) => {
  if (!imageObj) return;
  imageObj.clipPath = undefined;
  if (imageObj.frameOverlay) {
    if (keepSlot && imageObj.frameOverlay) {
      const slot = imageObj.frameOverlay;
      slot.isFrameOverlay = false;
      slot.isFrameSlot = true;
      slot.ownerImage = null;
      slot.set({
        selectable: true,
        evented: true,
        strokeDashArray: [6, 4],
        hoverCursor: "move",
      });
    } else {
      canvas.remove(imageObj.frameOverlay);
    }
    imageObj.frameOverlay = null;
  }
  if (imageObj._overlayHandlers) {
    const { onMove, onScale, onRotate, onRemoved } = imageObj._overlayHandlers;
    imageObj.off("moving", onMove);
    imageObj.off("scaling", onScale);
    imageObj.off("rotating", onRotate);
    imageObj.off("removed", onRemoved);
    imageObj._overlayHandlers = null;
  }
  canvas.requestRenderAll();
};

