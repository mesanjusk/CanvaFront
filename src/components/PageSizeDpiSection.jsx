import React from "react";
import { Slider } from "@mui/material";
import { clamp } from "../utils/numberUtils";

const PageSizeDpiSection = ({
  usePrintSizing,
  setUsePrintSizing,
  pagePreset,
  setPagePreset,
  customPage,
  setCustomPage,
  pageOrientation,
  setPageOrientation,
  dpi,
  setDpi,
}) => (
  <div className="border-b">
    <button className="w-full text-left p-3 text-sm font-semibold">
      Page Size & DPI
    </button>
    <div className="px-3 pb-3 space-y-2 text-sm">
      <label className="flex items-center gap-2 text-xs mb-2">
        <input
          type="checkbox"
          checked={usePrintSizing}
          onChange={(e) => setUsePrintSizing(e.target.checked)}
        />
        Enable print sizing
      </label>
      <div className="grid grid-cols-2 gap-2">
        {["ID-1/CR80", "A4", "Letter", "Legal", "Tabloid", "Custom"].map(
          (key) => (
            <button
              key={key}
              onClick={() => setPagePreset(key)}
              className={`border rounded px-2 py-1 ${
                pagePreset === key ? "bg-gray-900 text-white" : ""
              }`}
            >
              {key}
            </button>
          )
        )}
      </div>
      {pagePreset === "Custom" && (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs">
            Width (mm)
            <input
              type="number"
              className="w-full border rounded px-2 py-1"
              value={customPage.w_mm}
              onChange={(e) =>
                setCustomPage((s) => ({
                  ...s,
                  w_mm: clamp(parseFloat(e.target.value) || 0, 1, 3000),
                }))
              }
            />
          </label>
          <label className="text-xs">
            Height (mm)
            <input
              type="number"
              className="w-full border rounded px-2 py-1"
              value={customPage.h_mm}
              onChange={(e) =>
                setCustomPage((s) => ({
                  ...s,
                  h_mm: clamp(parseFloat(e.target.value) || 0, 1, 3000),
                }))
              }
            />
          </label>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button
          className={`border rounded px-2 py-1 ${
            pageOrientation === "portrait" ? "bg-gray-900 text-white" : ""
          }`}
          onClick={() => setPageOrientation("portrait")}
        >
          Portrait
        </button>
        <button
          className={`border rounded px-2 py-1 ${
            pageOrientation === "landscape" ? "bg-gray-900 text-white" : ""
          }`}
          onClick={() => setPageOrientation("landscape")}
        >
          Landscape
        </button>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs">DPI</span>
          <span className="text-[11px] opacity-70">{dpi} dpi</span>
        </div>
        <Slider
          min={150}
          max={600}
          step={50}
          value={dpi}
          onChange={(_, v) => setDpi(Array.isArray(v) ? v[0] : v)}
        />
      </div>
    </div>
  </div>
);

export default PageSizeDpiSection;
