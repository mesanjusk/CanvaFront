/* ------------------------- RightInspectorPanel ------------------------- */
import PropTypes from "prop-types";
import { Box, Typography, Button, TextField, FormControlLabel, Switch, Stack } from "@mui/material";

export function RightInspectorPanel({ activeObj = null, onUpdate = () => {}, onClose = () => {} }) {
  if (!activeObj) {
    return (
      <Box p={3}>
        <Typography variant="subtitle1">No selection</Typography>
        <Typography variant="body2" color="text.secondary">
          Select an object to see properties
        </Typography>
      </Box>
    );
  }

  const type = activeObj.type || "object";

  return (
    <Stack spacing={3} p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1">{type.toUpperCase()} Properties</Typography>
        <Button size="small" onClick={onClose} variant="outlined">
          Close
        </Button>
      </Stack>

      {type === "text" && (
        <Stack spacing={2}>
          <TextField
            label="Text"
            defaultValue={activeObj.text}
            fullWidth
            onChange={(e) => onUpdate({ text: e.target.value })}
          />
          <TextField
            label="Font size"
            type="number"
            defaultValue={activeObj.fontSize}
            fullWidth
            onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
          />
          <TextField
            label="Color"
            type="color"
            defaultValue={activeObj.fill}
            fullWidth
            onChange={(e) => onUpdate({ fill: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      )}

      {type === "image" && (
        <Stack spacing={2}>
          <Button variant="outlined" onClick={() => onUpdate({ action: "replace" })}>
            Replace Image
          </Button>
          <Button variant="outlined" onClick={() => onUpdate({ action: "removeBg" })}>
            Remove Background
          </Button>
          <FormControlLabel control={<Switch />} label="Lock proportions" />
        </Stack>
      )}

      {type === "rect" && (
        <Stack spacing={2}>
          <TextField
            label="Fill"
            type="color"
            defaultValue={activeObj.fill}
            fullWidth
            onChange={(e) => onUpdate({ fill: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Stroke"
            type="color"
            defaultValue={activeObj.stroke}
            fullWidth
            onChange={(e) => onUpdate({ stroke: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      )}
    </Stack>
  );
}

RightInspectorPanel.propTypes = {
  activeObj: PropTypes.object,
  onUpdate: PropTypes.func,
  onClose: PropTypes.func,
};

export default RightInspectorPanel;
