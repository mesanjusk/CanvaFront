/* ------------------------- BottomBar ------------------------- */
import PropTypes from "prop-types";

export function BottomBar({ children }) {
return (
<div className="h-14 border-t bg-white flex items-center px-4">{children}</div>
);
}
BottomBar.propTypes = { children: PropTypes.node };

export default BottomBar;
