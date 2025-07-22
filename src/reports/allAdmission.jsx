import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { FaPhoneAlt, FaWhatsapp } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import BASE_URL from '../config';

const AllAdmission = () => {
  const [admissions, setAdmissions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const navigate = useNavigate();
  const { username } = useParams();
  const institute_uuid = localStorage.getItem('institute_uuid');

  const fetchCourses = async () => {
  try {
    const { data } = await axios.get(`${BASE_URL}/api/courses`, {
      params: { institute_uuid },
    });
    setCourses(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('❌ Error fetching courses:', error);
    toast.error('Failed to load courses');
  }
};

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${BASE_URL}/api/admissions`, {
        params: { institute_uuid },
      });
      setAdmissions(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error('❌ Error fetching admissions:', error.response?.data || error.message);
      toast.error('Error fetching admissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
    fetchCourses();
  }, []);

  const filteredAdmissions = admissions.filter((a) => {
    const name = `${a.student?.firstName || ''} ${a.student?.lastName || ''}`.toLowerCase();
    const mobile = a.student?.mobileSelf || '';
    return name.includes(search.toLowerCase()) || mobile.includes(search);
  });

  const handleWhatsApp = (mobile, name) => {
    if (!mobile) return toast.error('Mobile number not available');
    const message = `Hello ${name || ''}, we are contacting you regarding your admission.`;
    window.open(`https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCall = (mobile) => {
    if (!mobile) return toast.error('Mobile number not available');
    window.open(`tel:${mobile}`);
  };

  const getCourseName = (courseUuid) => {
  const course = courses.find((c) => c.uuid === courseUuid);
  return course ? course.name : 'Course N/A';
};

  return (
    <div className="p-4">
      <Toaster />

      {selectedAdmission && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 overflow-y-auto z-[60]">
          <div className="bg-white p-6 rounded shadow max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">
              {selectedAdmission.student?.firstName} {selectedAdmission.student?.lastName}
            </h2>
            <p className="text-gray-700 mb-2">
              Course: {getCourseName(selectedAdmission.course)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/${username}/edit-admission/${selectedAdmission._id}`)}
                className="bg-yellow-500 text-white px-4 py-2 rounded text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => setSelectedAdmission(null)}
                className="bg-gray-400 text-white px-4 py-2 rounded text-sm ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4 gap-2 flex-wrap sm:flex-nowrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or mobile"
          className="border p-2 rounded w-full max-w-xs"
        />
        <button
          onClick={() => navigate(`/${username}/addadmission`)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + New Admission
        </button>
      </div>

      {loading && <div>Loading admissions...</div>}
      {!loading && filteredAdmissions.length === 0 && <div>No admissions found.</div>}

      {!loading && filteredAdmissions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          {filteredAdmissions.map((admission) => (
            <div
              key={admission._id}
              className="border rounded-lg p-4 shadow hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              onClick={() => setSelectedAdmission(admission)}
            >
              <div>
                <h2 className="font-semibold text-lg text-gray-800">
                  {admission.student?.firstName} {admission.student?.lastName}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {getCourseName(admission.course)}
                </p>
              </div>
              <div className="flex justify-end items-center gap-3 mt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWhatsApp(admission.student?.mobileSelf, admission.student?.firstName);
                  }}
                  className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600"
                  title="WhatsApp"
                >
                  <FaWhatsapp />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCall(admission.student?.mobileSelf);
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

export default AllAdmission;
