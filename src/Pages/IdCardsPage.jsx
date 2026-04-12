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
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import * as XLSX from 'xlsx';
import PageHeader from '../components/PageHeader';
import api from '../services/api';
import { useAppContext } from '../context/AppContext';
import { renderIdCard } from '../utils/documentGenerators';

const defaultTemplate = {
  name: '',
  orientation: 'portrait',
  title: 'STUDENT ID CARD',
  subtitle: '',
  footerText: 'If found, please return to school office.',
  width: 54,
  height: 86,
  unit: 'mm',
  photoShape: 'rounded',
  photoX: 18,
  photoY: 18,
  photoWidth: 60,
  photoHeight: 72,
  fields: [
    { key: 'studentName', label: 'Name', x: 96, y: 26, fontSize: 16, fontWeight: '700', color: '#111827' },
    { key: 'className', label: 'Class', x: 96, y: 52, fontSize: 12, fontWeight: '600', color: '#334155' },
    { key: 'section', label: 'Section', x: 96, y: 70, fontSize: 12, fontWeight: '500', color: '#334155' },
    { key: 'rollNumber', label: 'Roll No', x: 96, y: 88, fontSize: 12, fontWeight: '500', color: '#334155' },
    { key: 'admissionNo', label: 'Admission No', x: 96, y: 106, fontSize: 12, fontWeight: '500', color: '#334155' },
  ],
  styles: { primaryColor: '#0f172a', accentColor: '#2563eb', textColor: '#111827', cardColor: '#ffffff' },
};

const emptyManual = { studentName: '', className: '', section: '', rollNumber: '', admissionNo: '', mobileParent: '', guardianName: '', photoUrl: '' };

const fieldKeys = ['studentName', 'className', 'section', 'rollNumber', 'admissionNo', 'guardianName', 'mobileParent', 'photoUrl', 'bloodGroup', 'house'];

const downloadDataUrl = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
};

export default function IdCardsPage() {
  const { institute, settings, user } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [templateForm, setTemplateForm] = useState(defaultTemplate);
  const [sourceTab, setSourceTab] = useState('database');
  const [selectedTemplateUuid, setSelectedTemplateUuid] = useState('');
  const [selectedStudentUuids, setSelectedStudentUuids] = useState([]);
  const [excelRows, setExcelRows] = useState([]);
  const [manualRows, setManualRows] = useState([emptyManual]);
  const [preview, setPreview] = useState(null);
  const [shareDialog, setShareDialog] = useState({ open: false, record: null, link: '' });
  const fileRef = useRef(null);

  const selectedTemplate = useMemo(() => templates.find((item) => item.uuid === selectedTemplateUuid) || templates[0] || null, [templates, selectedTemplateUuid]);

  const fetchAll = async () => {
    if (!institute?.institute_uuid) return;
    setLoading(true);
    try {
      const institute_uuid = institute.institute_uuid;
      const [t, s, r] = await Promise.all([
        api.get('/api/id-cards/templates', { params: { institute_uuid } }),
        api.get('/api/id-cards/students', { params: { institute_uuid } }),
        api.get('/api/id-cards/records', { params: { institute_uuid } }),
      ]);
      const nextTemplates = t.data.data || [];
      setTemplates(nextTemplates);
      setStudents(s.data.data || []);
      setRecords(r.data.data || []);
      if (!selectedTemplateUuid && nextTemplates.length) setSelectedTemplateUuid(nextTemplates[0].uuid);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll().catch(console.error); }, [institute?.institute_uuid]);

  const createTemplate = async () => {
    const payload = { ...templateForm, institute_uuid: institute.institute_uuid };
    const { data } = await api.post('/api/id-cards/templates', payload);
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
    const normalized = rows.map((row) => ({
      studentName: row.studentName || row.StudentName || row.name || row.Name || '',
      className: row.className || row.Class || row.class || '',
      section: row.section || row.Section || '',
      rollNumber: row.rollNumber || row.RollNumber || row.roll || '',
      admissionNo: row.admissionNo || row.AdmissionNo || row.admNo || '',
      guardianName: row.guardianName || row.ParentName || '',
      mobileParent: row.mobileParent || row.ParentMobile || row.mobile || '',
      photoUrl: row.photoUrl || row.Photo || row.image || '',
      ...row,
    }));
    setExcelRows(normalized);
    setSourceTab('excel');
  };

  const selectedDatabasePayloads = students.filter((item) => selectedStudentUuids.includes(item.uuid)).map((student) => ({
    student_uuid: student.uuid,
    data: {
      studentName: [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' '),
      className: student.className || '',
      section: student.section || '',
      rollNumber: student.rollNumber || '',
      admissionNo: student.admissionNo || '',
      guardianName: student.guardianName || '',
      mobileParent: student.mobileParent || '',
      photoUrl: Array.isArray(student.photo) ? (student.photo[0] || '') : '',
      bloodGroup: student.bloodGroup || '',
      house: student.house || '',
    },
  }));

  const activeRows = sourceTab === 'database' ? selectedDatabasePayloads : sourceTab === 'excel' ? excelRows.map((row) => ({ data: row })) : manualRows.map((row) => ({ data: row }));

  const generatePreview = async (row) => {
    if (!selectedTemplate || !row) return;
    const rendered = await renderIdCard(selectedTemplate, row.data || row);
    setPreview({ row: row.data || row, ...rendered });
  };

  useEffect(() => {
    if (selectedTemplate && activeRows[0]) generatePreview(activeRows[0]).catch(console.error);
  }, [selectedTemplateUuid, sourceTab, students.length, excelRows.length, manualRows.length]);

  const bulkGenerate = async () => {
    if (!selectedTemplate) return;
    const rows = activeRows.slice(0, 500);
    const payload = { institute_uuid: institute.institute_uuid, template_uuid: selectedTemplate.uuid, sourceType: sourceTab, records: rows };
    const { data } = await api.post('/api/id-cards/records/bulk-create', payload);
    const generated = [];
    for (const item of data.data || []) {
      const rendered = await renderIdCard(selectedTemplate, item.data);
      const updated = await api.put(`/api/id-cards/records/${item.uuid}`, { ...rendered, status: item.data?.photoUrl ? 'ready' : 'pending_photo' });
      generated.push(updated.data.data);
    }
    setRecords((prev) => [...generated, ...prev]);
    if (generated[0]) setPreview({ row: generated[0].data, imageDataUrl: generated[0].imageDataUrl, pdfDataUrl: generated[0].pdfDataUrl });
  };

  const openShare = async (record) => {
    const { data } = await api.post(`/api/id-cards/records/${record.uuid}/share-link`, { baseUrl: window.location.origin, shareRole: 'student', expiresHours: 168 });
    setShareDialog({ open: true, record, link: data.data.shareUrl });
  };

  const updateManualRow = (index, key, value) => {
    setManualRows((prev) => prev.map((row, i) => i === index ? { ...row, [key]: value } : row));
  };

  return (
    <>
      <PageHeader
        title="ID Card Studio"
        subtitle="Create mobile-first ID cards from database students, Excel sheets, or manual entries. Generate image/PDF and share prelogged edit links on WhatsApp."
        action={<Stack direction="row" spacing={1}><Button variant="outlined" startIcon={<UploadFileRoundedIcon />} onClick={() => fileRef.current?.click()}>Import Excel</Button><Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setTemplateDialog(true)}>New template</Button></Stack>}
      />
      <input ref={fileRef} hidden type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 2, borderRadius: 4 }}><CardContent>
            <Stack spacing={1.5}>
              <Typography variant="h6">Template gallery</Typography>
              {templates.map((item) => (
                <Card
                  key={item.uuid}
                  variant={selectedTemplateUuid === item.uuid ? 'elevation' : 'outlined'}
                  onClick={() => setSelectedTemplateUuid(item.uuid)}
                  sx={{ cursor: 'pointer', borderRadius: 3, borderColor: selectedTemplateUuid === item.uuid ? 'primary.main' : 'divider' }}
                >
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography fontWeight={700}>{item.name}</Typography>
                      {item.isDefault ? <Chip size="small" color="primary" label="Default" /> : null}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{item.orientation} • {item.width}×{item.height} {item.unit}</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                      {(item.fields || []).slice(0, 4).map((field) => <Chip key={field.key} size="small" label={field.label || field.key} />)}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </CardContent></Card>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}><CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>Preview</Typography>
            {preview?.imageDataUrl ? <Box component="img" src={preview.imageDataUrl} alt="preview" sx={{ width: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 1 }} /> : <Alert severity="info">Choose a template and one record to preview.</Alert>}
            <Stack direction="row" spacing={1}>
              <Button disabled={!preview?.imageDataUrl} startIcon={<DownloadRoundedIcon />} variant="outlined" onClick={() => downloadDataUrl(preview.imageDataUrl, 'id-card.png')}>PNG</Button>
              <Button disabled={!preview?.pdfDataUrl} startIcon={<DownloadRoundedIcon />} variant="contained" onClick={() => downloadDataUrl(preview.pdfDataUrl, 'id-card.pdf')}>PDF</Button>
            </Stack>
          </CardContent></Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 2, borderRadius: 4 }}><CardContent>
            <Tabs value={sourceTab} onChange={(_, value) => setSourceTab(value)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 2 }}>
              <Tab value="database" label={`Database (${students.length})`} />
              <Tab value="excel" label={`Excel (${excelRows.length})`} />
              <Tab value="manual" label="Manual" />
            </Tabs>

            {sourceTab === 'database' ? (
              <Stack spacing={1.2}>
                <Alert severity="info">Select students from your live school database and generate cards in one shot.</Alert>
                <Grid container spacing={1.2}>{students.map((student) => {
                  const selected = selectedStudentUuids.includes(student.uuid);
                  return <Grid size={{ xs: 12, sm: 6 }} key={student.uuid}><Card onClick={() => setSelectedStudentUuids((prev) => selected ? prev.filter((id) => id !== student.uuid) : [...prev, student.uuid])} variant={selected ? 'elevation' : 'outlined'} sx={{ cursor: 'pointer', borderRadius: 3, borderColor: selected ? 'primary.main' : 'divider' }}><CardContent>
                    <Stack direction="row" justifyContent="space-between"><Typography fontWeight={700}>{[student.firstName, student.lastName].filter(Boolean).join(' ')}</Typography><Chip size="small" label={student.className || '-'} /></Stack>
                    <Typography variant="body2" color="text.secondary">Sec {student.section || '-'} • Roll {student.rollNumber || '-'}</Typography>
                    <Typography variant="body2" color="text.secondary">Adm No {student.admissionNo || '-'}</Typography>
                  </CardContent></Card></Grid>;
                })}</Grid>
              </Stack>
            ) : null}

            {sourceTab === 'excel' ? (
              <Stack spacing={1.2}>
                <Alert severity="success">Excel is mapped. Keep columns like studentName, className, section, rollNumber, admissionNo, mobileParent, photoUrl.</Alert>
                {excelRows.slice(0, 8).map((row, index) => (
                  <Card key={index} variant="outlined" sx={{ borderRadius: 3 }}><CardContent>
                    <Typography fontWeight={700}>{row.studentName || '-'}</Typography>
                    <Typography variant="body2" color="text.secondary">{row.className || '-'} • {row.section || '-'} • {row.rollNumber || '-'}</Typography>
                  </CardContent></Card>
                ))}
              </Stack>
            ) : null}

            {sourceTab === 'manual' ? (
              <Stack spacing={1.5}>
                {manualRows.map((row, index) => (
                  <Card key={index} variant="outlined" sx={{ borderRadius: 3 }}><CardContent>
                    <Grid container spacing={1.2}>
                      {fieldKeys.map((key) => <Grid key={key} size={{ xs: 12, sm: 6 }}><TextField fullWidth size="small" label={key} value={row[key] || ''} onChange={(e) => updateManualRow(index, key, e.target.value)} /></Grid>)}
                    </Grid>
                  </CardContent></Card>
                ))}
                <Button startIcon={<AddRoundedIcon />} onClick={() => setManualRows((prev) => [...prev, emptyManual])}>Add another manual row</Button>
              </Stack>
            ) : null}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
              <Button variant="contained" startIcon={<BadgeRoundedIcon />} disabled={!selectedTemplate || !activeRows.length} onClick={bulkGenerate}>Generate ID cards</Button>
              <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={fetchAll} disabled={loading}>Refresh saved cards</Button>
            </Stack>
          </CardContent></Card>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}><CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Generated cards</Typography>
            <Grid container spacing={1.2}>{records.map((record) => <Grid size={{ xs: 12, md: 6 }} key={record.uuid}><Card variant="outlined" sx={{ borderRadius: 3 }}><CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography fontWeight={700}>{record.data?.studentName || 'Unnamed student'}</Typography>
                  <Typography variant="body2" color="text.secondary">{record.data?.className || '-'} • {record.data?.section || '-'} • Roll {record.data?.rollNumber || '-'}</Typography>
                </Box>
                <Chip size="small" color={record.status === 'ready' ? 'success' : 'warning'} label={record.status} />
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap">
                <Button size="small" startIcon={<EditRoundedIcon />} onClick={() => generatePreview(record)}>Preview</Button>
                <Button size="small" startIcon={<DownloadRoundedIcon />} onClick={() => record.imageDataUrl && downloadDataUrl(record.imageDataUrl, `${record.data?.studentName || 'id-card'}.png`)} disabled={!record.imageDataUrl}>PNG</Button>
                <Button size="small" startIcon={<DownloadRoundedIcon />} onClick={() => record.pdfDataUrl && downloadDataUrl(record.pdfDataUrl, `${record.data?.studentName || 'id-card'}.pdf`)} disabled={!record.pdfDataUrl}>PDF</Button>
                <Button size="small" startIcon={<LinkRoundedIcon />} onClick={() => openShare(record)}>Share link</Button>
              </Stack>
            </CardContent></Card></Grid>)}</Grid>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Dialog open={templateDialog} onClose={() => setTemplateDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create ID card template</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField label="Template name" value={templateForm.name} onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))} />
            <TextField label="Title" value={templateForm.title} onChange={(e) => setTemplateForm((p) => ({ ...p, title: e.target.value }))} />
            <TextField label="Subtitle" value={templateForm.subtitle} onChange={(e) => setTemplateForm((p) => ({ ...p, subtitle: e.target.value }))} />
            <TextField label="Footer text" value={templateForm.footerText} onChange={(e) => setTemplateForm((p) => ({ ...p, footerText: e.target.value }))} />
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}><TextField select fullWidth label="Orientation" value={templateForm.orientation} onChange={(e) => setTemplateForm((p) => ({ ...p, orientation: e.target.value }))}><MenuItem value="portrait">Portrait</MenuItem><MenuItem value="landscape">Landscape</MenuItem></TextField></Grid>
              <Grid size={{ xs: 6 }}><TextField select fullWidth label="Photo shape" value={templateForm.photoShape} onChange={(e) => setTemplateForm((p) => ({ ...p, photoShape: e.target.value }))}><MenuItem value="rounded">Rounded</MenuItem><MenuItem value="rect">Rect</MenuItem><MenuItem value="circle">Circle</MenuItem></TextField></Grid>
              <Grid size={{ xs: 6 }}><TextField fullWidth type="number" label="Width (mm)" value={templateForm.width} onChange={(e) => setTemplateForm((p) => ({ ...p, width: Number(e.target.value) }))} /></Grid>
              <Grid size={{ xs: 6 }}><TextField fullWidth type="number" label="Height (mm)" value={templateForm.height} onChange={(e) => setTemplateForm((p) => ({ ...p, height: Number(e.target.value) }))} /></Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setTemplateDialog(false)}>Cancel</Button><Button variant="contained" onClick={createTemplate}>Save template</Button></DialogActions>
      </Dialog>

      <Dialog open={shareDialog.open} onClose={() => setShareDialog({ open: false, record: null, link: '' })} fullWidth maxWidth="sm">
        <DialogTitle>Prelogged edit link</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Alert severity="success">This link opens directly without login so a student, teacher, or parent can update missing photo/data from mobile.</Alert>
            <TextField fullWidth multiline minRows={3} value={shareDialog.link} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="outlined" onClick={() => navigator.clipboard.writeText(shareDialog.link)}>Copy link</Button>
              <Button variant="contained" startIcon={<WhatsAppIcon />} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Please complete your ID card details: ${shareDialog.link}`)}`, '_blank')}>Open WhatsApp</Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
