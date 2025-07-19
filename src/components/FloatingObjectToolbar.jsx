// FloatingObjectToolbar.jsx
import React from "react";
import { Crop, Trash2, Lock, Unlock, Settings, Maximize2, Group, RefreshCw } from "lucide-react";
import IconButton from "./IconButton";

const FloatingObjectToolbar = ({
  activeObj,
  cropImage,
  handleDelete,
  toggleLock,
  setShowSettings,
  fitCanvasToObject,
  isLocked,
  multipleSelected,
  groupObjects,
  ungroupObjects
}) => {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-white shadow-lg rounded px-3 py-2 flex gap-3 items-center">
      <IconButton onClick={cropImage} title="Crop"><Crop size={24} /></IconButton>
      <IconButton onClick={handleDelete} title="Delete"><Trash2 size={24} /></IconButton>
      <IconButton onClick={() => toggleLock(activeObj)} title={isLocked ? "Unlock" : "Lock"}>
        {isLocked ? <Unlock size={24} /> : <Lock size={24} />}
      </IconButton>
      <IconButton onClick={() => setShowSettings(true)} title="Settings"><Settings size={24} /></IconButton>
      <IconButton onClick={fitCanvasToObject} title="Fit Canvas"><Maximize2 size={24} /></IconButton>
      {multipleSelected && <IconButton onClick={groupObjects} title="Group"><Group size={24} /></IconButton>}
      {activeObj?.type === "group" && <IconButton onClick={ungroupObjects} title="Ungroup"><RefreshCw size={24} /></IconButton>}
    </div>
  );
};

export default FloatingObjectToolbar;
