import React from "react";
import { Type, Square, Circle, Image as ImageIcon, RefreshCw, Download, FileJson } from "lucide-react";
import UndoRedoControls from "./UndoRedoControls";

const EditorToolbar = ({
  addText,
  addRect,
  addCircle,
  addImage,
  setCropSrc,
  cropCallbackRef,
  undo,
  redo,
  duplicateObject,
  downloadPDF,
  downloadHighRes,
  exportJSON,
  saveTemplateLayout,
  canvas,
  resetHistory,
  saveHistory,
}) => (
  <div className="flex justify-between items-center px-4 py-2 bg-white border-b shadow z-20">
    <div className="flex gap-2 items-center overflow-x-auto">
      <button title="Add Text" onClick={addText} className="p-2 rounded bg-white shadow hover:bg-blue-100"><Type size={28} /></button>
      <button title="Add Rectangle" onClick={addRect} className="p-2 rounded bg-white shadow hover:bg-blue-100"><Square size={28} /></button>
      <button title="Add Circle" onClick={addCircle} className="p-2 rounded bg-white shadow hover:bg-blue-100"><Circle size={28} /></button>
      <input type="file" accept="image/*" id="upload-image" style={{ display: "none" }} onChange={(e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setCropSrc(reader.result);
            cropCallbackRef.current = (croppedUrl) => {
              addImage(croppedUrl);
            };
          };
          reader.readAsDataURL(file);
        }
      }} />
      <label htmlFor="upload-image" className="p-2 rounded bg-white shadow hover:bg-blue-100 cursor-pointer" title="Upload Image">
        <ImageIcon size={28} />
      </label>
      <UndoRedoControls undo={undo} redo={redo} duplicateObject={duplicateObject} downloadPDF={downloadPDF} />
    </div>
    <div className="flex gap-2 items-center">
      <button title="Reset Canvas" onClick={() => { canvas?.clear(); resetHistory(); saveHistory(); }} className="p-2 rounded-full bg-yellow-500 text-white shadow hover:bg-yellow-600"><RefreshCw size={22} /></button>
      <button title="Download PNG" onClick={downloadHighRes} className="p-2 rounded-full bg-green-600 text-white shadow hover:bg-green-700"><Download size={22} /></button>
      <button title="Export JSON" onClick={exportJSON} className="p-2 rounded-full bg-indigo-600 text-white shadow hover:bg-indigo-700"><FileJson size={22} /></button>
      <button title="Save Template" onClick={saveTemplateLayout} className="p-2 rounded-full bg-blue-600 text-white shadow hover:bg-blue-700">Save Template</button>
    </div>
  </div>
);

export default EditorToolbar;
