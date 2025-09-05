import React from "react";
import IconButton from "./IconButton";
import {
  Square,
  Circle,
  Triangle,
  Hexagon,
  Star,
  Heart,
} from "lucide-react";

const FrameSection = ({ showFrames, setShowFrames, addFrameSlot }) => (
  <div className="border-b">
    <button
      className="w-full text-left p-3 text-sm font-semibold"
      onClick={() => setShowFrames((v) => !v)}
    >
      Add Frame
    </button>
    {showFrames && (
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
            <Square size={18} />
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
          Tip: Drag an image over a dashed frame to snap & mask it. Double-click
          an image to adjust inside the frame.
        </div>
      </div>
    )}
  </div>
);

export default FrameSection;

