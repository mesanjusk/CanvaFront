import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// CSS to hide no-print elements on print
const style = `
@media print {
  .no-print { display: none !important; }
}
`;

const ReceiptModal = ({ data, institute = {}, onPrint, onClose }) => {
  const receiptRef = useRef();

  // Institute/branding details
  const INSTITUTE = {
    name: institute?.name || "",
    contact: institute?.contact || "",
    code: institute?.code || "",
    logo: '/mnt/data/mkcl.png',
  };

  // Data fields (fill with dummy if missing)
  const fields = {
    receiptDate: data?.receiptDate || "",
    receiptNumber: data?.receiptNumber || "",
    learnerName: data?.learnerName || "",
    learnerCode: data?.learnerCode || "",
    examEvent: data?.examEvent || "",
    courseName: data?.courseName || "",
    amount: data?.amount || "",
    amountWords: data?.amountWords || "",
    installmentPlan : data?.installmentPlan || []
  };

  // PDF download logic (hide .no-print elements during capture)
  const handleDownloadPDF = async () => {
    const elements = receiptRef.current.querySelectorAll('.no-print');
    elements.forEach(el => (el.style.display = 'none'));

    await new Promise((res) => setTimeout(res, 80));
    const input = receiptRef.current;
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      unit: 'pt',
      format: [420, 595],
    });
    const contentW = 420 - 72;
    const contentH = 595 - 72;
    pdf.addImage(imgData, 'PNG', 36, 36, contentW, contentH);
    pdf.save(`Receipt-${fields.receiptNumber}.pdf`);

    // Restore .no-print elements
    elements.forEach(el => (el.style.display = ''));
  };

  // Print logic
  const handlePrint = () => {
    window.print();
    if (onPrint) onPrint();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50 print:bg-white">
      {/* Inject CSS for print */}
      <style>{style}</style>
      <div
        ref={receiptRef}
        className="bg-white text-black rounded-lg shadow-xl relative"
        style={{
          width: "420pt", // ~5.8 in
          height: "450pt", // ~8.3 in
          margin: "auto",
          padding: "36pt", // 0.5 inch all sides
          fontFamily: "Inter, Segoe UI, Arial, sans-serif",
          boxSizing: "border-box",
          overflow: "auto"
        }}
      >
        {/* Header: Logo + Institute Info */}
        <div className="flex flex-row justify-between items-start mb-2">
          {/* Logo & tagline */}
          <div className="flex flex-col items-start" style={{ width: 130 }}>
            <img src={INSTITUTE.logo} alt="Logo" className="w-16 h-16 mb-1" />
            <div className="text-xs font-semibold text-yellow-800 leading-tight">{INSTITUTE.tagline}</div>
            <div className="text-xs text-gray-500">{INSTITUTE.website}</div>
          </div>
          {/* Institute right info */}
          <div className="flex-1 flex flex-col items-end gap-0">
            <div className="text-xs font-semibold text-gray-800">ALC Name - <span className="font-bold uppercase">{INSTITUTE.name}</span></div>
            <div className="text-xs font-semibold text-gray-800">ALC Contact Person - <span className="font-bold">{INSTITUTE.contact}</span></div>
            <div className="text-xs font-semibold text-gray-800">ALC Code - <span className="font-bold">{INSTITUTE.code}</span></div>
          </div>
        </div>

        <hr className="my-1 border-gray-200" />

        {/* Title Row */}
        <div className="flex flex-row justify-between items-center mt-2 mb-2">
          <div className="text-2xl font-bold tracking-wider">FEE RECEIPT</div>
          <div className="text-lg font-semibold">{fields.installment}</div>
        </div>

        {/* Receipt Info Row */}
        <div className="flex flex-row justify-between items-center text-xs mb-4">
          <div></div>
          <div>
            <span className="font-semibold">Receipt Date: </span>{fields.receiptDate}<br />
            <span className="font-semibold">Receipt Number: </span>{fields.receiptNumber}
          </div>
        </div>

        {/* Course Name */}
        <div className="mt-3 mb-2">
          <span className="text-lg font-semibold">Course Name:</span>
          <span className="text-lg font-bold">{fields.courseName}</span>
        </div>

        {/* Learner Info Block */}
        <div className="mb-3">
          <div><span className="font-semibold">Name of the Learner: </span>
            <span className="font-bold uppercase">{fields.learnerName}</span></div>
          <div><span className="font-semibold">Learner Code: </span>
            <span className="font-bold">{fields.learnerCode}</span></div>
          <div><span className="font-semibold">Examination Event: </span>
            <span className="font-bold">{fields.examEvent}</span></div>
        </div>

        {/* Amount Block */}
        <div className="bg-gray-100 rounded-md px-4 py-3 mb-3">
          <div className="text-base font-medium">Amount Received:</div>
          <div className="mt-1 font-bold">{fields.amountWords}</div>
          <div className="h-7"></div>
        </div>

        {/* Amount in Words */}
        <div className="bg-gray-100 rounded-md px-4 py-3 mb-2">
          <div className="text-base font-medium">Amount in Words:</div>
          <div className="mt-1 font-bold">{fields.amountWords}</div>
        </div>

         {/* Installment Block */}

         <div className="bg-gray-100 rounded-md px-4 py-3 mb-2">
          <div className="text-base font-medium">Installment:</div>
           <div className="overflow-x-auto">
           <table className="min-w-full border mt-2 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">#</th>
            <th className="border px-2 py-1">Due Date</th>
            <th className="border px-2 py-1">Amount</th>
          </tr>
        </thead>
        <tbody>
          {fields.installmentPlan.map(p => (
            <tr key={p.installmentNo}>
              <td className="border px-2 py-1 text-center truncate">{p.installmentNo}</td>
              <td className="border px-2 py-1 truncate">{new Date(p.dueDate).toLocaleDateString()}</td>
              <td className="border px-2 py-1 text-right truncate">{p.amount}</td>
            </tr>
          ))}
        </tbody>
        </table>
           </div>
         </div>

        {/* Actions (not shown on print or PDF) */}
        <div className="flex justify-center gap-4 mt-8 no-print">
          <button
            onClick={handlePrint}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded"
          >
            🖨 Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded"
          >
            ⬇ Download PDF
          </button>
          <button
            onClick={onClose}
            className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-4 py-2 rounded"
          >
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
