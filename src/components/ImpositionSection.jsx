import React, { useState } from "react";
import { clamp } from "../utils/numberUtils";

const ImpositionSection = ({
  imposeOn,
  setImposeOn,
  sheetPreset,
  setSheetPreset,
  sheetCustom,
  setSheetCustom,
  rows,
  setRows,
  cols,
  setCols,
  gap,
  setGap,
  outer,
  setOuter,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b">
      {/* Section Header */}
      <button
        className="w-full flex justify-between items-center p-3 text-sm font-semibold"
        onClick={() => setOpen(!open)}
      >
        <span>Imposition (n-up)</span>
        <span className="text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {/* Collapsible Content */}
      {open && (
        <div className="px-3 pb-3 space-y-2 text-sm">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={imposeOn}
              onChange={(e) => setImposeOn(e.target.checked)}
            />
            Enable Imposition on Sheet
          </label>

          {/* Sheet Presets */}
          <div className="grid grid-cols-2 gap-2">
            {["A4", "Letter", "Legal", "Tabloid", "Custom"].map((key) => (
              <button
                key={key}
                className={`border rounded px-2 py-1 ${
                  sheetPreset === key ? "bg-gray-900 text-white" : ""
                }`}
                onClick={() => setSheetPreset(key)}
              >
                {key}
              </button>
            ))}
          </div>

          {/* Custom Sheet Inputs */}
          {sheetPreset === "Custom" && (
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">
                Sheet W (mm)
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={sheetCustom.w_mm}
                  onChange={(e) =>
                    setSheetCustom((s) => ({
                      ...s,
                      w_mm: clamp(parseFloat(e.target.value) || 0, 30, 3000),
                    }))
                  }
                />
              </label>
              <label className="text-xs">
                Sheet H (mm)
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={sheetCustom.h_mm}
                  onChange={(e) =>
                    setSheetCustom((s) => ({
                      ...s,
                      h_mm: clamp(parseFloat(e.target.value) || 0, 30, 3000),
                    }))
                  }
                />
              </label>
            </div>
          )}

          {/* Rows & Cols */}
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs">
              Rows
              <input
                type="number"
                className="w-full border rounded px-2 py-1"
                value={rows}
                onChange={(e) =>
                  setRows(clamp(parseInt(e.target.value) || 1, 1, 20))
                }
              />
            </label>
            <label className="text-xs">
              Columns
              <input
                type="number"
                className="w-full border rounded px-2 py-1"
                value={cols}
                onChange={(e) =>
                  setCols(clamp(parseInt(e.target.value) || 1, 1, 20))
                }
              />
            </label>
          </div>

          {/* Gap */}
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs">
              Gap X (mm)
              <input
                type="number"
                className="w-full border rounded px-2 py-1"
                value={gap.x_mm}
                onChange={(e) =>
                  setGap((g) => ({
                    ...g,
                    x_mm: clamp(parseFloat(e.target.value) || 0, 0, 100),
                  }))
                }
              />
            </label>
            <label className="text-xs">
              Gap Y (mm)
              <input
                type="number"
                className="w-full border rounded px-2 py-1"
                value={gap.y_mm}
                onChange={(e) =>
                  setGap((g) => ({
                    ...g,
                    y_mm: clamp(parseFloat(e.target.value) || 0, 0, 100),
                  }))
                }
              />
            </label>
          </div>

          {/* Outer margins */}
          <div className="grid grid-cols-4 gap-2">
            {["top", "right", "bottom", "left"].map((side) => (
              <label key={side} className="text-xs capitalize">
                Outer {side}
                <input
                  type="number"
                  className="w-full border rounded px-2 py-1"
                  value={outer[side]}
                  onChange={(e) =>
                    setOuter((prev) => ({
                      ...prev,
                      [side]: clamp(parseFloat(e.target.value) || 0, 0, 200),
                    }))
                  }
                />
              </label>
            ))}
          </div>

          <div className="text-[11px] text-gray-500">
            When Bulk + Imposition are on, we tile across the sheet using your
            filtered students.
          </div>
        </div>
      )}
    </div>
  );
};

export default ImpositionSection;
