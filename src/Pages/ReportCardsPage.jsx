import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import * as XLSX from 'xlsx';
import PageHeader from '../components/PageHeader';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import { renderReportCard } from '../utils/documentGenerators';

const defaultTemplate = {
  name: '',
  academicYear: '',
  examName: '',
  subjects: ['English', 'Mathematics', 'Science', 'Social Science'],
  headerColor: '#1d4ed8',
};

const emptyManual = {
  studentSnapshot: { studentName: '', className: '', section: '', rollNumber: '', admissionNo: '', photoUrl: '' },
  academicYear: '',
  examName: '',
  className: '',
  section: '',
  attendance: { workingDays: 0, presentDays: 0 },
  subjects: [
    { subject: 'English', maxMarks: 100, obtainedMarks: 0, grade: '' },
    { subject: 'Mathematics', maxMarks: 100, obtainedMarks: 0, grade: '' },
  ],
  teacherRemarks: '',
  principalRemarks: '',
};

const calculateTotals = (subjects = []) => {
  const total = subjects.reduce((sum, item) => sum + Number(item.maxMarks || 0), 0);
  const obtained = subjects.reduce((sum, item) => sum + Number(item.obtainedMarks || 0), 0);
  const percentage = total ? ((obtained / total) * 100).toFixed(2) : 0;
  return { total, obtained, percentage, result: Number(percentage) >= 35 ? 'Pass' : 'Needs Attention' };
};

const downloadDataUrl = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
};

export default function ReportCardsPage() {
  const { institute, settings } = useAppContext();
  const [templates, setTemplates] = useState([]);
  const [students, setStudents] = useState([]);
  const [reports, setReports] = useState([]);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [templateForm, setTemplateForm] = useState(defaultTemplate);
  const [selectedTemplateUuid, setSelectedTemplateUuid] = useState('');
  const [sourceTab, setSourceTab] = useState('database');
  const [selectedStudentUuids, setSelectedStudentUuids] = useState([]);
  const [excelRows, setExcelRows] = useState([]);
  const [manualRows, setManualRows] = useState([emptyManual]);
  const [preview, setPreview] = useState(null);
  const [shareDialog, setShareDialog] = useState({ open: false, link: '' });
  const fileRef = useRef(null);

  const selectedTemplate = useMemo(() => templates.find((item) => item.uuid === selectedTemplateUuid) || templates[0] || null, [templates, selectedTemplateUuid]);

  const fetchAll = async () => {
    if (!institute?.institute_uuid) return;
    const institute_uuid = institute.institute_uuid;
    const [t, s, r] = await Promise.all([
      api.get('/api/report-cards/templates', { params: { institute_uuid } }),
      api.get('/api/students', { params: { institute_uuid } }),
      api.get('/api/report-cards', { params: { institute_uuid } }),
    ]);
    const nextTemplates = t.data.data || [];
    setTemplates(nextTemplates);
    setStudents(s.data.data || []);
    setReports(r.data.data || []);
    if (!selectedTemplateUuid && nextTemplates.length) setSelectedTemplateUuid(nextTemplates[0].uuid);
  };

  useEffect(() => { fetchAll().catch(console.error); }, [institute?.institute_uuid]);

  const createTemplate = async () => {
    const payload = { ...templateForm, institute_uuid: institute.institute_uuid };
    const { data } = await api.post('/api/report-cards/templates', payload);
    setTemplateDialog(false);
    setTemplateForm(defaultTemplate);
    await fetchAll();
    setSelectedTemplateUuid(data.data.uuid);
  };

  const importExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    const byStudent = {};
    rows.forEach((row) => {
      const key = row.studentName || row.StudentName || row.admissionNo || row.AdmissionNo || Math.random();
      if (!byStudent[key]) {
        byStudent[key] = {
          studentSnapshot: {
            studentName: row.studentName || row.StudentName || '',
            className: row.className || row.Class || '',
            section: row.section || row.Section || '',
            rollNumber: row.rollNumber || row.RollNumber || '',
            admissionNo: row.admissionNo || row.AdmissionNo || '',
            photoUrl: row.photoUrl || row.Photo || '',
          },
          academicYear: row.academicYear || '',
          examName: row.examName || row.Exam || '',
          className: row.className || row.Class || '',
          section: row.section || row.Section || '',
          attendance: { workingDays: Number(row.workingDays || 0), presentDays: Number(row.presentDays || 0) },
          subjects: [],
          teacherRemarks: row.teacherRemarks || '',
          principalRemarks: row.principalRemarks || '',
        };
      }
      if (row.subject || row.Subject) {
        byStudent[key].subjects.push({
          subject: row.subject || row.Subject,
          maxMarks: Number(row.maxMarks || row.MaxMarks || 100),
          obtainedMarks: Number(row.obtainedMarks || row.ObtainedMarks || 0),
          grade: row.grade || row.Grade || '',
        });
      }
    });
    setExcelRows(Object.values(byStudent));
    setSourceTab('excel');
  };

  const selectedDatabasePayloads = students.filter((item) => selectedStudentUuids.includes(item.uuid)).map((student) => ({
    student_uuid: student.uuid,
    studentSnapshot: {
      studentName: [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' '),
      className: student.className || '',
      section: student.section || '',
      rollNumber: student.rollNumber || '',
      admissionNo: student.admissionNo || '',
      photoUrl: Array.isArray(student.photo) ? (student.photo[0] || '') : '',
    },
    academicYear: student.academicYear || '',
    examName: selectedTemplate?.examName || '',
    className: student.className || '',
    section: student.section || '',
    attendance: { workingDays: 0, presentDays: 0 },
    subjects: (selectedTemplate?.subjects || ['English', 'Mathematics']).map((subject) => ({ subject, maxMarks: 100, obtainedMarks: 0, grade: '' })),
    teacherRemarks: '',
    principalRemarks: '',
  }));

  const activeRows = sourceTab === 'database' ? selectedDatabasePayloads : sourceTab === 'excel' ? excelRows : manualRows;

  const generatePreview = async (row) => {
    if (!selectedTemplate || !row) return;
    const computed = { ...row, totals: calculateTotals(row.subjects || []) };
    const rendered = await renderReportCard(selectedTemplate, computed, settings);
    setPreview({ ...computed, ...rendered });
  };

  useEffect(() => {
    if (selectedTemplate && activeRows[0]) generatePreview(activeRows[0]).catch(console.error);
  }, [selectedTemplateUuid, sourceTab, excelRows.length, manualRows.length, students.length]);

  const bulkGenerate = async () => {
    if (!selectedTemplate) return;
    const payloadRows = activeRows.map((row) => ({ ...row, totals: calculateTotals(row.subjects || []), template_uuid: selectedTemplate.uuid }));
    const { data } = await api.post('/api/report-cards/bulk-create', {
      institute_uuid: institute.institute_uuid,
      template_uuid: selectedTemplate.uuid,
      sourceType: sourceTab,
      records: payloadRows,
    });
    const generated = [];
    for (const item of data.data || []) {
      const rendered = await renderReportCard(selectedTemplate, { ...item, totals: calculateTotals(item.subjects || []) }, settings);
      const updated = await api.put(`/api/report-cards/${item.uuid}`, { ...rendered, totals: calculateTotals(item.subjects || []) });
      generated.push(updated.data.data);
    }
    setReports((prev) => [...generated, ...prev]);
    if (generated[0]) {
      const first = generated[0];
      setPreview({ ...first, imageDataUrl: first.imageDataUrl, pdfDataUrl: first.pdfDataUrl });
    }
  };

  const openShare = async (report) => {
    const { data } = await api.post(`/api/report-cards/${report.uuid}/share-link`, { baseUrl: window.location.origin, shareRole: 'teacher', expiresHours: 168 });
    setShareDialog({ open: true, link: data.data.shareUrl });
  };

  const updateManualRow = (rowIndex, key, value) => {
    setManualRows((prev) => prev.map((row, i) => i === rowIndex ? { ...row, [key]: value } : row));
  };

  const updateManualSubject = (rowIndex, subjectIndex, key, value) => {
    setManualRows((prev) => prev.map((row, i) => i === rowIndex ? { ...row, subjects: row.subjects.map((subject, sIdx) => sIdx === subjectIndex ? { ...subject, [key]: value } : subject) } : row));
  };

  return (
    <>
      <PageHeader
        title="Report Card Studio"
        subtitle="Prepare printable report cards from live students, Excel marksheets, or manual marks entry. Generate image/PDF and share edit links from mobile."
        action={<Stack direction="row" spacing={1}><Button variant="outlined" startIcon={<UploadFileRoundedIcon />} onClick={() => fileRef.current?.click()}>Import Excel</Button><Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setTemplateDialog(true)}>New template</Button></Stack>}
      />
      <input ref={fileRef} hidden type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, mb: 2 }}><CardContent>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Exam templates</Typography>
            <Stack spacing={1.2}>{templates.map((item) => (
              <Card key={item.uuid} variant={selectedTemplateUuid === item.uuid ? 'elevation' : 'outlined'} onClick={() => setSelectedTemplateUuid(item.uuid)} sx={{ cursor: 'pointer', borderRadius: 3, borderColor: selectedTemplateUuid === item.uuid ? 'primary.main' : 'divider' }}><CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={700}>{item.name}</Typography>
                  {item.isDefault ? <Chip label="Default" size="small" color="primary" /> : null}
                </Stack>
                <Typography variant="body2" color="text.secondary">{item.academicYear || '-'} • {item.examName || '-'}</Typography>
                <Typography variant="body2" color="text.secondary">Subjects: {(item.subjects || []).join(', ')}</Typography>
              </CardContent></Card>
            ))}</Stack>
          </CardContent></Card>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}><CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Preview</Typography>
            {preview?.imageDataUrl ? <Box component="img" src={preview.imageDataUrl} alt="report preview" sx={{ width: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 1 }} /> : <Alert severity="info">Choose template and data to preview report card.</Alert>}
            <Stack direction="row" spacing={1}>
              <Button disabled={!preview?.imageDataUrl} variant="outlined" startIcon={<DownloadRoundedIcon />} onClick={() => downloadDataUrl(preview.imageDataUrl, 'report-card.png')}>PNG</Button>
              <Button disabled={!preview?.pdfDataUrl} variant="contained" startIcon={<DownloadRoundedIcon />} onClick={() => downloadDataUrl(preview.pdfDataUrl, 'report-card.pdf')}>PDF</Button>
            </Stack>
          </CardContent></Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, mb: 2 }}><CardContent>
            <Tabs value={sourceTab} onChange={(_, value) => setSourceTab(value)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 2 }}>
              <Tab value="database" label={`Database (${students.length})`} />
              <Tab value="excel" label={`Excel (${excelRows.length})`} />
              <Tab value="manual" label="Manual" />
            </Tabs>

            {sourceTab === 'database' ? (
              <Grid container spacing={1.2}>{students.map((student) => {
                const selected = selectedStudentUuids.includes(student.uuid);
                return <Grid key={student.uuid} size={{ xs: 12, sm: 6 }}><Card onClick={() => setSelectedStudentUuids((prev) => selected ? prev.filter((id) => id !== student.uuid) : [...prev, student.uuid])} variant={selected ? 'elevation' : 'outlined'} sx={{ cursor: 'pointer', borderRadius: 3, borderColor: selected ? 'primary.main' : 'divider' }}><CardContent>
                  <Typography fontWeight={700}>{[student.firstName, student.lastName].filter(Boolean).join(' ')}</Typography>
                  <Typography variant="body2" color="text.secondary">{student.className || '-'} • {student.section || '-'} • {student.rollNumber || '-'}</Typography>
                </CardContent></Card></Grid>;
              })}</Grid>
            ) : null}

            {sourceTab === 'excel' ? (
              <Stack spacing={1.2}>
                <Alert severity="success">Excel format can be row-wise by subject. Use columns like studentName, className, section, subject, maxMarks, obtainedMarks, grade.</Alert>
                {excelRows.slice(0, 6).map((row, index) => <Card key={index} variant="outlined" sx={{ borderRadius: 3 }}><CardContent>
                  <Typography fontWeight={700}>{row.studentSnapshot?.studentName || '-'}</Typography>
                  <Typography variant="body2" color="text.secondary">{row.className || '-'} • {row.examName || '-'}</Typography>
                </CardContent></Card>)}
              </Stack>
            ) : null}

            {sourceTab === 'manual' ? (
              <Stack spacing={1.5}>
                {manualRows.map((row, rowIndex) => <Card key={rowIndex} variant="outlined" sx={{ borderRadius: 3 }}><CardContent>
                  <Grid container spacing={1.2}>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth size="small" label="Student name" value={row.studentSnapshot.studentName} onChange={(e) => updateManualRow(rowIndex, 'studentSnapshot', { ...row.studentSnapshot, studentName: e.target.value })} /></Grid>
                    <Grid size={{ xs: 6, sm: 3 }}><TextField fullWidth size="small" label="Class" value={row.className} onChange={(e) => updateManualRow(rowIndex, 'className', e.target.value)} /></Grid>
                    <Grid size={{ xs: 6, sm: 3 }}><TextField fullWidth size="small" label="Section" value={row.section} onChange={(e) => updateManualRow(rowIndex, 'section', e.target.value)} /></Grid>
                    <Grid size={{ xs: 6, sm: 4 }}><TextField fullWidth size="small" label="Academic year" value={row.academicYear} onChange={(e) => updateManualRow(rowIndex, 'academicYear', e.target.value)} /></Grid>
                    <Grid size={{ xs: 6, sm: 4 }}><TextField fullWidth size="small" label="Exam" value={row.examName} onChange={(e) => updateManualRow(rowIndex, 'examName', e.target.value)} /></Grid>
                    <Grid size={{ xs: 6, sm: 2 }}><TextField fullWidth size="small" type="number" label="Working" value={row.attendance.workingDays} onChange={(e) => updateManualRow(rowIndex, 'attendance', { ...row.attendance, workingDays: Number(e.target.value) })} /></Grid>
                    <Grid size={{ xs: 6, sm: 2 }}><TextField fullWidth size="small" type="number" label="Present" value={row.attendance.presentDays} onChange={(e) => updateManualRow(rowIndex, 'attendance', { ...row.attendance, presentDays: Number(e.target.value) })} /></Grid>
                  </Grid>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack spacing={1}>{row.subjects.map((subject, subjectIndex) => <Grid container spacing={1} key={subjectIndex}>
                    <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth size="small" label="Subject" value={subject.subject} onChange={(e) => updateManualSubject(rowIndex, subjectIndex, 'subject', e.target.value)} /></Grid>
                    <Grid size={{ xs: 4, sm: 2 }}><TextField fullWidth size="small" type="number" label="Max" value={subject.maxMarks} onChange={(e) => updateManualSubject(rowIndex, subjectIndex, 'maxMarks', Number(e.target.value))} /></Grid>
                    <Grid size={{ xs: 4, sm: 3 }}><TextField fullWidth size="small" type="number" label="Obtained" value={subject.obtainedMarks} onChange={(e) => updateManualSubject(rowIndex, subjectIndex, 'obtainedMarks', Number(e.target.value))} /></Grid>
                    <Grid size={{ xs: 4, sm: 3 }}><TextField fullWidth size="small" label="Grade" value={subject.grade} onChange={(e) => updateManualSubject(rowIndex, subjectIndex, 'grade', e.target.value)} /></Grid>
                  </Grid>)}</Stack>
                </CardContent></Card>)}
                <Button startIcon={<AddRoundedIcon />} onClick={() => setManualRows((prev) => [...prev, emptyManual])}>Add another report</Button>
              </Stack>
            ) : null}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
              <Button variant="contained" startIcon={<AssessmentRoundedIcon />} disabled={!selectedTemplate || !activeRows.length} onClick={bulkGenerate}>Generate report cards</Button>
            </Stack>
          </CardContent></Card>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}><CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Generated report cards</Typography>
            <Grid container spacing={1.2}>{reports.map((report) => <Grid key={report.uuid} size={{ xs: 12, md: 6 }}><Card variant="outlined" sx={{ borderRadius: 3 }}><CardContent>
              <Typography fontWeight={700}>{report.studentSnapshot?.studentName || report.student_uuid || 'Student'}</Typography>
              <Typography variant="body2" color="text.secondary">{report.className || '-'} • {report.examName || '-'}</Typography>
              <Typography variant="body2" color="text.secondary">Result: {report.totals?.result || '-'} • {report.totals?.percentage || 0}%</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap">
                <Button size="small" onClick={() => generatePreview(report)}>Preview</Button>
                <Button size="small" startIcon={<DownloadRoundedIcon />} onClick={() => report.imageDataUrl && downloadDataUrl(report.imageDataUrl, `${report.studentSnapshot?.studentName || 'report'}.png`)} disabled={!report.imageDataUrl}>PNG</Button>
                <Button size="small" startIcon={<DownloadRoundedIcon />} onClick={() => report.pdfDataUrl && downloadDataUrl(report.pdfDataUrl, `${report.studentSnapshot?.studentName || 'report'}.pdf`)} disabled={!report.pdfDataUrl}>PDF</Button>
                <Button size="small" startIcon={<LinkRoundedIcon />} onClick={() => openShare(report)}>Share link</Button>
              </Stack>
            </CardContent></Card></Grid>)}</Grid>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Dialog open={templateDialog} onClose={() => setTemplateDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create report card template</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField label="Template name" value={templateForm.name} onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))} />
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}><TextField label="Academic year" fullWidth value={templateForm.academicYear} onChange={(e) => setTemplateForm((p) => ({ ...p, academicYear: e.target.value }))} /></Grid>
              <Grid size={{ xs: 6 }}><TextField label="Exam name" fullWidth value={templateForm.examName} onChange={(e) => setTemplateForm((p) => ({ ...p, examName: e.target.value }))} /></Grid>
              <Grid size={{ xs: 12 }}><TextField label="Subjects (comma separated)" fullWidth value={templateForm.subjects.join(', ')} onChange={(e) => setTemplateForm((p) => ({ ...p, subjects: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))} /></Grid>
              <Grid size={{ xs: 12 }}><TextField label="Header color" fullWidth value={templateForm.headerColor} onChange={(e) => setTemplateForm((p) => ({ ...p, headerColor: e.target.value }))} helperText="Use color like #1d4ed8" /></Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setTemplateDialog(false)}>Cancel</Button><Button variant="contained" onClick={createTemplate}>Save template</Button></DialogActions>
      </Dialog>

      <Dialog open={shareDialog.open} onClose={() => setShareDialog({ open: false, link: '' })} fullWidth maxWidth="sm">
        <DialogTitle>Prelogged report card edit link</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Alert severity="success">This link can be sent on WhatsApp so a teacher or student can fill missing marks or remarks from mobile without logging in.</Alert>
            <TextField fullWidth multiline minRows={3} value={shareDialog.link} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="outlined" onClick={() => navigator.clipboard.writeText(shareDialog.link)}>Copy link</Button>
              <Button variant="contained" startIcon={<WhatsAppIcon />} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Please complete the report card details here: ${shareDialog.link}`)}`, '_blank')}>Open WhatsApp</Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
