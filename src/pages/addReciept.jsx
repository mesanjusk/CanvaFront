import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from 'react-hot-toast';
import BASE_URL from '../config';

export default function AddReceipt() {
    const navigate = useNavigate();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [transactionDate, setTransactionDate] = useState('');
    const [accounts, setAccounts] = useState('');
    const [group, setGroup] = useState('');
    const [student, setStudent] = useState(null);
    const [allAccountOptions, setAllAccountOptions] = useState([]);
    const [accountOptions, setAccountOptions] = useState([]);
    const [paymentOptions, setPaymentOptions] = useState([]);
    const [loggedInUser, setLoggedInUser] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [whatsAppInfo, setWhatsAppInfo] = useState(null);
    const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
    const [loading, setLoading] = useState(false);

    const institute_uuid = localStorage.getItem("institute_uuid");

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.name) setLoggedInUser(user.name);
    }, []);

    useEffect(() => {
        axios.get(`${BASE_URL}/api/account/GetAccountList`)
            .then(res => {
                if (res.data.success) {
                    setAllAccountOptions(res.data.result);
                    const options = res.data.result.filter(item => item.Account_group === "ACCOUNT");
                    setAccountOptions(options);
                }
            }).catch(err => {
                toast.error("Error fetching accounts");
                console.error(err);
            });
    }, []);

    useEffect(() => {
        const fetchPaymentModes = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/api/account/GetAccountList`);
                const options = (res.data?.result || []).filter(
                    (item) =>
                        (item.Account_name === 'Bank' || item.Account_name === 'Cash') &&
                        item.institute_uuid === institute_uuid
                );
                setPaymentOptions(options);
            } catch (err) {
                toast.error('Failed to load payment modes');
                console.error('Payment mode fetch error:', err);
            }
        };
        fetchPaymentModes();
    }, [institute_uuid]);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setCustomerName(value);

        if (value) {
            const filtered = allAccountOptions.filter(option =>
                option.Account_name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredOptions(filtered);
            setShowOptions(true);
        } else {
            setShowOptions(false);
        }
    };

    const handleOptionClick = (option) => {
        setCustomerName(option.Account_name);
        setAccounts(option.uuid);
        setStudent(option);
        setShowOptions(false);
        setFilteredOptions([]);
    };

    const handleAmountChange = (e) => {
        setAmount(e.target.value.replace(/^0+/, ''));
    };

    async function submit(e) {
        e.preventDefault();

        if (!transactionDate) {
            toast.error("Select the date.");
            return;
        }
        if (!customerName || !accounts) {
            toast.error("Please select a customer.");
            return;
        }
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }
        if (!group) {
            toast.error("Select payment mode.");
            return;
        }

        setLoading(true);
        try {
            const Account = allAccountOptions.find(option => option.uuid === accounts);
            const Group = paymentOptions.find(option => option.uuid === group);
            const todayDate = new Date().toISOString().split("T")[0];

            const journal = [
                { Account_id: accounts, Type: 'Debit', Amount: Number(amount) },
                { Account_id: Group.account_uuid || group, Type: 'Credit', Amount: Number(amount) }
            ];

            const payload = {
                Description: description,
                Total_Credit: Number(amount),
                Total_Debit: Number(amount),
                Payment_mode: Group.uuid,
                Created_by: loggedInUser,
                Transaction_date: transactionDate || todayDate,
                Journal_entry: journal,
                institute_uuid,
            };

            const response = await axios.post(`${BASE_URL}/api/transaction/addTransaction`, payload);

            if (response.data.success) {
                toast.success("Receipt added successfully.");
                setWhatsAppInfo({
                    name: Account.Account_name,
                    phone: Account.Mobile_number,
                    amount,
                    date: transactionDate || todayDate,
                    mode: Group.Account_name,
                });
                setShowWhatsAppModal(true);
            } else {
                toast.error("Failed to add transaction");
            }
        } catch (e) {
            console.error("Error adding Transaction:", e);
            toast.error("Error occurred while submitting the form.");
        } finally {
            setLoading(false);
        }
    }

    const sendMessageToAPI = async () => {
        if (!whatsAppInfo || !whatsAppInfo.phone) {
            toast.error("Customer phone number is missing.");
            return;
        }
        setSendingWhatsApp(true);
        const { name, phone, amount, date, mode } = whatsAppInfo;
        const message = `Hello ${name}, we have received your payment of ₹${amount} on ${date} via ${mode}. Thank you!`;

        const payload = {
            mobile: phone,
            userName: name,
            type: 'customer',
            message: message,
        };
        try {
            const res = await fetch(`${BASE_URL}/api/institute/send-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to send message: ${errorText}`);
            }

            const result = await res.json();
            if (result.error) {
                toast.error("Failed to send: " + result.error);
            } else {
                toast.success("Message sent successfully.");
            }
            setShowWhatsAppModal(false);
            navigate("/dashboard");
        } catch (error) {
            console.error("Request failed:", error);
            toast.error("Failed to send message: " + error.message);
        } finally {
            setSendingWhatsApp(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50 z-[60]">
            <Toaster />
            <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg relative">
                {/* X close button */}
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-2xl font-bold p-2 rounded-full focus:outline-none"
                    onClick={() => navigate("/home")}
                    aria-label="Close"
                    title="Close"
                    type="button"
                >
                    ×
                </button>
                <h2 className="text-lg font-semibold mb-4 text-center">Add Receipt</h2>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block mb-1 font-medium">Date</label>
                        <input
                            type="date"
                            value={transactionDate}
                            onChange={e => setTransactionDate(e.target.value)}
                            className="border p-2 rounded w-full"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Customer</label>
                        <input
                            type="text"
                            placeholder="Search customer"
                            value={customerName}
                            onChange={handleInputChange}
                            onFocus={() => setShowOptions(true)}
                            className="border p-2 rounded w-full"
                            autoComplete="off"
                            required
                        />
                        {showOptions && filteredOptions.length > 0 && (
                            <ul className="border rounded bg-white mt-1 absolute w-full max-h-40 overflow-y-auto z-50">
                                {filteredOptions.map((option, index) => (
                                    <li
                                        key={option.uuid}
                                        className="px-3 py-2 hover:bg-gray-200 cursor-pointer"
                                        onClick={() => handleOptionClick(option)}
                                    >
                                        {option.Account_name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Amount</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="Amount"
                            className="border p-2 rounded w-full"
                            min="1"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Payment Mode</label>
                        <select
                            className="border p-2 rounded w-full"
                            value={group}
                            onChange={e => setGroup(e.target.value)}
                            required
                        >
                            <option value="">Select Payment</option>
                            {paymentOptions.map((g) => (
                                <option key={g.uuid} value={g.uuid}>
                                    {g.Account_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Description"
                            className="border p-2 rounded w-full"
                        />
                    </div>
                    {/* Centered Save Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold transition"
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </form>
            </div>
            {/* WhatsApp Confirmation Modal (unchanged) */}
            {showWhatsAppModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-40">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm relative animate-fadeIn">
                        <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl p-2 rounded-full focus:outline-none"
                            onClick={() => setShowWhatsAppModal(false)}
                            aria-label="Close Modal"
                        >
                            ×
                        </button>
                        <div className="flex flex-col items-center text-center">
                            <div className="text-green-600 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="inline h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.031-.967-.273-.099-.471-.148-.67.151-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.654-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.67-.51-.173-.007-.371-.009-.57-.009s-.521.074-.793.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.199 5.077 4.366.709.305 1.262.486 1.694.621.712.227 1.36.195 1.872.118.571-.085 1.758-.718 2.007-1.412.248-.694.248-1.289.173-1.412-.074-.124-.272-.198-.57-.347z" />
                                    <path d="M20.52 3.48C18.19 1.151 15.157 0 12.001 0 5.372 0 0 5.373 0 12c0 2.119.553 4.188 1.607 5.991L0 24l6.182-1.605C8.021 23.447 9.997 24 12.001 24c6.627 0 12-5.373 12-12 0-3.157-1.151-6.19-3.48-8.52zm-8.519 19.021c-1.783 0-3.534-.472-5.061-1.362l-.363-.214-3.672.954.982-3.583-.236-.368C2.133 15.858 1.613 13.956 1.613 12c0-5.729 4.658-10.388 10.387-10.388 2.778 0 5.388 1.082 7.345 3.041 1.958 1.958 3.04 4.567 3.04 7.345 0 5.729-4.659 10.388-10.388 10.388z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Send WhatsApp Message?</h3>
                            <p className="mb-4">
                                Do you want to send a WhatsApp receipt to <span className="font-bold">{whatsAppInfo?.name}</span>?
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium flex items-center justify-center"
                                    onClick={sendMessageToAPI}
                                    disabled={sendingWhatsApp}
                                >
                                    {sendingWhatsApp ? "Sending..." : "Send"}
                                </button>
                                <button
                                    className="flex-1 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium"
                                    onClick={() => {
                                        setShowWhatsAppModal(false);
                                        navigate("/dashboard");
                                    }}
                                    disabled={sendingWhatsApp}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
