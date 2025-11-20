import { useEffect, useRef } from "react";

export const useSmartGuides = (canvasRef, enable = true, tolerance = 8) => {
  const showV = useRef(false);
  const showH = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enable) return;

    const prevOverlay = canvas._renderOverlay;
    canvas._renderOverlay = function (ctx) {
      if (typeof prevOverlay === "function") prevOverlay.call(this, ctx);
      const w = canvas.getWidth();
      const h = canvas.getHeight();
      ctx.save();
      ctx.strokeStyle = "rgba(99,102,241,0.85)";
      ctx.lineWidth = 1;
      if (showV.current) { ctx.beginPath(); ctx.moveTo(w / 2 + 0.5, 0); ctx.lineTo(w / 2 + 0.5, h); ctx.stroke(); }
      if (showH.current) { ctx.beginPath(); ctx.moveTo(0, h / 2 + 0.5); ctx.lineTo(w, h / 2 + 0.5); ctx.stroke(); }
      ctx.restore();
    };

    const onMove = (e) => {
      const obj = e.target; if (!obj) return;
      const w = canvas.getWidth(), h = canvas.getHeight();
      const nearV = Math.abs(obj.left - w / 2) <= tolerance;
      const nearH = Math.abs(obj.top - h / 2) <= tolerance;
      showV.current = nearV; showH.current = nearH;
      if (nearV) obj.set({ left: Math.round(w / 2) });
      if (nearH) obj.set({ top: Math.round(h / 2) });
    };
    const clear = () => { showV.current = false; showH.current = false; canvas.requestRenderAll(); };

    canvas.on("object:moving", onMove);
    canvas.on("mouse:up", clear);
    return () => {
      canvas.off("object:moving", onMove);
      canvas.off("mouse:up", clear);
      canvas._renderOverlay = prevOverlay;
      canvas.requestRenderAll();
    };
  }, [canvasRef, enable, tolerance]);
};

export const useObjectSnapping = (canvas, enable = true, tolerance = 6) => {
  const vGuide = useRef(null);
  const hGuide = useRef(null);

  useEffect(() => {
    if (!canvas || !enable) return;

    const prevOverlay = canvas._renderOverlay;
    canvas._renderOverlay = function (ctx) {
      if (typeof prevOverlay === "function") prevOverlay.call(this, ctx);
      ctx.save();
      ctx.strokeStyle = "rgba(99,102,241,0.85)";
      ctx.lineWidth = 1;
      if (vGuide.current !== null) {
        ctx.beginPath();
        ctx.moveTo(vGuide.current + 0.5, 0);
        ctx.lineTo(vGuide.current + 0.5, canvas.getHeight());
        ctx.stroke();
      }
      if (hGuide.current !== null) {
        ctx.beginPath();
        ctx.moveTo(0, hGuide.current + 0.5);
        ctx.lineTo(canvas.getWidth(), hGuide.current + 0.5);
        ctx.stroke();
      }
      ctx.restore();
    };

    const onMove = (e) => {
      const t = e.target;
      if (!t) return;
      const objs = canvas.getObjects().filter((o) => o !== t && !o.isEditing);
      const tRect = t.getBoundingRect(true, true);
      const tCx = tRect.left + tRect.width / 2;
      const tCy = tRect.top + tRect.height / 2;

      let snappedX = null,
        snappedY = null,
        guideX = null,
        guideY = null;
      objs.forEach((o) => {
        const r = o.getBoundingRect(true, true);
        const oCx = r.left + r.width / 2;
        const oCy = r.top + r.height / 2;
        if (Math.abs(tCx - oCx) <= tolerance) {
          snappedX = oCx - tRect.width / 2;
          guideX = oCx;
        }
        if (Math.abs(tCy - oCy) <= tolerance) {
          snappedY = oCy - tRect.height / 2;
          guideY = oCy;
        }
        if (Math.abs(tRect.left - r.left) <= tolerance) {
          snappedX = r.left;
          guideX = r.left;
        }
        if (Math.abs(tRect.left + tRect.width - (r.left + r.width)) <= tolerance) {
          snappedX = r.left + r.width - tRect.width;
          guideX = r.left + r.width;
        }
        if (Math.abs(tRect.top - r.top) <= tolerance) {
          snappedY = r.top;
          guideY = r.top;
        }
        if (Math.abs(tRect.top + tRect.height - (r.top + r.height)) <= tolerance) {
          snappedY = r.top + r.height - tRect.height;
          guideY = r.top + r.height;
        }
      });
      if (snappedX !== null) t.set({ left: snappedX });
      if (snappedY !== null) t.set({ top: snappedY });
      vGuide.current = guideX;
      hGuide.current = guideY;
      canvas.requestRenderAll();
    };

    const clearGuides = () => {
      vGuide.current = null;
      hGuide.current = null;
      canvas.requestRenderAll();
    };

    canvas.on("object:moving", onMove);
    canvas.on("mouse:up", clearGuides);
    return () => {
      canvas.off("object:moving", onMove);
      canvas.off("mouse:up", clearGuides);
      canvas._renderOverlay = prevOverlay;
    };
  }, [canvas, enable, tolerance]);
};
