import { memo } from 'react';

const TemplateCard = memo(({ template, onSelect }) => (
  <div
    className="cursor-pointer rounded overflow-hidden shadow hover:shadow-lg bg-white dark:bg-gray-700"
    onClick={() => onSelect(template.layout ? JSON.parse(template.layout) : template.data)}
  >
    {template.image && (
      <img
        src={template.image}
        alt={template.title || template.name}
        className="w-full h-24 object-cover"
      />
    )}
    <div className="p-2 text-center text-sm">
      {template.title || template.name}
    </div>
  </div>
));

export default TemplateCard;
