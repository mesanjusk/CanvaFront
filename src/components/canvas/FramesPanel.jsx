export function FramesPanel({ onAddFrame = () => {} }) {
return (
<div className="p-3">
<Typography variant="subtitle1">Frames</Typography>
<div className="mt-2 space-y-2">
<Button onClick={() => onAddFrame('rounded')} variant="outlined">Rounded</Button>
<Button onClick={() => onAddFrame('circle')} variant="outlined">Circle</Button>
</div>
</div>
);
}
FramesPanel.propTypes = { onAddFrame: PropTypes.func };