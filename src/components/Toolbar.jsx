import React from 'react';

const Toolbar = ({
  onAddText,
  onAddRect,
  onAddCircle,
  onAddImage,
  onBringToFront,
  onSendToBack,
  onDownload,
  onCropImage,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAlignTop,
  onAlignMiddle,
  onAlignBottom,
}) => (
  <div className="fixed bottom-0 left-0 right-0 bg-gray-200 p-2 flex overflow-x-auto gap-2 md:static md:w-24 md:flex-col">
    <button onClick={onAddText} className="p-2 bg-blue-500 text-white rounded text-xs whitespace-nowrap">Text</button>
    <button onClick={onAddRect} className="p-2 bg-blue-500 text-white rounded text-xs whitespace-nowrap">Rect</button>
    <button onClick={onAddCircle} className="p-2 bg-blue-500 text-white rounded text-xs whitespace-nowrap">Circle</button>
    <label className="p-2 bg-blue-500 text-white rounded text-xs text-center cursor-pointer whitespace-nowrap">
      Image
      <input type="file" className="hidden" onChange={onAddImage} />
    </label>
    <button onClick={onBringToFront} className="p-2 bg-blue-500 text-white rounded text-xs whitespace-nowrap">Front</button>
    <button onClick={onSendToBack} className="p-2 bg-blue-500 text-white rounded text-xs whitespace-nowrap">Back</button>
    <button onClick={onCropImage} className="p-2 bg-blue-500 text-white rounded text-xs whitespace-nowrap">Crop</button>
    <button onClick={onDownload} className="p-2 bg-green-500 text-white rounded text-xs whitespace-nowrap">Download</button>
    <div className="flex gap-1">
      <button onClick={onAlignLeft} className="p-2 bg-gray-500 text-white rounded text-xs whitespace-nowrap">L</button>
      <button onClick={onAlignCenter} className="p-2 bg-gray-500 text-white rounded text-xs whitespace-nowrap">C</button>
      <button onClick={onAlignRight} className="p-2 bg-gray-500 text-white rounded text-xs whitespace-nowrap">R</button>
      <button onClick={onAlignTop} className="p-2 bg-gray-500 text-white rounded text-xs whitespace-nowrap">T</button>
      <button onClick={onAlignMiddle} className="p-2 bg-gray-500 text-white rounded text-xs whitespace-nowrap">M</button>
      <button onClick={onAlignBottom} className="p-2 bg-gray-500 text-white rounded text-xs whitespace-nowrap">B</button>
    </div>
  </div>
);

export default Toolbar;
