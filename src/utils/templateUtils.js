const DIMENSION_PATHS = {
  width: [
    "width",
    "w",
    "canvasWidth",
    "canvas_width",
    "canvasSize.width",
    "canvas_size.width",
    "size.width",
    "dimensions.width",
  ],
  height: [
    "height",
    "h",
    "canvasHeight",
    "canvas_height",
    "canvasSize.height",
    "canvas_size.height",
    "size.height",
    "dimensions.height",
  ],
};

const PREVIEW_PATHS = [
  "previewImage",
  "thumbnail",
  "image",
  "coverImage",
  "backgroundImage",
];

const CANVAS_JSON_PATHS = [
  "canvasJson",
  "canvas_json",
  "layout",
  "canvas",
  "data",
];

const SEGMENT_SEPARATOR = ".";

const readPath = (source, path) =>
  path.split(SEGMENT_SEPARATOR).reduce((acc, key) => (acc == null ? undefined : acc[key]), source);

export const parsePositiveNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? Math.round(num) : null;
};

export const extractTemplateSize = (meta = {}) => {
  const width = DIMENSION_PATHS.width.reduce(
    (acc, path) => acc ?? parsePositiveNumber(readPath(meta, path)),
    null,
  );
  const height = DIMENSION_PATHS.height.reduce(
    (acc, path) => acc ?? parsePositiveNumber(readPath(meta, path)),
    null,
  );
  return { width, height };
};

export const parseMaybeJSON = (input) => {
  if (!input) return null;
  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch (err) {
      console.warn("Failed to parse template JSON", err);
      return null;
    }
  }
  if (typeof input === "object") return input;
  return null;
};

export const extractCanvasJsonFromMeta = (meta = {}) =>
  CANVAS_JSON_PATHS.reduce((acc, path) => acc ?? parseMaybeJSON(readPath(meta, path)), null);

export const pickTemplatePreview = (meta = {}) =>
  PREVIEW_PATHS.reduce((acc, path) => acc ?? readPath(meta, path), null) || null;

export const normalizeTemplateMeta = (meta = {}) => {
  const { width, height } = extractTemplateSize(meta);
  const preview = pickTemplatePreview(meta);
  const canvasJson = extractCanvasJsonFromMeta(meta);

  return {
    ...meta,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(preview ? { preview } : {}),
    ...(canvasJson ? { canvasJson } : {}),
  };
};
