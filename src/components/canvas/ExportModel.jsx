export function ExportModal({ open, onClose, onExport }) {
const [dpi, setDpi] = useState(300);
return (
<Modal open={open} onClose={onClose}>
<Box className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded shadow-lg w-96">
<Typography variant="h6">Export</Typography>
<div className="mt-3">
<Typography variant="subtitle2">DPI</Typography>
<Slider value={dpi} min={72} max={1200} onChange={(e,v)=> setDpi(v)} />
</div>
<div className="mt-4 flex gap-2 justify-end">
<Button onClick={onClose}>Cancel</Button>
<Button variant="contained" onClick={() => onExport({ dpi })}>Export</Button>
</div>
</Box>
</Modal>
);
}
ExportModal.propTypes = { open: PropTypes.bool, onClose: PropTypes.func, onExport: PropTypes.func };