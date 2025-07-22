import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';
import BASE_URL from '../config'; // adjust if needed

const WhatsAppAdminPage = () => {
    const [qr, setQr] = useState(null);
    const [status, setStatus] = useState('Not connected');
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [bulkNumbers, setBulkNumbers] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');

    const branding = JSON.parse(localStorage.getItem('branding'));
    const institute_uuid = branding?.uuid;

    useEffect(() => {
        if (!institute_uuid) {
            toast.error('Institute UUID not found. Please ensure you are logged in.');
            return;
        }
        const socket = io(BASE_URL);

        socket.emit('join', institute_uuid);

        socket.on('qr', qr => {
            setQr(qr);
            setStatus('Scan the QR using WhatsApp');
        });

        socket.on('ready', msg => {
            setQr(null);
            setStatus(msg);
            toast.success(msg);
        });

        socket.on('authenticated', msg => {
            setStatus(msg);
            toast.success(msg);
        });

        socket.on('auth_failure', msg => {
            setStatus(msg);
            toast.error(msg);
        });

        socket.on('disconnected', msg => {
            setStatus(msg);
            toast.error(msg);
        });

        return () => socket.disconnect();
    }, [institute_uuid]);

    const requestQr = async () => {
        if (!institute_uuid) {
            toast.error('Institute UUID not found.');
            return;
        }
        setLoading(true);
        try {
            await axios.get(`${BASE_URL}/api/whatsapp/qr`, {
                params: { institute_uuid }
            });
            toast.success('QR requested, watch below');
        } catch (error) {
            console.error(error);
            toast.error('Failed to request QR');
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!phone || !message) return toast.error('Phone and message required');
        if (!institute_uuid) return toast.error('Institute UUID not found.');
        try {
            await axios.post(`${BASE_URL}/api/whatsapp/send`, {
                to: phone,
                message,
                institute_uuid
            });
            toast.success('Message sent');
            setPhone('');
            setMessage('');
        } catch (error) {
            console.error(error);
            toast.error('Failed to send message');
        }
    };

    const scheduleBulkMessage = async () => {
        if (!bulkNumbers || !message || !scheduleTime) return toast.error('All fields required');
        if (!institute_uuid) return toast.error('Institute UUID not found.');
        try {
            const numbers = bulkNumbers.split(',').map(n => n.trim()).filter(Boolean);
            await axios.post(`${BASE_URL}/api/whatsapp/schedule`, {
                numbers,
                message,
                schedule: scheduleTime,
                institute_uuid
            });
            toast.success('Bulk message scheduled');
            setBulkNumbers('');
            setScheduleTime('');
            setMessage('');
        } catch (error) {
            console.error(error);
            toast.error('Failed to schedule');
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 space-y-4">
            <h1 className="text-2xl font-bold">📲 WhatsApp Admin Panel</h1>
            <p className="text-sm text-gray-600">Status: {status}</p>
            <button
                onClick={requestQr}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
            >
                {loading ? 'Requesting QR...' : 'Request QR'}
            </button>

            {qr && (
                <div className="mt-4">
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qr)}`}
                        alt="QR Code"
                        className="mx-auto"
                    />
                </div>
            )}

            <div className="mt-8 space-y-2">
                <h2 className="text-lg font-semibold">Send Test Message</h2>
                <input
                    type="text"
                    placeholder="Phone number with country code"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="border w-full p-2 rounded"
                />
                <textarea
                    placeholder="Message"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="border w-full p-2 rounded"
                />
                <button
                    onClick={sendMessage}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
                >
                    Send Message
                </button>
            </div>

            <div className="space-y-2 border-t pt-4 mt-6">
                <h2 className="text-lg font-semibold">Schedule/Bulk Send</h2>
                <textarea
                    placeholder="Comma separated numbers"
                    value={bulkNumbers}
                    onChange={e => setBulkNumbers(e.target.value)}
                    className="border w-full p-2 rounded"
                />
                <input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="border w-full p-2 rounded"
                />
                <textarea
                    placeholder="Message"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="border w-full p-2 rounded"
                />
                <button
                    onClick={scheduleBulkMessage}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 w-full"
                >
                    Schedule Bulk Message
                </button>
            </div>
        </div>
    );
};

export default WhatsAppAdminPage;
