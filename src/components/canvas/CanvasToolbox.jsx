import React from "react";
import {
  Box,
  Fab,
  IconButton,
  Paper,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  Circle,
  Image as ImageIcon,
  Images,
  Layout as LayoutIcon,
  Layers as LayersIcon,
  Menu as MenuIcon,
  Square,
  Type,
} from "lucide-react";
import UndoRedoControls from "../UndoRedoControls";

const CanvasToolbox = ({
  addCircle,
  addRect,
  addText,
  duplicateObject,
  handleUpload,
  redo,
  setIsRightbarOpen,
  setRightPanel,
  setShowMobileTools,
  showMobileTools,
  undo,
  withFabClose,
}) => (
  <>
    <Fab
      color="primary"
      size="medium"
      onClick={() => setShowMobileTools((v) => !v)}
      aria-label="Toggle Tools"
      sx={{
        position: "fixed",
        bottom: 80,
        left: 16,
        zIndex: 50,
        display: { xs: "flex", md: "none" },
      }}
    >
      <MenuIcon size={20} />
    </Fab>

    <Paper
      elevation={4}
      sx={{
        position: "fixed",
        top: 64,
        left: 8,
        zIndex: 40,
        p: 1,
        display: { xs: showMobileTools ? "flex" : "none", md: "flex" },
      }}
    >
      <Stack spacing={1}>
        <Tooltip title="Choose Gallery" placement="right">
          <IconButton
            onClick={() => {
              setRightPanel("gallaries");
              setIsRightbarOpen(true);
            }}
            color="primary"
            size="small"
          >
            <Images size={20} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Bulk Settings" placement="right">
          <IconButton
            onClick={() => {
              setRightPanel("bulk");
              setIsRightbarOpen(true);
            }}
            color="primary"
            size="small"
          >
            <LayersIcon size={20} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Add Frame" placement="right">
          <IconButton
            onClick={() => {
              setRightPanel("frames");
              setIsRightbarOpen(true);
            }}
            color="primary"
            size="small"
          >
            <LayoutIcon size={20} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Add Text" placement="right">
          <IconButton onClick={withFabClose(addText)} color="primary" size="small">
            <Type size={20} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Add Rectangle" placement="right">
          <IconButton onClick={withFabClose(addRect)} color="primary" size="small">
            <Square size={20} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Add Circle" placement="right">
          <IconButton onClick={withFabClose(addCircle)} color="primary" size="small">
            <Circle size={20} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Upload Image" placement="right">
          <IconButton component="label" color="primary" size="small">
            <ImageIcon size={20} />
            <input type="file" accept="image/*" hidden onChange={handleUpload} />
          </IconButton>
        </Tooltip>

        <Box sx={{ pt: 0.5 }}>
          <UndoRedoControls undo={undo} redo={redo} duplicateObject={duplicateObject} vertical />
        </Box>
      </Stack>
    </Paper>
  </>
);

export default CanvasToolbox;
