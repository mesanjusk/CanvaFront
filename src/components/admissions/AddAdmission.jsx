import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdmissionFormModal from "./AdmissionFormModal";
import ReceiptModal from "./ReceiptModal";
import jsPDF from 'jspdf';
import axios from 'axios';
import BASE_URL from '../../config';

const AddAdmission = () => {
  const [showModal, setShowModal] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const [studentsMap, setStudentsMap] = useState({});
  const [coursesMap, setCoursesMap] = useState({});
  const [institute, setInstitute] = useState({});

  const [searchParams] = useSearchParams();
  const [leadData, setLeadData] = useState(null);
const [studentData, setStudentData] = useState(null);

  const lead_uuid = searchParams.get("lead_uuid");

  const navigate = useNavigate();

  // 🔍 Fetch lead data if lead_uuid exists
  useEffect(() => {
  const fetchLeadData = async () => {
  if (!lead_uuid) return;

  try {
    const { data } = await axios.get(`${BASE_URL}/api/leads/${lead_uuid}`);
    const lead = data.data;
    setLeadData(lead);

    if (lead?.student_uuid) {
      const studentRes = await axios.get(`${BASE_URL}/api/students/${lead.student_uuid}`);
      const student = studentRes.data?.data;
      setStudentData(student); 
    }
  } catch (err) {
    console.error("❌ Error fetching lead/student data:", err);
  }
};


    fetchLeadData();
  }, [lead_uuid]);

  // 🔁 Build mapping
  useEffect(() => {
    axios.get(`${BASE_URL}/api/students?institute_uuid=${localStorage.getItem('institute_uuid')}`)
      .then(res => {
        const map = {};
        res.data.data.forEach(s => {
          map[s.uuid || s._id] = `${s.firstName || ''} ${s.lastName || ''}`.trim();
        });
        setStudentsMap(map);
      });

    axios.get(`${BASE_URL}/api/courses`)
      .then(res => {
        const map = {};
        res.data.forEach(c => {
          map[c.uuid || c._id] = c.name || c.title;
        });
        setCoursesMap(map);
      });

    axios.get(`${BASE_URL}/api/institute/${localStorage.getItem('institute_uuid')}`)
      .then(res => {
        const i = res.data.result;
        setInstitute({
          name: i.institute_title,
          address: i.address,
          phone: i.institute_call_number,
          gst: i.gst,
          logo: (i.theme && i.theme.logo) || i.institute_logo,
          brandColor: (i.theme && i.theme.color) || "#1E40AF"
        });
      });
  }, []);

  const handlePrint = () => {
    window.print();
    setShowReceipt(false);
    navigate('/dashboard/allLeadByAdmission');
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    doc.text('Admission Receipt', 10, 10);
    doc.text(`Student: ${receiptData.firstName} ${receiptData.lastName}`, 10, 20);
    doc.text(`Course: ${receiptData.course}`, 10, 30);
    doc.text(`Paid: ₹${receiptData.feePaid}`, 10, 40);
    doc.text(`Balance: ₹${receiptData.balance}`, 10, 50);
    doc.save('admission-receipt.pdf');
    setShowReceipt(false);
    navigate('/dashboard/allLeadByAdmission');
  };

  const handleClose = () => {
    setShowModal(false);
    navigate('/dashboard/allLeadByAdmission');
  };

  const handleSuccess = (admissionData) => {
    setShowModal(false);
    setShowReceipt(true);
    setReceiptData({
      ...admissionData,
      student_uuid: admissionData.student_uuid || admissionData.student?.uuid,
      course_uuid: admissionData.course_uuid || admissionData.course,
    });
  };

  return (
    <>
      {showModal && (
        <AdmissionFormModal
          onClose={handleClose}
          onSuccess={handleSuccess}
          leadData={leadData} 
          studentData={studentData}
        />
      )}
      {showReceipt && receiptData && (
        <ReceiptModal
          data={receiptData}
          studentsMap={studentsMap}
          coursesMap={coursesMap}
          institute={institute}
          onPrint={handlePrint}
          onDownload={handleDownload}
          onClose={() => {
            setShowReceipt(false);
            navigate('/dashboard/allLeadByAdmission');
          }}
        />
      )}
    </>
  );
};

export default AddAdmission;
