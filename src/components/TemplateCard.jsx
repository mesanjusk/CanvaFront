import { memo } from 'react';

const TemplateCard = memo(({ template, onSelect }) => {
  const preview =
    template.image ||
    template.previewImage ||
    template.thumbnail ||
    template.coverImage ||
    null;

  return (
    <div
      className="cursor-pointer rounded overflow-hidden shadow hover:shadow-lg bg-white dark:bg-gray-700"
      onClick={() => onSelect(template)}
    >
      {preview && (
        <img
          src={preview}
          alt={template.title || template.name || "Template preview"}
          className="w-full h-24 object-cover"
        />
      )}
      <div className="p-2 text-center text-sm">
        {template.title || template.name || "Untitled"}
      </div>
    </div>
  );
});

export default TemplateCard;
