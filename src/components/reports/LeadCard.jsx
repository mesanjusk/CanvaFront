import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';

const LeadCard = ({ lead, courseName, onSelect, onWhatsApp, onCall }) => (
  <div
    onClick={() => onSelect(lead)}
    className="border rounded-lg p-4 shadow hover:shadow-md transition cursor-pointer flex flex-col justify-between"
  >
    <div>
      <h2 className="font-semibold text-lg text-gray-800">
        {lead.studentData?.firstName} {lead.studentData?.lastName}
      </h2>
      <p className="text-sm text-gray-600 mt-1">{courseName}</p>
    </div>
    <div className="flex justify-end items-center gap-3 mt-4">
      {/* WhatsApp button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onWhatsApp();
        }}
        className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600"
        title="WhatsApp"
        aria-label="Send WhatsApp"
      >
        <FaWhatsapp />
      </button>
      {/* Call button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCall();
        }}
        className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
        title="Call"
        aria-label="Call"
      >
        {/* Tailwind-only Phone SVG */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
          viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 5.879V6a17 17 0 0017 17h.121a2 2 0 001.995-1.851l.356-3.199a2 2 0 00-1.013-1.939l-3.28-1.8a2 2 0 00-2.393.275l-2.101 1.752a11.016 11.016 0 01-5.4-5.401l1.751-2.1a2 2 0 00.276-2.394l-1.801-3.28A2 2 0 005.05 3.23l-3.199.357A2 2 0 001 5.88z" />
        </svg>
      </button>
    </div>
  </div>
);

export default LeadCard;
