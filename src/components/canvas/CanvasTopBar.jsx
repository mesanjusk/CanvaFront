import React, { Fragment } from "react";
import {
  AlignCenter,
  AlignHorizontalJustifyCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  BookOpen,
  Bold,
  CaseUpper,
  ChevronLeft,
  Contrast as ContrastIcon,
  Download,
  FileDown,
  Group as GroupIcon,
  HelpCircle,
  Images,
  Italic,
  PaintBucket,
  Ruler,
  Sparkles,
  Underline,
  Ungroup,
} from "lucide-react";
import IconButton from "../IconButton";

const CanvasTopBar = ({
  activeObj,
  alignToCanvas,
  bulkMode,
  canvas,
  canvasRef,
  distributeWithSpacing,
  downloadBulkPDF,
  downloadBulkPNGs,
  downloadCurrentPNG,
  exportImposedPDF,
  exportSinglePDF,
  fitToViewport,
  handleSizeChange,
  handleZoomChange,
  hideHeader,
  imposeOn,
  isShape,
  isText,
  navigateBack,
  saveHistoryDebounced,
  setIsRightbarOpen,
  setRightPanel,
  setShowHelp,
  setSnapCenterGuides,
  setSnapObjects,
  setSnapTolerance,
  setShowGrid,
  setGradientFill,
  showGrid,
  snapCenterGuides,
  snapObjects,
  snapTolerance,
  tplSize,
  zoom,
}) => {
  if (hideHeader) return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b z-40 flex items-center justify-between px-3 md:px-4 gap-3">
      <div className="flex items-center gap-2 overflow-x-auto">
        <button onClick={navigateBack} className="p-2 rounded hover:bg-gray-100" title="Back" aria-label="Back">
          <ChevronLeft size={20} />
        </button>
      </div>

      {activeObj && (isText(activeObj) || isShape(activeObj)) && (
        <div className="flex items-center gap-2 max-w-[60vw] overflow-x-auto rounded-full bg-white px-2 py-1 border">
          <input
            type="color"
            value={typeof activeObj.fill === "string" ? activeObj.fill : "#000000"}
            onChange={(e) => { activeObj.set({ fill: e.target.value }); canvasRef.current?.requestRenderAll(); }}
            className="w-8 h-8 p-0 border rounded cursor-pointer"
            title="Fill Color"
          />
          <button
            className="px-2 py-1 rounded border text-xs hover:bg-gray-100"
            onClick={() => { setGradientFill(activeObj); canvas.requestRenderAll(); }}
            title="Gradient Fill"
          >
            <PaintBucket size={14} />
          </button>

          {isText(activeObj) && (
            <Fragment>
              <div className="flex items-center gap-1">
                <IconButton
                  title="Bold"
                  onClick={() => { activeObj.set("fontWeight", activeObj.fontWeight === "bold" ? "normal" : "bold"); canvas.requestRenderAll(); }}
                >
                  <Bold size={16} />
                </IconButton>
                <IconButton
                  title="Italic"
                  onClick={() => { activeObj.set("fontStyle", activeObj.fontStyle === "italic" ? "normal" : "italic"); canvas.requestRenderAll(); }}
                >
                  <Italic size={16} />
                </IconButton>
                <IconButton
                  title="Underline"
                  onClick={() => { activeObj.set("underline", !activeObj.underline); canvas.requestRenderAll(); }}
                >
                  <Underline size={16} />
                </IconButton>
                <IconButton
                  title="Uppercase"
                  onClick={() => { activeObj.set("text", (activeObj.text || "").toUpperCase()); canvas.requestRenderAll(); }}
                >
                  <CaseUpper size={16} />
                </IconButton>
              </div>

              <input
                type="number"
                min={8}
                max={200}
                value={activeObj.fontSize || 20}
                onChange={(e) => {
                  const size = parseInt(e.target.value, 10);
                  if (!Number.isNaN(size)) {
                    const obj = canvasRef.current?.getActiveObject();
                    if (obj && isText(obj)) {
                      obj.set({ fontSize: size });
                      obj.setCoords();
                      canvas.fire("object:modified");
                      canvas.requestRenderAll();
                    }
                  }
                }}
                className="w-16 p-1 border rounded"
                title="Font Size"
              />

              <select
                value={activeObj.fontFamily || "Arial"}
                onChange={(e) => {
                  const obj = canvasRef.current?.getActiveObject();
                  if (obj && isText(obj)) {
                    obj.set({ fontFamily: e.target.value });
                    obj.setCoords();
                    canvas.fire("object:modified");
                    canvas.requestRenderAll();
                  }
                }}
                className="p-1 border rounded"
                title="Font Family"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
                <option value="Poppins">Poppins</option>
                <option value="Inter">Inter</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Lato">Lato</option>
              </select>

              <div className="flex items-center gap-1">
                <IconButton title="Align Left" onClick={() => { activeObj.set("textAlign", "left"); canvas.requestRenderAll(); }}>
                  <AlignLeft size={16} />
                </IconButton>
                <IconButton title="Align Center" onClick={() => { activeObj.set("textAlign", "center"); canvas.requestRenderAll(); }}>
                  <AlignCenter size={16} />
                </IconButton>
                <IconButton title="Align Right" onClick={() => { activeObj.set("textAlign", "right"); canvas.requestRenderAll(); }}>
                  <AlignRight size={16} />
                </IconButton>
              </div>

              <div className="flex items-center gap-1 text-xs">
                <label className="ml-2">Spacing</label>
                <input
                  type="range"
                  min={-50}
                  max={200}
                  value={Math.round((activeObj.charSpacing || 0) / 10)}
                  onChange={(e) => { activeObj.set("charSpacing", parseInt(e.target.value, 10) * 10); canvas.requestRenderAll(); }}
                />
                <label className="ml-2">Line</label>
                <input
                  type="range"
                  min={0.8}
                  max={3}
                  step={0.05}
                  value={activeObj.lineHeight || 1.16}
                  onChange={(e) => { activeObj.set("lineHeight", parseFloat(e.target.value)); canvas.requestRenderAll(); }}
                />
              </div>

              <button
                className="px-2 py-1 rounded border text-xs hover:bg-gray-100"
                title="Text Shadow"
                onClick={() => { activeObj.set("shadow", { color: "rgba(0,0,0,0.35)", blur: 6, offsetX: 2, offsetY: 2 }); canvas.requestRenderAll(); }}
              >
                <Sparkles size={14} />
              </button>
              <button
                className="px-2 py-1 rounded border text-xs hover:bg-gray-100"
                title="Text Outline"
                onClick={() => { activeObj.set({ stroke: "#000000", strokeWidth: 1 }); canvas.requestRenderAll(); }}
              >
                <ContrastIcon size={14} />
              </button>
            </Fragment>
          )}
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max px-2 py-1">
          <label className="text-xs">W</label>
          <input type="number" value={tplSize.w} onChange={(e) => handleSizeChange("w", e.target.value)} className="w-16 p-1 border rounded" />
          <label className="text-xs">H</label>
          <input type="number" value={tplSize.h} onChange={(e) => handleSizeChange("h", e.target.value)} className="w-16 p-1 border rounded" />
          <label className="text-xs">Zoom</label>
          <input type="range" min={25} max={200} value={Math.round(zoom * 100)} onChange={(e) => handleZoomChange(e.target.value)} className="w-24" />
          <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button className="px-2 py-1 rounded border text-xs hover:bg-gray-100" onClick={fitToViewport} title="Fit to Viewport">Fit</button>

          <button
            className={`hidden sm:flex items-center gap-1 px-3 py-2 rounded-full ${showGrid ? "bg-indigo-600 text-white" : "bg-white"} border hover:bg-gray-50 text-sm`}
            onClick={() => setShowGrid((v) => !v)}
            title="Toggle Grid"
          >
            <Ruler size={16} /> Grid
            <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} title="Show Grid" />
          </button>

          <label className="hidden md:flex items-center gap-1 text-xs px-2 py-1 border rounded-full bg-white">
            <input type="checkbox" checked={snapCenterGuides} onChange={(e) => setSnapCenterGuides(e.target.checked)} />
            Center guides
          </label>
          <label className="hidden md:flex items-center gap-1 text-xs px-2 py-1 border rounded-full bg-white">
            <input type="checkbox" checked={snapObjects} onChange={(e) => setSnapObjects(e.target.checked)} />
            Object snap
          </label>
          <div className="hidden md:flex items-center gap-1 text-xs px-2 py-1 border rounded-full bg-white">
            <span>Tol</span>
            <input
              type="number"
              className="w-12"
              min={2}
              max={20}
              value={snapTolerance}
              onChange={(e) => setSnapTolerance(Math.max(2, Math.min(20, parseInt(e.target.value, 10) || 6)))}
            />
          </div>

          <button
            className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-white border hover:bg-gray-50 text-sm"
            onClick={() => {
              const sel = canvas?.getActiveObject();
              if (!sel) return;
              if (sel.type === "activeSelection") {
                const grp = sel.toGroup();
                canvas.setActiveObject(grp);
                canvas.requestRenderAll();
                saveHistoryDebounced();
              } else if (sel.type === "group") {
                sel.toActiveSelection();
                canvas.requestRenderAll();
                saveHistoryDebounced();
              }
            }}
            title="Group / Ungroup (Ctrl/Cmd+G)"
          >
            <GroupIcon size={16} /> / <Ungroup size={16} />
          </button>

          <button
            className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-white border hover:bg-gray-50 text-sm"
            onClick={() => distributeWithSpacing("h", 20)}
            title="Distribute Horizontally w/ spacing"
          >
            <AlignHorizontalJustifyCenter size={16} /> H+
          </button>
          <button
            className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-white border hover:bg-gray-50 text-sm"
            onClick={() => distributeWithSpacing("v", 20)}
            title="Distribute Vertically w/ spacing"
          >
            <AlignVerticalJustifyCenter size={16} /> V+
          </button>

          <div className="hidden lg:flex items-center gap-1">
            <button className="px-2 py-1 rounded border text-xs hover:bg-gray-100" onClick={() => alignToCanvas("left")}>⟸</button>
            <button className="px-2 py-1 rounded border text-xs hover:bg-gray-100" onClick={() => alignToCanvas("hcenter")}>↔</button>
            <button className="px-2 py-1 rounded border text-xs hover:bg-gray-100" onClick={() => alignToCanvas("right")}>⟹</button>
            <button className="px-2 py-1 rounded border text-xs hover:bg-gray-100" onClick={() => alignToCanvas("top")}>⟸</button>
            <button className="px-2 py-1 rounded border text-xs hover:bg-gray-100" onClick={() => alignToCanvas("vcenter")}>↕</button>
            <button className="px-2 py-1 rounded border text-xs hover:bg-gray-100" onClick={() => alignToCanvas("bottom")}>⟹</button>
          </div>

          <button
            className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-white border hover:bg-gray-50 text-sm"
            onClick={() => setShowHelp(true)}
            title="Keyboard Shortcuts"
          >
            <HelpCircle size={16} /> Help
          </button>

          <button
            title="Choose Template"
            onClick={() => { setRightPanel("templates"); setIsRightbarOpen(true); }}
            className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-white border hover:bg-gray-50 text-sm"
          >
            <Images size={16} /> Template
          </button>

          <button title="Download PNG" onClick={downloadCurrentPNG} className="p-2 rounded-full bg-green-600 text-white shadow hover:bg-green-700">
            <Download size={18} />
          </button>

          <button title="Export PDF" onClick={exportSinglePDF} className="p-2 rounded-full bg-purple-600 text-white shadow hover:bg-purple-700">
            <FileDown size={18} />
          </button>
          <button
            title="Export Imposed Sheet PDF"
            onClick={exportImposedPDF}
            className={`hidden sm:flex items-center gap-1 px-3 py-2 rounded-full ${imposeOn ? "bg-rose-600 hover:bg-rose-700" : "bg-rose-300 cursor-not-allowed"} text-white shadow text-sm`}
            disabled={!imposeOn}
          >
            <BookOpen size={16} /> Imposed PDF
          </button>

          {bulkMode && (
            <button
              title="Download All (PNGs)"
              onClick={downloadBulkPNGs}
              className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-indigo-600 text-white shadow hover:bg-indigo-700 text-sm"
            >
              <Images size={16} /> Download All
            </button>
          )}

          {bulkMode && (
            <button
              title="Download PDF (All)"
              onClick={downloadBulkPDF}
              className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-purple-600 text-white shadow hover:bg-purple-700 text-sm"
            >
              <FileDown size={16} /> Download PDF (All)
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default CanvasTopBar;
