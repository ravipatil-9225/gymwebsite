import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, Plus, Image as ImageIcon } from 'lucide-react';

const GalleryManager = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', category: 'General', imageUrl: '' });

    const fetchImages = async () => {
        try {
            const token = localStorage.getItem('gymToken');
            const { data } = await axios.get('/api/admin/gallery', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setImages(data);
        } catch (err) {
            console.error('Failed to fetch gallery', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this image?')) return;
        try {
            const token = localStorage.getItem('gymToken');
            await axios.delete(`/api/admin/gallery/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchImages();
        } catch (err) {
            alert('Error deleting image');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('gymToken');
            await axios.post('/api/admin/gallery', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            setFormData({ title: '', category: 'General', imageUrl: '' });
            fetchImages();
        } catch (err) {
            alert('Error uploading image');
        }
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, imageUrl: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) return <div className="p-8">Loading gallery...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Gallery Management</h1>
                <button onClick={() => setShowModal(true)} className="bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-secondary transition">
                    <Plus className="w-4 h-4 mr-2" /> Upload Image
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img) => (
                    <div key={img._id} className="relative group bg-gray-100 rounded-xl overflow-hidden aspect-square">
                        <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                            <p className="text-white text-sm font-bold truncate">{img.title || 'Untitled'}</p>
                            <p className="text-gray-300 text-xs">{img.category}</p>
                            <button onClick={() => handleDelete(img._id)} className="absolute top-2 right-2 text-white bg-red-500 hover:bg-red-600 p-2 rounded-full transition">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {images.length === 0 && <div className="p-8 text-center text-gray-500 bg-white rounded border">No images found</div>}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Upload Image</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input type="text" placeholder="Title (Optional)" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />
                            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full p-2 border border-gray-300 rounded">
                                <option value="General">General</option>
                                <option value="Facilities">Facilities</option>
                                <option value="Classes">Classes</option>
                                <option value="Transformations">Transformations</option>
                            </select>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image File</label>
                                <input required type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full text-sm" />
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded hover:bg-brand-secondary">Upload</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GalleryManager;
