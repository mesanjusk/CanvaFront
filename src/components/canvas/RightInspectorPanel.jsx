/* ------------------------- RightInspectorPanel ------------------------- */
import PropTypes from "prop-types";
import {
  Typography,
  Button,
  TextField,
  FormControlLabel,
  Switch
} from "@mui/material";


export function RightInspectorPanel({ activeObj = null, onUpdate = () => {}, onClose = () => {} }) {
if (!activeObj) {
return (
<div className="p-4">
<Typography variant="subtitle1">No selection</Typography>
<Typography variant="body2" color="textSecondary">Select an object to see properties</Typography>
</div>
);
}


const type = activeObj.type || 'object';
return (
<div className="p-4 space-y-4">
<div className="flex items-center justify-between">
<Typography variant="subtitle1">{type.toUpperCase()} Properties</Typography>
<Button size="small" onClick={onClose}>Close</Button>
</div>


{type === 'text' && (
<div className="space-y-2">
<TextField label="Text" defaultValue={activeObj.text} fullWidth onChange={(e) => onUpdate({ text: e.target.value })} />
<TextField label="Font size" defaultValue={activeObj.fontSize} fullWidth onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })} />
<TextField label="Color" defaultValue={activeObj.fill} fullWidth onChange={(e) => onUpdate({ fill: e.target.value })} />
</div>
)}


{type === 'image' && (
<div className="space-y-2">
<Button variant="outlined" onClick={() => onUpdate({ action: 'replace' })}>Replace Image</Button>
<Button variant="outlined" onClick={() => onUpdate({ action: 'removeBg' })}>Remove Background</Button>
<FormControlLabel control={<Switch />} label="Lock proportions" />
</div>
)}


{type === 'rect' && (
<div className="space-y-2">
<TextField label="Fill" defaultValue={activeObj.fill} fullWidth onChange={(e) => onUpdate({ fill: e.target.value })} />
<TextField label="Stroke" defaultValue={activeObj.stroke} fullWidth onChange={(e) => onUpdate({ stroke: e.target.value })} />
</div>
)}
</div>
);
}
RightInspectorPanel.propTypes = {
activeObj: PropTypes.object,
onUpdate: PropTypes.func,
onClose: PropTypes.func,
};

export default RightInspectorPanel;
