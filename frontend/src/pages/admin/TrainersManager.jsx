import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, Edit, Plus, Image as ImageIcon } from 'lucide-react';

const TrainersManager = () => {
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', specialization: '', experience: '', certifications: '', photo: '' });

    const fetchTrainers = async () => {
        try {
            const token = localStorage.getItem('gymToken');
            const { data } = await axios.get('/api/admin/trainers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTrainers(data);
        } catch (err) {
            console.error('Failed to fetch trainers', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrainers();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this trainer?')) return;
        try {
            const token = localStorage.getItem('gymToken');
            await axios.delete(`/api/admin/trainers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTrainers();
        } catch (err) {
            alert('Error deleting trainer');
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('gymToken');
            if (editingId) {
                await axios.put(`/api/admin/trainers/${editingId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/admin/trainers', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            closeModal();
            fetchTrainers();
        } catch (err) {
            alert(editingId ? 'Error updating trainer' : 'Error creating trainer');
        }
    };

    const openEditModal = (trainer) => {
        setFormData({
            name: trainer.name,
            specialization: trainer.specialization,
            experience: trainer.experience || '',
            certifications: trainer.certifications || '',
            photo: trainer.photo || ''
        });
        setEditingId(trainer._id);
        setShowModal(true);
    };

    const openCreateModal = () => {
        setFormData({ name: '', specialization: '', experience: '', certifications: '', photo: '' });
        setEditingId(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({ name: '', specialization: '', experience: '', certifications: '', photo: '' });
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, photo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) return <div className="p-8">Loading trainers...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Trainers Management</h1>
                <button onClick={openCreateModal} className="bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-secondary transition">
                    <Plus className="w-4 h-4 mr-2" /> Add Trainer
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainers.map((trainer) => (
                    <div key={trainer._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="h-48 bg-gray-200 relative">
                            {trainer.photo ? (
                                <img src={trainer.photo} alt={trainer.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <ImageIcon className="w-12 h-12" />
                                </div>
                            )}
                        </div>
                        <div className="p-4 flex-1">
                            <h3 className="text-lg font-bold">{trainer.name}</h3>
                            <p className="text-sm text-brand-primary font-medium">{trainer.specialization}</p>
                            <p className="text-sm text-gray-500 mt-2"><strong>Exp:</strong> {trainer.experience}</p>
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end space-x-2">
                            <button onClick={() => openEditModal(trainer)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded">
                                <Edit className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDelete(trainer._id)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {trainers.length === 0 && <div className="p-8 text-center text-gray-500 bg-white rounded border">No trainers found</div>}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Trainer' : 'Add Trainer'}</h2>
                        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                            <input required type="text" placeholder="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />
                            <input required type="text" placeholder="Specialization (e.g. Weightlifting)" value={formData.specialization} onChange={e => setFormData({ ...formData, specialization: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />
                            <input type="text" placeholder="Experience (e.g. 5 Years)" value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />
                            <input type="text" placeholder="Certifications" value={formData.certifications} onChange={e => setFormData({ ...formData, certifications: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo (Base64)</label>
                                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full text-sm" />
                            </div>

                            {formData.photo && (
                                <div className="mt-2 h-20 w-20 overflow-hidden rounded border">
                                    <img src={formData.photo} alt="Preview" className="h-full w-full object-cover" />
                                </div>
                            )}

                            <div className="flex justify-end space-x-2 pt-4">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary">{editingId ? 'Update Trainer' : 'Save Trainer'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainersManager;
