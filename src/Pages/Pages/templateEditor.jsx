// src/Pages/templateEditor.jsx
import React from "react";
import { useParams } from "react-router-dom";
import CanvasEditor from "../components/CanvasEditor";
import ErrorBoundary from "../components/ErrorBoundary";

/**
 * Backward-compatible wrapper.
 * We don't duplicate editor logic here; we simply reuse the main CanvasEditor.
 */
const TemplateEditor = () => {
  const { templateId } = useParams();
  return (
    <ErrorBoundary>
      <CanvasEditor templateId={templateId} />
    </ErrorBoundary>
  );
};

export default TemplateEditor;
