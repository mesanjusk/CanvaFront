/* ------------------------- Viewport ------------------------- */
import PropTypes from "prop-types";

export function Viewport({ children, stageStyle = {}, className = '' }) {
return (
<div className={`p-6 flex items-center justify-center ${className}`}>
<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
<div className="shadow-md border bg-white relative" style={stageStyle}>
{children}
</div>
</div>
</div>
);
}
Viewport.propTypes = { children: PropTypes.node, stageStyle: PropTypes.object };

export default Viewport;
