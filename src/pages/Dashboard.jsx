import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AllAttendance from '../reports/allAttendance';

const API_URL = 'https://socialbackend-iucy.onrender.com/api/dashboard-stats';

const Dashboard = () => {
  const navigate = useNavigate();

  // Safe JSON parse for institute
  let instituteObj = {};
  try { instituteObj = JSON.parse(localStorage.getItem('institute')) || {}; } catch {
    // ignore JSON parse errors
  }
  const instituteName = instituteObj.institute_name ||
    localStorage.getItem('institute_title') ||
    'Your Institute';

  const expiryDateStr =
    localStorage.getItem('expiry_date') ||
    localStorage.getItem('trialExpiresAt');
  const planType = localStorage.getItem('plan_type');

  // Dashboard stats state
  const [stats, setStats] = useState({
    students: null,
    admissions: null,
    courses: null,
    enquiries: null,
    feesToday: null,
    followupToday: null,
    attendance: [],
  });
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [daysLeft, setDaysLeft] = useState(null);

  useEffect(() => {
    if (expiryDateStr) {
      const diff = Math.ceil((new Date(expiryDateStr) - new Date()) / (1000 * 60 * 60 * 24));
      setDaysLeft(diff);
      if (diff < 0) setExpired(true);
    }
  }, [expiryDateStr]);

 useEffect(() => {
  const institute_uuid = localStorage.getItem('institute_uuid');
  const fetchUrl = `${API_URL}?institute_uuid=${institute_uuid}`;

  fetch(fetchUrl)
    .then((res) => res.ok ? res.json() : Promise.reject())
    .then((data) => { 
      setStats({
        students: data.students ?? 0,
        admissions: data.admissions ?? 0,
        courses: data.courses ?? 0,
        enquiries: data.enquiries ?? 0,
        feesToday: data.feesToday ?? 0,
        followupToday: data.followupToday ?? 0,
        attendance: Array.isArray(data.attendance) ? data.attendance : [],
      });
    })
    .catch((err) => {
      setStats({
        students: 0,
        admissions: 0,
        courses: 0,
        enquiries: 0,
        feesToday: 0,
        followupToday: 0,
        attendance: [],
      });
    })
    .finally(() => setLoading(false));
}, []);



  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Trial Expired</h2>
          <p className="text-gray-600 mb-4">
            Your trial has ended. Please contact support to upgrade your plan.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // For skeleton loading effect
  const skeleton = (
    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
  );

  // Helper to display values or skeleton
  const display = (val, isMoney = false) =>
    loading
      ? skeleton
      : isMoney
        ? `₹${(val || 0).toLocaleString()}`
        : (val || 0);

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="flex-1 flex flex-col">
        {/* Institute name on top */}
        
        {/* Days left on trial */}
        {planType === 'trial' && daysLeft !== null && daysLeft >= 0 && (
          <div className="bg-orange-100 text-orange-700 text-sm text-center py-2 mb-2">
            Trial expires in {daysLeft} day{daysLeft !== 1 && 's'}!
          </div>
        )}
        {/* Attendance Board */}
        <AllAttendance />
        {/* Dashboard Cards */}
        <main className="flex-1 p-4 bg-gray-50">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
            <div className="bg-white p-4 rounded-2xl shadow flex flex-col items-start" onClick={() => navigate('/dashboard/Students')}>
              <div className="text-sm text-gray-400 mb-2">Total Students</div>
              <div className="text-3xl font-bold text-green-600">
                {display(stats.students)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow flex flex-col items-start" onClick={() => navigate('/dashboard/allLeadByAdmission')}>
              <div className="text-sm text-gray-400 mb-2">Total Admissions</div>
              <div className="text-3xl font-bold text-blue-600">
                {display(stats.admissions)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow flex flex-col items-start" onClick={() => navigate('/dashboard/Courses')}>
              <div className="text-sm text-gray-400 mb-2">Active Courses</div>
              <div className="text-3xl font-bold text-purple-600">
                {display(stats.courses)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow flex flex-col items-start" onClick={() => navigate('/dashboard/leads')}>
              <div className="text-sm text-gray-400 mb-2">No. of Enquiries</div>
              <div className="text-3xl font-bold text-orange-500">
                {display(stats.enquiries)}
              </div>
              
            </div>
           {/*  <div className="bg-white p-4 rounded-2xl shadow flex flex-col items-start">
              <div className="text-sm text-gray-400 mb-2">No. of Enquiries</div>
              <div className="text-3xl font-bold text-orange-500">
                {display(stats.enquiries)}
              </div>
              
            </div>
            <div className="bg-white p-4 rounded-2xl shadow flex flex-col items-start">
              <div className="text-sm text-gray-400 mb-2">No. of Enquiries</div>
              <div className="text-3xl font-bold text-orange-500">
                {display(stats.enquiries)}
              </div>
              
            </div>*/}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-2xl shadow flex flex-col">
              <div className="text-sm text-gray-400 mb-2">Today's Collection</div>
              <div className="text-3xl font-bold text-green-700 mb-4">
                {display(stats.feesToday, true)}
              </div>
              <button
                onClick={() => navigate('/dashboard/fees')}
                className="mt-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                View Details
              </button>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow flex flex-col">
              <div className="text-sm text-gray-400 mb-2">Today's Follow-up</div>
              <div className="text-3xl font-bold text-blue-700 mb-4">
                {display(stats.followupToday)}
              </div>
              <button
                onClick={() => navigate('/dashboard/followup')}
                className="mt-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                View List
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
