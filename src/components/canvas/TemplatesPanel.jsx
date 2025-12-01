export function TemplatesPanel({ templates = [], onLoad = () => {} }) {
return (
<div className="p-3">
<Typography variant="subtitle1">Templates</Typography>
<div className="grid grid-cols-2 gap-2 mt-3">
{templates.map((t) => (
<div key={t._id || t.id} className="cursor-pointer" onClick={() => onLoad(t)}>
<div className="aspect-[4/5] bg-gray-100 rounded overflow-hidden">
{t.image ? <img src={t.image} alt={t.title} className="w-full h-full object-cover" /> : <div className="p-4 text-xs">Preview</div>}
</div>
<Typography variant="caption" className="truncate">{t.title}</Typography>
</div>
))}
</div>
</div>
);
}
TemplatesPanel.propTypes = { templates: PropTypes.array, onLoad: PropTypes.func };