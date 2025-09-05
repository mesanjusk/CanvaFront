import React from "react";

const FiltersSection = ({
  showFilters,
  setShowFilters,
  courses,
  batches,
  selectedCourse,
  setSelectedCourse,
  selectedBatch,
  setSelectedBatch,
  handleStudentSelect,
  bulkMode,
  filteredStudents,
  selectedStudent,
}) => (
  <div className="border-b">
    <button
      className="w-full text-left p-3 text-sm font-semibold"
      onClick={() => setShowFilters((v) => !v)}
    >
      Filters
    </button>
    {showFilters && (
      <div className="px-3 pb-3">
        <label className="block text-xs mb-1">Course</label>
        <select
          className="w-full border rounded px-2 py-1 mb-2"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="">Select course</option>
          {courses.map((c) => (
            <option key={c._id} value={c.Course_uuid}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="block text-xs mb-1">Batch</label>
        <select
          className="w-full border rounded px-2 py-1 mb-2"
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
        >
          <option value="">Select batch</option>
          {batches.map((b) => (
            <option key={b._id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>

        <label className="block text-xs mb-1">Student</label>
        <select
          className="w-full border rounded px-2 py-1"
          onChange={(e) => handleStudentSelect(e.target.value)}
          value={selectedStudent?.uuid || ""}
          disabled={bulkMode}
        >
          <option value="">Select a student</option>
          {filteredStudents.map((s) => (
            <option key={s.uuid} value={s.uuid}>
              {s.firstName} {s.lastName}
            </option>
          ))}
        </select>

        <div className="text-[11px] text-gray-500 mt-2">
          Bulk mode uses the filtered list above. Use Prev/Next or swipe on
          mobile.
        </div>
      </div>
    )}
  </div>
);

export default FiltersSection;

