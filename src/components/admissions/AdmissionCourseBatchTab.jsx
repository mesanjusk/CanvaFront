
const AdmissionCourseBatchTab = ({ form, handleChange, courses, educations, exams, batches, setForm }) => (
  <>
    <select value={form.education} onChange={handleChange('education')} className="border p-2">
      <option value="">-- Select Education --</option>
      {educations.map(e => (
        <option key={e._id} value={e.education}>{e.education}</option>
      ))}
    </select>
    <select
      value={form.course}
      onChange={(e) => {
        const selectedCourse = courses.find(c => c.Course_uuid === e.target.value);
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
          balance,
        }));
      }}
      className="border p-2"
    >
      <option value="">-- Select Course --</option>
      {courses.map(c => (
        <option key={c._id} value={c.Course_uuid}>{c.name}</option>
      ))}
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
      {exams.map(e => (
        <option key={e._id} value={e.exam}>{e.exam}</option>
      ))}
    </select>
  </>
);

export default AdmissionCourseBatchTab;
