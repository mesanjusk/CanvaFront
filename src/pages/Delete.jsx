  import { useSearchParams } from 'react-router-dom';
  import React, { useState, useEffect } from 'react';
  import axios from 'axios';
  import toast, { Toaster } from 'react-hot-toast';
  import jsPDF from 'jspdf';
  import autoTable from 'jspdf-autotable';
  import * as XLSX from 'xlsx';
import BASE_URL from '../config';
import { getThemeColor } from '../utils/storageUtils';

  const AddAdmission = () => {
    const nextMonthDate = (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d.toISOString().substring(0, 10);
    })();

    const initialForm = {
      branchCode: '',
      admissionDate: new Date().toISOString().substring(0, 10),
      emiDate: nextMonthDate,
      firstName: '',
      middleName: '',
      lastName: '',
      dob: '',
      gender: '',
      mobileSelf: '',
      mobileSelfWhatsapp: false,
      mobileParent: '',
      mobileParentWhatsapp: false,
      address: '',
      education: '',
      examEvent: '',
      course: '',
      batchTime: '',
      installment: '',
      fees: '',
      discount: '',
      total: '',
      feePaid: '',
      paidBy: '',
      balance: '',
      emi: ''
    };

    const [form, setForm] = useState(initialForm);
    const [tab, setTab] = useState(0);

    const [admissions, setAdmissions] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showModal, setShowModal] = useState(true);
    const [courses, setCourses] = useState([]);
    const [educations, setEducations] = useState([]);
    const [exams, setExams] = useState([]);
    const [batches, setBatches] = useState([]);
    const themeColor = getThemeColor();
    const [paymentModes, setPaymentModes] = useState([]);
    const [installmentPlan, setInstallmentPlan] = useState([]);

    const institute_uuid = localStorage.getItem("institute_uuid");
    const [searchParams] = useSearchParams();
    const lead_uuid = searchParams.get('lead_uuid');


    const fetchCourses = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/courses`);
        setCourses(Array.isArray(res.data) ? res.data : []);
      } catch {
        toast.error('Failed to load courses');
      }
    };
    useEffect(() => {
      const fetchLeadData = async () => {
        try {
          const res = await axios.get(`${BASE_URL}/api/leads/${lead_uuid}`);
          const lead = res.data;

          setForm(prev => ({
            ...prev,
            firstName: lead.studentData?.firstName || '',
            lastName: lead.studentData?.lastName || '',
            mobileSelf: lead.studentData?.mobileSelf || '',
            address: lead.studentData?.address || '',
            course: lead.studentData?.course || '',
          }));

          // Auto-fill fees if course exists
          const selectedCourse = courses.find(c => c.name === lead.studentData?.course);
          if (selectedCourse) {
            const courseFee = Number(selectedCourse.courseFees || 0);
            setForm(prev => ({
              ...prev,
              fees: courseFee,
              total: courseFee,
              balance: courseFee,
            }));
          }
        } catch (err) {
          console.error('Error fetching lead data:', err);
          toast.error('Failed to load lead data');
        }
      };

      if (lead_uuid && courses.length > 0) fetchLeadData();
    }, [lead_uuid, courses]);

    const fetchEducations = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/education`);
        setEducations(Array.isArray(res.data) ? res.data : []);
      } catch {
        toast.error('Failed to load education options');
      }
    };

    const fetchExams = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/exams`);
        setExams(Array.isArray(res.data) ? res.data : []);
      } catch {
        toast.error('Failed to load exam events');
      }
    };

    const fetchBatches = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/batches`);
        setBatches(res.data || []);
      } catch {
        toast.error('Failed to load batches');
      }
    };

    const fetchPaymentModes = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/paymentmode`);
        setPaymentModes(Array.isArray(res.data) ? res.data : []);
      } catch {
        toast.error('Failed to load payment modes');
      }
    };

    // Generate installment plan and EMI whenever related fields change
    useEffect(() => {
      const inst = parseInt(form.installment, 10);
      const fees = Number(form.fees || 0);
      const discount = Number(form.discount || 0);
      const feePaid = Number(form.feePaid || 0);
      const bal = fees - discount - feePaid;

      if (!inst || inst <= 0 || bal <= 0) {
        setInstallmentPlan([]);
        if (form.emi !== '') {
          setForm(prev => ({ ...prev, emi: '' }));
        }
        return;
      }

      const emi = parseFloat((bal / inst).toFixed(2));
      const plan = [];
      let remaining = bal;
      const start = form.emiDate ? new Date(form.emiDate) : (() => {
        const d = new Date(form.admissionDate);
        d.setMonth(d.getMonth() + 1);
        return d;
      })();

      for (let i = 0; i < inst; i++) {
        const due = new Date(start);
        due.setMonth(due.getMonth() + i);
        const amount = i + 1 === inst ? parseFloat(remaining.toFixed(2)) : emi;
        remaining = parseFloat((remaining - amount).toFixed(2));
        plan.push({
          installmentNo: i + 1,
          dueDate: due.toISOString().split('T')[0],
          amount,
        });
      }
      setInstallmentPlan(plan);
      if (form.emi !== emi) {
        setForm(prev => ({ ...prev, emi }));
      }
    }, [
      form.installment,
      form.fees,
      form.discount,
      form.feePaid,
      form.admissionDate,
      form.emiDate
    ]);

    const fetchAdmissions = async () => {
      if (!institute_uuid) return;
      try {
        const res = await axios.get(`${BASE_URL}/api/admissions`, {
          params: { institute_uuid }
        });
        const { data } = res.data;
        setAdmissions(Array.isArray(data) ? data : []);
      } catch {
        toast.error('Failed to fetch admissions');
      }
    };

    const handleChange = (field) => (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      let updatedForm = { ...form, [field]: value };

      if (field === 'admissionDate') {
        const d = new Date(value);
        d.setMonth(d.getMonth() + 1);
        const nextMonth = d.toISOString().substring(0, 10);
        const prevDefault = (() => {
          const pd = new Date(form.admissionDate);
          pd.setMonth(pd.getMonth() + 1);
          return pd.toISOString().substring(0, 10);
        })();
        if (form.emiDate === prevDefault || form.emiDate === '') {
          updatedForm.emiDate = nextMonth;
        }
      }

      const fees = Number(field === 'fees' ? value : form.fees || 0);
      const discount = Number(field === 'discount' ? value : form.discount || 0);
      const feePaid = Number(field === 'feePaid' ? value : form.feePaid || 0);

      if (['fees', 'discount', 'feePaid'].includes(field)) {
        const total = fees - discount;
        const balance = total - feePaid;

        updatedForm.fees = fees;
        updatedForm.discount = discount;
        updatedForm.feePaid = feePaid;
        updatedForm.total = total;
        updatedForm.balance = balance;
      }

      setForm(updatedForm);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      console.log("🚀 handleSubmit triggered");

      if (!institute_uuid) return toast.error("Missing institute ID");

      const mobileRegex = /^\d{10}$/;
      if (form.mobileSelf && !mobileRegex.test(form.mobileSelf)) return toast.error('Enter valid self mobile number');
      if (form.mobileParent && !mobileRegex.test(form.mobileParent)) return toast.error('Enter valid parent mobile number');

      const fees = Number(form.fees || 0);
      const discount = Number(form.discount || 0);
      const feePaid = Number(form.feePaid || 0);
      const total = fees - discount;
      const balance = total - feePaid;

      if (discount > fees) return toast.error('Discount cannot exceed fees');
      if (feePaid > total) return toast.error('Fee paid cannot exceed total');

      try {
        // Step 1: Create/Update student
        const studentPayload = {
          institute_uuid,
          firstName: form.firstName,
          middleName: form.middleName,
          lastName: form.lastName,
          dob: form.dob,
          gender: form.gender,
          mobileSelf: form.mobileSelf,
          mobileParent: form.mobileParent,
          address: form.address,
        };

        let studentResponse;
        if (editingId && form.student_uuid) {
          studentResponse = await axios.put(`${BASE_URL}/api/students/${form.student_uuid}`, studentPayload);
        } else {
          studentResponse = await axios.post(`${BASE_URL}/api/students`, studentPayload);
        }

        const studentData = studentResponse.data.data;
        const student_uuid = studentData.uuid || studentData._id;

        // Step 2: Create/Update admission
        const admissionPayload = {
          institute_uuid,
          student_uuid,
          admissionDate: form.admissionDate,
          course: form.course,
          batchTime: form.batchTime,
          examEvent: form.examEvent,
          installment: form.installment,
          fees,
          discount,
          total,
          feePaid,
          paidBy: form.paidBy,
          balance,
          createdBy: 'System',
        };

        let admissionResponse;
        if (editingId) {
          admissionResponse = await axios.put(`${BASE_URL}/api/admissions/${editingId}`, admissionPayload);
          toast.success('Admission updated successfully');
        } else {
          admissionResponse = await axios.post(`${BASE_URL}/api/admissions`, admissionPayload);
          toast.success('Admission added successfully');
        }

        const admissionData = admissionResponse.data.data;
        const admission_uuid = admissionData.uuid;

        // Step 3: Create/Update fees/emi record
        const feesPayload = {
          institute_uuid,
          student_uuid,
          admission_uuid,
          fees,
          discount,
          total,
          feePaid,
          balance,
          emi: Number(form.emi || 0),
          installment: form.installment,
          installmentPlan,
          paidBy: form.paidBy,
        };

        const feesResponse = await axios.post(`${BASE_URL}/api/fees`, feesPayload);

        // Step 3: Create/Update lead record
        const leadPayload = {
          institute_uuid,
          student_uuid,
          admission_uuid,
          enquiryDate: form.admissionDate,
          course: form.course, 
          referredBy:"Self",
          createdBy: 'System',
          followups: [{
        date: new Date().toISOString().substring(0, 10),
        status: 'open',
        remark: '',
        createdBy: 'System',
      }],    
        };

        const leadResponse = await axios.post(`${BASE_URL}/api/leads`, leadPayload);

          // Step 3: Create/Update account record
        const accountPayload = {
          institute_uuid,
          Account_name: `${form.firstName} ${form.lastName}`.trim(),
          Account_group: 'ACCOUNT',
          Mobile_number: form.mobileSelf    
        };

        const accountResponse = await axios.post(`${BASE_URL}/api/account/addAccount`, accountPayload);

        toast.success('All records saved successfully');

        // Reset state
        setForm(initialForm);
        setEditingId(null);
        setTab(0);
        setInstallmentPlan([]);
        // setShowModal(false);

        fetchAdmissions();
      } catch (err) {
        console.error("🔥 Error in handleSubmit:", err);
        if (err.response) {
          console.error("📡 Backend Response:", err.response.data);
          toast.error(`Server Error: ${err.response.data.message || err.response.statusText}`);
        } else {
          toast.error('Error saving admission');
        }
      }
    };



    const handleEdit = (data) => {
      const emiDate = data.emiDate || (() => {
        const d = new Date(data.admissionDate);
        d.setMonth(d.getMonth() + 1);
        return d.toISOString().substring(0, 10);
      })();
      setForm({ ...data, emiDate });
      setInstallmentPlan(data.installmentPlan || []);
      setEditingId(data._id);
      setShowModal(true);
    };

    const handleDelete = async (id) => {
      if (!window.confirm('Delete this admission?')) return;
      try {
        await axios.delete(`${BASE_URL}/api/admission/${id}`);
        toast.success('Deleted');
        fetchAdmissions();
      } catch {
        toast.error('Failed to delete');
      }
    };

    const exportPDF = () => {
      if (filteredAdmissions.length === 0) return toast.error("No data to export");
      const doc = new jsPDF();
      autoTable(doc, {
        head: [[
          'Name',
          'Course',
          'Mobile',
          'Fees',
          'Discount',
          'Total',
          'Paid',
          'Balance',
          'Admission Date'
        ]],
        body: filteredAdmissions.map((e) => [
          `${e.firstName} ${e.lastName}`,
          e.course,
          e.mobileSelf,
          e.fees,
          e.discount,
          e.total,
          e.feePaid,
          e.balance,
          e.admissionDate
        ]),
      });
      doc.save('admissions.pdf');
    };

    const exportExcel = () => {
      if (filteredAdmissions.length === 0) return toast.error("No data to export");
      const worksheet = XLSX.utils.json_to_sheet(
        filteredAdmissions.map((e) => ({
          Name: `${e.firstName} ${e.lastName}`,
          Course: e.course,
          Mobile: e.mobileSelf,
          Fees: e.fees,
          Discount: e.discount,
          Total: e.total,
          Paid: e.feePaid,
          Balance: e.balance,
          AdmissionDate: e.admissionDate,
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Admissions');
      XLSX.writeFile(workbook, 'admissions.xlsx');
    };

    useEffect(() => {
      fetchCourses();
      fetchEducations();
      fetchExams();
      fetchBatches();
      fetchPaymentModes();
      fetchAdmissions();
    }, []);

    // Don't render anything if the modal should be hidden
    if (!showModal) return null;

    const filteredAdmissions = admissions.filter(e => {
      const matchSearch = e.firstName?.toLowerCase().includes(search.toLowerCase()) || e.mobileSelf?.includes(search);
      const admissionDate = new Date(e.admissionDate);
      const inDateRange = (!startDate || admissionDate >= new Date(startDate)) && (!endDate || admissionDate <= new Date(endDate));
      return matchSearch && inDateRange;
    });

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto z-[60]">
        <Toaster />
        <div className="bg-white rounded-lg shadow-lg w-full max-w-xl max-h-screen overflow-y-auto">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-bold" style={{ color: themeColor }}>
              {editingId ? 'Edit Admission' : 'Add New Admission'}
            </h2>
            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-black text-2xl">&times;</button>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-around border-b">
            {['Student Info', 'Course & Batch', 'Payment & EMI'].map((tabName, idx) => (
              <button
                key={idx}
                onClick={() => setTab(idx)}
                className="flex-1 py-2 text-sm font-medium"
                style={tab === idx ? { borderBottomWidth: '2px', borderColor: themeColor, color: themeColor } : { color: '#4b5563' }}
              >
                {tabName}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">

            {/* TAB 1: Student Info */}
            {tab === 0 && (
              <>
                <input placeholder="First Name" value={form.firstName} onChange={handleChange('firstName')} className="border p-2" required />
                <input placeholder="Middle Name" value={form.middleName} onChange={handleChange('middleName')} className="border p-2" />
                <input placeholder="Last Name" value={form.lastName} onChange={handleChange('lastName')} className="border p-2" />

                <div className="flex items-center gap-4">
                  <input type="date" value={form.dob?.substring(0, 10)} onChange={handleChange('dob')} className="border p-2 flex-1" required />
                  <label className="text-sm font-medium">Date of Birth</label>
                </div>

                <div className="flex gap-4">
                  <label><input type="radio" name="gender" value="Male" checked={form.gender === 'Male'} onChange={handleChange('gender')} /> Male</label>
                  <label><input type="radio" name="gender" value="Female" checked={form.gender === 'Female'} onChange={handleChange('gender')} /> Female</label>
                </div>

                <input placeholder="Mobile (Self)" value={form.mobileSelf} onChange={handleChange('mobileSelf')} inputMode="numeric" pattern="[0-9]{10}" maxLength={10} className="border p-2" />
                <input placeholder="Mobile (Parent)" value={form.mobileParent} onChange={handleChange('mobileParent')} inputMode="numeric" pattern="[0-9]{10}" maxLength={10} className="border p-2" />
                <input placeholder="Address" value={form.address} onChange={handleChange('address')} className="border p-2" />


              </>
            )}

            {/* TAB 2: Course & Batch */}
            {tab === 1 && (
              <>
                <select value={form.education} onChange={handleChange('education')} className="border p-2">
                  <option value="">-- Select Education --</option>
                  {educations.map(e => <option key={e._id} value={e.education}>{e.education}</option>)}
                </select>
                <select
                  value={form.course}
                  onChange={(e) => {
                    const selectedCourse = courses.find(c => c.uuid === e.target.value);
                    const courseFee = Number(selectedCourse?.courseFees || 0);
                    const discount = Number(form.discount || 0);
                    const feePaid = Number(form.feePaid || 0);
                    const total = courseFee - discount;
                    const balance = total - feePaid;
                    setForm(prev => ({
                      ...prev,
                      course: e.target.value,
                      fees: courseFee,
                      total,
                      balance
                    }));
                  }}
                  className="border p-2"
                >
                  <option value="">-- Select Course --</option>
                  {courses.map(c => <option key={c._id} value={c.uuid}>{c.name}</option>)}
                </select>

                <select value={form.batchTime} onChange={handleChange('batchTime')} className="border p-2">
                  <option value="">-- Select Batch --</option>
                  {batches.map(b => (
                    <option key={b._id} value={b.time || b.batchTime || b.name || ''}>
                      {b.time || b.batchTime || b.name || 'Unnamed Batch'}
                    </option>
                  ))}
                </select>

                <select value={form.examEvent} onChange={handleChange('examEvent')} className="border p-2">
                  <option value="">-- Select Exam --</option>
                  {exams.map(e => <option key={e._id} value={e.exam}>{e.exam}</option>)}
                </select>
              </>
            )}

            {/* TAB 3: Payment & EMI */}
            {tab === 2 && (
              <>


                <input placeholder="Fees" value={form.fees} type="number" className="border p-2" readOnly />
                <input placeholder="Discount" value={form.discount} type="number" onChange={handleChange('discount')} className="border p-2" />
                <input placeholder="Total" value={form.total} type="number" className="border p-2" readOnly />
                <input placeholder="Fee Paid" value={form.feePaid} type="number" onChange={handleChange('feePaid')} className="border p-2" />
                <input placeholder="Balance" value={form.balance} type="number" className="border p-2" readOnly />

                <select value={form.paidBy} onChange={handleChange('paidBy')} className="border p-2">
                  <option value="">-- Select Payment Mode --</option>
                  {paymentModes.map(p => <option key={p._id} value={p.mode}>{p.mode}</option>)}
                </select>
                <input placeholder="Installments" value={form.installment} onChange={handleChange('installment')} type="number" min="1" className="border p-2" />


                <input
                  type="date"
                  placeholder="EMI Start Date"
                  value={form.emiDate}
                  onChange={handleChange('emiDate')}
                  className="border p-2"
                />
                <input placeholder="EMI" value={form.emi} type="number" className="border p-2" readOnly />
                  {installmentPlan.length > 0 && (
                  <div className="overflow-x-auto max-h-[60vh]">
                  <table className="min-w-full border mt-2 text-sm">
                    <thead className="sticky top-0 bg-gray-100">
                      <tr className="bg-gray-100">
                        <th className="border px-2 py-1">#</th>
                        <th className="border px-2 py-1">Due Date</th>
                        <th className="border px-2 py-1">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installmentPlan.map(p => (
                        <tr key={p.installmentNo}>
                          <td className="border px-2 py-1 text-center truncate">{p.installmentNo}</td>
                          <td className="border px-2 py-1 truncate">{new Date(p.dueDate).toLocaleDateString()}</td>
                          <td className="border px-2 py-1 text-right truncate">{p.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                  )}
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-white px-4 py-2 rounded"
                style={{ backgroundColor: themeColor }}
              >
                {editingId ? 'Update' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );

  };

  export default AddAdmission;
