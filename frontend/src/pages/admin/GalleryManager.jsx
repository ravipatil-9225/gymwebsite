import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import socket from '../../utils/socket';
import {
    Trash2, Edit, Plus, Image as ImageIcon, Zap, ArrowLeftRight,
    FolderOpen, Folder, FolderPlus, X, ChevronRight, Upload, Grid
} from 'lucide-react';

const TABS = [
    { key: 'gallery', label: 'Photo Gallery', icon: ImageIcon },
    { key: 'transformations', label: 'Transformations', icon: Zap },
];

/* ── Folder Pill ─────────────────────────────────────────── */
const FolderPill = ({ name, count, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
            active
                ? 'bg-primary text-white border-primary shadow-md shadow-primary/25'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary/40 hover:text-primary'
        }`}
    >
        {active ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
        {name}
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {count}
        </span>
    </button>
);

/* ── Create Folder Modal ─────────────────────────────────── */
const CreateFolderModal = ({ onClose, onCreate, existingFolders }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        if (existingFolders.map(f => f.toLowerCase()).includes(trimmed.toLowerCase())) {
            alert('A folder with this name already exists.');
            return;
        }
        onCreate(trimmed);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <FolderPlus className="w-5 h-5 text-primary" /> Create New Folder
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Folder Name</label>
                        <input
                            type="text"
                            autoFocus
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Gym Interior, Equipment, Events..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-gray-50 focus:bg-white transition-all"
                        />
                    </div>
                    {existingFolders.length > 0 && (
                        <div>
                            <p className="text-xs text-gray-400 font-semibold mb-2">Existing folders:</p>
                            <div className="flex flex-wrap gap-1.5">
                                {existingFolders.map(f => (
                                    <span key={f} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">{f}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 font-bold transition-colors">Cancel</button>
                        <button type="submit" className="flex-1 py-2.5 text-sm text-white bg-primary rounded-xl hover:bg-primary/90 font-black transition-all shadow-md shadow-primary/25">
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ── Upload Modal ─────────────────────────────────────────── */
const UploadModal = ({ folders, defaultFolder, onClose, onSubmit, editingImage }) => {
    const [form, setForm] = useState({
        title: editingImage?.title || '',
        folder: editingImage?.folder || defaultFolder || (folders[0] || 'General'),
        imageUrl: editingImage?.imageUrl || '',
        folderMode: 'existing', // 'existing' | 'new'
        newFolderName: '',
    });

    const effectiveFolder = form.folderMode === 'new' ? form.newFolderName : form.folder;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setForm(f => ({ ...f, imageUrl: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const folder = effectiveFolder.trim() || 'General';
        onSubmit({ title: form.title, folder, imageUrl: form.imageUrl });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-primary" />
                        {editingImage ? 'Edit Image' : 'Upload Image'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5">Title (Optional)</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="e.g. Main Training Floor"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none bg-gray-50 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Folder Selection */}
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Folder</label>
                        <div className="flex gap-2 mb-3">
                            <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, folderMode: 'existing' }))}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${form.folderMode === 'existing' ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/40'}`}
                            >
                                <Folder className="w-3.5 h-3.5 inline mr-1" /> Existing Folder
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm(f => ({ ...f, folderMode: 'new' }))}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${form.folderMode === 'new' ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/40'}`}
                            >
                                <FolderPlus className="w-3.5 h-3.5 inline mr-1" /> Create New
                            </button>
                        </div>

                        {form.folderMode === 'existing' ? (
                            folders.length > 0 ? (
                                <select
                                    value={form.folder}
                                    onChange={e => setForm(f => ({ ...f, folder: e.target.value }))}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none bg-gray-50 focus:bg-white transition-all"
                                >
                                    {folders.map(folder => (
                                        <option key={folder} value={folder}>{folder}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="text-xs text-orange-500 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 font-semibold">
                                    No folders yet — switch to "Create New" to make your first folder.
                                </div>
                            )
                        ) : (
                            <input
                                type="text"
                                required={form.folderMode === 'new'}
                                value={form.newFolderName}
                                onChange={e => setForm(f => ({ ...f, newFolderName: e.target.value }))}
                                placeholder="e.g. Gym Interior, Equipment, Events..."
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none bg-gray-50 focus:bg-white transition-all"
                            />
                        )}
                    </div>

                    {/* Image Upload */}
                    {!editingImage ? (
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5">Image File *</label>
                            <input required type="file" accept="image/*" onChange={handleFileChange}
                                className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all" />
                            {form.imageUrl && (
                                <div className="mt-2 h-28 rounded-xl overflow-hidden border border-gray-200">
                                    <img src={form.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <p className="text-xs text-gray-400 mb-2 font-semibold">Image cannot be changed. Delete and re-upload if needed.</p>
                            <div className="h-24 w-36 overflow-hidden rounded-xl border border-gray-200">
                                <img src={form.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 font-bold transition-colors">Cancel</button>
                        <button type="submit" className="flex-1 py-2.5 text-sm text-white bg-primary rounded-xl hover:bg-primary/90 font-black transition-all shadow-md shadow-primary/25">
                            {editingImage ? 'Update' : 'Upload'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ── Main GalleryManager ─────────────────────────────────── */
const GalleryManager = () => {
    const [activeTab, setActiveTab] = useState('gallery');

    // Gallery State
    const [images, setImages] = useState([]);
    const [loadingGallery, setLoadingGallery] = useState(true);
    const [activeFolder, setActiveFolder] = useState('All');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [editingImage, setEditingImage] = useState(null);
    // Extra folders created by admin (not yet containing images)
    const [extraFolders, setExtraFolders] = useState([]);

    // Transformations State
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

    // Derive unique folders from images + extraFolders
    const imageFolders = useMemo(() => {
        const set = new Set(images.map(img => img.folder || 'General'));
        return Array.from(set).sort();
    }, [images]);

    const allFolders = useMemo(() => {
        const set = new Set([...imageFolders, ...extraFolders]);
        return Array.from(set).sort();
    }, [imageFolders, extraFolders]);

    const filteredImages = useMemo(() => {
        if (activeFolder === 'All') return images;
        return images.filter(img => (img.folder || 'General') === activeFolder);
    }, [images, activeFolder]);

    const folderCounts = useMemo(() => {
        const map = {};
        images.forEach(img => {
            const f = img.folder || 'General';
            map[f] = (map[f] || 0) + 1;
        });
        return map;
    }, [images]);

    // ═══ Gallery CRUD ═══
    const fetchImages = async (silent = false) => {
        if (!silent) setLoadingGallery(true);
        try {
            const { data } = await axios.get('/api/admin/gallery', authHeader);
            setImages(data);
        } catch (err) { if (!silent) console.error('Failed to fetch gallery', err); }
        finally { setLoadingGallery(false); }
    };

    const handleDeleteGallery = async (id) => {
        if (!window.confirm('Delete this image?')) return;
        try {
            await axios.delete(`/api/admin/gallery/${id}`, authHeader);
            fetchImages();
        } catch { alert('Error deleting image'); }
    };

    const handleUploadSubmit = async ({ title, folder, imageUrl }) => {
        try {
            if (editingImage) {
                await axios.put(`/api/admin/gallery/${editingImage._id}`, { title, folder }, authHeader);
            } else {
                await axios.post('/api/admin/gallery', { title, folder, imageUrl }, authHeader);
            }
            setShowUploadModal(false);
            setEditingImage(null);
            fetchImages();
        } catch { alert(editingImage ? 'Error updating image' : 'Error uploading image'); }
    };

    const handleCreateFolder = (name) => {
        setExtraFolders(prev => [...new Set([...prev, name])]);
        setActiveFolder(name);
    };

    // ═══ Transformations CRUD ═══
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
        setTransformForm({ memberName: '', beforeImage: '', afterImage: '', duration: '', weightBefore: '', weightAfter: '', testimonial: '', programme: '' });
        setEditingTransformId(null);
        setShowTransformModal(true);
    };

    const closeTransformModal = () => {
        setShowTransformModal(false);
        setEditingTransformId(null);
        setTransformForm({ memberName: '', beforeImage: '', afterImage: '', duration: '', weightBefore: '', weightAfter: '', testimonial: '', programme: '' });
    };

    const handleTransformImageUpload = (field) => (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setTransformForm(prev => ({ ...prev, [field]: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        fetchImages();
        fetchTransformations();
        const onDbChange = () => { fetchImages(true); fetchTransformations(true); };
        socket.on('db_changed', onDbChange);
        return () => socket.off('db_changed', onDbChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

            {/* ════════════════════════════════════ */}
            {/* GALLERY TAB */}
            {/* ════════════════════════════════════ */}
            {activeTab === 'gallery' && (
                <>
                    {/* Header */}
                    <div className="flex flex-wrap justify-between items-center gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Gallery Management</h1>
                            <p className="text-sm text-gray-500 mt-0.5">{images.length} photos in {allFolders.length} folders</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowCreateFolderModal(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:border-primary/40 hover:text-primary transition-all bg-white"
                            >
                                <FolderPlus className="w-4 h-4" /> New Folder
                            </button>
                            <button
                                onClick={() => { setEditingImage(null); setShowUploadModal(true); }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/25"
                            >
                                <Upload className="w-4 h-4" /> Upload Image
                            </button>
                        </div>
                    </div>

                    {/* Folder Tabs */}
                    {allFolders.length > 0 && (
                        <div className="flex flex-wrap gap-2 items-center">
                            <FolderPill
                                name="All"
                                count={images.length}
                                active={activeFolder === 'All'}
                                onClick={() => setActiveFolder('All')}
                            />
                            {allFolders.map(folder => (
                                <FolderPill
                                    key={folder}
                                    name={folder}
                                    count={folderCounts[folder] || 0}
                                    active={activeFolder === folder}
                                    onClick={() => setActiveFolder(folder)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Active folder info bar */}
                    {activeFolder !== 'All' && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                            <FolderOpen className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-gray-700">{activeFolder}</span>
                            <ChevronRight className="w-4 h-4" />
                            <span>{filteredImages.length} photo{filteredImages.length !== 1 ? 's' : ''}</span>
                            <button
                                onClick={() => { setEditingImage(null); setShowUploadModal(true); }}
                                className="ml-auto flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add to this folder
                            </button>
                        </div>
                    )}

                    {loadingGallery ? (
                        <div className="p-8 text-gray-500">Loading gallery...</div>
                    ) : filteredImages.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-4 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                                <Grid className="w-8 h-8 text-gray-300" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-600">No images in {activeFolder === 'All' ? 'gallery' : `"${activeFolder}"`}</p>
                                <p className="text-sm text-gray-400 mt-1">Click "Upload Image" to add photos here.</p>
                            </div>
                            <button
                                onClick={() => { setEditingImage(null); setShowUploadModal(true); }}
                                className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
                            >
                                <Upload className="w-4 h-4" /> Upload Now
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredImages.map((img) => (
                                <div key={img._id} className="relative group bg-gray-100 rounded-xl overflow-hidden aspect-square shadow-sm hover:shadow-md transition-shadow">
                                    <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                        <p className="text-white text-sm font-bold truncate">{img.title || 'Untitled'}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                                                {img.folder || 'General'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => { setEditingImage(img); setShowUploadModal(true); }}
                                            className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteGallery(img._id)}
                                            className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Modals */}
                    {showCreateFolderModal && (
                        <CreateFolderModal
                            existingFolders={allFolders}
                            onClose={() => setShowCreateFolderModal(false)}
                            onCreate={handleCreateFolder}
                        />
                    )}
                    {showUploadModal && (
                        <UploadModal
                            folders={allFolders}
                            defaultFolder={activeFolder !== 'All' ? activeFolder : (allFolders[0] || 'General')}
                            editingImage={editingImage}
                            onClose={() => { setShowUploadModal(false); setEditingImage(null); }}
                            onSubmit={handleUploadSubmit}
                        />
                    )}
                </>
            )}

            {/* ════════════════════════════════════ */}
            {/* TRANSFORMATIONS TAB */}
            {/* ════════════════════════════════════ */}
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
                                        <div className="relative flex">
                                            <div className="w-1/2 aspect-[3/4] overflow-hidden relative">
                                                <img src={t.beforeImage} alt="Before" className="w-full h-full object-cover" />
                                                <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Before</span>
                                            </div>
                                            <div className="w-1/2 aspect-[3/4] overflow-hidden relative">
                                                <img src={t.afterImage} alt="After" className="w-full h-full object-cover" />
                                                <span className="absolute bottom-2 right-2 bg-primary/90 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">After</span>
                                            </div>
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center z-10">
                                                <ArrowLeftRight className="w-4 h-4 text-primary" />
                                            </div>
                                        </div>
                                        <div className="p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-gray-900 text-lg">{t.memberName}</h3>
                                                {!t.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Hidden</span>}
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                                {t.duration && <span className="bg-gray-100 px-2 py-1 rounded">⏱ {t.duration}</span>}
                                                {t.weightBefore && t.weightAfter && <span className="bg-green-50 text-green-700 px-2 py-1 rounded">⚖ {t.weightBefore} → {t.weightAfter}</span>}
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
                                            {transformForm.beforeImage && <div className="h-24 w-full overflow-hidden rounded border mb-2"><img src={transformForm.beforeImage} alt="Before preview" className="h-full w-full object-cover" /></div>}
                                            <input type="file" accept="image/*" onChange={handleTransformImageUpload('beforeImage')} required={!editingTransformId} className="w-full text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">After Image *</label>
                                            {transformForm.afterImage && <div className="h-24 w-full overflow-hidden rounded border mb-2"><img src={transformForm.afterImage} alt="After preview" className="h-full w-full object-cover" /></div>}
                                            <input type="file" accept="image/*" onChange={handleTransformImageUpload('afterImage')} required={!editingTransformId} className="w-full text-sm" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                                            <input type="text" placeholder="e.g. 3 Months" value={transformForm.duration} onChange={e => setTransformForm({ ...transformForm, duration: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Weight Before</label>
                                            <input type="text" placeholder="e.g. 95 kg" value={transformForm.weightBefore} onChange={e => setTransformForm({ ...transformForm, weightBefore: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Weight After</label>
                                            <input type="text" placeholder="e.g. 78 kg" value={transformForm.weightAfter} onChange={e => setTransformForm({ ...transformForm, weightAfter: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Programme / Plan</label>
                                        <input type="text" placeholder="e.g. Strength + Cardio" value={transformForm.programme} onChange={e => setTransformForm({ ...transformForm, programme: e.target.value })} className="w-full p-2 border border-gray-300 rounded" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial / Quote</label>
                                        <textarea placeholder="What the member said..." rows={3} value={transformForm.testimonial} onChange={e => setTransformForm({ ...transformForm, testimonial: e.target.value })} className="w-full p-2 border border-gray-300 rounded resize-none" />
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
