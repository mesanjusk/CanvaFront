import React, { useRef, useState } from 'react';
import axios from 'axios';
import BASE_URL from '../config'; // Adjust the path based on your folder structure


const ImageUploader = () => {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);
  const [imageURL, setImageURL] = useState('');
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    const file = fileRef.current.files[0];
    if (!file) return alert("No file selected");

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post('${BASE_URL}/api/upload', formData, {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
          'Content-Type': 'multipart/form-data'
        }
      });
      setImageURL(res.data.url);
    } catch (err) {
      alert('Upload failed');
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Welcome to Post Generator</h1>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
      </div>
      <input type="file" ref={fileRef} onChange={handleFileChange} className="mb-2" />
      {preview && <img src={preview} alt="Preview" className="w-64 h-64 object-cover mb-2" />}
      <button onClick={handleUpload} className="bg-green-600 text-white px-4 py-2 rounded">Upload</button>
      {imageURL && (
        <p className="mt-2 text-sm text-green-700">
          Uploaded to: <a href={imageURL} className="underline" target="_blank" rel="noreferrer">{imageURL}</a>
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
