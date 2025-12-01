export function ObjectSettingsPanel({ obj, onUpdate = () => {} }) {
return (
<div className="p-3">
<Typography variant="subtitle1">Object Settings</Typography>
<div className="mt-2">
<TextField label="Opacity" defaultValue={obj?.opacity ?? 1} type="number" onChange={(e) => onUpdate({ opacity: Number(e.target.value) })} fullWidth />
</div>
</div>
);
}
ObjectSettingsPanel.propTypes = { obj: PropTypes.object, onUpdate: PropTypes.func };