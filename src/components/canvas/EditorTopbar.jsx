/* ------------------------- EditorTopBar ------------------------- */
import PropTypes from "prop-types";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Slider,
  Switch,
  FormControlLabel
} from "@mui/material";

import {
  Menu as MenuIcon,
  Save,
  Download,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  HelpOutline,
  Tune
} from "@mui/icons-material";


export function EditorTopBar({
  fileName = "Untitled",
  zoom = 100,
  onZoomChange = () => {},
  onSave = () => {},
  onDownload = () => {},
  onUndo = () => {},
  onRedo = () => {},
  onToggleHelp = () => {},
  showGrid = false,
  onToggleGrid = () => {},
  snapObjects = true,
  onToggleSnap = () => {},
  onToggleLeftPanel = () => {},
  onToggleRightPanel = () => {},
  isMobile = false,
}) {
  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar className="flex items-center gap-3">
        <IconButton edge="start" aria-label="menu" size="large" onClick={isMobile ? onToggleLeftPanel : undefined}>
          <MenuIcon />
        </IconButton>
        <Typography variant="subtitle1" className="truncate max-w-xs">
          {fileName}
        </Typography>

        <div className="ml-4 flex items-center gap-2">
          <Button startIcon={<Save />} onClick={onSave} variant="outlined" size="small">
            Save
          </Button>
          <Button startIcon={<Download />} onClick={onDownload} variant="contained" size="small">
            Export
          </Button>
        </div>

        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <IconButton onClick={onUndo} size="large" title="Undo">
            <Undo />
          </IconButton>
          <IconButton onClick={onRedo} size="large" title="Redo">
            <Redo />
          </IconButton>

          <div className="flex items-center gap-2 px-3">
            <ZoomOut />
            <Slider
              value={zoom}
              onChange={(e, v) => onZoomChange(v)}
              min={10}
              max={400}
              sx={{ width: 160 }}
            />
            <ZoomIn />
          </div>

          <FormControlLabel
            control={<Switch checked={showGrid} onChange={(e) => onToggleGrid(e.target.checked)} size="small" />}
            label="Grid"
          />

          <FormControlLabel
            control={<Switch checked={snapObjects} onChange={(e) => onToggleSnap(e.target.checked)} size="small" />}
            label="Snap"
          />

          {isMobile && (
            <IconButton onClick={onToggleRightPanel} size="large" title="Inspector">
              <Tune />
            </IconButton>
          )}

          <IconButton onClick={onToggleHelp} title="Shortcuts" size="large">
            <HelpOutline />
          </IconButton>
        </div>
      </Toolbar>
    </AppBar>
  );
}
EditorTopBar.propTypes = {
  fileName: PropTypes.string,
  zoom: PropTypes.number,
  onZoomChange: PropTypes.func,
  onSave: PropTypes.func,
  onDownload: PropTypes.func,
  onUndo: PropTypes.func,
  onRedo: PropTypes.func,
  onToggleHelp: PropTypes.func,
  showGrid: PropTypes.bool,
  onToggleGrid: PropTypes.func,
  snapObjects: PropTypes.bool,
  onToggleSnap: PropTypes.func,
  onToggleLeftPanel: PropTypes.func,
  onToggleRightPanel: PropTypes.func,
  isMobile: PropTypes.bool,
};

export default EditorTopBar;
