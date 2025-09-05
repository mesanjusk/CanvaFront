import React from "react";
import { Button, Slider } from "@mui/material";
import IconButton from "./IconButton";
import {
  Square,
  Circle,
  Triangle,
  Hexagon,
  Star,
  Heart,
  RefreshCw,
} from "lucide-react";

const shapeIconMap = {
  rect: Square,
  rounded: Square,
  circle: Circle,
  triangle: Triangle,
  hexagon: Hexagon,
  star: Star,
  heart: Heart,
};

const ImageToolsSection = ({
  activeObj,
  showImageTools,
  setShowImageTools,
  frameShape,
  setFrameShape,
  frameCorner,
  setFrameCorner,
  frameWidth,
  setFrameWidth,
  frameBorder,
  setFrameBorder,
  adjustMode,
  enterAdjustMode,
  exitAdjustMode,
  fitImageToFrame,
  centerImageInFrame,
  setImageZoom,
  canvas,
  applyMaskAndFrame,
  removeMaskAndFrame,
  replaceActiveImage,
  extractActiveImage,
  saveHistory,
}) => {
  if (!activeObj || activeObj.type !== "image") return null;
  return (
    <div className="border-b">
      <button
        className="w-full text-left p-3 text-sm font-semibold"
        onClick={() => setShowImageTools((v) => !v)}
      >
        Mask & Frame / Adjust
      </button>
      {showImageTools && (
        <div className="px-3 pb-3">
          <div className="grid grid-cols-4 gap-2 mb-3">
            {["rect","rounded","circle","triangle","hexagon","star","heart"].map((shape) => {
              const Icon = shapeIconMap[shape];
              return (
                <IconButton
                  key={shape}
                  title={shape}
                  onClick={() => {
                    setFrameShape(shape);
                    applyMaskAndFrame(canvas, activeObj, shape, {
                      stroke: frameBorder,
                      strokeWidth: frameWidth,
                      rx: frameCorner,
                      absolute: adjustMode,
                      followImage: !adjustMode,
                    });
                    if (adjustMode) fitImageToFrame(activeObj, "cover");
                    saveHistory();
                  }}
                >
                  <Icon size={18} />
                </IconButton>
              );
            })}
            <IconButton
              title="Remove Frame (keep slot)"
              onClick={() => {
                removeMaskAndFrame(canvas, activeObj, true);
                saveHistory();
              }}
            >
              <RefreshCw size={18} />
            </IconButton>
          </div>

          {frameShape === "rounded" && (
            <div className="mb-2">
              <label className="block text-xs mb-1">Corner Radius</label>
              <Slider
                min={0}
                max={Math.floor(
                  Math.min(activeObj?.width || 100, activeObj?.height || 100) /
                    2
                )}
                value={frameCorner}
                onChange={(_, v) => {
                  const val = Array.isArray(v) ? v[0] : v;
                  setFrameCorner(val);
                  if (activeObj) {
                    applyMaskAndFrame(canvas, activeObj, "rounded", {
                      stroke: frameBorder,
                      strokeWidth: frameWidth,
                      rx: val,
                      absolute: adjustMode,
                      followImage: !adjustMode,
                    });
                    if (adjustMode) fitImageToFrame(activeObj, "cover");
                  }
                }}
              />
            </div>
          )}

          <div className="mb-2">
            <label className="block text-xs mb-1">Border Width</label>
            <Slider
              min={0}
              max={30}
              value={frameWidth}
              onChange={(_, v) => {
                const val = Array.isArray(v) ? v[0] : v;
                setFrameWidth(val);
                if (activeObj?.frameOverlay) {
                  activeObj.frameOverlay.set({ strokeWidth: val });
                  canvas.requestRenderAll();
                }
              }}
            />
          </div>

          <div className="mb-2">
            <label className="block text-xs mb-1">Border Color</label>
            <input
              type="color"
              value={frameBorder}
              onChange={(e) => {
                const col = e.target.value;
                setFrameBorder(col);
                if (activeObj?.frameOverlay) {
                  activeObj.frameOverlay.set({ stroke: col });
                  canvas.requestRenderAll();
                }
              }}
            />
          </div>

          <div className="mt-4 p-3 border rounded">
            <div className="text-sm font-semibold mb-2">Adjust Image in Frame</div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {!adjustMode ? (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => enterAdjustMode(activeObj)}
                >
                  Enter Adjust
                </Button>
              ) : (
                <Button
                  size="small"
                  color="secondary"
                  variant="outlined"
                  onClick={() => exitAdjustMode(activeObj)}
                >
                  Done
                </Button>
              )}
              <Button
                size="small"
                variant="outlined"
                onClick={() => fitImageToFrame(activeObj, "contain")}
                disabled={!adjustMode}
              >
                Fit
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => fitImageToFrame(activeObj, "cover")}
                disabled={!adjustMode}
              >
                Fill
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => centerImageInFrame(activeObj)}
                disabled={!adjustMode}
              >
                Center
              </Button>
            </div>
            <div className="mb-2">
              <label className="block text-xs mb-1">Zoom</label>
              <Slider
                min={0.1}
                max={5}
                step={0.01}
                value={Number((activeObj?.scaleX || 1).toFixed(2))}
                onChange={(_, v) =>
                  setImageZoom(activeObj, Array.isArray(v) ? v[0] : v)
                }
                disabled={!adjustMode}
              />
            </div>
            <div className="text-[11px] text-gray-500 mt-2">
              Double-click an image to enter Adjust. Drag to pan under the mask.
              Use Fit/Fill/Center/Zoom.
            </div>
            <div className="mt-3">
              <Button
                size="small"
                variant="outlined"
                onClick={replaceActiveImage}
              >
                Replace Image
              </Button>
              {activeObj?.frameOverlay && (
                <Button
                  size="small"
                  variant="text"
                  className="ml-2"
                  onClick={extractActiveImage}
                >
                  Extract (remove frame)
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageToolsSection;

