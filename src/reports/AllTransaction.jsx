import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BASE_URL from '../config';
import TopNavbar from '../Pages/topNavbar';
import Footer from '../Pages/footer';
import { FaWhatsapp, FaSortUp, FaSortDown } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
// import "jspdf-autotable"; // If using autotable plugin
import { formatDisplayDate } from '../utils/dateUtils';

const AllTransaction = () => {
    const [transactions, setTransactions] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [outstandingReport, setOutstandingReport] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const navigate = useNavigate();

    const TRANSACTION_API = `${BASE_URL}/api/transaction`;
    const CUSTOMER_API = `${BASE_URL}/api/customer`;

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await axios.get(TRANSACTION_API);
                setTransactions(res.data.result || []);
            } catch (err) {
                console.error('Transaction fetch error:', err);
            }
        };
        const fetchCustomers = async () => {
            try {
                const res = await axios.get(CUSTOMER_API);
                setCustomers(res.data.result || []);
            } catch (err) {
                console.error('Customer fetch error:', err);
            }
        };
        fetchTransactions();
        fetchCustomers();
    }, []);

    useEffect(() => {
        generateOutstandingReport();
    }, [transactions, customers]);

    // Generates outstanding balance per customer
    const generateOutstandingReport = () => {
        const report = customers.map(customer => {
            let debit = 0, credit = 0;
            transactions.forEach(tx => {
                (tx.Journal_entry || []).forEach(entry => {
                    if (entry.Account_id === customer.Customer_uuid) {
                        if (entry.Type === 'Debit') debit += entry.Amount || 0;
                        if (entry.Type === 'Credit') credit += entry.Amount || 0;
                    }
                });
            });
            return {
                uuid: customer.Customer_uuid,
                name: customer.Customer_name,
                mobile: customer.Mobile_number || 'No phone number',
                debit,
                credit,
                balance: credit - debit
            };
        });
        setOutstandingReport(report);
    };

    const sortedReport = [...outstandingReport]
        .filter(item => {
            if (filterType === 'receivable') return item.balance > 0;
            if (filterType === 'payable') return item.balance < 0;
            if (filterType === 'zero') return item.balance === 0 && (item.debit !== 0 || item.credit !== 0);
            return true;
        })
        .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sendMessageToAPI = async (name, phone, balance) => {
        const today = formatDisplayDate(new Date());
        const senderName = "YourBusinessName"; // Change to your org
        const message = `Dear ${name}, your balance is ₹${balance} as of ${today}. Please clear it soon. - ${senderName}`;

        try {
            const res = await fetch('https://misbackend-e078.onrender.com/usertask/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobile: phone,
                    userName: name,
                    type: 'customer',
                    message,
                }),
            });
            const result = await res.json();
            if (result.error) alert("Failed to send: " + result.error);
            else alert("Message sent successfully.");
        } catch (err) {
            alert("Failed to send message.");
        }
    };

    const sendWhatsApp = (name, phone, balance) => {
        if (phone === 'No phone number') {
            alert("No phone number available for this customer.");
            return;
        }
        const confirmation = window.confirm(
            `Are you sure you want to send a WhatsApp message to ${name}?\n\nMessage: "Dear ${name}, your balance is ₹${balance}."`
        );
        if (confirmation) sendMessageToAPI(name, phone, balance);
    };

    const viewTransactions = (customer) => {
        navigate('/allTransaction3', { state: { customer } });
    };

    // Export to Excel
    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(sortedReport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Outstanding Report');
        XLSX.writeFile(wb, 'outstanding_report.xlsx');
    };

    // Export to PDF
    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text('Outstanding Report', 14, 10);
        // If using jsPDF autotable, uncomment below:
        // doc.autoTable({
        //     head: [['Customer', 'Mobile', 'Amount']],
        //     body: sortedReport.map(item => [item.name, item.mobile, `₹${item.balance}`]),
        //     startY: 20,
        // });
        // For demo, just a list:
        sortedReport.forEach((item, i) => {
            doc.text(`${item.name}  ${item.mobile}  ₹${item.balance}`, 10, 20 + (i * 8));
        });
        doc.save('outstanding_report.pdf');
    };

    return (
        <>
            <div className="no-print">
                <TopNavbar />
            </div>
            <div className="pt-12 pb-20">
                <div className="mt-6 max-w-7xl mx-auto  p-4">
                    <div className="mb-4 flex gap-2">
                        <button onClick={exportToExcel} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Excel</button>
                        <button onClick={exportToPDF} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">PDF</button>
                    </div>
                    <h2 className="text-lg font-semibold mb-4 text-center text-green-700">Outstanding Report</h2>

                    {/* Search & Filter */}
                    <div className="mb-4 flex flex-col md:flex-row gap-3 md:items-center">
                        <input
                            type="text"
                            placeholder="Search customer name..."
                            className="flex-1 p-2 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => setFilterType('receivable')} className={`px-4 py-2 rounded ${filterType === 'receivable' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'} hover:bg-green-200`}>Receivable</button>
                            <button onClick={() => setFilterType('payable')} className={`px-4 py-2 rounded ${filterType === 'payable' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'} hover:bg-red-200`}>Payable</button>
                            <button onClick={() => setFilterType('zero')} className={`px-4 py-2 rounded ${filterType === 'zero' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'} hover:bg-blue-200`}>Zero</button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                    <table className="min-w-full table-auto text-sm border">
                        <thead className="bg-green-100 text-green-900">
                            <tr>
                                <th onClick={() => handleSort('name')} className="border px-3 py-2 cursor-pointer text-left">
                                    Customer {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />)}
                                </th>
                                <th onClick={() => handleSort('mobile')} className="border px-3 py-2 cursor-pointer text-left hidden md:table-cell">
                                    Mobile {sortConfig.key === 'mobile' && (sortConfig.direction === 'asc' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />)}
                                </th>
                                <th onClick={() => handleSort('balance')} className="border px-3 py-2 cursor-pointer text-right">
                                    Amount {sortConfig.key === 'balance' && (sortConfig.direction === 'asc' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />)}
                                </th>
                                <th className="border px-3 py-2 text-center"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedReport.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-6 text-gray-500">No customers found.</td>
                                </tr>
                            ) : (
                                sortedReport.map((item, index) => (
                                    <tr key={index} className="border-t hover:bg-gray-50">
                                        <td className="px-3 py-2 cursor-pointer text-green-600 truncate" onClick={() => viewTransactions(item)}>
                                            {item.name}
                                        </td>
                                        <td className="px-3 py-2 truncate hidden md:table-cell">{item.mobile}</td>
                                        <td className={`px-3 py-2 text-right ${item.balance < 0 ? 'text-red-600' : 'text-green-700'} truncate`}>
                                            ₹{Math.abs(item.balance)}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {item.mobile !== 'No phone number' && (
                                                <button onClick={() => sendWhatsApp(item.name, item.mobile, item.balance)}>
                                                    <FaWhatsapp className="text-green-600 text-lg" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default AllTransaction;
