import React from "react";

const EditorSidebar = ({ students, institutes, onStudentSelect, onInstituteSelect }) => (
  <aside className="w-full sm:w-60 border-r bg-white dark:bg-gray-800 p-4 space-y-6 overflow-y-auto sticky top-0 h-screen">
    <div>
      <label className="block mb-1 font-semibold">Select Student:</label>
      <select onChange={(e) => onStudentSelect(e.target.value)} className="w-full border rounded px-2 py-1">
        <option value="">Select a student</option>
        {students.map((student) => (
          <option key={student.uuid} value={student.uuid}>
            {student.firstName} {student.lastName}
          </option>
        ))}
      </select>
    </div>
    <div>
      <label className="block mb-1 font-semibold">Select Institute:</label>
      <select onChange={(e) => onInstituteSelect(e.target.value)} className="w-full border rounded px-2 py-1">
        <option value="">Select an institute</option>
        {(institutes || []).map((institute) => (
          <option key={institute.institute_uuid} value={institute.institute_uuid}>
            {institute.institute_title}
          </option>
        ))}
      </select>
    </div>
    <div>
      <h3 className="text-sm font-semibold mb-2">Tutorial</h3>
      <iframe
        className="w-full h-32 rounded"
        src="https://www.youtube.com/embed/dQw4w9WgXcQ"
        title="Tutorial Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  </aside>
);

export default EditorSidebar;
