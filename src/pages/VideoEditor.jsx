import React, { useRef, useState, useEffect } from 'react';
import { fabric } from 'fabric';
import axios from 'axios';

const VideoEditor = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    const c = new fabric.Canvas('video-editor-canvas', {
      width: 640,
      height: 360,
      selection: false,
    });
    canvasRef.current = c;
    setCanvas(c);
    return () => c.dispose();
  }, []);

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
  };

  const addText = () => {
    if (!canvas) return;
    const text = new fabric.IText('Placeholder', {
      left: 50,
      top: 50,
      fill: '#fff',
      fontSize: 24,
    });
    canvas.add(text);
  };

  const addImage = (e) => {
    const file = e.target.files[0];
    if (!file || !canvas) return;
    const url = URL.createObjectURL(file);
    fabric.Image.fromURL(url, (img) => {
      img.set({ left: 50, top: 50 });
      canvas.add(img);
    });
  };

  const saveDesign = async () => {
    if (!canvas) return;
    const json = canvas.toJSON();
    try {
      const base = import.meta.env.VITE_BASE_URL || '';
      await axios.post(`${base}/api/video-design`, { data: json });
      alert('Saved!');
    } catch {
      alert('Save failed');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Video Editor (Prototype)</h1>
      <input type="file" accept="video/*" onChange={handleVideoUpload} />
      {videoUrl && (
        <div className="relative w-full max-w-3xl">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            width="640"
            height="360"
          />
          <canvas
            id="video-editor-canvas"
            className="absolute inset-0 pointer-events-none"
          />
        </div>
      )}
      <div className="space-x-2">
        <button onClick={addText} className="px-2 py-1 bg-blue-600 text-white rounded">Add Text</button>
        <label className="px-2 py-1 bg-blue-600 text-white rounded cursor-pointer">
          Add Image
          <input type="file" accept="image/*" onChange={addImage} className="hidden" />
        </label>
        <button onClick={saveDesign} className="px-2 py-1 bg-green-600 text-white rounded">Save</button>
      </div>
    </div>
  );
};

export default VideoEditor;
