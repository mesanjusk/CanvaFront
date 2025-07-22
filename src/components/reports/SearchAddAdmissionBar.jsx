import React from 'react';

const SearchAddAdmissionBar = ({ search, setSearch, onAdd }) => (
  <div className="flex items-center gap-2 mb-4 w-full">
    <div className="relative flex-1">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or mobile"
        aria-label="Search admissions"
        className="border p-2 rounded w-full pr-8 focus:outline-none"
      />
      {search && (
        <button
          type="button"
          onClick={() => setSearch('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
        >
          {/* X (Clear) Icon, Tailwind only */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
            viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
    <button
      type="button"
      onClick={onAdd}
      aria-label="Add new admission"
      className="flex-shrink-0 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-lg font-bold transition"
    >
      +
    </button>
  </div>
);

export default SearchAddAdmissionBar;
