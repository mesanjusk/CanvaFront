import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { FaWhatsapp } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import BASE_URL from '../config';
import AdmissionFormModal from '../components/admissions/AdmissionFormModal';
import ConfirmAdmissionModal from '../components/admissions/ConfirmAdmissionModal';
import ManageBatchModal from '../components/common/ManageBatchModal';
import ManageExamModal from '../components/common/ManageExamModal';
import { formatDisplayDate } from '../utils/dateUtils';
import CertificateModal from '../components/admissions/CertificateModel';
import ReceiptModal from '../components/admissions/ReceiptModal';
import SearchAddAdmissionBar from '../components/reports/SearchAddAdmissionBar';
import LeadCard from '../components/reports/LeadCard';
import LeadDetailsModal from '../components/reports/LeadDetailsModal';
import { saveRecords, getAllRecords } from '../db/dbService';



const AllLeadByAdmission = () => {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editLead, setEditLead] = useState(null);
  const [confirmLead, setConfirmLead] = useState(null);
   const [batchAdmission, setBatchAdmission] = useState(null);
    const [examAdmission, setExamAdmission] = useState(null);
   const [receiptData, setReceiptData] = useState(null);
   const [certificateData, setCertificateData] = useState(null);
  const [institute, setInstitute] = useState({});
  const navigate = useNavigate();
  const { username } = useParams();
  const institute_uuid = localStorage.getItem('institute_uuid');

  
// Institute/branding details

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

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${BASE_URL}/api/Leads`, {
        params: { institute_uuid },
      });
      const allLeads = Array.isArray(data?.data) ? data.data : [];
      const leadsWithAdmission = allLeads.filter((lead) => !!lead.admission_uuid);
      setLeads(leadsWithAdmission);
      await saveRecords('leads', leadsWithAdmission, ['student']);

    } catch (error) {
      console.error('❌ Error fetching leads:', error.response?.data || error.message);
      toast.error('Error fetching leads');
    } finally {
      setLoading(false);
    }
  };
const fetchInstitute = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/api/institute/${institute_uuid}`);
      const inst = data?.result || data;
      setInstitute({
        name: inst.institute_title,
        contact: inst.institute_call_number,
        code: inst.gst,
        logo: (inst.theme && inst.theme.logo) || inst.institute_logo,
      });
    } catch (err) {
      console.error('Error fetching institute:', err);
    }
  };

  useEffect(() => {
    const loadCached = async () => {
      const cached = await getAllRecords('leads', ['student']);
      if (cached.length) setLeads(cached);
    };
    loadCached();
    fetchLeads();
    fetchCourses();
    fetchInstitute();
  }, []);
  
  const filteredLeads = leads.filter((a) => {
  const student = a.studentData || a.student || {};
  const name = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
  const mobile = student.mobileSelf || '';
  return name.includes(search.toLowerCase()) || mobile.includes(search);
});


  const handleWhatsApp = (mobile, name) => {
    if (!mobile) return toast.error('Mobile number not available');
    const message = `Hello ${name || ''}, we are contacting you regarding your admission.`;
    window.open(`https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`, '_blank');
  };


  const handleEditClick = async (lead) => {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/api/admissions/${lead.admission_uuid}`
    );
    const admission = data?.data || data;

    const enriched = {
      ...admission,
      studentData: lead.studentData || lead.student || {},
      course: admission.course || lead.course,
    };

    setEditLead(enriched);
    setSelectedLead(null);
  } catch (error) {
    console.error('Error fetching admission:', error);
    toast.error('Failed to load admission');
  }
};

const handleCertificateClick = async (lead) => {
  try {
    const { data } = await axios.get(
      `${BASE_URL}/api/admissions/${lead.admission_uuid}`
    );
    const admission = data?.data || data;

    const enriched = {
      ...admission,
      studentData: lead.studentData || lead.student || {},
      course: admission.course || lead.course,
    };

    setCertificateData(enriched);
    setSelectedLead(null);
  } catch (error) {
    console.error('Error fetching admission:', error);
    toast.error('Failed to load admission');
  }
};

  const handleManageBatchClick = async (lead) => {
    try {
      const { data } = await axios.get(
        `${BASE_URL}/api/admissions/${lead.admission_uuid}`
      );
      const admission = data?.data || data;
      setBatchAdmission(admission);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error fetching admission for batch:', error);
      toast.error('Failed to load admission');
    }
  };

  const handleManageExamClick = async (lead) => {
    try {
      const { data } = await axios.get(
        `${BASE_URL}/api/admissions/${lead.admission_uuid}`
      );
      const admission = data?.data || data;
      setExamAdmission(admission);
      setSelectedLead(null);
    } catch (error) {
      console.error('Error fetching admission for exam:', error);
      toast.error('Failed to load admission');
    }
  };

  const handleConfirmClick = async (lead) => {
    try {
      const { data } = await axios.get(
        `${BASE_URL}/api/admissions/${lead.admission_uuid}`
      );
      const admission = data?.data || data;

      const enriched = {
        ...admission,
        student: lead.student || lead.studentData || {},
        course: lead.course,
      };

      setConfirmLead(enriched);
      setSelectedLead(null);
    } catch (error) {
      console.error('Failed to fetch admission:', error);
      toast.error('Unable to fetch admission details');
    }
  };

  
const getCourseName = (courseId) => {
  const course = courses.find(
    (c) => c.Course_uuid === courseId || c._id === courseId
  );
  return course ? course.name : 'Course N/A';
};

const convertToWords = (num) => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
  return formatter.format(num).replace('₹', '').trim() + ' Rupees';
};


  
const handleReceiptClick = () => {
  if (!receiptInfo || Object.keys(receiptInfo).length === 0) {
    return toast.error('Receipt info not available');
  }

  setReceiptData(receiptInfo);
};

const receiptInfo = selectedLead?.receiptInfo || {};

const handleSelectLead = async (lead) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/api/admissions/${lead.admission_uuid}`);
    const admission = data?.data || data;

    const { data: feesRes } = await axios.get(`${BASE_URL}/api/fees`, {
      params: { admission_uuid: lead.admission_uuid },
    });

    const feeRecord = Array.isArray(feesRes.data)
      ? feesRes.data.find((f) => f.admission_uuid === lead.admission_uuid)
      : null;

    const receiptInfo = {
      ...admission,
      learnerName: `${lead.studentData?.firstName || ''} ${lead.studentData?.lastName || ''}`,
      learnerCode: admission?.learnerCode || 'N/A',
      courseName: getCourseName(admission.course || lead.course),
      receiptDate: formatDisplayDate(new Date()),
      receiptNumber: admission?.receiptNumber || `R-${Math.floor(Math.random() * 100000)}`,
      examEvent: admission?.examEvent || 'August',
      amount: feeRecord?.feePaid?.toString() || '0',
      amountWords: convertToWords(feeRecord?.feePaid || 0),
      installmentPlan: feeRecord?.installmentPlan || [],
    };

    setSelectedLead({ ...lead, receiptInfo });
  } catch (error) {
    console.error('Failed to fetch admission for lead:', error);
    toast.error('Unable to fetch lead details');
  }
};

  return (
    <div className="p-4">
      <Toaster />

      <LeadDetailsModal
        lead={selectedLead}
        receiptInfo={receiptInfo}
        institute={institute}
        onEdit={handleEditClick}
        onManageBatch={handleManageBatchClick}
        onManageExam={handleManageExamClick}
        onConfirm={handleConfirmClick}
        onReceipt={handleReceiptClick}
        onCertificate={handleCertificateClick}
        onClose={() => setSelectedLead(null)}
      />

      <SearchAddAdmissionBar
        search={search}
        setSearch={setSearch}
        onAdd={() => navigate(`/${username}/addNewAdd`)}
      />

      {loading && <div>Loading admissions...</div>}
      {!loading && filteredLeads.length === 0 && <div>No leads with admissions found.</div>}

      {!loading && filteredLeads.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-10 gap-4">
          {filteredLeads.map((admission) => (
            <LeadCard
              key={admission._id}
              lead={admission}
              courseName={getCourseName(admission.course)}
              onSelect={handleSelectLead}
              onWhatsApp={() =>
                handleWhatsApp(admission.student?.mobileSelf, admission.student?.firstName)
              }
            />
          ))}
        </div>
      )}

      {editLead && (
        <AdmissionFormModal
          editingData={editLead}
          onClose={() => setEditLead(null)}
          onSuccess={() => {
            setEditLead(null);
            fetchLeads();
          }}
        />
      )}
      {confirmLead && (
        <ConfirmAdmissionModal
          admission={confirmLead}
          onClose={() => setConfirmLead(null)}
          onUpdated={() => {
            setConfirmLead(null);
            fetchLeads();
          }}
        />
      )}
      {batchAdmission && (
        <ManageBatchModal
          admission={batchAdmission}
          onClose={() => setBatchAdmission(null)}
          onUpdated={() => {
            setBatchAdmission(null);
            fetchLeads();
          }}
        />
      )}
      {examAdmission && (
        <ManageExamModal
          admission={examAdmission}
          onClose={() => setExamAdmission(null)}
          onUpdated={() => {
            setExamAdmission(null);
            fetchLeads();
          }}
        />
      )}
      {receiptData && (
        <ReceiptModal
          data={receiptData}
          institute={institute}
          onClose={() => setReceiptData(null)}
        />
      )}
      {certificateData && (
        <CertificateModal
          certificate={certificateData}
          onClose={() => setCertificateData(null)}
          onSuccess={() => {
            setCertificateData(null);
            fetchLeads();
          }}
        />
      )}
    </div>
  );
};

export default AllLeadByAdmission;
