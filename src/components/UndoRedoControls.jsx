
import React from "react";
import IconButton from "./IconButton";
import { Undo, Redo, Copy, FileDown } from "lucide-react";

const UndoRedoControls = ({ undo, redo, duplicateObject, downloadPDF }) => (
  <div className="flex gap-2">
    <IconButton onClick={undo} title="Undo">
      <Undo size={22} />
    </IconButton>
    <IconButton onClick={redo} title="Redo">
      <Redo size={22} />
    </IconButton>
    <IconButton onClick={duplicateObject} title="Duplicate">
      <Copy size={22} />
    </IconButton>
    <IconButton onClick={downloadPDF} title="Export PDF">
      <FileDown size={22} />
    </IconButton>
  </div>
);

export default UndoRedoControls;
