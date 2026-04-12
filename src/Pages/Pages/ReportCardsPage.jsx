import { Button, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import PageHeader from '../components/PageHeader';
import EntityDialog from '../components/EntityDialog';

const emptyTemplate = { name: '', academicYear: '', examName: '', subjectColumns: 'subject,maxMarks,obtainedMarks,grade' };
const emptyReport = { student_uuid: '', academicYear: '', examName: '', className: '', section: '', teacherRemarks: '' };

export default function ReportCardsPage() {
  const { institute } = useAppContext();
  const [templates, setTemplates] = useState([]);
  const [reports, setReports] = useState([]);
  const [students, setStudents] = useState([]);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);
  const [templateForm, setTemplateForm] = useState(emptyTemplate);
  const [reportForm, setReportForm] = useState(emptyReport);

  const fetchAll = async () => {
    const institute_uuid = institute?.institute_uuid;
    if (!institute_uuid) return;
    const [t, r, s] = await Promise.all([
      api.get('/api/report-cards/templates', { params: { institute_uuid } }),
      api.get('/api/report-cards', { params: { institute_uuid } }),
      api.get('/api/students', { params: { institute_uuid } }),
    ]);
    setTemplates(t.data.data || []);
    setReports(r.data.data || []);
    setStudents(s.data.data || []);
  };

  useEffect(() => { fetchAll().catch(console.error); }, [institute?.institute_uuid]);

  const saveTemplate = async () => {
    await api.post('/api/report-cards/templates', { ...templateForm, institute_uuid: institute.institute_uuid, subjectColumns: String(templateForm.subjectColumns).split(',').map((x) => x.trim()).filter(Boolean) });
    setTemplateDialog(false); setTemplateForm(emptyTemplate); fetchAll();
  };
  const saveReport = async () => {
    await api.post('/api/report-cards', { ...reportForm, institute_uuid: institute.institute_uuid, subjects: [] });
    setReportDialog(false); setReportForm(emptyReport); fetchAll();
  };

  return (
    <>
      <PageHeader title="Report Card Management" subtitle="Setup exam templates and create report card records from the mobile dashboard." action={<Stack direction="row" spacing={1}><Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => setTemplateDialog(true)}>Add template</Button><Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setReportDialog(true)}>Add report</Button></Stack>} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}><Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}><CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Templates</Typography>
          <Stack spacing={1.5}>{templates.map((item) => <Card key={item.uuid} variant="outlined"><CardContent>
            <Typography fontWeight={700}>{item.name}</Typography>
            <Typography variant="body2" color="text.secondary">{item.academicYear || '-'} • {item.examName || '-'}</Typography>
            <Typography variant="body2" color="text.secondary">Columns: {item.subjectColumns?.join(', ')}</Typography>
          </CardContent></Card>)}</Stack>
        </CardContent></Card></Grid>
        <Grid item xs={12} md={7}><Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}><CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Generated records</Typography>
          <Stack spacing={1.5}>{reports.map((item) => {
            const student = students.find((s) => s.uuid === item.student_uuid);
            return <Card key={item.uuid} variant="outlined"><CardContent>
              <Typography fontWeight={700}>{student ? `${student.firstName} ${student.lastName}` : item.student_uuid}</Typography>
              <Typography variant="body2" color="text.secondary">{item.className || '-'} {item.section || ''} • {item.examName || '-'}</Typography>
              <Typography variant="body2" color="text.secondary">Remarks: {item.teacherRemarks || '-'}</Typography>
            </CardContent></Card>;
          })}</Stack>
        </CardContent></Card></Grid>
      </Grid>
      <EntityDialog open={templateDialog} title="Add report card template" form={templateForm} setForm={setTemplateForm} onClose={() => setTemplateDialog(false)} onSubmit={saveTemplate} fields={[
        { name: 'name', label: 'Template name' },
        { name: 'academicYear', label: 'Academic year' },
        { name: 'examName', label: 'Exam name' },
        { name: 'subjectColumns', label: 'Columns (comma separated)', multiline: true },
      ]} />
      <EntityDialog open={reportDialog} title="Add report card" form={reportForm} setForm={setReportForm} onClose={() => setReportDialog(false)} onSubmit={saveReport} fields={[
        { name: 'student_uuid', label: 'Student', type: 'select', options: students.map((s) => ({ label: `${s.firstName} ${s.lastName}`.trim(), value: s.uuid })) },
        { name: 'academicYear', label: 'Academic year' },
        { name: 'examName', label: 'Exam name' },
        { name: 'className', label: 'Class' },
        { name: 'section', label: 'Section' },
        { name: 'teacherRemarks', label: 'Teacher remarks', multiline: true },
      ]} />
    </>
  );
}
