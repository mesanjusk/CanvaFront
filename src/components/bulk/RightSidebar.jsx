import React from 'react';

const RightSidebar = ({ show, students }) => (
  <aside className={`bg-gray-50 w-64 p-4 overflow-y-auto space-y-2 ${show ? 'block' : 'hidden'} md:block`}>
    <h2 className="font-medium">Students</h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {students.map((student, idx) => (
        <div key={idx} className="p-2 bg-white rounded shadow text-center">
          <img
            src={student.photo?.[0] || 'https://via.placeholder.com/100?text=No+Photo'}
            alt={`${student.firstName} ${student.lastName}`}
            className="w-12 h-12 mx-auto rounded-full object-cover mb-1 border"
          />
          <p className="text-xs font-medium truncate">
            {student.firstName} {student.lastName}
          </p>
        </div>
      ))}
    </div>
  </aside>
);

export default RightSidebar;
