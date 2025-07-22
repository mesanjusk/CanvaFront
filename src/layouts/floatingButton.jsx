import React, { useState } from "react";

const FloatingButtons = ({ buttonsList = [], direction = "up" }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Modern + Button
  const getButtonIcon = () => (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div className="fixed bottom-20 right-10 flex flex-col items-center z-50">
      {/* Action Buttons */}
      {isOpen && (
        <div
          className={`flex ${
            direction === "up" ? "flex-col-reverse" : "flex-col"
          } items-center gap-3 mb-3 transition-all ease-out duration-300`}
        >
          {buttonsList.length === 0 ? (
            <p className="text-white text-sm">No actions</p>
          ) : (
            buttonsList.map((button, index) => (
              <button
                key={index}
                onClick={() => {
                  button.onClick();
                  setIsOpen(false); // Auto-close after click
                }}
                tabIndex={0}
                className="w-36 h-12 bg-white text-green-700 font-semibold p-2 rounded-full shadow-lg hover:bg-green-100 transition-all duration-200 transform hover:scale-105 focus:outline-none"
                aria-label={button.label || `Action ${index + 1}`}
                title={button.label || ""}
              >
                <span className="mx-auto">{button.label}</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Toggle FAB */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-10 h-10 bg-green-600 text-white flex justify-center items-center rounded-full shadow-2xl hover:bg-green-700 transition-all duration-200 transform hover:rotate-90 focus:outline-none"
        aria-label="Toggle actions"
      >
        {getButtonIcon()}
      </button>
    </div>
  );
};

export default FloatingButtons;
