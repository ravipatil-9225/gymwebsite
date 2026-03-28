const fs = require('fs');
const path = require('path');

// 1. Trainers.jsx
const tPath = 'd:\\GYM WEBSITE\\frontend\\src\\pages\\Trainers.jsx';
let tData = fs.readFileSync(tPath, 'utf8');
tData = tData.replace(
    `import React from 'react';`,
    `import React, { useState, useEffect } from 'react';\nimport axios from 'axios';\nimport socket from '../utils/socket';`
);
tData = tData.replace(
    /const trainersData = \[([\s\S]*?)\];\n\nconst Trainers = \(\) => {/,
    `const Trainers = () => {\n    const [trainersData, setTrainersData] = useState([]);\n    const [loading, setLoading] = useState(true);\n\n    useEffect(() => {\n        const fetchTrainers = async (isSilent = false) => {\n            try {\n                const { data } = await axios.get('/api/public/trainers');\n                const colors = [\n                    { c: '#E34A29', g: 'rgba(227,74,41,0.2)' },\n                    { c: '#4299e1', g: 'rgba(66,153,225,0.2)' },\n                    { c: '#a78bfa', g: 'rgba(167,139,250,0.2)' },\n                    { c: '#ed8936', g: 'rgba(237,137,54,0.2)' }\n                ];\n                setTrainersData(data.map((t, i) => ({\n                    id: t._id, name: t.name, role: t.specialization,\n                    image: t.photo || '', bio: t.description || t.experience || '',\n                    specialties: t.certifications ? t.certifications.split(',').map(s=>s.trim()) : [],\n                    social: { instagram: t.instagram || t.instagramId || '' },\n                    accentColor: colors[i % colors.length].c, accentGlow: colors[i % colors.length].g\n                })));\n            } catch (err) { console.error(err); } finally { if (!isSilent) setLoading(false); }\n        };\n        fetchTrainers();\n        const onDbChange = () => fetchTrainers(true);\n        socket.on('db_changed', onDbChange);\n        return () => socket.off('db_changed', onDbChange);\n    }, []);\n\n    if (loading && trainersData.length === 0) return <div className="min-h-[calc(100vh-80px)] bg-dark flex justify-center items-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;`
);
fs.writeFileSync(tPath, tData);

// 2. GalleryPage.jsx
const gPath = 'd:\\GYM WEBSITE\\frontend\\src\\pages\\GalleryPage.jsx';
let gData = fs.readFileSync(gPath, 'utf8');
gData = gData.replace(
    `import React, { useState, useEffect } from 'react';\nimport { motion`,
    `import React, { useState, useEffect } from 'react';\nimport axios from 'axios';\nimport socket from '../utils/socket';\nimport { motion`
);
gData = gData.replace(
    /const photos = \[([\s\S]*?)\];\n\nconst GalleryPage = \(\) => {\n    const \[lightboxIdx, setLightboxIdx\] = useState\(null\);/,
    `const GalleryPage = () => {\n    const [lightboxIdx, setLightboxIdx] = useState(null);\n    const [photos, setPhotos] = useState([]);\n\n    useEffect(() => {\n        const fetchGallery = async () => {\n            try {\n                const { data } = await axios.get('/api/public/gallery');\n                setPhotos(data.filter(g => g.isActive).map((g, i) => ({\n                    id: g._id || i, src: g.imageUrl, alt: g.title || 'Gym Facility', caption: g.title || g.category || 'Gym Facility'\n                })));\n            } catch(e) { console.error(e) }\n        };\n        fetchGallery();\n        socket.on('db_changed', fetchGallery);\n        return () => socket.off('db_changed', fetchGallery);\n    }, []);`
);
fs.writeFileSync(gPath, gData);

// 3. MembershipPlans.jsx
const pPath = 'd:\\GYM WEBSITE\\frontend\\src\\pages\\MembershipPlans.jsx';
let pData = fs.readFileSync(pPath, 'utf8');
pData = pData.replace(
    `import { Link } from 'react-router-dom';`,
    `import { Link } from 'react-router-dom';\nimport axios from 'axios';\nimport socket from '../utils/socket';`
);
pData = pData.replace(
    /const plans = \[([\s\S]*?)\];\n\nconst containerVariants/,
    `const containerVariants`
);
pData = pData.replace(
    /const \[upiCopied, setUpiCopied\] = useState\(false\);/,
    `const [upiCopied, setUpiCopied] = useState(false);\n    const [plans, setPlans] = useState([]);\n    const [loading, setLoading] = useState(true);\n\n    useEffect(() => {\n        const fetchPlans = async (isSilent = false) => {\n            try {\n                const { data } = await axios.get('/api/public/packages');\n                const styles = [\n                    { icon: <Target size={28} className="text-[#FFD700]" />, color: '#FFD700', popular: true, bestValue: false, trialTag: false, gradient: 'from-[#FFD700]/15 to-transparent', border: 'border-[#FFD700]/40 hover:border-[#FFD700]/70', badgeBg: 'bg-[#FFD700] text-black' },\n                    { icon: <Crown size={28} className="text-[#a78bfa]" />, color: '#a78bfa', popular: false, bestValue: true, trialTag: false, gradient: 'from-[#a78bfa]/15 to-transparent', border: 'border-[#a78bfa]/40 hover:border-[#a78bfa]/70', badgeBg: 'bg-[#a78bfa]' },\n                    { icon: <Dumbbell size={28} className="text-[#CD7F32]" />, color: '#CD7F32', popular: false, bestValue: false, trialTag: false, gradient: 'from-[#CD7F32]/15 to-transparent', border: 'hover:border-[#CD7F32]/50', badgeBg: 'bg-[#CD7F32]' },\n                    { icon: <Flame size={28} className="text-[#ff4b2b]" />, color: '#ff4b2b', popular: false, bestValue: false, trialTag: true, gradient: 'from-[#ff4b2b]/15 to-transparent', border: 'hover:border-[#ff4b2b]/50', badgeBg: 'bg-gradient-to-r from-[#ff4b2b] to-[#ff9068] text-white' },\n                    { icon: <Shield size={28} className="text-[#4299e1]" />, color: '#4299e1', popular: false, bestValue: false, trialTag: false, gradient: 'from-[#4299e1]/15 to-transparent', border: 'hover:border-[#4299e1]/50', badgeBg: 'bg-[#4299e1]' },\n                    { icon: <Zap size={28} className="text-[#ed8936]" />, color: '#ed8936', popular: false, bestValue: false, trialTag: false, gradient: 'from-[#ed8936]/15 to-transparent', border: 'hover:border-[#ed8936]/50', badgeBg: 'bg-[#ed8936]' },\n                    { icon: <Activity size={28} className="text-[#9e9e9e]" />, color: '#9e9e9e', popular: false, bestValue: false, trialTag: false, gradient: 'from-[#9e9e9e]/15 to-transparent', border: 'hover:border-[#9e9e9e]/50', badgeBg: 'bg-[#9e9e9e]' },\n                ];\n                setPlans(data.filter(p => p.isActive).map((p, idx) => {\n                    const st = styles[idx % styles.length];\n                    return {\n                        id: p._id, name: p.name, price: p.price.toString(), duration: p.duration, description: p.description,\n                        includes: p.features || [], icon: st.icon, accentColor: st.color, popular: st.popular, bestValue: st.bestValue, trialTag: st.trialTag,\n                        gradient: st.gradient, border: st.border, badgeBg: st.badgeBg,\n                    };\n                }));\n            } catch (err) { console.error(err); } finally { if (!isSilent) setLoading(false); }\n        };\n        fetchPlans();\n        const silentFetch = () => fetchPlans(true);\n        socket.on('db_changed', silentFetch);\n        return () => socket.off('db_changed', silentFetch);\n    }, []);\n`
);
fs.writeFileSync(pPath, pData);

console.log("SUCCESS");
