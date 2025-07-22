import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const BASE_URL = 'https://socialbackend-iucy.onrender.com'; 

const Fees = () => {
  const location = useLocation();
  const filterBy = location.state?.filterBy;

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const fetchFees = async () => {
    const institute_uuid = localStorage.getItem('institute_uuid');
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-CA'); 
    console.log('Sending todayStr:', todayStr);


    try {
      const res = await fetch(
        `${BASE_URL}/api/fees?institute_uuid=${institute_uuid}&date=${todayStr}`
      );
      const data = await res.json();
      console.log('Fetched fees:', data);
      setFees(data || []);
    } catch (err) {
      console.error('Error fetching fees:', err);
    } finally {
      setLoading(false);
    }
  };

  
    fetchFees();
  
}, [filterBy]);


  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Today's Fees Collection</h2>
      {loading ? (
        <p>Loading...</p>
      ) : fees.length === 0 ? (
        <p>No fee collections today.</p>
      ) : (
        <div className="overflow-auto max-h-[70vh]">
          <table className="min-w-full table-auto border border-gray-300">
            <thead className="sticky top-0 bg-gray-100">
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">Student Name</th>
                <th className="border px-4 py-2">Admission ID</th>
                <th className="border px-4 py-2">Due Date</th>
                <th className="border px-4 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee, idx) =>
                fee.installmentPlan.map((plan, i) => (
                  <tr key={`${idx}-${i}`} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{fee.studentName}</td>
                    <td className="border px-4 py-2">{fee.admissionId}</td>
                    <td className="border px-4 py-2">{new Date(plan.dueDate).toLocaleDateString()}</td>
                    <td className="border px-4 py-2">₹{plan.amount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Fees;
