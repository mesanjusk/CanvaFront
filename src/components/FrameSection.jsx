import React, { useState } from "react";
import IconButton from "./IconButton";
import {
  Square,
  Circle,
  Triangle,
  Hexagon,
  Star,
  Heart,
} from "lucide-react";

const FrameSection = ({ addFrameSlot }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b">
      {/* Section Header */}
      <button
        className="w-full flex justify-between items-center p-3 text-sm font-semibold"
        onClick={() => setOpen(!open)}
      >
        <span>Add Frame</span>
        <span className="text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {/* Collapsible Content */}
      {open && (
        <div className="px-3 pb-3">
          <div className="grid grid-cols-4 gap-2">
            <IconButton
              title="Rectangle Frame"
              onClick={() => addFrameSlot("rect")}
            >
              <Square size={18} />
            </IconButton>
            <IconButton
              title="Rounded Frame"
              onClick={() => addFrameSlot("rounded")}
            >
              <Square size={18} className="rounded-md" />
            </IconButton>
            <IconButton
              title="Circle Frame"
              onClick={() => addFrameSlot("circle")}
            >
              <Circle size={18} />
            </IconButton>
            <IconButton
              title="Triangle Frame"
              onClick={() => addFrameSlot("triangle")}
            >
              <Triangle size={18} />
            </IconButton>
            <IconButton
              title="Hexagon Frame"
              onClick={() => addFrameSlot("hexagon")}
            >
              <Hexagon size={18} />
            </IconButton>
            <IconButton
              title="Star Frame"
              onClick={() => addFrameSlot("star")}
            >
              <Star size={18} />
            </IconButton>
            <IconButton
              title="Heart Frame"
              onClick={() => addFrameSlot("heart")}
            >
              <Heart size={18} />
            </IconButton>
          </div>

          <div className="text-[11px] text-gray-500 mt-2">
            Tip: Drag an image over a dashed frame to snap & mask it.
            Double-click an image to adjust inside the frame.
          </div>
        </div>
      )}
    </div>
  );
};

export default FrameSection;
