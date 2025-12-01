export function GalleryPanel({ galleries = [], loading = false, onSelect = () => {} }) {
return (
<div className="p-3">
<Typography variant="subtitle1">Gallery</Typography>
{loading ? <Typography variant="body2">Loading…</Typography> : (
<div className="grid grid-cols-2 gap-2 mt-3">
{galleries.map((g) => (
<div key={g._id || g.id} className="cursor-pointer" onClick={() => onSelect(g)}>
<img src={g.image} alt={g.title} className="w-full h-24 object-cover rounded" />
<Typography variant="caption" className="truncate">{g.title}</Typography>
</div>
))}
</div>
)}
</div>
);
}
GalleryPanel.propTypes = { galleries: PropTypes.array, loading: PropTypes.bool, onSelect: PropTypes.func };