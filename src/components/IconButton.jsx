// IconButton.jsx
import React from "react";

const IconButton = ({ onClick, title, children, className = "" }) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded bg-white shadow hover:bg-blue-100 ${className}`.trim()}
    >
      {children}
    </button>
  );
};

export default IconButton;
