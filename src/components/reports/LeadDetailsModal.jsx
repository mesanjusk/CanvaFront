import React from 'react';

const LeadDetailsModal = ({
  lead,
  receiptInfo,
  institute,
  onEdit,
  onManageBatch,
  onManageExam,
  onConfirm,
  onReceipt,
  onCertificate,
  onClose,
}) => {
  if (!lead) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 overflow-y-auto z-[60]">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-2 my-4 p-3 sm:p-6 overflow-y-auto max-h-screen">
        {/* Header: Name */}
        <div className="flex flex-col items-start mb-2">
          <h2 className="text-xl font-bold text-gray-900">
            {(lead.student?.firstName || lead.studentData?.firstName) || ''}{' '}
            {(lead.student?.lastName || lead.studentData?.lastName) || ''}
          </h2>
        </div>
        
        {/* Institute Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
          <div className="flex flex-col items-start w-full sm:w-auto">
            <img
              src={institute.logo}
              alt="Logo"
              className="w-14 h-14 object-contain rounded mb-1"
            />
            <div className="text-xs font-semibold text-yellow-800">{institute.tagline}</div>
            <div className="text-xs text-gray-500">{institute.website}</div>
          </div>
          <div className="flex flex-col items-start sm:items-end text-xs w-full sm:w-auto mt-2 sm:mt-0">
            <div>
              - <span className="font-bold uppercase">{institute.name}</span>
            </div>
            <div>
              <span className="font-bold">{institute.contact}</span>
            </div>
            <div>
              ALC Code - <span className="font-bold">{institute.code}</span>
            </div>
          </div>
        </div>

        <hr className="my-2 border-gray-200" />

        {/* Receipt Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs mb-2">
          <div />
          <div className="mt-1 sm:mt-0">
            <span className="font-semibold">Receipt Date: </span>
            {receiptInfo.receiptDate}
            <br />
            <span className="font-semibold">Receipt Number: </span>
            {receiptInfo.receiptNumber}
          </div>
        </div>

        <div className="mt-3 mb-2">
          <span className="font-semibold">Course Name:</span>
          <span className="font-bold"> {receiptInfo.courseName}</span>
        </div>

        <div className="mb-3 space-y-1">
          <div>
            <span className="font-semibold">Name of the Learner: </span>
            <span className="font-bold uppercase">{receiptInfo.learnerName}</span>
          </div>
          <div>
            <span className="font-semibold">Learner Code: </span>
            <span className="font-bold">{receiptInfo.learnerCode}</span>
          </div>
          <div>
            <span className="font-semibold">Examination Event: </span>
            <span className="font-bold">{receiptInfo.examEvent}</span>
          </div>
        </div>

        {/* Amount Section */}
        <div className="bg-gray-100 rounded px-3 py-2 mb-2">
          <div className="font-medium">Amount Received:</div>
          <div className="mt-1 font-bold">{receiptInfo.amountWords}</div>
        </div>
        <div className="bg-gray-100 rounded px-3 py-2 mb-2">
          <div className="font-medium">Amount in Words:</div>
          <div className="mt-1 font-bold">{receiptInfo.amountWords}</div>
        </div>

        {/* Installment Table */}
        <div className="bg-gray-100 rounded px-3 py-2 mb-2">
          <div className="font-medium mb-1">Installment:</div>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-xs">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border px-2 py-1">#</th>
                  <th className="border px-2 py-1">Due Date</th>
                  <th className="border px-2 py-1">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(receiptInfo.installmentPlan || []).map((p) => (
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

        {/* Actions - Stack on mobile */}
        <div className="flex flex-wrap gap-2 mt-3">
          <button onClick={() => onEdit(lead)} className="bg-yellow-500 text-white px-4 py-2 rounded text-sm w-full sm:w-auto">Edit</button>
          <button onClick={() => onManageBatch(lead)} className="bg-purple-600 text-white px-4 py-2 rounded text-sm w-full sm:w-auto">Batch</button>
          <button onClick={() => onManageExam(lead)} className="bg-pink-600 text-white px-4 py-2 rounded text-sm w-full sm:w-auto">Exam</button>
          <button onClick={() => onConfirm(lead)} className="bg-green-600 text-white px-4 py-2 rounded text-sm w-full sm:w-auto">Confirm</button>
          <button onClick={() => onReceipt(lead)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm w-full sm:w-auto">Download Receipt</button>
          <button onClick={() => onCertificate(lead)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm w-full sm:w-auto">Issue Certificate</button>
          <button onClick={onClose} className="bg-gray-400 text-white px-4 py-2 rounded text-sm w-full sm:w-auto">Close</button>
        </div>
      </div>
      
    </div>
  );
};

export default LeadDetailsModal;
