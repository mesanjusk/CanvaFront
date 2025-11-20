import React from "react";
import { Circle, Image as ImageIcon, Images, Layout as LayoutIcon, Layers as LayersIcon, Menu as MenuIcon, Square, Type } from "lucide-react";
import UndoRedoControls from "../UndoRedoControls";

const CanvasToolbox = ({
  addCircle,
  addRect,
  addText,
  duplicateObject,
  handleUpload,
  redo,
  setIsRightbarOpen,
  setRightPanel,
  setShowMobileTools,
  showMobileTools,
  undo,
  withFabClose,
}) => (
  <>
    <button
      onClick={() => setShowMobileTools((v) => !v)}
      className="md:hidden fixed bottom-20 left-4 z-50 rounded-full p-3 shadow bg-indigo-600 text-white"
      title="Tools"
      aria-label="Toggle Tools"
    >
      <MenuIcon size={20} />
    </button>

    <div className={`fixed top-16 left-2 z-40 flex-col gap-2 ${showMobileTools ? "flex" : "hidden"} md:flex`}>
      <button
        title="Choose Gallary"
        onClick={() => { setRightPanel("gallaries"); setIsRightbarOpen(true); }}
        className="p-2 rounded bg-white shadow hover:bg-blue-100"
      >
        <Images size={20} />
      </button>
      <button
        title="Bulk Settings"
        onClick={() => { setRightPanel("bulk"); setIsRightbarOpen(true); }}
        className="p-2 rounded bg-white shadow hover:bg-blue-100"
      >
        <LayersIcon size={20} />
      </button>
      <button
        title="Add Frame"
        onClick={() => { setRightPanel("frames"); setIsRightbarOpen(true); }}
        className="p-2 rounded bg-white shadow hover:bg-blue-100"
      >
        <LayoutIcon size={20} />
      </button>
      <button title="Add Text" onClick={withFabClose(addText)} className="p-2 rounded bg-white shadow hover:bg-blue-100">
        <Type size={20} />
      </button>
      <button title="Add Rectangle" onClick={withFabClose(addRect)} className="p-2 rounded bg-white shadow hover:bg-blue-100">
        <Square size={20} />
      </button>
      <button title="Add Circle" onClick={withFabClose(addCircle)} className="p-2 rounded bg-white shadow hover:bg-blue-100">
        <Circle size={20} />
      </button>
      <input type="file" accept="image/*" id="upload-image" style={{ display: "none" }} onChange={handleUpload} />
      <label htmlFor="upload-image" onClick={withFabClose(() => { })} className="p-2 rounded bg-white shadow hover:bg-blue-100 cursor-pointer" title="Upload Image">
        <ImageIcon size={20} />
      </label>

      <UndoRedoControls undo={undo} redo={redo} duplicateObject={duplicateObject} vertical />
    </div>
  </>
);

export default CanvasToolbox;
