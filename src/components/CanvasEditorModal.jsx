import React from 'react';
import Modal from './common/Modal';
import CanvasEditor from './CanvasEditor';

const CanvasEditorModal = ({ templateId, onClose, onSaved }) => (
  <Modal title="Edit Template" onClose={onClose}>
    <CanvasEditor templateId={templateId} onSaved={onSaved} />
  </Modal>
);

export default CanvasEditorModal;
