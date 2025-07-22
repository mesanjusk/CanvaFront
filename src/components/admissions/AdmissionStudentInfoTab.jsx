import React from 'react';

const AdmissionStudentInfoTab = ({ form, handleChange }) => (
  <>
    <input
      placeholder="First Name"
      value={form.firstName}
      onChange={handleChange('firstName')}
      className="border p-2"
      required
    />
    <input
      placeholder="Middle Name"
      value={form.middleName}
      onChange={handleChange('middleName')}
      className="border p-2"
    />
    <input
      placeholder="Last Name"
      value={form.lastName}
      onChange={handleChange('lastName')}
      className="border p-2"
    />
    <div className="flex items-center gap-4">
      <input
        type="date"
        value={form.dob?.substring(0, 10)}
        onChange={handleChange('dob')}
        className="border p-2 flex-1"
        required
      />
      <label className="text-sm font-medium">Date of Birth</label>
    </div>
    <div className="flex gap-4">
      <label>
        <input
          type="radio"
          name="gender"
          value="Male"
          checked={form.gender === 'Male'}
          onChange={handleChange('gender')}
        />
        {' '}Male
      </label>
      <label>
        <input
          type="radio"
          name="gender"
          value="Female"
          checked={form.gender === 'Female'}
          onChange={handleChange('gender')}
        />
        {' '}Female
      </label>
    </div>
    <input
      placeholder="Mobile (Self)"
      value={form.mobileSelf}
      onChange={handleChange('mobileSelf')}
      inputMode="numeric"
      pattern="[0-9]{10}"
      maxLength={10}
      className="border p-2"
    />
    <input
      placeholder="Mobile (Parent)"
      value={form.mobileParent}
      onChange={handleChange('mobileParent')}
      inputMode="numeric"
      pattern="[0-9]{10}"
      maxLength={10}
      className="border p-2"
    />
    <input
      placeholder="Address"
      value={form.address}
      onChange={handleChange('address')}
      className="border p-2"
    />
  </>
);

export default AdmissionStudentInfoTab;
