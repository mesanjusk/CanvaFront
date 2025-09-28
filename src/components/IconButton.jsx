// IconButton.jsx
import React from "react";

const IconButton = ({ onClick, title, children, className = "", disabled = false, ...props }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`p-2 rounded bg-white shadow ${disabled ? "cursor-not-allowed opacity-60" : "hover:bg-blue-100"} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default IconButton;
