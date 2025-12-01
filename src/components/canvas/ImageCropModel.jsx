export function ImageCropModal({ open = true, src = null, onCancel = () => {}, onConfirm = () => {} }) {
return (
<Modal open={open} onClose={onCancel}>
<Box className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded shadow-lg w-96">
<Typography variant="h6">Crop Image</Typography>
<div className="mt-2 h-56 bg-gray-100 flex items-center justify-center">{src ? <img src={src} alt="crop" className="max-h-full" /> : 'Preview'}</div>
<div className="mt-3 flex justify-end gap-2">
<Button onClick={onCancel}>Cancel</Button>
<Button variant="contained" onClick={() => onConfirm(src)}>Confirm</Button>
</div>
</Box>
</Modal>
);
}
ImageCropModal.propTypes = { open: PropTypes.bool, src: PropTypes.string, onCancel: PropTypes.func, onConfirm: PropTypes.func };