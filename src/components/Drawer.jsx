import React from "react";

const Drawer = ({ isOpen, onClose, children }) => {
  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? "visible" : "invisible pointer-events-none"
      }`}
    >
      <div
        className={`absolute inset-0 bg-black bg-opacity-40 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      ></div>
      <div
        className={`fixed bottom-0 left-0 w-full md:w-80 bg-white rounded-t-2xl shadow-lg transform transition-transform duration-300 ${
          isOpen ? "translate-y-0" : "translate-y-full"
        } md:top-0 md:right-0 md:left-auto md:rounded-l-2xl md:rounded-t-none md:translate-y-0 md:translate-x-0`}
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        <button
          className="absolute top-3 right-4 text-2xl font-bold text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          ×
        </button>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export default Drawer;
