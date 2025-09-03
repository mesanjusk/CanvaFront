
import React from "react";
import IconButton from "./IconButton";

const UndoRedoControls = ({ undo, redo, duplicateObject, downloadPDF }) => (
  <div className="flex gap-2">
    <IconButton onClick={undo} title="Undo">
      Undo
    </IconButton>
    <IconButton onClick={redo} title="Redo">
      Redo
    </IconButton>
    <IconButton onClick={duplicateObject} title="Duplicate">
      Duplicate
    </IconButton>
    <IconButton onClick={downloadPDF} title="Export PDF">
      PDF
    </IconButton>
  </div>
);

export default UndoRedoControls;
