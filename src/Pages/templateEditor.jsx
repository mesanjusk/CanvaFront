import React, { useEffect, useRef } from "react";
import { fabric } from "fabric";
import axios from "axios";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import FrameSection from "../components/FrameSection";
import TemplateLayout from "../Pages/addTemplateLayout";

const TemplateEditor = ({ activeTemplateId }) => {
  const { id } = useParams();
  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);

  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#fff",
    });
    fabricCanvas.current = canvas;

    const fetchTemplate = async () => {
      try {
        const res = await axios.get(`https://canvaback.onrender.com/api/template/${id}`);
        const template = res.data;

        if (template?.canvasJson) {
          canvas.loadFromJSON(template.canvasJson, () => {
            canvas.renderAll();
          });
        }
      } catch (err) {
        console.error("Failed to fetch template", err);
        toast.error("Failed to load template");
      }
    };

    fetchTemplate();
    return () => canvas.dispose();
  }, [id]);

  // === Add Frame Shapes ===
  const addFrameSlot = (shape) => {
    let frame;
    switch (shape) {
      case "rect":
        frame = new fabric.Rect({ width: 150, height: 150, fill: "transparent", stroke: "black", strokeWidth: 2 });
        break;
      case "rounded":
        frame = new fabric.Rect({ width: 150, height: 150, rx: 20, ry: 20, fill: "transparent", stroke: "black", strokeWidth: 2 });
        break;
      case "circle":
        frame = new fabric.Circle({ radius: 75, fill: "transparent", stroke: "black", strokeWidth: 2 });
        break;
      case "triangle":
        frame = new fabric.Triangle({ width: 150, height: 150, fill: "transparent", stroke: "black", strokeWidth: 2 });
        break;
      case "hexagon":
        frame = new fabric.Polygon(
          [
            { x: 75, y: 0 }, { x: 150, y: 43 }, { x: 150, y: 110 },
            { x: 75, y: 150 }, { x: 0, y: 110 }, { x: 0, y: 43 }
          ],
          { fill: "transparent", stroke: "black", strokeWidth: 2 }
        );
        break;
      case "star":
        frame = new fabric.Polygon(
          [
            { x: 75, y: 0 }, { x: 90, y: 50 }, { x: 140, y: 50 },
            { x: 100, y: 80 }, { x: 115, y: 130 }, { x: 75, y: 100 },
            { x: 35, y: 130 }, { x: 50, y: 80 }, { x: 10, y: 50 }, { x: 60, y: 50 }
          ],
          { fill: "transparent", stroke: "black", strokeWidth: 2 }
        );
        break;
      case "heart":
        frame = new fabric.Path(
          "M 75 30 A 20 20 0 0 1 125 30 Q 125 60 75 100 Q 25 60 25 30 A 20 20 0 0 1 75 30 z",
          { fill: "transparent", stroke: "black", strokeWidth: 2 }
        );
        break;
      default:
        return;
    }

    frame.left = 100;
    frame.top = 100;
    frame.customId = "studentPhoto";
    frame.field = "studentPhoto";

    fabricCanvas.current.add(frame);
  };

  // === Add Student Name Text ===
  const addTextSlot = () => {
    const text = new fabric.Textbox("Student Name", {
      left: 300,
      top: 100,
      fontSize: 22,
      fill: "red",
    });
    text.customId = "studentName";
    text.field = "studentName";
    fabricCanvas.current.add(text);
  };

  return (
    <TemplateLayout
      canvas={fabricCanvas.current}
      activeTemplateId={activeTemplateId || id}
    >
      <div className="flex">
        {/* Canvas */}
        <canvas ref={canvasRef} className="border" />

        {/* Right Panel */}
        <div className="w-64 border-l">
          <FrameSection addFrameSlot={addFrameSlot} />
          <div className="p-3 space-y-2">
            <button
              onClick={addTextSlot}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded"
            >
              Add Text
            </button>
          </div>
        </div>
      </div>
    </TemplateLayout>
  );
};

export default TemplateEditor;
