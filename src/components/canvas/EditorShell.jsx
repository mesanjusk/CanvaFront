/* ------------------------- EditorShell ------------------------- */
import PropTypes from "prop-types";

export function EditorShell({
topBar,
leftToolbar,
viewport,
rightPanel,
bottomBar,
}) {
return (
<div className="min-h-screen w-screen flex flex-col bg-gray-50">
<div className="flex-shrink-0">{topBar}</div>
<div className="flex-1 flex overflow-hidden">
<div className="w-72 border-r bg-white overflow-auto">{leftToolbar}</div>
<div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center">{viewport}</div>
<div className="w-80 border-l bg-white overflow-auto">{rightPanel}</div>
</div>
<div className="flex-shrink-0">{bottomBar}</div>
</div>
);
}
EditorShell.propTypes = {
topBar: PropTypes.node,
leftToolbar: PropTypes.node,
viewport: PropTypes.node,
rightPanel: PropTypes.node,
bottomBar: PropTypes.node,
};

export default EditorShell;
