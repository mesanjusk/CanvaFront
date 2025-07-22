import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  // Utility: check if the current route is active
  const isActive = (route) => location.pathname.startsWith(route);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-1 bg-white border-t">
      <div className="flex justify-around p-2">
        {/* Enquiry */}
        <button
          className={`flex flex-col items-center ${isActive('/dashboard/leads') ? 'text-green-600 font-bold' : 'text-gray-500'}`}
          onClick={() => navigate('/dashboard/leads')}
        >
          <svg className="h-6 w-6" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z"/>  
            <rect x="5" y="3" width="14" height="18" rx="2" />  
            <line x1="9" y1="7" x2="15" y2="7" />  
            <line x1="9" y1="11" x2="15" y2="11" />  
            <line x1="9" y1="15" x2="13" y2="15" />
          </svg>
          <span className="text-xs">Enquiry</span>
        </button>

        {/* Admission */}
        <button
          className={`flex flex-col items-center ${isActive('/dashboard/allLeadByAdmission') ? 'text-green-600 font-bold' : 'text-gray-500'}`}
          onClick={() => navigate('/dashboard/allLeadByAdmission')}
        >
          <svg className="h-6 w-6" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z"/>  
            <circle cx="7" cy="17" r="2" />  
            <circle cx="17" cy="17" r="2" />  
            <path d="M5 17h-2v-4m-1 -8h11v12m-4 0h6m4 0h2v-6h-8m0 -5h5l3 5" />  
            <line x1="3" y1="9" x2="7" y2="9" />
          </svg>
          <span className="text-xs">Admission</span>
        </button>

        {/* WhatsApp */}
        <button
          className={`flex flex-col items-center ${isActive('/dashboard/whatsapp') ? 'text-green-600 font-bold' : 'text-green-600'}`}
          onClick={() => navigate('/dashboard/whatsapp')}
        >
          <FaWhatsapp className="text-4xl" />
          
        </button>

        {/* Reminder */}
        <button
          className={`flex flex-col items-center ${isActive('/reminder') ? 'text-green-600 font-bold' : 'text-gray-500'}`}
          onClick={() => navigate('/reminder')}
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />  
            <line x1="16" y1="2" x2="16" y2="6" />  
            <line x1="8" y1="2" x2="8" y2="6" />  
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-xs">Reminder</span>
        </button>

        {/* Outstanding */}
        <button
          className={`flex flex-col items-center ${isActive('/admin/allbalance') ? 'text-green-600 font-bold' : 'text-gray-500'}`}
          onClick={() => navigate('/admin/allbalance')}
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z"/>  
            <path d="M9 7 h-3a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-3" />  
            <path d="M9 15h3l8.5 -8.5a1.5 1.5 0 0 0 -3 -3l-8.5 8.5v3" />  
            <line x1="16" y1="5" x2="19" y2="8" />
          </svg>
          <span className="text-xs">Outstanding</span>
        </button>
      </div>
    </div>
  );
}
