import React, { useEffect, useState } from 'react';
import axios from 'axios';
import socket from '../../utils/socket';
import { Trash2, Edit, Plus } from 'lucide-react';

const OffersManager = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ title: '', description: '', discountPercentage: '', validUntil: '' });

    const fetchOffers = async () => {
        try {
            const token = localStorage.getItem('gymToken');
            const { data } = await axios.get('/api/admin/offers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOffers(data);
        } catch (err) {
            console.error('Failed to fetch offers', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchOffersSilent = async () => {
        try {
            const token = localStorage.getItem('gymToken');
            const { data } = await axios.get('/api/admin/offers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOffers(data);
        } catch (err) { }
    };

    useEffect(() => {
        fetchOffers();
        socket.on('db_changed', fetchOffersSilent);
        return () => socket.off('db_changed', fetchOffersSilent);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this offer?')) return;
        try {
            const token = localStorage.getItem('gymToken');
            await axios.delete(`/api/admin/offers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchOffers();
        } catch (err) {
            alert('Error deleting offer');
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('gymToken');
            if (editingId) {
                await axios.put(`/api/admin/offers/${editingId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/admin/offers', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            closeModal();
            fetchOffers();
        } catch (err) {
            alert(editingId ? 'Error updating offer' : 'Error creating offer');
        }
    };

    const openEditModal = (offer) => {
        setFormData({
            title: offer.title,
            description: offer.description,
            discountPercentage: offer.discountPercentage,
            validUntil: offer.validUntil ? offer.validUntil.split('T')[0] : ''
        });
        setEditingId(offer._id);
        setShowModal(true);
    };

    const openCreateModal = () => {
        setFormData({ title: '', description: '', discountPercentage: '', validUntil: '' });
        setEditingId(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ title: '', description: '', discountPercentage: '', validUntil: '' });
    };

    if (loading) return <div className="p-8">Loading offers...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Offers Management</h1>
                <button onClick={openCreateModal} className="bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-secondary transition">
                    <Plus className="w-4 h-4 mr-2" /> Add Offer
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {offers.map((offer) => (
                    <div key={offer._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col relative w-full pr-12">
                        <div className="absolute top-4 right-4 flex space-x-2">
                            <button onClick={() => openEditModal(offer)} className="text-gray-400 hover:text-blue-500 transition">
                                <Edit className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDelete(offer._id)} className="text-gray-400 hover:text-red-500 transition">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{offer.title}</h3>
                        <p className="text-sm font-semibold text-brand-primary mb-2 bg-brand-primary bg-opacity-10 inline-block px-2 py-1 rounded">
                            {offer.discountPercentage}% OFF
                        </p>
                        <p className="text-sm text-gray-700 flex-1 mb-4">{offer.description}</p>
                        <div className={`text-xs font-semibold ${new Date(offer.validUntil) < new Date() ? 'text-red-500' : 'text-green-500'}`}>
                            Valid Until: {new Date(offer.validUntil).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>
            {offers.length === 0 && <div className="p-8 text-center text-gray-500 bg-white rounded border">No offers found</div>}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Offer' : 'Add Offer'}</h2>
                        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                            <input required type="text" placeholder="Offer Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />
                            <textarea required placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />
                            <input required type="number" placeholder="Discount Percentage (e.g. 20)" value={formData.discountPercentage} onChange={e => setFormData({ ...formData, discountPercentage: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />
                            <input required type="date" placeholder="Valid Until" value={formData.validUntil} onChange={e => setFormData({ ...formData, validUntil: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />

                            <div className="flex justify-end space-x-2 pt-4">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary">{editingId ? 'Update Offer' : 'Save Offer'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OffersManager;
