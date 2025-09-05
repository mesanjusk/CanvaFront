import React from "react";
import IconButton from "./IconButton";
import Tooltip from "@mui/material/Tooltip";
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

const ButtonWithTip = ({ title, onClick, ariaLabel, children }) => (
  <Tooltip
    title={title}
    arrow
    placement="top"
    enterTouchDelay={0}       // show instantly on touch
    leaveTouchDelay={3000}    // keep visible a bit on mobile
  >
    {/* Keep aria-label for a11y; avoid native 'title' to prevent double-tooltips */}
    <span>
      <IconButton onClick={onClick} aria-label={ariaLabel}>
        {children}
      </IconButton>
    </span>
  </Tooltip>
);

const BottomToolbar = ({
  alignLeft,
  alignCenter,
  alignRight,
  alignTop,
  alignMiddle,
  alignBottom,
  bringToFront,
  sendToBack,
}) => {
  return (
    <div className="fixed bottom-0 w-full bg-white border-t shadow z-30 px-2 py-2 overflow-x-auto scrollbar-thin flex justify-start items-center gap-1 md:hidden">
      <ButtonWithTip title="Align Left" onClick={alignLeft} ariaLabel="Align Left">
        <AlignLeftIcon size={22} />
      </ButtonWithTip>

      <ButtonWithTip title="Align Center" onClick={alignCenter} ariaLabel="Align Center">
        <AlignCenterIcon size={22} />
      </ButtonWithTip>

      <ButtonWithTip title="Align Right" onClick={alignRight} ariaLabel="Align Right">
        <AlignRightIcon size={22} />
      </ButtonWithTip>

      <ButtonWithTip title="Align Top" onClick={alignTop} ariaLabel="Align Top">
        <AlignStartVertical size={22} />
      </ButtonWithTip>

      <ButtonWithTip title="Align Middle" onClick={alignMiddle} ariaLabel="Align Middle">
        <AlignVerticalSpaceAround size={22} />
      </ButtonWithTip>

      <ButtonWithTip title="Align Bottom" onClick={alignBottom} ariaLabel="Align Bottom">
        <AlignEndVertical size={22} />
      </ButtonWithTip>

      <ButtonWithTip title="Bring to Front" onClick={bringToFront} ariaLabel="Bring to Front">
        <ArrowUpFromLine size={22} />
      </ButtonWithTip>

      <ButtonWithTip title="Send to Back" onClick={sendToBack} ariaLabel="Send to Back">
        <ArrowDownToLine size={22} />
      </ButtonWithTip>
    </div>
  );
};

export default React.memo(BottomToolbar);
