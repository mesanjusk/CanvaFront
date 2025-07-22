import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LeadFormModal from '../components/leads/LeadFormModal';

const AddLead = () => {
  const [showModal, setShowModal] = useState(true);
  const navigate = useNavigate();
  const { username } = useParams();

  const handleClose = () => {
    setShowModal(false);
    navigate(`/${username}/leads`); // navigate back to leads page
  };

  if (!showModal) return null;

  return (
    <LeadFormModal
      onClose={handleClose}
      onSuccess={() => {
        // optional toast or refresh logic
      }}
      institute_uuid={localStorage.getItem('institute_uuid')} // pass institute_uuid correctly
    />
  );
};

export default AddLead;
