import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import BASE_URL from '../config';
import ManageBatchModal from '../components/common/ManageBatchModal';

const AllBatches = () => {
  const [admissions, setAdmissions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const searchTimeout = useRef();

  const institute_uuid = localStorage.getItem('institute_uuid');

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${BASE_URL}/api/admissions`, {
        params: { institute_uuid },
      });
      setAdmissions(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      console.error('Error fetching admissions:', error);
      toast.error('Failed to load admissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/api/courses`, {
        params: { institute_uuid },
      });
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  useEffect(() => {
    fetchAdmissions();
    fetchCourses();
  }, []);

  // Debounced search
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  const getCourseName = (uuid) => {
    const course = courses.find(c => c.Course_uuid === uuid || c.uuid === uuid);
    return course?.name || 'Course N/A';
  };

  // Filter and group logic memoized for performance
  const filteredAdmissions = useMemo(() => admissions.filter((a) => {
    const name = `${a.studentData?.firstName || a.student?.firstName || ''} ${a.studentData?.lastName || a.student?.lastName || ''}`.toLowerCase();
    const mobile = a.studentData?.mobileSelf || a.student?.mobileSelf || '';
    return name.includes(debouncedSearch.toLowerCase()) || mobile.includes(debouncedSearch);
  }), [admissions, debouncedSearch]);

  const grouped = useMemo(() => filteredAdmissions.reduce((acc, adm) => {
    const batch = adm.batchTime || 'Unassigned';
    if (!acc[batch]) acc[batch] = [];
    acc[batch].push(adm);
    return acc;
  }, {}), [filteredAdmissions]);

  // Uncomment if you want WhatsApp/Call icons inside cards as in Leads
  // const handleWhatsApp = (mobile, name) => {
  //   if (!mobile) return toast.error('Mobile number not available');
  //   const message = `Hello ${name || ''}, regarding your course.`;
  //   window.open(`https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`, '_blank');
  // };

  // const handleCall = (mobile) => {
  //   if (!mobile) return toast.error('Mobile number not available');
  //   window.open(`tel:${mobile}`);
  // };

  return (
    <div className="p-2">
      <Toaster />
      {selectedAdmission && (
        <ManageBatchModal
          admission={selectedAdmission}
          onClose={() => setSelectedAdmission(null)}
          onUpdated={fetchAdmissions}
        />
      )}
      <div className="flex items-center gap-2 mb-4 w-full">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name or mobile"
          className="border p-2 rounded flex-1 min-w-0"
        />
      </div>
      {loading ? (
        <div className="text-center p-6">Loading students...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center p-6 text-gray-500">No students found.</div>
      ) : (
        Object.entries(grouped).map(([batch, list]) => (
          <div key={batch} className="mb-8">
            <h2 className="text-xl font-semibold mb-3">{batch}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
              {list.map((admission) => (
                <div
                  key={admission._id}
                  onClick={() => setSelectedAdmission(admission)}
                  className="border rounded-lg p-3 shadow hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      {admission.studentData?.firstName || admission.student?.firstName} {admission.studentData?.lastName || admission.student?.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {getCourseName(admission.course)}
                    </p>
                  </div>
                  {/* Example: Uncomment to add action buttons (match Leads page) */}
                  {/* <div className="flex justify-end items-center gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWhatsApp(admission.studentData?.mobileSelf || admission.student?.mobileSelf, admission.studentData?.firstName || admission.student?.firstName);
                      }}
                      className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600"
                      title="WhatsApp"
                    >
                      <FaWhatsapp />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCall(admission.studentData?.mobileSelf || admission.student?.mobileSelf);
                      }}
                      className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                      title="Call"
                    >
                      <FaPhoneAlt />
                    </button>
                  </div> */}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AllBatches;
