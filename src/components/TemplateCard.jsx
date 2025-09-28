import { memo } from "react";
import { extractTemplateSize, pickTemplatePreview } from "../utils/templateUtils";

const TemplateCard = memo(({ template, onSelect }) => {
  const preview = template.preview ?? pickTemplatePreview(template);
  const { width, height } = extractTemplateSize(template);
  const title = template.title || template.name || "Template preview";

  return (
    <button
      type="button"
      className="group flex w-full flex-col overflow-hidden rounded bg-white text-left shadow transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700"
      onClick={() => onSelect?.(template)}
    >
      <div className="relative w-full overflow-hidden">
        {preview ? (
          <img src={preview} alt={title} className="h-24 w-full object-cover" />
        ) : (
          <div className="flex h-24 w-full items-center justify-center bg-gray-100 text-xs text-gray-500">Preview</div>
        )}
      </div>
      <div className="flex flex-col items-center gap-1 p-2 text-center">
        <div className="w-full truncate text-xs font-medium text-gray-900 dark:text-gray-100">{title}</div>
        <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-300">
          {width && height ? `${width}×${height} px` : "Flexible size"}
        </div>
      </div>
    </button>
  );
});

export default TemplateCard;
