import React from "react";
import { Button, Stack } from "@mui/material";
import IconButton from "./IconButton";
import { Crop, Trash2, Lock, Unlock, Move } from "lucide-react";

const SelectedObjectSection = ({
  activeObj,
  showSelectedSection,
  setShowSelectedSection,
  cropImage,
  canvas,
  removeMaskAndFrame,
  setActiveObj,
  setActiveStudentPhoto,
  saveHistory,
  extractActiveImage,
  activeStudentPhoto,
  setImageZoom,
  getOverlayBox,
}) => {
  if (!activeObj) return null;
  return (
    <div className="border-b">
      <button
        className="w-full text-left p-3 text-sm font-semibold"
        onClick={() => setShowSelectedSection((v) => !v)}
      >
        Selected Object
      </button>
      {showSelectedSection && (
        <div className="px-3 pb-3">
          <div className="flex flex-wrap gap-2">
            <IconButton onClick={cropImage} title="Crop">
              <Crop size={18} />
            </IconButton>
            <IconButton
              onClick={() => {
                const obj = activeObj;
                if (!obj) return;
                if (obj.type === "image" && obj.frameOverlay) {
                  removeMaskAndFrame(canvas, obj, true);
                  canvas.remove(obj);
                } else {
                  canvas.remove(obj);
                }
                setActiveObj(null);
                setActiveStudentPhoto(null);
                saveHistory();
              }}
              title="Delete"
            >
              <Trash2 size={18} />
            </IconButton>
            <IconButton
              onClick={() => {
                const locked = !!activeObj.lockMovementX;
                activeObj.set({
                  lockMovementX: !locked,
                  lockMovementY: !locked,
                  lockScalingX: !locked,
                  lockScalingY: !locked,
                  lockRotation: !locked,
                  hasControls: locked,
                });
                canvas.renderAll();
              }}
              title="Lock/Unlock"
            >
              {activeObj?.lockMovementX ? <Unlock size={18} /> : <Lock size={18} />}
            </IconButton>
            {activeObj?.type === "image" && activeObj?.frameOverlay && (
              <IconButton onClick={extractActiveImage} title="Extract Image (remove frame)">
                <Move size={18} />
              </IconButton>
            )}
          </div>

          {activeStudentPhoto && (
            <Stack direction="row" spacing={1} justifyContent="start" className="mt-3">
              <Button
                variant="contained"
                size="small"
                onClick={() =>
                  setImageZoom(
                    activeStudentPhoto,
                    (activeStudentPhoto.scaleX || 1) * 1.1
                  )
                }
              >
                Zoom In
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() =>
                  setImageZoom(
                    activeStudentPhoto,
                    (activeStudentPhoto.scaleX || 1) * 0.9
                  )
                }
              >
                Zoom Out
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  const box = getOverlayBox(activeStudentPhoto);
                  if (!box) return;
                  const scale = Math.min(
                    box.w / activeStudentPhoto.width,
                    box.h / activeStudentPhoto.height
                  );
                  activeStudentPhoto.set({
                    scaleX: scale,
                    scaleY: scale,
                    left: box.cx,
                    top: box.cy,
                    originX: "center",
                    originY: "center",
                  });
                  canvas.requestRenderAll();
                }}
              >
                Reset Fit
              </Button>
            </Stack>
          )}
        </div>
      )}
    </div>
  );
};

export default SelectedObjectSection;

