// TopToolbar.jsx
import React from "react";
import { Type, Square, Circle, Image as ImageIcon, RefreshCw, Download } from "lucide-react";
import IconButton from "./IconButton";

const TopToolbar = ({ addText, addRect, addCircle, addImage, setCropSrc, cropCallbackRef, handleReset, downloadHighRes }) => {
  return (
    <div className="w-full flex justify-between items-center px-4 py-2 bg-white border-b shadow z-20">
      <div className="flex gap-2 items-center overflow-x-auto">
        <IconButton onClick={addText} title="Add Text"><Type size={28} /></IconButton>
        <IconButton onClick={addRect} title="Add Rectangle"><Square size={28} /></IconButton>
        <IconButton onClick={addCircle} title="Add Circle"><Circle size={28} /></IconButton>
        <input
          type="file"
          accept="image/*"
          id="upload-image"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                setCropSrc(reader.result);
                cropCallbackRef.current = (croppedUrl) => addImage(croppedUrl);
              };
              reader.readAsDataURL(file);
            }
          }}
        />
        <label htmlFor="upload-image" title="Upload Image" className="cursor-pointer">
          <IconButton><ImageIcon size={28} /></IconButton>
        </label>
      </div>

      <div className="flex gap-2 items-center">
        <IconButton onClick={handleReset} title="Reset Canvas" className="bg-yellow-500 text-white hover:bg-yellow-600">
          <RefreshCw size={22} />
        </IconButton>
        <IconButton onClick={downloadHighRes} title="Download" className="bg-green-600 text-white hover:bg-green-700">
          <Download size={22} />
        </IconButton>
      </div>
    </div>
  );
};

export default TopToolbar;
