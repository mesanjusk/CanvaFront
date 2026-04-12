import { Button, Card, CardContent, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import EntityDialog from '../components/EntityDialog';

const emptyStudent = { firstName: '', lastName: '', mobileSelf: '', mobileParent: '', className: '', section: '', admissionNo: '', rollNumber: '', academicYear: '' };
const emptyAdmission = { student_uuid: '', course: '', className: '', section: '', academicYear: '', source: '', feesPlanned: 0, netFees: 0 };

export default function AdmissionsPage() {
  const { institute } = useAppContext();
  const [students, setStudents] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [masters, setMasters] = useState([]);
  const [studentDialog, setStudentDialog] = useState(false);
  const [admissionDialog, setAdmissionDialog] = useState(false);
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [admissionForm, setAdmissionForm] = useState(emptyAdmission);

  const fetchAll = async () => {
    const institute_uuid = institute?.institute_uuid;
    if (!institute_uuid) return;
    const [s, a, m] = await Promise.all([
      api.get('/api/students', { params: { institute_uuid } }),
      api.get('/api/admissions', { params: { institute_uuid } }),
      api.get('/api/masters', { params: { institute_uuid } }),
    ]);
    setStudents(s.data.data || []);
    setAdmissions(a.data.data || []);
    setMasters(m.data.data || []);
  };

  useEffect(() => { fetchAll().catch(console.error); }, [institute?.institute_uuid]);

  const classOptions = useMemo(() => masters.filter((m) => m.type === 'class').map((m) => ({ label: m.name, value: m.name })), [masters]);
  const sectionOptions = useMemo(() => masters.filter((m) => m.type === 'section').map((m) => ({ label: m.name, value: m.name })), [masters]);
  const yearOptions = useMemo(() => masters.filter((m) => m.type === 'academic_year').map((m) => ({ label: m.name, value: m.name })), [masters]);

  const saveStudent = async () => {
    await api.post('/api/students', { ...studentForm, institute_uuid: institute.institute_uuid });
    setStudentDialog(false); setStudentForm(emptyStudent); fetchAll();
  };
  const saveAdmission = async () => {
    await api.post('/api/admissions', { ...admissionForm, institute_uuid: institute.institute_uuid });
    setAdmissionDialog(false); setAdmissionForm(emptyAdmission); fetchAll();
  };

  return (
    <>
      <PageHeader
        title="Admissions & Students"
        subtitle="Capture admissions, manage students and keep every core value DB-driven."
        action={<Stack direction="row" spacing={1}><Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => setStudentDialog(true)}>New student</Button><Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setAdmissionDialog(true)}>New admission</Button></Stack>}
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}><CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Students</Typography>
            <Stack spacing={1.5}>{students.map((student) => (
              <Card key={student.uuid} variant="outlined"><CardContent>
                <Typography fontWeight={700}>{student.firstName} {student.lastName}</Typography>
                <Typography variant="body2" color="text.secondary">{student.className || '-'} {student.section || ''} • Adm No: {student.admissionNo || '-'}</Typography>
                <Typography variant="body2" color="text.secondary">Parent: {student.mobileParent || '-'}</Typography>
              </CardContent></Card>
            ))}</Stack>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}><CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Admissions</Typography>
            <Stack spacing={1.5}>{admissions.map((admission) => (
              <Card key={admission.uuid} variant="outlined"><CardContent>
                <Typography fontWeight={700}>{admission.course || 'Admission'}</Typography>
                <Typography variant="body2" color="text.secondary">{admission.className || '-'} {admission.section || ''} • {admission.academicYear || '-'}</Typography>
                <Typography variant="body2" color="text.secondary">Fees: ₹{admission.netFees || 0}</Typography>
              </CardContent></Card>
            ))}</Stack>
          </CardContent></Card>
        </Grid>
      </Grid>

      <EntityDialog open={studentDialog} title="Add Student" form={studentForm} setForm={setStudentForm} onClose={() => setStudentDialog(false)} onSubmit={saveStudent} fields={[
        { name: 'firstName', label: 'First name' },
        { name: 'lastName', label: 'Last name' },
        { name: 'mobileSelf', label: 'Student mobile' },
        { name: 'mobileParent', label: 'Parent mobile' },
        { name: 'admissionNo', label: 'Admission no' },
        { name: 'rollNumber', label: 'Roll no' },
        { name: 'className', label: 'Class', type: 'select', options: classOptions },
        { name: 'section', label: 'Section', type: 'select', options: sectionOptions },
        { name: 'academicYear', label: 'Academic year', type: 'select', options: yearOptions },
      ]} />

      <EntityDialog open={admissionDialog} title="Add Admission" form={admissionForm} setForm={setAdmissionForm} onClose={() => setAdmissionDialog(false)} onSubmit={saveAdmission} fields={[
        { name: 'student_uuid', label: 'Student', type: 'select', options: students.map((s) => ({ label: `${s.firstName} ${s.lastName}`.trim(), value: s.uuid })) },
        { name: 'course', label: 'Program / Course' },
        { name: 'className', label: 'Class', type: 'select', options: classOptions },
        { name: 'section', label: 'Section', type: 'select', options: sectionOptions },
        { name: 'academicYear', label: 'Academic year', type: 'select', options: yearOptions },
        { name: 'source', label: 'Lead source' },
        { name: 'feesPlanned', label: 'Fees planned' },
        { name: 'netFees', label: 'Net fees' },
      ]} />
    </>
  );
}
