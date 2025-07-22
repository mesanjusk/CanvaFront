import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSortUp, FaSortDown } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import BASE_URL from '../config';
import { FaFileExcel, FaFilePdf } from "react-icons/fa";


const AllBalance = () => {
    const [transactions, setTransactions] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [outstandingReport, setOutstandingReport] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    const navigate = useNavigate();
    const institute_uuid = localStorage.getItem('institute_uuid');
    // ... rest as before

    const TRANSACTION_API = `${BASE_URL}/api/transaction/GetTransactionList`;
    const CUSTOMER_API = `${BASE_URL}/api/account/GetAccountList`;


    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await axios.get(TRANSACTION_API);
                setTransactions(
                    (res.data.result || []).filter(
                        t => t.institute_uuid === institute_uuid
                    )
                );
            } catch (err) {
                console.error('Transaction fetch error:', err);
            }
        };
        const fetchCustomers = async () => {
            try {
                const res = await axios.get(CUSTOMER_API);
                setCustomers(
                    (res.data.result || []).filter(
                        c => c.institute_uuid === institute_uuid
                    )
                );
            } catch (err) {
                console.error('Customer fetch error:', err);
            }
        };
        fetchTransactions();
        fetchCustomers();
    }, [institute_uuid]); // also add institute_uuid as dependency

    useEffect(() => {
        generateOutstandingReport();
    }, [transactions, customers]);

    // Generates outstanding balance per customer
    const generateOutstandingReport = () => {
        const report = customers.map(customer => {
            let debit = 0, credit = 0;

            transactions.forEach(tx => {
                (tx.Journal_entry || []).forEach(entry => {
                    if (entry.Account_id === customer.uuid) {

                        if (entry.Type === 'Debit') debit += Number(entry.Amount) || 0;
                        if (entry.Type === 'Credit') credit += Number(entry.Amount) || 0;
                    }
                });
            });

            return {
                uuid: customer.uuid,
                name: customer.Account_name,
                mobile: customer.Mobile_number || 'No phone number',
                debit,
                credit,
                balance: credit - debit,
            };
        });

        setOutstandingReport(report);
    };


    const sortedReport = [...outstandingReport]
        .filter(item => {
            // Show only non-zero balances (receivable or payable)
            if (filterType === 'receivable') return item.balance > 0;
            if (filterType === 'payable') return item.balance < 0;
            if (filterType === 'zero') return false; // don't show zero balance even if filter is zero
            // By default, skip zero balances
            return item.balance !== 0;
        })
        .filter(item => (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
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
            
            
                <div className="min-w-full overflow-x-auto pb-2">
                



                    {/* Search & Filter */}

                    <div className="flex items-center gap-2 mb-4 w-full">
                        <input
                            type="text"
                            placeholder="Search customer name..."
                            className="flex-1 p-2 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="flex gap-2 justify-start md:justify-end w-full md:w-auto">
                            <button
                                onClick={exportToExcel}
                                className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                                aria-label="Export to Excel"
                                title="Export to Excel"
                            >
                                <FaFileExcel className="text-xl mr-1" />
                                <span className="hidden sm:inline">Excel</span>
                            </button>
                            <button
                                onClick={exportToPDF}
                                className="flex items-center px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                                aria-label="Export to PDF"
                                title="Export to PDF"
                            >
                                <FaFilePdf className="text-xl mr-1" />
                                <span className="hidden sm:inline">PDF</span>
                            </button>
                        </div>
                    </div>


                    {/* Table */}
                    <table className="min-w-full table-auto text-sm border">
                        <thead className="bg-green-100 text-green-900">
                            <tr>
                                <th onClick={() => handleSort('name')} className="border px-3 py-2 cursor-pointer text-left">
                                    Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />)}
                                </th>
                                <th onClick={() => handleSort('mobile')} className="border px-3 py-2 cursor-pointer text-left hidden md:table-cell">
                                    Mobile {sortConfig.key === 'mobile' && (sortConfig.direction === 'asc' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />)}
                                </th>
                                <th className="border px-3 py-2 text-right">Receivable</th>
                                <th className="border px-3 py-2 text-right">Payable</th>
                                <th className="border px-3 py-2 text-center"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedReport.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-6 text-gray-500">No customers found.</td>
                                </tr>
                            ) : (
                                sortedReport.map((item, index) => (
                                    <tr key={index} className="border-t hover:bg-gray-50">
                                        <td className="px-3 py-2 cursor-pointer text-green-600 truncate" onClick={() => viewTransactions(item)}>
                                            {item.name}
                                        </td>
                                        <td className="px-3 py-2 truncate hidden md:table-cell">{item.mobile}</td>
                                        <td className="px-3 py-2 text-right text-green-700 truncate">
                                            {item.balance > 0 ? `₹${item.balance}` : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-red-600 truncate">
                                            {item.balance < 0 ? `₹${Math.abs(item.balance)}` : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-center"></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                </div>
            
        </>
    );
};

export default AllBalance;
