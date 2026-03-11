import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../../utils/socket';
import { Save, Loader } from 'lucide-react';

const CMSManager = () => {
    const [activeSection, setActiveSection] = useState('hero');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Store content for the active section
    const [contentData, setContentData] = useState({});

    // Define structure for each section to auto-generate form fields
    const sections = [
        {
            id: 'hero',
            name: 'Hero Section',
            fields: [
                { key: 'title', label: 'Main Headline', type: 'text' },
                { key: 'subtitle', label: 'Sub-headline', type: 'textarea' },
                { key: 'buttonText', label: 'Primary Button Text', type: 'text' }
            ]
        },
        {
            id: 'about',
            name: 'About Section',
            fields: [
                { key: 'heading', label: 'Section Heading', type: 'text' },
                { key: 'description', label: 'About Us Details', type: 'textarea' },
                { key: 'mission', label: 'Our Mission Statement', type: 'textarea' }
            ]
        },
        {
            id: 'footer',
            name: 'Footer & Contact',
            fields: [
                { key: 'address', label: 'Gym Address', type: 'textarea' },
                { key: 'phone', label: 'Contact Phone', type: 'text' },
                { key: 'email', label: 'Contact Email', type: 'text' },
                { key: 'copyright', label: 'Copyright Text', type: 'text' }
            ]
        }
    ];

    const fetchContentSilent = async () => {
        try {
            const token = localStorage.getItem('gymToken');
            const { data } = await axios.get(`/api/admin/content/${activeSection}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data && data.data) {
                setContentData(data.data);
            }
        } catch (err) { }
    };

    useEffect(() => {
        if (!saving) {
            fetchContent();
        }
        socket.on('db_changed', fetchContentSilent);
        return () => socket.off('db_changed', fetchContentSilent);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSection, saving]);

    const fetchContent = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('gymToken');
            const { data } = await axios.get(`/api/admin/content/${activeSection}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // data might return { data: { title: "..." } } based on backend
            // or return { data: {} } if nothing found
            setContentData(data?.data || {});
        } catch (err) {
            console.error('Failed to load content for section', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem('gymToken');
            await axios.put(`/api/admin/content/${activeSection}`, { data: contentData }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Content saved successfully. It will reflect automatically on the main website.');
        } catch (err) {
            console.error('Failed to save content', err);
            alert('Error saving content');
        } finally {
            setSaving(false);
        }
    };

    const handleFieldChange = (key, value) => {
        setContentData(prev => ({ ...prev, [key]: value }));
    };

    const activeConfig = sections.find(s => s.id === activeSection);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Content Management System</h1>

            <div className="flex flex-col md:flex-row gap-6">

                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-shrink-0">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
                        Content Areas
                    </div>
                    <ul className="divide-y divide-gray-100">
                        {sections.map(sec => (
                            <li key={sec.id}>
                                <button
                                    onClick={() => setActiveSection(sec.id)}
                                    className={`w-full text-left px-4 py-3 font-medium transition ${activeSection === sec.id
                                        ? 'bg-brand-primary bg-opacity-10 text-brand-primary border-l-4 border-brand-primary'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {sec.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Editor Area */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900">Editing: {activeConfig?.name}</h2>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center p-12 text-gray-500 space-x-2">
                                <Loader className="w-6 h-6 animate-spin" />
                                <span>Loading content...</span>
                            </div>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-6">
                                {activeConfig?.fields.map(field => (
                                    <div key={field.key}>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {field.label}
                                        </label>

                                        {field.type === 'textarea' ? (
                                            <textarea
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary outline-none text-gray-800"
                                                rows="4"
                                                value={contentData[field.key] || ''}
                                                onChange={e => handleFieldChange(field.key, e.target.value)}
                                                placeholder={`Enter ${field.label.toLowerCase()}...`}
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary outline-none text-gray-800"
                                                value={contentData[field.key] || ''}
                                                onChange={e => handleFieldChange(field.key, e.target.value)}
                                                placeholder={`Enter ${field.label.toLowerCase()}...`}
                                            />
                                        )}
                                    </div>
                                ))}

                                <div className="pt-6 border-t border-gray-100 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-brand-primary text-white px-6 py-3 rounded-lg flex items-center shadow shadow-brand-primary/30 hover:bg-brand-secondary transition disabled:opacity-50"
                                    >
                                        {saving ? <Loader className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                        {saving ? 'Saving...' : 'Publish Changes'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CMSManager;
