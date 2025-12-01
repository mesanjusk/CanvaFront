export function BackgroundRemoveModal({ open, onClose, onRemove }) {
return (
<Modal open={open} onClose={onClose}>
<Box className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow-lg w-80">
<Typography variant="h6">Remove Background</Typography>
<Typography variant="body2" className="mt-2">This will attempt to remove the background of the selected image.</Typography>
<div className="mt-3 flex justify-end gap-2">
<Button onClick={onClose}>Cancel</Button>
<Button variant="contained" onClick={onRemove}>Remove</Button>
</div>
</Box>
</Modal>
);
}
BackgroundRemoveModal.propTypes = { open: PropTypes.bool, onClose: PropTypes.func, onRemove: PropTypes.func };