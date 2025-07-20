
import React from "react";
import IconButton from "./IconButton";

const UndoRedoControls = ({ undo, redo, duplicateObject, downloadPDF }) => (
  <div className="flex gap-2">
    <IconButton onClick={undo}>Undo</IconButton>
    <IconButton onClick={redo}>Redo</IconButton>
    <IconButton onClick={duplicateObject}>Duplicate</IconButton>
    <IconButton onClick={downloadPDF}>PDF</IconButton>
  </div>
);

export default UndoRedoControls;
