import React from "react";
import IconButton from "./IconButton";
import {
  AlignLeft as AlignLeftIcon,
  AlignCenter as AlignCenterIcon,
  AlignRight as AlignRightIcon,
  AlignStartVertical,
  AlignVerticalSpaceAround,
  AlignEndVertical,
  ArrowUpFromLine,
  ArrowDownToLine,
} from "lucide-react";

const BottomToolbar = React.memo(({
  alignLeft,
  alignCenter,
  alignRight,
  alignTop,
  alignMiddle,
  alignBottom,
  bringToFront,
  sendToBack,
}) => (
  <div className="fixed bottom-0 w-full bg-white border-t shadow z-30 px-2 py-2 overflow-x-auto scrollbar-thin flex justify-start items-center gap-1">
    <IconButton onClick={alignLeft} title="Align Left">
      <AlignLeftIcon size={22} />
    </IconButton>
    <IconButton onClick={alignCenter} title="Align Center">
      <AlignCenterIcon size={22} />
    </IconButton>
    <IconButton onClick={alignRight} title="Align Right">
      <AlignRightIcon size={22} />
    </IconButton>
    <IconButton onClick={alignTop} title="Align Top">
      <AlignStartVertical size={22} />
    </IconButton>
    <IconButton onClick={alignMiddle} title="Align Middle">
      <AlignVerticalSpaceAround size={22} />
    </IconButton>
    <IconButton onClick={alignBottom} title="Align Bottom">
      <AlignEndVertical size={22} />
    </IconButton>
    <IconButton onClick={bringToFront} title="Bring to Front">
      <ArrowUpFromLine size={22} />
    </IconButton>
    <IconButton onClick={sendToBack} title="Send to Back">
      <ArrowDownToLine size={22} />
    </IconButton>
  </div>
);

export default BottomToolbar;

