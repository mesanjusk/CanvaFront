/* ------------------------- Viewport ------------------------- */
import PropTypes from "prop-types";

export function Viewport({ children, stageStyle = {}, className = "" }) {
  const { width, height, ...rest } = stageStyle;
  const aspectRatio = width && height ? `${width} / ${height}` : undefined;
  const maxHeight = "calc(100vh - 160px)";

  return (
    <div className={`w-full h-full p-4 md:p-6 flex items-center justify-center overflow-hidden ${className}`}>
      <div className="w-full h-full flex items-center justify-center overflow-auto">
        <div
          className="shadow-md border bg-white relative max-w-full"
          style={{
            width: "100%",
            maxWidth: width ? `${width}px` : "100%",
            maxHeight,
            aspectRatio,
            height: aspectRatio ? "auto" : "100%",
            ...rest,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
Viewport.propTypes = { children: PropTypes.node, stageStyle: PropTypes.object, className: PropTypes.string };

export default Viewport;
