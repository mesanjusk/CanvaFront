import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import useAdmissionForm from './useAdmissionForm';
import AdmissionStudentInfoTab from './AdmissionStudentInfoTab';
import AdmissionCourseBatchTab from './AdmissionCourseBatchTab';
import AdmissionPaymentInstallmentTab from './AdmissionPaymentInstallmentTab';
import toast from 'react-hot-toast';
import axios from 'axios';
import BASE_URL from '../../config';

const AdmissionFormModal = ({ onClose, onSuccess, editingData, leadData, studentData }) => {

  const {
    form,
    setForm,
    tab,
    setTab,
    handleChange,
    handleSubmit,
    installmentPlan,
    courses,
    educations,
    exams,
    batches,
    paymentModes,
    editingId,
    handleEdit,
    themeColor,
  } = useAdmissionForm({});



 useEffect(() => {
  if (!leadData || !studentData) return;

  const updatedForm = {
    firstName: studentData.firstName || '',
    middleName: studentData.middleName || '',
    lastName: studentData.lastName || '',
    dob: studentData.dob ? new Date(studentData.dob).toISOString().split('T')[0] : '',
    gender: studentData.gender || '',
    mobileSelf: studentData.mobileSelf || '',
    mobileParent: studentData.mobileParent || '',
    address: studentData.address || '',
    course: leadData.course || '',
    referredBy: leadData.referredBy || '',
    student_uuid: leadData.student_uuid || '',
  };

  setForm((prev) => ({ ...prev, ...updatedForm }));
}, [leadData, studentData]);



   useEffect(() => {
    if (editingData) {
      handleEdit(editingData);
    }
  }, [editingData]);

 


  // Handle tab navigation
const handleNext = async () => {
  if (tab === 0) {
    try {
      const res = await axios.get(`${BASE_URL}/api/students/check-mobile`, {
        params: {
          institute_uuid: localStorage.getItem('institute_uuid'),
          mobileSelf: form.mobileSelf,
        },
      });

      if (res.data.exists && !form.student_uuid) {
        toast.error('Mobile number already exists in student records');
        return;
      }

    } catch (error) {
      console.error('Mobile check failed:', error);
      toast.error('Failed to validate mobile number');
      return;
    }
  }

  setTab(tab + 1);
};



  const handleBack = () => setTab(tab - 1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto z-[60]">
      <Toaster />
      <div className="bg-white rounded-lg shadow-lg w-full max-w-xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold" style={{ color: themeColor }}>
            {editingId ? 'Edit Admission' : 'Add New Admission'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black text-2xl">&times;</button>
        </div>
        <div className="flex justify-around border-b">
          {['Student Info', 'Course & Batch', 'Payment & EMI'].map((tabName, idx) => (
            <button
              key={idx}
              onClick={() => setTab(idx)}
              className="flex-1 py-2 text-sm font-medium"
              style={
                tab === idx
                  ? { borderBottomWidth: '2px', borderColor: themeColor, color: themeColor }
                  : { color: '#4b5563' }
              }
            >
              {tabName}
            </button>
          ))}
        </div>
        {/* KEY CHANGE: Pass onSuccess to handleSubmit */}
        <form onSubmit={e => handleSubmit(e, onSuccess)} className="p-4 flex flex-col gap-3">
          {tab === 0 && <AdmissionStudentInfoTab form={form} handleChange={handleChange} />}
          {tab === 1 && (
            <AdmissionCourseBatchTab
              form={form}
              handleChange={handleChange}
              courses={courses}
              educations={educations}
              exams={exams}
              batches={batches}
              setForm={setForm}
            />
          )}
          {tab === 2 && (
            <AdmissionPaymentInstallmentTab
              form={form}
              handleChange={handleChange}
              installmentPlan={installmentPlan}
              paymentModes={paymentModes}
            />
          )}
          {/* Button Row */}
          <div className="flex justify-end gap-2 pt-2">
            {tab === 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded"
              >
                Back
              </button>
            )}
            {tab === 2 ? (
              <>
                <button
                  type="button"
                  onClick={handleBack}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="text-white px-4 py-2 rounded"
                  style={{ backgroundColor: themeColor }}
                >
                  {editingId ? 'Update' : 'Submit'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="text-white px-4 py-2 rounded"
                style={{ backgroundColor: themeColor }}
                disabled={tab === 2}
              >
                Next
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdmissionFormModal;
