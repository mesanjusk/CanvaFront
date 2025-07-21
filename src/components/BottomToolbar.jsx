// BottomToolbar.jsx
import React from "react";
import {
  AlignLeft, AlignCenter, AlignRight,
  AlignStartVertical, AlignVerticalSpaceAround, AlignEndVertical,
  ArrowUpFromLine, ArrowDownToLine
} from "lucide-react";
import IconButton from "./IconButton";

const BottomToolbar = ({
  alignLeft, alignCenter, alignRight,
  alignTop, alignMiddle, alignBottom,
  bringToFront, sendToBack
}) => {
  return (
    <div className="fixed bottom-0 w-full bg-white border-t shadow z-30 px-2 py-2 overflow-x-auto scrollbar-thin flex justify-start items-center gap-1">
      <IconButton onClick={alignLeft} title="Align Left"><AlignLeft size={28} /></IconButton>
      <IconButton onClick={alignCenter} title="Align Center"><AlignCenter size={28} /></IconButton>
      <IconButton onClick={alignRight} title="Align Right"><AlignRight size={28} /></IconButton>
      <IconButton onClick={alignTop} title="Align Top"><AlignStartVertical size={28} /></IconButton>
      <IconButton onClick={alignMiddle} title="Align Middle"><AlignVerticalSpaceAround size={28} /></IconButton>
      <IconButton onClick={alignBottom} title="Align Bottom"><AlignEndVertical size={28} /></IconButton>
      <IconButton onClick={bringToFront} title="Bring to Front"><ArrowUpFromLine size={28} /></IconButton>
      <IconButton onClick={sendToBack} title="Send to Back"><ArrowDownToLine size={28} /></IconButton>
    </div>
  );
};

export default BottomToolbar;
