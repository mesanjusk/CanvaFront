import React from "react";
import Drawer from "./Drawer";
import RightPanel from "./RightPanel";
import LayerPanel from "./LayerPanel";

const EditorDrawer = ({
  isOpen,
  onClose,
  selectedInstitute,
  selectedStudent,
  rightPanelProps,
  canvas,
}) => (
  <Drawer isOpen={isOpen} onClose={onClose}>
    {selectedInstitute?.logo && (
      <div className="p-4">
        <h3 className="text-lg font-bold mb-2">Institute Logo</h3>
        <img src={selectedInstitute.logo} className="w-32 h-32 object-contain" />
      </div>
    )}

    {selectedInstitute?.signature && (
      <div className="p-4">
        <h3 className="text-lg font-bold mb-2">Signature</h3>
        <img src={selectedInstitute.signature} className="w-32 h-20 object-contain" />
      </div>
    )}

    {selectedStudent && selectedStudent.photo && (
      <div className="p-4">
        <h3 className="text-lg font-bold mb-2">Selected Student Photo</h3>
        <img src={selectedStudent.photo[0]} className="w-32 h-32 object-cover rounded" />
      </div>
    )}

    <RightPanel {...rightPanelProps} />
    <LayerPanel canvas={canvas} />
  </Drawer>
);

export default EditorDrawer;
