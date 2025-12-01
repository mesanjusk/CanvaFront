import React, { useEffect, useState } from "react";
import {
  Box,
  IconButton,
  InputAdornment,
  Slider,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

const SelectionToolbar = ({ activeObj, canvas }) => {
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!activeObj || !canvas) return;

    const updatePosition = () => {
      const rect = activeObj.getBoundingRect();
      const canvasRect = canvas.upperCanvasEl.getBoundingClientRect();
      setPos({
        left: canvasRect.left + rect.left + rect.width / 2,
        top: canvasRect.top + rect.top,
      });
    };

    updatePosition();
    canvas.on("object:moving", updatePosition);
    canvas.on("object:scaling", updatePosition);
    canvas.on("object:modified", updatePosition);
    return () => {
      canvas.off("object:moving", updatePosition);
      canvas.off("object:scaling", updatePosition);
      canvas.off("object:modified", updatePosition);
    };
  }, [activeObj, canvas]);

  if (!activeObj) return null;

  const isText = activeObj.type === "i-text" || activeObj.type === "text";
  const isRect = activeObj.type === "rect";

  const apply = (props) => {
    activeObj.set(props);
    activeObj.setCoords();
    canvas.requestRenderAll();
  };

  return (
    <Box
      sx={{
        position: "fixed",
        zIndex: 50,
        backgroundColor: "background.paper",
        boxShadow: 3,
        borderRadius: 1,
        p: 1,
        transform: "translate(-50%, -110%)",
        left: pos.left,
        top: pos.top,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <TextField
          type="color"
          value={typeof activeObj.fill === "string" ? activeObj.fill : "#000000"}
          onChange={(e) => apply({ fill: e.target.value })}
          size="small"
          InputProps={{
            sx: { width: 48, height: 48, p: 0.5 },
          }}
        />

        {isText && (
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              type="number"
              size="small"
              value={activeObj.fontSize || 20}
              inputProps={{ min: 8, max: 200, style: { width: 64 } }}
              onChange={(e) => apply({ fontSize: parseInt(e.target.value) || 12 })}
              label="Size"
            />
            <Tooltip title="Bold">
              <IconButton
                size="small"
                color={activeObj.fontWeight === "bold" ? "primary" : "default"}
                onClick={() =>
                  apply({ fontWeight: activeObj.fontWeight === "bold" ? "normal" : "bold" })
                }
              >
                <Bold size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Italic">
              <IconButton
                size="small"
                color={activeObj.fontStyle === "italic" ? "primary" : "default"}
                onClick={() =>
                  apply({ fontStyle: activeObj.fontStyle === "italic" ? "normal" : "italic" })
                }
              >
                <Italic size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Align left">
              <IconButton size="small" onClick={() => apply({ textAlign: "left" })}>
                <AlignLeft size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Align center">
              <IconButton size="small" onClick={() => apply({ textAlign: "center" })}>
                <AlignCenter size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Align right">
              <IconButton size="small" onClick={() => apply({ textAlign: "right" })}>
                <AlignRight size={16} />
              </IconButton>
            </Tooltip>
            <TextField
              type="number"
              size="small"
              value={activeObj.charSpacing || 0}
              onChange={(e) => apply({ charSpacing: parseInt(e.target.value) })}
              label="Spacing"
              InputProps={{
                endAdornment: <InputAdornment position="end">pt</InputAdornment>,
                inputProps: { min: -100, max: 400, style: { width: 80 } },
              }}
            />
          </Stack>
        )}

        {isRect && (
          <Box sx={{ width: 140 }}>
            <Slider
              size="small"
              min={0}
              max={100}
              value={activeObj.rx || 0}
              onChange={(e, value) =>
                apply({ rx: parseInt(value), ry: parseInt(value) })
              }
              valueLabelDisplay="auto"
            />
          </Box>
        )}

        <Box sx={{ width: 140 }}>
          <Slider
            size="small"
            min={0}
            max={1}
            step={0.05}
            value={activeObj.opacity ?? 1}
            onChange={(e, value) => apply({ opacity: parseFloat(value) })}
            valueLabelDisplay="auto"
          />
        </Box>
      </Stack>
    </Box>
  );
};

export default SelectionToolbar;
