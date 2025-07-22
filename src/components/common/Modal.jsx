import React from 'react';

/**
 * Generic modal container. Renders children in a centered box with a dark overlay.
 * Accepts a title, optional actions and an onClose handler.
 */
const Modal = ({ title, onClose, actions, children }) => (
  <div
    className="fixed inset-0 z-[60] bg-black bg-opacity-40 flex items-center justify-center p-4 overflow-y-auto"
    onClick={onClose}
  >
    <div
      className="bg-white p-6 rounded shadow max-w-xl w-full max-h-screen overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      {children}
      {actions && <div className="mt-4 flex justify-end gap-2">{actions}</div>}
    </div>
  </div>
);

export default Modal;
