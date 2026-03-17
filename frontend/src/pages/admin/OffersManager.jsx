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
            image: offer.image || '',
            discount: offer.discount || '',
            expiryDate: offer.expiryDate ? offer.expiryDate.split('T')[0] : ''
        });
        setEditingId(offer._id);
        setShowModal(true);
    };

    const openCreateModal = () => {
        setFormData({ title: '', description: '', image: '', discount: '', expiryDate: '' });
        setEditingId(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ title: '', description: '', image: '', discount: '', expiryDate: '' });
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) return <div className="p-8">Loading offers...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Offers Management</h1>
                <button onClick={openCreateModal} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-primary-hover transition">
                    <Plus className="w-4 h-4 mr-2" /> Add Offer
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {offers.map((offer) => (
                    <div key={offer._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col relative">
                        {offer.image && (
                            <div className="h-40 w-full overflow-hidden bg-gray-100">
                                <img src={offer.image} alt={offer.title} className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="p-6 flex-1 pr-12">
                            <div className="absolute top-4 right-4 flex flex-col space-y-2">
                                <button onClick={() => openEditModal(offer)} className="p-1.5 text-gray-400 hover:text-blue-500 bg-gray-50 rounded-lg transition">
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(offer._id)} className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-50 rounded-lg transition">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{offer.title}</h3>
                            <p className="text-sm font-semibold text-primary mb-2 bg-primary bg-opacity-10 inline-block px-2 py-1 rounded">
                                {offer.discount}
                            </p>
                            <p className="text-sm text-gray-700 mb-4 line-clamp-2">{offer.description}</p>
                            <div className={`mt-auto text-xs font-semibold ${new Date(offer.expiryDate) < new Date() ? 'text-red-500' : 'text-green-500'}`}>
                                Valid Until: {new Date(offer.expiryDate).toLocaleDateString()}
                            </div>
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
                            <input required type="text" placeholder="Discount (e.g. 20% OFF or ₹500 OFF)" value={formData.discount} onChange={e => setFormData({ ...formData, discount: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />
                            <input required type="date" placeholder="Expiry Date" value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Image (Optional)</label>
                                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full text-sm" />
                            </div>

                            {formData.image && (
                                <div className="mt-2 h-20 w-32 overflow-hidden rounded border">
                                    <img src={formData.image} alt="Preview" className="h-full w-full object-cover" />
                                </div>
                            )}

                            <div className="flex justify-end space-x-2 pt-4">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover">{editingId ? 'Update Offer' : 'Save Offer'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OffersManager;
