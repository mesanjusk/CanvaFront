import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from "react-router-dom"
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import BASE_URL from '../../config';
import { getThemeColor } from '../../utils/storageUtils';

const useAdmissionForm = (initialForm = {}) => {
  const navigate = useNavigate();
  const nextMonthDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth()  +1);
    return d.toISOString().substring(0, 10);
  })();

  const defaultForm = {
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

  const [form, setForm] = useState({ ...defaultForm, ...initialForm });
  const [tab, setTab] = useState(0);
  const [admissions, setAdmissions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [courses, setCourses] = useState([]);
  const [educations, setEducations] = useState([]);
  const [exams, setExams] = useState([]);
  const [batches, setBatches] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);

  const [installmentPlan, setInstallmentPlan] = useState([]);

  const themeColor = getThemeColor();
  const institute_uuid = localStorage.getItem('institute_uuid');
  const [searchParams] = useSearchParams();
  const lead_uuid = searchParams.get('lead_uuid');
  const [accountGroups, setAccountGroups] = useState([]);

const fetchAccountGroups = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/api/accountgroup/GetAccountgroupList`);
    const data = res.data?.result;

    if (Array.isArray(data)) {
      setAccountGroups(data);
    } else {
      toast.error("Invalid account group data");
      setAccountGroups([]);
    }
  } catch (err) {
    toast.error('Failed to load account groups');
    console.error('Error fetching account groups:', err);
  }
};


useEffect(() => {
  fetchAccountGroups(); 
}, []);


  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/courses`);
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load courses');
    }
  };

 

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
      const res = await axios.get(`${BASE_URL}/api/account/GetAccountList`);
      const options = (res.data?.result || []).filter(
        (item) =>
          (item.Account_name === 'Bank' || item.Account_name === 'Cash') &&
          item.institute_uuid === institute_uuid
      );

      setPaymentModes(options);
    } catch (err) {
      console.error('Payment mode fetch error:', err);
      alert('Failed to load payment modes');
    }
  };



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
      d.setMonth(d.getMonth()  +1);
      return d;
    })();
    for (let i = 0; i < inst; i++) {
      const due = new Date(start);
      due.setMonth(due.getMonth()  +i);
      const amount = i  +1 === inst ? parseFloat(remaining.toFixed(2)) : emi;
      remaining = parseFloat((remaining - amount).toFixed(2));
      plan.push({
        installmentNo: i  +1,
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
    form.emiDate,
  ]);

  const fetchAdmissions = async () => {
    if (!institute_uuid) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/admissions`, {
        params: { institute_uuid },
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
      d.setMonth(d.getMonth()  +1);
      const nextMonth = d.toISOString().substring(0, 10);
      const prevDefault = (() => {
        const pd = new Date(form.admissionDate);
        pd.setMonth(pd.getMonth()  +1);
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

  const handleBlur = async (field, value) => {
  if (field === 'mobileSelf' && /^\d{10}$/.test(value)) {
    try {
      const res = await axios.get(`${BASE_URL}/api/students/check-mobile`, {
        params: {
          institute_uuid,
          mobileSelf: value,
        },
      });
      if (res.data.exists) {
        toast.error('Mobile number already exists for this institute');
      }
    } catch (err) {
      console.error('Error checking mobileSelf:', err);
    }
  }
};


  // --- UPDATED handleSubmit ---
 const handleSubmit = async (e, onSuccess) => {
  e.preventDefault();
  if (!institute_uuid) return toast.error('Missing institute ID');

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

const checkDuplicate = await axios.get(`${BASE_URL}/api/students/check-mobile`, {
  params: {
    institute_uuid,
    mobileSelf: form.mobileSelf,
  },
});

if (checkDuplicate.data.exists && !form.student_uuid) {
  return toast.error('Mobile number already exists');
}



  try {
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
    await axios.post(`${BASE_URL}/api/fees`, feesPayload);

    const leadPayload = {
  institute_uuid,
  student_uuid,
  admission_uuid,
  enquiryDate: form.admissionDate,
  course: form.course,
  referredBy: 'Self',
  createdBy: 'System',
  followups: [{
    date: new Date().toISOString().substring(0, 10),
    status: 'converted',
    remark: '',
    createdBy: 'System',
  }],
  studentData: {
    mobileSelf: form.mobileSelf, 
    firstName: form.firstName,
    lastName: form.lastName,
    course: form.course,
  },
};

    await axios.post(`${BASE_URL}/api/leads`, leadPayload);

    const accountGroup = accountGroups.find(group => group.Account_group === 'ACCOUNT');
    if (!accountGroup || !accountGroup.Account_group_uuid) {
  toast.error('ACCOUNT group UUID not found. Cannot create account.');
  return;
}

    const accountPayload = {
      institute_uuid,
      Account_name: `${form.firstName} ${form.lastName}`.trim(),
      Account_group: accountGroup.Account_group_uuid,
      Mobile_number: form.mobileSelf,
    };
    await axios.post(`${BASE_URL}/api/account/addAccount`, accountPayload);

    // ✅ Fetch account list ONCE
    let accList = [];
    try {
      const accountRes = await axios.get(
        `${BASE_URL}/api/account/GetAccountList`,
        { params: { institute_uuid } }
      );
      accList = accountRes.data.result || [];
    } catch (err) {
      toast.error("Failed to fetch account list for transactions");
      console.error("Account fetch error:", err);
    }

    // ✅ Transaction 1: Receipt (feePaid)
    if (feePaid > 0 && form.paidBy) {
      try {
        const studentAccount = accList.find(a =>
          a.Account_name?.trim().toLowerCase() === `${form.firstName} ${form.lastName}`.trim().toLowerCase()
          && a.Mobile_number === form.mobileSelf
        );

        const paymentAcc = accList.find(a => a.Account_name === form.paidBy);
        const paymentAccountUuid = paymentAcc ? paymentAcc.Account_uuid || paymentAcc.uuid : form.paidBy;

        if (!studentAccount) {
          toast.error('Could not find account for receipt entry');
        } else {
          const journal = [
            {
              Account_id: studentAccount.Account_uuid || studentAccount.uuid,
              Type: 'Debit',
              Amount: Number(feePaid),
            },
            {
              Account_id: paymentAccountUuid,
              Type: 'Credit',
              Amount: Number(feePaid),
            }
          ];

          const txPayload = {
            Description: `Admission Fees Received for ${form.firstName} ${form.lastName}`,
            Total_Credit: Number(feePaid),
            Total_Debit: Number(feePaid),
            Payment_mode: form.paidBy,
            Created_by: 'System',
            Transaction_date: form.admissionDate,
            Journal_entry: journal,
            institute_uuid,
          };

          await axios.post(`${BASE_URL}/api/transaction/addTransaction`, txPayload);
        }
      } catch (e) {
        toast.error('Failed to create transaction entry for fees paid');
        console.error('Transaction error:', e);
      }
    }

    // ✅ Transaction 2: Fees Receivable (total - discount)
    const receivableAmount = fees - discount;
    if (receivableAmount > 0) {
      try {
        const studentAccount = accList.find(a =>
          a.Account_name?.trim().toLowerCase() === `${form.firstName} ${form.lastName}`.trim().toLowerCase()
          && a.Mobile_number === form.mobileSelf
        );

        const receivableAcc = accList.find(a => a.Account_name === "Fees Receivable");
        const receivableAccountUuid = receivableAcc ? receivableAcc.Account_uuid || receivableAcc.uuid : null;

        if (!studentAccount || !receivableAccountUuid) {
          toast.error('Could not find account for fees receivable entry');
        } else {
          const receivableJournal = [
            {
              Account_id: receivableAccountUuid,
              Type: 'Debit',
              Amount: receivableAmount,
            },
            {
              Account_id: studentAccount.Account_uuid || studentAccount.uuid,
              Type: 'Credit',
              Amount: receivableAmount,
            }
          ];

          const receivableTxPayload = {
            Description: `Total Admission Fees Receivable for ${form.firstName} ${form.lastName}`,
            Total_Credit: receivableAmount,
            Total_Debit: receivableAmount,
            Payment_mode: 'Fees Receivable',
            Created_by: 'System',
            Transaction_date: form.admissionDate,
            Journal_entry: receivableJournal,
            institute_uuid,
          };

          await axios.post(`${BASE_URL}/api/transaction/addTransaction`, receivableTxPayload);
        }
      } catch (e) {
        toast.error('Failed to create transaction entry for total fees receivable');
        console.error('Transaction error:', e);
      }
    }

    toast.success('All records saved successfully');
    if (onSuccess) onSuccess(admissionData);
    setForm(initialForm);
    setEditingId(null);
    setTab(0);
    setInstallmentPlan([]);
    fetchAdmissions();
  } catch (err) {
    console.error('Error in handleSubmit:', err);
    if (err.response) {
      toast.error(`Server Error: ${err.response.data.message || err.response.statusText}`);
    } else {
      toast.error('Error saving admission');
    }
  }
};

  // --- END UPDATED handleSubmit ---
const handleEdit = async (data) => {
  const emiDate = data.emiDate || (() => {
    const d = new Date(data.admissionDate);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().substring(0, 10);
  })();

  const studentData = data.studentData || {};

  // Step 1: Set base admission + student data
  const baseForm = {
    admissionDate: data.admissionDate || '',
    emiDate,
    batchTime: data.batchTime || '',
    examEvent: data.examEvent || '',
    course: data.course || '',
    student_uuid: data.student_uuid || studentData.uuid || studentData._id || '',

    firstName: studentData.firstName || '',
    middleName: studentData.middleName || '',
    lastName: studentData.lastName || '',
    dob: studentData.dob || '',
    gender: studentData.gender || '',
    mobileSelf: studentData.mobileSelf || '',
    mobileSelfWhatsapp: studentData.mobileSelfWhatsapp || false,
    mobileParent: studentData.mobileParent || '',
    mobileParentWhatsapp: studentData.mobileParentWhatsapp || false,
    address: studentData.address || '',
    education: studentData.education || '',
  };

  // Step 2: Fetch Fees data by admission_uuid
  try {
    const feeRes = await axios.get(`${BASE_URL}/api/fees/admission/${data.uuid}`);
    const feeData = feeRes.data?.data;

    if (feeData) {
      baseForm.fees = feeData.fees || '';
      baseForm.discount = feeData.discount || '';
      baseForm.total = feeData.total || '';
      baseForm.feePaid = feeData.feePaid || '';
      baseForm.balance = feeData.balance || '';
      baseForm.emi = feeData.emi || '';
      baseForm.installment = feeData.installment || '';
      baseForm.paidBy = feeData.paidBy || '';

      setInstallmentPlan(feeData.installmentPlan || []);
    }
  } catch (err) {
    console.error("Failed to fetch fee details:", err);
    toast.error("Could not load payment and installment info");
  }

  setForm(baseForm);
  setEditingId(data._id);
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
    if (filteredAdmissions.length === 0) return toast.error('No data to export');
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
        'Admission Date',
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
        e.admissionDate,
      ]),
    });
    doc.save('admissions.pdf');
  };

  const exportExcel = () => {
    if (filteredAdmissions.length === 0) return toast.error('No data to export');
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

  const filteredAdmissions = admissions.filter((e) => {
    const matchSearch = e.firstName?.toLowerCase().includes(search.toLowerCase()) || e.mobileSelf?.includes(search);
    const admissionDate = new Date(e.admissionDate);
    const inDateRange = (!startDate || admissionDate >= new Date(startDate)) && (!endDate || admissionDate <= new Date(endDate));
    return matchSearch && inDateRange;
  });

  return {
    form,
    setForm,
    tab,
    setTab,
    courses,
    educations,
    exams,
    batches,
    paymentModes,
    installmentPlan,
    editingId,
    themeColor,
    handleChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    exportPDF,
    exportExcel,
    handleBlur,
    filteredAdmissions,
  };
};

export default useAdmissionForm;


