import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, Edit, Plus } from 'lucide-react';
import socket from '../../utils/socket';

const PackagesManager = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', price: '', duration: '', features: '', isActive: true });

    const fetchPackages = async () => {
        try {
            const token = localStorage.getItem('gymToken');
            const { data } = await axios.get('/api/admin/packages', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPackages(data);
        } catch (err) {
            console.error('Failed to fetch packages', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPackagesSilent = async () => {
        try {
            const token = localStorage.getItem('gymToken');
            const { data } = await axios.get('/api/admin/packages', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPackages(data);
        } catch (err) { }
    };

    useEffect(() => {
        fetchPackages();
        socket.on('db_changed', fetchPackagesSilent);
        return () => socket.off('db_changed', fetchPackagesSilent);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this package?')) return;
        try {
            const token = localStorage.getItem('gymToken');
            await axios.delete(`/api/admin/packages/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPackages();
        } catch (err) {
            alert('Error deleting package');
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('gymToken');
            const payload = {
                ...formData,
                features: typeof formData.features === 'string'
                    ? formData.features.split(',').map(f => f.trim())
                    : formData.features
            };

            if (editingId) {
                await axios.put(`/api/admin/packages/${editingId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/admin/packages', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            closeModal();
            fetchPackages();
        } catch (err) {
            alert(editingId ? 'Error updating package' : 'Error creating package');
        }
    };

    const openEditModal = (pkg) => {
        setFormData({
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            duration: pkg.duration,
            features: pkg.features.join(', '),
            isActive: pkg.isActive !== undefined ? pkg.isActive : true
        });
        setEditingId(pkg._id);
        setShowModal(true);
    };

    const openCreateModal = () => {
        setFormData({ name: '', description: '', price: '', duration: '', features: '', isActive: true });
        setEditingId(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ name: '', description: '', price: '', duration: '', features: '', isActive: true });
    };

    if (loading) return <div className="p-8">Loading packages...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Packages Management</h1>
                <button onClick={openCreateModal} className="bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-secondary transition">
                    <Plus className="w-4 h-4 mr-2" /> Add Package
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-sm">
                                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Price (₹)</th>
                                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {packages.map((pkg) => (
                                <tr key={pkg._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{pkg.name}</td>
                                    <td className="px-6 py-4 text-gray-500">{pkg.price}</td>
                                    <td className="px-6 py-4 text-gray-500">{pkg.duration}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${pkg.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {pkg.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => openEditModal(pkg)} className="text-blue-500 hover:text-blue-700 mr-3">
                                            <Edit className="w-4 h-4 inline" />
                                        </button>
                                        <button onClick={() => handleDelete(pkg._id)} className="text-red-500 hover:text-red-700">
                                            <Trash2 className="w-4 h-4 inline" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {packages.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No packages found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Package' : 'Add Package'}</h2>
                        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                            <input required type="text" placeholder="Name (e.g. Hardcore)" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />
                            <input required type="text" placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />
                            <input required type="number" placeholder="Price (₹)" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />
                            <input required type="text" placeholder="Duration (e.g. 3 Months)" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />
                            <textarea placeholder="Features (comma separated)" value={formData.features} onChange={e => setFormData({ ...formData, features: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />
                            {editingId && (
                                <div className="flex items-center mt-2">
                                    <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="mr-2" />
                                    <label htmlFor="isActive">Active Package</label>
                                </div>
                            )}
                            <div className="flex justify-end space-x-2 pt-4">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary">{editingId ? 'Update Package' : 'Save Package'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PackagesManager;
