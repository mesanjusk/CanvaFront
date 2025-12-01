export function BulkPanel({ bulkMode = false, onToggleBulk = () => {}, onExport = () => {} }) {
return (
<div className="p-3 space-y-3">
<Typography variant="subtitle1">Bulk & Print</Typography>
<FormControlLabel control={<Switch checked={bulkMode} onChange={(e) => onToggleBulk(e.target.checked)} />} label="Enable Bulk" />
<div className="space-y-2">
<Button variant="outlined" onClick={() => onExport('png')}>Export Bulk PNG</Button>
<Button variant="outlined" onClick={() => onExport('pdf')}>Export Bulk PDF</Button>
</div>
</div>
);
}
BulkPanel.propTypes = { bulkMode: PropTypes.bool, onToggleBulk: PropTypes.func, onExport: PropTypes.func };