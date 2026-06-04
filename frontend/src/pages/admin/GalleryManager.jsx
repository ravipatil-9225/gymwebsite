import React, { useEffect, useState } from 'react';
import axios from 'axios';
import socket from '../../utils/socket';
import { Trash2, Edit, Plus, Image as ImageIcon, Zap, ArrowLeftRight } from 'lucide-react';

const TABS = [
    { key: 'gallery', label: 'Photo Gallery', icon: ImageIcon },
    { key: 'transformations', label: 'Transformations', icon: Zap },
];

const GalleryManager = () => {
    const [activeTab, setActiveTab] = useState('gallery');

    // ═══ Gallery State ═══
    const [images, setImages] = useState([]);
    const [loadingGallery, setLoadingGallery] = useState(true);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [editingGalleryId, setEditingGalleryId] = useState(null);
    const [galleryForm, setGalleryForm] = useState({ title: '', category: 'Gym', imageUrl: '' });

    // ═══ Transformations State ═══
    const [transformations, setTransformations] = useState([]);
    const [loadingTransformations, setLoadingTransformations] = useState(true);
    const [showTransformModal, setShowTransformModal] = useState(false);
    const [editingTransformId, setEditingTransformId] = useState(null);
    const [transformForm, setTransformForm] = useState({
        memberName: '', beforeImage: '', afterImage: '', duration: '',
        weightBefore: '', weightAfter: '', testimonial: '', programme: ''
    });

    const token = localStorage.getItem('adminToken');
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    // ═══════════════════════════════════════
    // GALLERY CRUD
    // ═══════════════════════════════════════
    const fetchImages = async (silent = false) => {
        if (!silent) setLoadingGallery(true);
        try {
            const { data } = await axios.get('/api/admin/gallery', authHeader);
            setImages(data);
        } catch (err) { if (!silent) console.error('Failed to fetch gallery', err); }
        finally { setLoadingGallery(false); }
    };

    const handleDeleteGallery = async (id) => {
        if (!window.confirm('Are you sure you want to delete this image?')) return;
        try {
            await axios.delete(`/api/admin/gallery/${id}`, authHeader);
            fetchImages();
        } catch { alert('Error deleting image'); }
    };

    const handleGallerySubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingGalleryId) {
                await axios.put(`/api/admin/gallery/${editingGalleryId}`, galleryForm, authHeader);
            } else {
                await axios.post('/api/admin/gallery', galleryForm, authHeader);
            }
            closeGalleryModal();
            fetchImages();
        } catch { alert(editingGalleryId ? 'Error updating image' : 'Error uploading image'); }
    };

    const openEditGallery = (img) => {
        setGalleryForm({ title: img.title || '', category: img.category || 'Gym', imageUrl: img.imageUrl });
        setEditingGalleryId(img._id);
        setShowGalleryModal(true);
    };

    const openCreateGallery = () => {
        setGalleryForm({ title: '', category: 'Gym', imageUrl: '' });
        setEditingGalleryId(null);
        setShowGalleryModal(true);
    };

    const closeGalleryModal = () => {
        setShowGalleryModal(false);
        setEditingGalleryId(null);
        setGalleryForm({ title: '', category: 'Gym', imageUrl: '' });
    };

    const handleGalleryPhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setGalleryForm({ ...galleryForm, imageUrl: reader.result });
            reader.readAsDataURL(file);
        }
    };

    // ═══════════════════════════════════════
    // TRANSFORMATIONS CRUD
    // ═══════════════════════════════════════
    const fetchTransformations = async (silent = false) => {
        if (!silent) setLoadingTransformations(true);
        try {
            const { data } = await axios.get('/api/admin/transformations', authHeader);
            setTransformations(data);
        } catch (err) { if (!silent) console.error('Failed to fetch transformations', err); }
        finally { setLoadingTransformations(false); }
    };

    const handleDeleteTransformation = async (id) => {
        if (!window.confirm('Delete this transformation?')) return;
        try {
            await axios.delete(`/api/admin/transformations/${id}`, authHeader);
            fetchTransformations();
        } catch { alert('Error deleting transformation'); }
    };

    const handleTransformSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTransformId) {
                await axios.put(`/api/admin/transformations/${editingTransformId}`, transformForm, authHeader);
            } else {
                await axios.post('/api/admin/transformations', transformForm, authHeader);
            }
            closeTransformModal();
            fetchTransformations();
        } catch { alert(editingTransformId ? 'Error updating transformation' : 'Error creating transformation'); }
    };

    const openEditTransform = (t) => {
        setTransformForm({
            memberName: t.memberName || '', beforeImage: t.beforeImage || '', afterImage: t.afterImage || '',
            duration: t.duration || '', weightBefore: t.weightBefore || '', weightAfter: t.weightAfter || '',
            testimonial: t.testimonial || '', programme: t.programme || ''
        });
        setEditingTransformId(t._id);
        setShowTransformModal(true);
    };

    const openCreateTransform = () => {
        setTransformForm({
            memberName: '', beforeImage: '', afterImage: '', duration: '',
            weightBefore: '', weightAfter: '', testimonial: '', programme: ''
        });
        setEditingTransformId(null);
        setShowTransformModal(true);
    };

    const closeTransformModal = () => {
        setShowTransformModal(false);
        setEditingTransformId(null);
        setTransformForm({
            memberName: '', beforeImage: '', afterImage: '', duration: '',
            weightBefore: '', weightAfter: '', testimonial: '', programme: ''
        });
    };

    const handleTransformImageUpload = (field) => (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setTransformForm(prev => ({ ...prev, [field]: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    // ═══ EFFECTS ═══
    useEffect(() => {
        fetchImages();
        fetchTransformations();
        const onDbChange = () => {
            fetchImages(true);
            fetchTransformations(true);
        };
        socket.on('db_changed', onDbChange);
        return () => socket.off('db_changed', onDbChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ═══ RENDER ═══
    return (
        <div className="space-y-6">
            {/* Tab Switcher */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-0">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold tracking-wide transition-all border-b-2 -mb-px ${
                                activeTab === tab.key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ═══════════════════════════════════════ */}
            {/* GALLERY TAB */}
            {/* ═══════════════════════════════════════ */}
            {activeTab === 'gallery' && (
                <>
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">Gallery Management</h1>
                        <button onClick={openCreateGallery} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-primary-hover transition">
                            <Plus className="w-4 h-4 mr-2" /> Upload Image
                        </button>
                    </div>

                    {loadingGallery ? (
                        <div className="p-8 text-gray-500">Loading gallery...</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {images.map((img) => (
                                    <div key={img._id} className="relative group bg-gray-100 rounded-xl overflow-hidden aspect-square">
                                        <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                            <p className="text-white text-sm font-bold truncate">{img.title || 'Untitled'}</p>
                                            <p className="text-gray-300 text-xs">{img.category}</p>
                                            <div className="absolute top-2 right-2 flex space-x-2">
                                                <button onClick={() => openEditGallery(img)} className="text-white bg-blue-500 hover:bg-blue-600 p-2 rounded-full transition">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteGallery(img._id)} className="text-white bg-red-500 hover:bg-red-600 p-2 rounded-full transition">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {images.length === 0 && <div className="p-8 text-center text-gray-500 bg-white rounded border">No images found</div>}
                        </>
                    )}

                    {/* Gallery Modal */}
                    {showGalleryModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                                <h2 className="text-xl font-bold mb-4">{editingGalleryId ? 'Edit Image' : 'Upload Image'}</h2>
                                <form onSubmit={handleGallerySubmit} className="space-y-4">
                                    <input type="text" placeholder="Title (Optional)" value={galleryForm.title} onChange={e => setGalleryForm({ ...galleryForm, title: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />
                                    <select value={galleryForm.category} onChange={e => setGalleryForm({ ...galleryForm, category: e.target.value })} className="w-full p-2 border border-gray-300 rounded">
                                        <option value="Gym">Gym</option>
                                        <option value="Workout">Workout</option>
                                        <option value="Events">Events</option>
                                    </select>

                                    {!editingGalleryId && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Image File</label>
                                            <input required type="file" accept="image/*" onChange={handleGalleryPhotoUpload} className="w-full text-sm" />
                                        </div>
                                    )}

                                    {editingGalleryId && (
                                        <div>
                                            <p className="text-sm text-gray-500 mb-2">Image cannot be changed during update. Delete and re-upload if needed.</p>
                                            <div className="h-20 w-32 overflow-hidden rounded border">
                                                <img src={galleryForm.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end space-x-2 pt-4">
                                        <button type="button" onClick={closeGalleryModal} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover">{editingGalleryId ? 'Update' : 'Upload'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ═══════════════════════════════════════ */}
            {/* TRANSFORMATIONS TAB */}
            {/* ═══════════════════════════════════════ */}
            {activeTab === 'transformations' && (
                <>
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">Transformations Management</h1>
                        <button onClick={openCreateTransform} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center hover:bg-primary-hover transition">
                            <Plus className="w-4 h-4 mr-2" /> Add Transformation
                        </button>
                    </div>

                    {loadingTransformations ? (
                        <div className="p-8 text-gray-500">Loading transformations...</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {transformations.map((t) => (
                                    <div key={t._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        {/* Before / After images */}
                                        <div className="relative flex">
                                            <div className="w-1/2 aspect-[3/4] overflow-hidden relative">
                                                <img src={t.beforeImage} alt="Before" className="w-full h-full object-cover" />
                                                <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Before</span>
                                            </div>
                                            <div className="w-1/2 aspect-[3/4] overflow-hidden relative">
                                                <img src={t.afterImage} alt="After" className="w-full h-full object-cover" />
                                                <span className="absolute bottom-2 right-2 bg-primary/90 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">After</span>
                                            </div>
                                            {/* Center arrow */}
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center z-10">
                                                <ArrowLeftRight className="w-4 h-4 text-primary" />
                                            </div>
                                        </div>
                                        {/* Details */}
                                        <div className="p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-gray-900 text-lg">{t.memberName}</h3>
                                                {!t.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Hidden</span>}
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                                {t.duration && <span className="bg-gray-100 px-2 py-1 rounded">⏱ {t.duration}</span>}
                                                {t.weightBefore && t.weightAfter && (
                                                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded">⚖ {t.weightBefore} → {t.weightAfter}</span>
                                                )}
                                                {t.programme && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">🏋️ {t.programme}</span>}
                                            </div>
                                            {t.testimonial && <p className="text-gray-500 text-sm italic line-clamp-2">"{t.testimonial}"</p>}
                                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                                <button onClick={() => openEditTransform(t)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition text-sm font-medium flex items-center gap-1">
                                                    <Edit className="w-3.5 h-3.5" /> Edit
                                                </button>
                                                <button onClick={() => handleDeleteTransformation(t._id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition text-sm font-medium flex items-center gap-1">
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {transformations.length === 0 && (
                                <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
                                    <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium">No transformations yet</p>
                                    <p className="text-gray-400 text-sm mt-1">Add your first member transformation to showcase results.</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Transformation Modal */}
                    {showTransformModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-8">
                                <h2 className="text-xl font-bold mb-4">{editingTransformId ? 'Edit Transformation' : 'Add Transformation'}</h2>
                                <form onSubmit={handleTransformSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Member Name *</label>
                                        <input type="text" required placeholder="e.g. Rahul Sharma" value={transformForm.memberName}
                                            onChange={e => setTransformForm({ ...transformForm, memberName: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Before Image *</label>
                                            {transformForm.beforeImage && (
                                                <div className="h-24 w-full overflow-hidden rounded border mb-2">
                                                    <img src={transformForm.beforeImage} alt="Before preview" className="h-full w-full object-cover" />
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" onChange={handleTransformImageUpload('beforeImage')}
                                                required={!editingTransformId} className="w-full text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">After Image *</label>
                                            {transformForm.afterImage && (
                                                <div className="h-24 w-full overflow-hidden rounded border mb-2">
                                                    <img src={transformForm.afterImage} alt="After preview" className="h-full w-full object-cover" />
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" onChange={handleTransformImageUpload('afterImage')}
                                                required={!editingTransformId} className="w-full text-sm" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                            <input type="text" placeholder="e.g. 3 Months" value={transformForm.duration}
                                                onChange={e => setTransformForm({ ...transformForm, duration: e.target.value })}
                                                className="w-full p-2 border border-gray-300 rounded" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Weight Before</label>
                                            <input type="text" placeholder="e.g. 95 kg" value={transformForm.weightBefore}
                                                onChange={e => setTransformForm({ ...transformForm, weightBefore: e.target.value })}
                                                className="w-full p-2 border border-gray-300 rounded" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Weight After</label>
                                            <input type="text" placeholder="e.g. 78 kg" value={transformForm.weightAfter}
                                                onChange={e => setTransformForm({ ...transformForm, weightAfter: e.target.value })}
                                                className="w-full p-2 border border-gray-300 rounded" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Programme / Plan</label>
                                        <input type="text" placeholder="e.g. Strength + Cardio" value={transformForm.programme}
                                            onChange={e => setTransformForm({ ...transformForm, programme: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial / Quote</label>
                                        <textarea placeholder="What the member said about their journey..." rows={3} value={transformForm.testimonial}
                                            onChange={e => setTransformForm({ ...transformForm, testimonial: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded resize-none" />
                                    </div>

                                    <div className="flex justify-end space-x-2 pt-4">
                                        <button type="button" onClick={closeTransformModal} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover">{editingTransformId ? 'Update' : 'Create'}</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default GalleryManager;
