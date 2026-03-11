import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';

const GenericFormManager = ({ title, type }) => {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchForms = async () => {
        try {
            const token = localStorage.getItem('gymToken');
            const { data } = await axios.get(`/api/admin/forms/${type}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setForms(data);
        } catch (err) {
            console.error('Failed to fetch forms', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForms();

        // Auto-refresh every 5 seconds to show new form submissions immediately
        const intervalId = setInterval(() => {
            fetchFormsSilent();
        }, 5000);

        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);

    const fetchFormsSilent = async () => {
        try {
            const token = localStorage.getItem('gymToken');
            const { data } = await axios.get(`/api/admin/forms/${type}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setForms(data);
        } catch (err) {
            // Silently fail on background sync
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this submission?')) return;
        try {
            const token = localStorage.getItem('gymToken');
            await axios.delete(`/api/admin/forms/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchForms();
        } catch (err) {
            alert('Error deleting submission');
        }
    };

    const handleToggleStatus = async (form) => {
        try {
            const token = localStorage.getItem('gymToken');
            const newStatus = form.status === 'resolved' ? 'pending' : 'resolved';
            await axios.put(`/api/admin/forms/${form._id}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchForms();
        } catch (err) {
            alert('Error updating status');
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forms.map((form) => (
                    <div key={form._id} className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col relative ${form.status === 'resolved' ? 'border-green-200' : 'border-gray-100'}`}>
                        <div className="absolute top-4 right-4 flex space-x-2">
                            <button
                                onClick={() => handleToggleStatus(form)}
                                className={`text-xs px-2 py-1 rounded transition-colors ${form.status === 'resolved' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
                            >
                                {form.status === 'resolved' ? 'Resolved' : 'Mark Resolved'}
                            </button>
                            <button onClick={() => handleDelete(form._id)} className="text-gray-400 hover:text-red-500 transition">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1 pr-24">{form.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{form.email} • {form.phone}</p>

                        <div className="space-y-2 flex-1">
                            {form.service && <p className="text-sm"><strong>Service:</strong> {form.service}</p>}
                            {form.date && <p className="text-sm"><strong>Date:</strong> {form.date}</p>}
                            {form.rating && <p className="text-sm"><strong>Rating:</strong> {form.rating}/5</p>}
                            {form.message && (
                                <div className="text-sm bg-gray-50 p-3 rounded mt-2 border border-gray-100">
                                    <span className="font-semibold block mb-1">Message:</span>
                                    <p className="text-gray-700 whitespace-pre-wrap">{form.message}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                            Submitted: {new Date(form.createdAt).toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>
            {forms.length === 0 && <div className="p-8 text-center text-gray-500 bg-white rounded border">No submissions found.</div>}
        </div>
    );
};

export default GenericFormManager;
