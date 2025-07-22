import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { FaPhoneAlt, FaWhatsapp } from 'react-icons/fa';
import BASE_URL from '../config';
import LeadStatusModal from "../components/leads/LeadStatusModal";
import { saveRecords, getAllRecords } from '../db/dbService';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const navigate = useNavigate();
  const { username } = useParams();
  const [courses, setCourses] = useState([]);

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/courses`, {
      });
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };


  const fetchLeads = async () => {
    try {
      setLoading(true);
      const institute_uuid = localStorage.getItem('institute_uuid');
      const { data } = await axios.get(`${BASE_URL}/api/leads`, {
        params: { institute_uuid },
      });
      const list = Array.isArray(data?.data) ? data.data : [];
      setLeads(list);
      // cache offline
      await saveRecords('leads', list, ['studentData']);
    } catch (error) {
      console.error('❌ Error fetching leads:', error.response?.data || error.message);
      toast.error('Error fetching leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCached = async () => {
      const cached = await getAllRecords('leads', ['studentData']);
      if (cached.length) setLeads(cached);
    };
    loadCached();
    fetchLeads();
    fetchCourses();
  }, []);

  const filteredLeads = leads
    .filter((lead) => {
      if (!Array.isArray(lead.followups) || lead.followups.length === 0) return false;
      const latestFollowup = [...lead.followups].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      )[0];
      return latestFollowup?.status === 'follow-up';
    })
    .filter((lead) => {
      const name = `${lead.studentData?.firstName || ''} ${lead.studentData?.lastName || ''}`.toLowerCase();
      const mobile = lead.studentData?.mobileSelf || '';
      return name.includes(search.toLowerCase()) || mobile.includes(search);
    });





  const handleWhatsApp = (mobile, name) => {
    const message = `Hello ${name}, I am contacting you regarding your enquiry.`;
    window.open(`https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCall = (mobile) => {
    window.open(`tel:${mobile}`);
  };

  const getCourseName = (uuid) => {
    const course = courses.find(c => c.Course_uuid === uuid);
    return course?.name || 'Course N/A';
  };


  return (
    <div className="p-2">
      <Toaster />
      {selectedLead && (
        <LeadStatusModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          refresh={fetchLeads}
        />
      )}
      <div className="flex items-center gap-2 mb-4 w-full">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or mobile"
          className="border p-2 rounded flex-1 min-w-0"
        />
        <button
          onClick={() => navigate(`/${username}/add-lead`)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex-shrink-0"
          aria-label="Add Lead"
        >
          +
        </button>
      </div>

      {loading && <div>Loading leads...</div>}
      {!loading && filteredLeads.length === 0 && <div>No leads found.</div>}
      {!loading && filteredLeads.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">

          {filteredLeads.map((lead) => (
            <div
              key={lead.uuid}
              className="border rounded-lg p-3 shadow hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              onClick={() => setSelectedLead(lead)}
            >
              <div>
                <h2 className="font-semibold text-lg text-gray-800">
                  {lead.studentData?.firstName} {lead.studentData?.lastName}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {getCourseName(lead.course)}
                </p>
              </div>

              <div className="flex justify-end items-center gap-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWhatsApp(lead.studentData?.mobileSelf, lead.studentData?.firstName);
                  }}
                  className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600"
                  title="WhatsApp"
                >
                  <FaWhatsapp />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCall(lead.studentData?.mobileSelf);
                  }}
                  className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                  title="Call"
                >
                  <FaPhoneAlt />
                </button>
              </div>


            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leads;