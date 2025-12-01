export function ShortcutsDialog({ open = false, onClose = () => {} }) {
return (
<Modal open={open} onClose={onClose}>
<Box className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded shadow-lg w-96">
<Typography variant="h6">Keyboard Shortcuts</Typography>
<div className="mt-3 text-sm space-y-2">
<div><strong>Ctrl/Cmd + Z</strong> — Undo</div>
<div><strong>Ctrl/Cmd + Shift + Z</strong> — Redo</div>
<div><strong>Space</strong> — Pan</div>
<div><strong>Ctrl/Cmd + S</strong> — Save</div>
</div>
<div className="mt-4 flex justify-end"><Button onClick={onClose}>Close</Button></div>
</Box>
</Modal>
);
}
ShortcutsDialog.propTypes = { open: PropTypes.bool, onClose: PropTypes.func };