import React from "react";
import { clamp } from "../utils/numberUtils";

const BleedSafeMarksSection = ({
  bleed,
  setBleed,
  safe,
  setSafe,
  showMarks,
  setShowMarks,
  showReg,
  setShowReg,
}) => (
  <div className="border-b">
    <button className="w-full text-left p-3 text-sm font-semibold">
      Bleed / Safe / Marks
    </button>
    <div className="px-3 pb-3 space-y-2 text-sm">
      <div className="grid grid-cols-4 gap-2">
        {["top", "right", "bottom", "left"].map((side) => (
          <label key={side} className="text-xs capitalize">
            Bleed {side}
            <input
              type="number"
              className="w-full border rounded px-2 py-1"
              value={bleed[side]}
              onChange={(e) =>
                setBleed((prev) => ({
                  ...prev,
                  [side]: clamp(parseFloat(e.target.value) || 0, 0, 50),
                }))
              }
            />
          </label>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {["top", "right", "bottom", "left"].map((side) => (
          <label key={side} className="text-xs capitalize">
            Safe {side}
            <input
              type="number"
              className="w-full border rounded px-2 py-1"
              value={safe[side]}
              onChange={(e) =>
                setSafe((prev) => ({
                  ...prev,
                  [side]: clamp(parseFloat(e.target.value) || 0, 0, 100),
                }))
              }
            />
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showMarks}
            onChange={(e) => setShowMarks(e.target.checked)}
          />
          Crop marks
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showReg}
            onChange={(e) => setShowReg(e.target.checked)}
          />
          Registration mark
        </label>
      </div>
    </div>
  </div>
);

export default BleedSafeMarksSection;
