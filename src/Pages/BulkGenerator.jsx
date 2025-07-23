import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { fabric } from 'fabric';
import { jsPDF } from 'jspdf';
import BASE_URL from '../config';

const A4 = { width: 2480, height: 3508 };
const A3 = { width: 3508, height: 4961 };

const fillPlaceholders = (json, row) => {
  const data = JSON.parse(JSON.stringify(json));
  if (Array.isArray(data.objects)) {
    data.objects.forEach(obj => {
      if (obj.type === 'i-text' && typeof obj.text === 'string') {
        obj.text = obj.text.replace(/\{\{(.*?)\}\}/g, (_, key) => row[key] || '');
      }
      if (obj.type === 'image' && typeof obj.src === 'string') {
        const match = obj.src.match(/\{\{(.*?)\}\}/);
        if (match) {
          const url = row[match[1]];
          if (url) obj.src = url;
        }
      }
    });
  }
  return data;
};

const BulkGenerator = () => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [rows, setRows] = useState([]);
  const [index, setIndex] = useState(0);
  const [size, setSize] = useState('A4');
  const [custom, setCustom] = useState({ width: A4.width, height: A4.height });
  const [cols, setCols] = useState(2);
  const [rowsPerPage, setRowsPerPage] = useState(2);
  const [orientation, setOrientation] = useState('portrait');
  const [margins, setMargins] = useState({ left: 0, right: 0, top: 0 });
  const [spacing, setSpacing] = useState({ horizontal: 0, vertical: 0 });
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const c = new fabric.Canvas('bulk-canvas', {
      width: custom.width,
      height: custom.height,
      backgroundColor: '#fff',
    });
    canvasRef.current = c;
    setCanvas(c);
    return () => c.dispose();
  }, []);

  useEffect(() => {
    axios.get('https://canvaback.onrender.com/api/template/')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.result || [];
        setTemplates(data.map(t => ({ ...t, id: t._id })));
      })
      .catch(() => setTemplates([]));
  }, []);

  useEffect(() => {
    if (!canvas) return;
    const s = size === 'A4' ? A4 : size === 'A3' ? A3 : custom;
    canvas.setWidth(s.width);
    canvas.setHeight(s.height);
  }, [canvas, size, custom]);

  const loadCurrent = async () => {
    if (!canvas || !selected || !rows[index]) return;
    const { data } = await axios.get(`https://canvaback.onrender.com/api/template/${selected}`);
    const json = fillPlaceholders(data.canvasJson, rows[index]);
    canvas.loadFromJSON(json, () => canvas.renderAll());
  };

  useEffect(() => {
    loadCurrent();
  }, [selected, rows, index, canvas]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws);
      setRows(json);
      setIndex(0);
    };
    reader.readAsBinaryString(file);
  };

  const loadStudents = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/students`);
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setRows(data);
      setIndex(0);
    } catch (e) {
      console.error('Failed to load students', e);
    }
  };

  const downloadCurrent = () => {
    if (!canvas) return;
    const url = canvas.toDataURL({ format: 'png' });
    const a = document.createElement('a');
    a.href = url;
    a.download = `design_${index + 1}.png`;
    a.click();
  };

  const downloadAll = async () => {
    for (let i = 0; i < rows.length; i++) {
      const { data } = await axios.get(`https://canvaback.onrender.com/api/template/${selected}`);
      const json = fillPlaceholders(data.canvasJson, rows[i]);
      await new Promise(resolve => canvas.loadFromJSON(json, () => {
        canvas.renderAll();
        const url = canvas.toDataURL({ format: 'png' });
        const a = document.createElement('a');
        a.href = url;
        a.download = `design_${i + 1}.png`;
        a.click();
        setTimeout(resolve, 300);
      }));
    }
  };

  const downloadLayout = async (format) => {
    if (!canvas || !selected || rows.length === 0) return;
    const baseSize = size === 'A4' ? A4 : size === 'A3' ? A3 : custom;
    const pageSize = orientation === 'landscape'
      ? { width: baseSize.height, height: baseSize.width }
      : baseSize;

    const perPage = cols * rowsPerPage;
    const cellW = cardSize.width ||
      (pageSize.width - margins.left - margins.right - spacing.horizontal * (cols - 1)) / cols;
    const cellH = cardSize.height ||
      (pageSize.height - margins.top - spacing.vertical * (rowsPerPage - 1)) / rowsPerPage;

    const images = [];
    for (let i = 0; i < rows.length; i++) {
      const { data } = await axios.get(`https://canvaback.onrender.com/api/template/${selected}`);
      const json = fillPlaceholders(data.canvasJson, rows[i]);
      await new Promise(resolve =>
        canvas.loadFromJSON(json, () => {
          canvas.renderAll();
          const url = canvas.toDataURL({ format: format === 'jpg' ? 'jpeg' : 'png' });
          images.push(url);
          resolve();
        })
      );
    }

    if (format === 'pdf') {
      const pdf = new jsPDF({ orientation, unit: 'px', format: [pageSize.width, pageSize.height] });
      images.forEach((img, i) => {
        if (i && i % perPage === 0) pdf.addPage();
        const pos = i % perPage;
        const x = margins.left + (pos % cols) * (cellW + spacing.horizontal);
        const y = margins.top + Math.floor(pos / cols) * (cellH + spacing.vertical);
        pdf.addImage(img, 'PNG', x, y, cellW, cellH);
      });
      pdf.save('bulk_layout.pdf');
    } else {
      let pageIndex = 0;
      for (let i = 0; i < images.length; i += perPage) {
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = pageSize.width;
        pageCanvas.height = pageSize.height;
        const ctx = pageCanvas.getContext('2d');
        for (let j = 0; j < perPage && i + j < images.length; j++) {
          const pos = j;
          const imgSrc = images[i + j];
          await new Promise(res => {
            const img = new Image();
            img.onload = () => {
              const x = margins.left + (pos % cols) * (cellW + spacing.horizontal);
              const y = margins.top + Math.floor(pos / cols) * (cellH + spacing.vertical);
              ctx.drawImage(img, x, y, cellW, cellH);
              res();
            };
            img.src = imgSrc;
          });
        }
        const a = document.createElement('a');
        a.href = pageCanvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`);
        a.download = `page_${pageIndex + 1}.${format}`;
        a.click();
        pageIndex++;
      }
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-2">Bulk Generator</h1>

      <div className="flex flex-wrap gap-2 items-center">
        <select value={selected || ''} onChange={e => setSelected(e.target.value)} className="border p-2 rounded">
          <option value="">Select Template</option>
          {templates.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>

        <select value={size} onChange={e => setSize(e.target.value)} className="border p-2 rounded">
          <option value="A4">A4</option>
          <option value="A3">A3</option>
          <option value="custom">Custom</option>
        </select>

        <select value={orientation} onChange={e => setOrientation(e.target.value)} className="border p-2 rounded">
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>

        <input type="number" min={1} value={cols} onChange={e => setCols(Number(e.target.value) || 1)} className="border p-2 w-20 rounded" placeholder="Columns" />
        <input type="number" min={1} value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value) || 1)} className="border p-2 w-20 rounded" placeholder="Rows" />

        {size === 'custom' && (
          <>
            <input type="number" value={custom.width} onChange={e => setCustom({ ...custom, width: Number(e.target.value) })} className="border p-2 w-24" placeholder="Page Width" />
            <input type="number" value={custom.height} onChange={e => setCustom({ ...custom, height: Number(e.target.value) })} className="border p-2 w-24" placeholder="Page Height" />
          </>
        )}

        <input type="number" value={margins.left} onChange={e => setMargins({ ...margins, left: Number(e.target.value) })} className="border p-2 w-24" placeholder="Left Margin" />
        <input type="number" value={margins.right} onChange={e => setMargins({ ...margins, right: Number(e.target.value) })} className="border p-2 w-24" placeholder="Right Margin" />
        <input type="number" value={margins.top} onChange={e => setMargins({ ...margins, top: Number(e.target.value) })} className="border p-2 w-24" placeholder="Top Margin" />

        <input type="number" value={spacing.horizontal} onChange={e => setSpacing({ ...spacing, horizontal: Number(e.target.value) })} className="border p-2 w-24" placeholder="H Separation" />
        <input type="number" value={spacing.vertical} onChange={e => setSpacing({ ...spacing, vertical: Number(e.target.value) })} className="border p-2 w-24" placeholder="V Separation" />

        <input type="number" value={cardSize.width} onChange={e => setCardSize({ ...cardSize, width: Number(e.target.value) })} className="border p-2 w-24" placeholder="Card Width" />
        <input type="number" value={cardSize.height} onChange={e => setCardSize({ ...cardSize, height: Number(e.target.value) })} className="border p-2 w-24" placeholder="Card Height" />

        <input type="file" accept=".xlsx,.csv" onChange={handleFile} className="border p-2" />
        <button onClick={loadStudents} className="bg-blue-600 text-white px-3 py-2 rounded">Load Students</button>
      </div>

      {rows.length > 0 && (
        <div className="flex items-center gap-2 mt-4">
          <button onClick={() => setIndex(i => Math.max(i - 1, 0))} className="px-2 py-1 bg-gray-200 rounded">Prev</button>
          <span>{index + 1} / {rows.length}</span>
          <button onClick={() => setIndex(i => Math.min(i + 1, rows.length - 1))} className="px-2 py-1 bg-gray-200 rounded">Next</button>
          <button onClick={downloadCurrent} className="px-2 py-1 bg-green-600 text-white rounded">Download</button>
          <button onClick={downloadAll} className="px-2 py-1 bg-blue-600 text-white rounded">Export All</button>
          <button onClick={() => downloadLayout('pdf')} className="px-2 py-1 bg-purple-600 text-white rounded">Layout PDF</button>
          <button onClick={() => downloadLayout('png')} className="px-2 py-1 bg-purple-600 text-white rounded">Layout PNG</button>
          <button onClick={() => downloadLayout('jpg')} className="px-2 py-1 bg-purple-600 text-white rounded">Layout JPG</button>
        </div>
      )}

      <div className="mt-4 border inline-block">
        <canvas id="bulk-canvas" />
      </div>
    </div>
  );
};

export default BulkGenerator;
