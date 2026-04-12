import DownloadIcon from '@mui/icons-material/Download';
import { Button, Grid, MenuItem, Stack, TextField } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import PageCard from '../components/PageCard';
import api from '../services/api';
import { renderCardHtml } from '../utils/renderCardHtml';

export default function IdCardsPage() {
  const [students, setStudents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const selectedStudent = useMemo(() => students.find((s) => s._id === selectedStudentId), [students, selectedStudentId]);
  const selectedTemplate = useMemo(() => templates.find((t) => t._id === selectedTemplateId), [templates, selectedTemplateId]);

  const load = async () => {
    const [{ data: s }, { data: t }, { data: r }] = await Promise.all([api.get('/api/students'), api.get('/api/templates'), api.get('/api/id-cards/records')]);
    setStudents(s.data);
    setTemplates(t.data);
    setRecords(r.data);
    if (!selectedStudentId && s.data[0]) setSelectedStudentId(s.data[0]._id);
    if (!selectedTemplateId && t.data[0]) setSelectedTemplateId(t.data[0]._id);
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    await api.post('/api/id-cards/generate', { studentIds: students.map((s) => s._id), templateId: selectedTemplateId });
    load();
  };

  const exportPdf = () => {
    if (!selectedStudent || !selectedTemplate) return;
    const pdf = new jsPDF({ unit: 'px', format: [selectedTemplate.width, selectedTemplate.height] });
    const html = renderCardHtml(selectedStudent, selectedTemplate);
    const temp = document.createElement('div');
    temp.innerHTML = html;
    document.body.appendChild(temp);
    pdf.html(temp.firstElementChild, {
      callback: (doc) => {
        doc.save(`${selectedStudent.fullName}-id-card.pdf`);
        document.body.removeChild(temp);
      },
      x: 0,
      y: 0,
      html2canvas: { scale: 1 },
    });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <PageCard title="Generate cards">
          <Stack spacing={2}>
            <TextField select label="Student" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
              {students.map((student) => <MenuItem key={student._id} value={student._id}>{student.fullName}</MenuItem>)}
            </TextField>
            <TextField select label="Template" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
              {templates.map((template) => <MenuItem key={template._id} value={template._id}>{template.name}</MenuItem>)}
            </TextField>
            <Button variant="contained" onClick={generate}>Generate all student card records</Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportPdf}>Export selected preview PDF</Button>
          </Stack>
        </PageCard>
      </Grid>
      <Grid item xs={12} md={4}>
        <PageCard title="Preview">
          {selectedStudent && selectedTemplate ? (
            <div dangerouslySetInnerHTML={{ __html: renderCardHtml(selectedStudent, selectedTemplate) }} />
          ) : 'No preview'}
        </PageCard>
      </Grid>
      <Grid item xs={12} md={4}>
        <PageCard title="Generated records">
          <Stack spacing={2}>
            {records.map((record) => (
              <PageCard key={record._id} title={record.studentId?.fullName || 'Student'}>
                {record.templateId?.name} · {record.status}
              </PageCard>
            ))}
          </Stack>
        </PageCard>
      </Grid>
    </Grid>
  );
}
