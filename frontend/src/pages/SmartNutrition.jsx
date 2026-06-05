import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Dumbbell, Utensils, Droplets, Moon, HeartPulse, Download, Loader2, Target, CalendarDays, ShieldAlert, Award } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const LOADING_STEPS = [
    { label: 'Scanning your biometric profile...', icon: '🧬', duration: 1500 },
    { label: 'Calculating caloric targets & macros...', icon: '⚡', duration: 2000 },
    { label: 'Designing your 7-day nutrition protocol...', icon: '🥗', duration: 3000 },
    { label: 'Building personalised workout split...', icon: '🏋️', duration: 3000 },
    { label: 'Applying safety & injury rules...', icon: '🛡️', duration: 2000 },
    { label: 'Computing hydration & sleep plan...', icon: '💧', duration: 2000 },
    { label: 'Finalising supplement guidance...', icon: '💊', duration: 1500 },
    { label: 'Running quality checks on blueprint...', icon: '✅', duration: 2000 },
];

const SmartNutrition = () => {
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const reportRef = useRef();
    const timerRef = useRef(null);
    const stepTimerRef = useRef(null);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            clearInterval(timerRef.current);
            clearTimeout(stepTimerRef.current);
        };
    }, []);

    const [formData, setFormData] = useState({
        name: '', age: '', gender: 'male', weight_kg: '', height_cm: '',
        goal: 'muscle_gain', activity_level: 'moderately_active',
        plan_type: 'diet',
        food_preference: 'non_vegetarian', cuisine_preference: 'Indian_first',
        allergies: '', medical_conditions: '', injuries: '',
        fitness_level: 'intermediate', preferred_workout_time: 'evening',
        equipment_available: 'full_gym', sleep_hours_actual: '7'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calculateMetrics = () => {
        const w = parseFloat(formData.weight_kg);
        const h = parseFloat(formData.height_cm);
        const a = parseInt(formData.age);
        if (!w || !h || !a) return null;

        const bmi = (w / ((h / 100) * (h / 100))).toFixed(1);
        let bmiCategory = 'normal';
        if (bmi < 18.5) bmiCategory = 'underweight';
        else if (bmi >= 25 && bmi < 30) bmiCategory = 'overweight';
        else if (bmi >= 30) bmiCategory = 'obese';

        const bmr = (10 * w) + (6.25 * h) - (5 * a) + (formData.gender === 'male' ? 5 : -161);
        let multiplier = 1.2;
        switch (formData.activity_level) {
            case 'lightly_active': multiplier = 1.375; break;
            case 'moderately_active': multiplier = 1.55; break;
            case 'very_active': multiplier = 1.725; break;
            case 'athlete': multiplier = 1.9; break;
            default: multiplier = 1.2;
        }
        let tdee = bmr * multiplier;

        let target_calories = Math.round(tdee);
        if (formData.goal === 'weight_loss') target_calories -= 500;
        else if (formData.goal === 'weight_gain' || formData.goal === 'muscle_gain') target_calories += 400;

        return {
            bmi: parseFloat(bmi),
            bmiCategory,
            target_calories
        };
    };

    const startLoadingAnimation = () => {
        setLoadingStep(0);
        setElapsed(0);

        // Elapsed timer
        timerRef.current = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);

        // Step progression
        let stepIndex = 0;
        const advanceStep = () => {
            if (stepIndex < LOADING_STEPS.length - 1) {
                stepIndex++;
                setLoadingStep(stepIndex);
                stepTimerRef.current = setTimeout(advanceStep, LOADING_STEPS[stepIndex].duration);
            }
        };
        stepTimerRef.current = setTimeout(advanceStep, LOADING_STEPS[0].duration);
    };

    const stopLoadingAnimation = () => {
        clearInterval(timerRef.current);
        clearTimeout(stepTimerRef.current);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResult(null);

        if (!formData.name || formData.name.trim().length === 0 || formData.name.length > 50) {
            setError("Name must be between 1 and 50 characters.");
            return;
        }

        const ageRaw = parseInt(formData.age);
        if (isNaN(ageRaw) || ageRaw < 10 || ageRaw > 100) {
            setError("Age must be between 10 and 100 years.");
            return;
        }

        const weightRaw = parseFloat(formData.weight_kg);
        if (isNaN(weightRaw) || weightRaw < 20 || weightRaw > 200) {
            setError("Weight must be between 20kg and 200kg.");
            return;
        }

        const heightRaw = parseFloat(formData.height_cm);
        if (isNaN(heightRaw) || heightRaw < 120 || heightRaw > 220) {
            setError("Height must be between 120cm and 220cm.");
            return;
        }

        const metrics = calculateMetrics();
        if (!metrics) {
            setError("Please fill in Weight, Height, and Age correctly.");
            return;
        }

        const payload = {
            ...formData,
            age: parseInt(formData.age),
            weight_kg: parseFloat(formData.weight_kg),
            height_cm: parseFloat(formData.height_cm),
            sleep_hours_actual: parseFloat(formData.sleep_hours_actual),
            allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
            medical_conditions: formData.medical_conditions ? formData.medical_conditions.split(',').map(s => s.trim()) : [],
            injuries: formData.injuries ? formData.injuries.split(',').map(s => s.trim()) : [],
            ...metrics
        };

        setLoading(true);
        startLoadingAnimation();
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/nutrition/generate', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                let errorMsg = "Failed to generate plan securely.";
                try {
                    const errorData = await res.json();
                    if (errorData.message) errorMsg = errorData.message;
                    if (errorData.error) errorMsg += " (" + errorData.error + ")";
                } catch (e) { }
                throw new Error(errorMsg);
            }

            const data = await res.json();
            setResult(data);
        } catch (err) {
            setError(err.message || 'An error occurred during AI generation.');
        } finally {
            setLoading(false);
            stopLoadingAnimation();
        }
    };

    const handleDownloadPDF = () => {
        const element = reportRef.current;
        const opt = {
            margin: [10, 10],
            filename: `${formData.name}_SmartNutrition_Plan.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#000000' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        // Add a temporary class to ensure it formats strictly for PDF if needed
        element.classList.add('pdf-mode');
        html2pdf().set(opt).from(element).save().then(() => {
            element.classList.remove('pdf-mode');
        });
    };

    const handleDownloadDoc = () => {
        const element = reportRef.current;
        const htmlSource = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; color: #000; background: #fff; padding: 20px; }
                    * { color: #000 !important; font-family: inherit; }
                    h1, h2, h3, h4, h5 { margin-top: 15px; margin-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #ccc; padding: 8px; }
                </style>
            </head>
            <body>
                ${element.innerHTML}
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff', htmlSource], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${formData.name}_SmartNutrition_Plan.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-[120px] pb-24 overflow-x-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen"></div>
                <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
                <div className="text-center mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-black heading-font tracking-tight mb-4 lowercase"
                    >
                        Smart<span className="text-primary italic">Nutrition</span> Hub
                    </motion.h1>
                    <p className="text-white/60 text-lg max-w-2xl mx-auto font-display">
                        Generate a highly personalized, medically aware 7-day Diet & Workout plan instantly using Elite AI.
                    </p>
                </div>

                {!result && !loading && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl">
                        <form onSubmit={handleSubmit} className="space-y-8">

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Name *</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} maxLength={50} required className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Age *</label>
                                    <input type="number" name="age" min="10" max="100" value={formData.age} onChange={handleChange} required className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="25" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Gender *</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none">
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Weight (kg) *</label>
                                    <input type="number" step="0.1" min="20" max="200" name="weight_kg" value={formData.weight_kg} onChange={handleChange} required className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="75" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Height (cm) *</label>
                                    <input type="number" step="0.1" min="120" max="220" name="height_cm" value={formData.height_cm} onChange={handleChange} required className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="175" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Primary Goal *</label>
                                    <select name="goal" value={formData.goal} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none">
                                        <option value="weight_loss">Weight Loss</option>
                                        <option value="weight_gain">Weight Gain</option>
                                        <option value="muscle_gain">Muscle Gain</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="endurance">Endurance</option>
                                        <option value="flexibility">Flexibility</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Activity Level *</label>
                                    <select name="activity_level" value={formData.activity_level} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none">
                                        <option value="sedentary">Sedentary (Office Job)</option>
                                        <option value="lightly_active">Lightly Active (1-3 days)</option>
                                        <option value="moderately_active">Moderately Active (3-5 days)</option>
                                        <option value="very_active">Very Active (6-7 days)</option>
                                        <option value="athlete">Athlete (2x a day)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Plan Type *</label>
                                    <select name="plan_type" value={formData.plan_type} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none">
                                        {/* <option value="both">Both (Diet & Workout)</option> */}
                                        <option value="diet">Diet Plan Only</option>
                                        <option value="workout">Workout Plan Only</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Fitness Level *</label>
                                    <select name="fitness_level" value={formData.fitness_level} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none">
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Food Preference *</label>
                                    <select name="food_preference" value={formData.food_preference} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none">
                                        <option value="non_vegetarian">Non-Vegetarian</option>
                                        <option value="vegetarian">Vegetarian</option>
                                        <option value="vegan">Vegan</option>
                                        <option value="eggetarian">Eggetarian</option>
                                        <option value="jain">Jain</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Cuisine *</label>
                                    <select name="cuisine_preference" value={formData.cuisine_preference} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none">
                                        <option value="Indian_first">Indian (Recommended)</option>
                                        <option value="global">Global</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Equipment Available *</label>
                                    <select name="equipment_available" value={formData.equipment_available} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none">
                                        <option value="full_gym">Full Gym Access</option>
                                        <option value="dumbbells">Dumbbells Only</option>
                                        <option value="resistance_bands">Resistance Bands</option>
                                        <option value="none">None (Bodyweight)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">Sleep (Hours) *</label>
                                    <input type="number" step="0.5" name="sleep_hours_actual" value={formData.sleep_hours_actual} onChange={handleChange} required className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none" placeholder="7" />
                                </div>
                            </div>

                            {/* Optional Fields */}
                            <div className="pt-4 border-t border-white/5 space-y-6">
                                <h3 className="text-sm font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-2"><ShieldAlert size={16} /> Medical & Safety (Optional)</h3>

                                <div>
                                    <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Allergies (comma separated)</label>
                                    <input type="text" name="allergies" value={formData.allergies} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm text-white/80 focus:border-primary outline-none" placeholder="e.g. peanuts, lactose, shellfish" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Medical Conditions (comma separated)</label>
                                    <input type="text" name="medical_conditions" value={formData.medical_conditions} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm text-white/80 focus:border-primary outline-none" placeholder="e.g. diabetes, pcos, hypertension" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Active Injuries (comma separated)</label>
                                    <input type="text" name="injuries" value={formData.injuries} onChange={handleChange} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-4 py-3 text-sm text-white/80 focus:border-primary outline-none" placeholder="e.g. left knee, lower back, right shoulder" />
                                </div>
                            </div>

                            {error && <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-sm text-center">{error}</div>}

                            <button type="submit" disabled={loading} className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-black text-sm uppercase tracking-[0.2em] rounded-lg transition-all shadow-[0_0_20px_rgba(227,74,41,0.3)] hover:shadow-[0_0_30px_rgba(227,74,41,0.5)]">
                                Generate Blueprint
                            </button>
                        </form>
                    </motion.div>
                )}

                {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 flex flex-col items-center justify-center space-y-10 text-center">
                        {/* Pulsing ring */}
                        <div className="relative">
                            <div className="w-28 h-28 rounded-full border-4 border-primary/20 flex items-center justify-center">
                                <div className="w-20 h-20 rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin"></div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center text-4xl">
                                {LOADING_STEPS[loadingStep]?.icon}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-2xl font-black font-display text-white tracking-widest uppercase">Building Your Blueprint</h2>
                            <motion.p key={loadingStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-primary font-bold text-sm tracking-wider">
                                {LOADING_STEPS[loadingStep]?.label}
                            </motion.p>
                            <p className="text-white/30 text-xs">⏱ {elapsed}s elapsed — AI is generating your full 7-day plan</p>
                        </div>

                        {/* Progress steps */}
                        <div className="w-full max-w-md space-y-2">
                            {LOADING_STEPS.map((step, i) => (
                                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-xs transition-all duration-500 ${i < loadingStep ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                            i === loadingStep ? 'bg-primary/10 text-primary border border-primary/30 scale-[1.02]' :
                                                'bg-white/3 text-white/20 border border-white/5'
                                        }`}
                                >
                                    <span className="text-base">{i < loadingStep ? '✓' : step.icon}</span>
                                    <span className={`font-${i === loadingStep ? 'bold' : 'normal'} tracking-wide`}>{step.label}</span>
                                    {i === loadingStep && <Loader2 size={12} className="ml-auto animate-spin text-primary" />}
                                    {i < loadingStep && <span className="ml-auto text-green-400">Done</span>}
                                </motion.div>
                            ))}
                        </div>

                        <p className="text-white/20 text-[11px] max-w-sm">This usually takes 10–20 seconds. AI is generating your comprehensive, medically-aware personalised plan at lightning speed.</p>
                    </motion.div>
                )}

                {result && !loading && (() => {
                    // Safe helpers to prevent crashes on missing AI fields
                    const meta = result.planMeta || {};
                    const macros = result.macroTargets || {};
                    const dietPlan = Array.isArray(result.dietPlan) ? result.dietPlan : [];
                    const workoutPlan = Array.isArray(result.workoutPlan) ? result.workoutPlan : [];

                    return (
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            {/* Header bar */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
                                <div>
                                    <h2 className="text-2xl font-black heading-font text-white uppercase tracking-wider">Plan Generated ✓</h2>
                                    <p className="text-white/60 text-sm font-display mt-1">
                                        For {meta.generatedFor || 'You'} • {meta.caloriesTarget || '--'} kcal/day • {(meta.goal || '').replace(/_/g, ' ').toUpperCase()}
                                    </p>
                                </div>
                                <div className="flex gap-3 flex-wrap justify-center">
                                    <button onClick={() => { setResult(null); setError(''); }} className="flex items-center gap-2 bg-white/10 text-white font-bold uppercase tracking-wider px-3 py-2 rounded-lg hover:bg-white/20 transition-all text-xs border border-white/10">
                                        ↩ New
                                    </button>
                                    <button onClick={handleDownloadDoc} className="flex items-center gap-2 bg-blue-600/20 text-blue-400 font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-blue-600/30 transition-all text-xs border border-blue-600/30">
                                        <Download size={16} /> Editable File
                                    </button>
                                    <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-white text-black font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-white/90 transition-all text-xs">
                                        <Download size={16} /> PDF
                                    </button>
                                </div>
                            </div>

                            {/* PDF Container */}
                            <div ref={reportRef} className="bg-[#080808] p-4 md:p-8 rounded-2xl border border-white/10 space-y-12">

                                {/* Header */}
                                <div className="text-center pb-8 border-b border-white/10">
                                    <h2 className="text-xl font-bold text-white mb-1 uppercase tracking-widest">TARA FITNESS</h2>
                                    <p className="text-white/40 text-[11px] mb-4 tracking-wider">{new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                                    <h1 className="text-3xl font-black text-primary uppercase tracking-[0.2em] mb-2">SMARTNUTRITION REPORT</h1>
                                    <p className="text-white/50 text-sm">Goal: {(meta.goal || '').replace(/_/g, ' ').toUpperCase()} • 7 Days • {meta.caloriesTarget} kcal/day</p>
                                    {meta.safetyNotice && <p className="text-red-400/70 text-xs mt-3 max-w-lg mx-auto italic">{meta.safetyNotice}</p>}
                                </div>

                                {/* Macros */}
                                {Object.keys(macros).length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'KCAL', value: macros.daily_calories, color: 'text-primary' },
                                            { label: 'PROTEIN', value: `${macros.protein_g || 0}g`, color: 'text-blue-400' },
                                            { label: 'CARBS', value: `${macros.carbs_g || 0}g`, color: 'text-green-400' },
                                            { label: 'FATS', value: `${macros.fat_g || 0}g`, color: 'text-yellow-400' },
                                        ].map(m => (
                                            <div key={m.label} className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                                                <div className={`text-2xl font-black ${m.color}`}>{m.value}</div>
                                                <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1">{m.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Diet Plan */}
                                {dietPlan.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-bold font-display uppercase tracking-wider mb-6 flex items-center gap-2">
                                            <Utensils className="text-primary" size={20} /> 7-Day Nutrition Protocol
                                        </h3>
                                        <div className="space-y-6">
                                            {dietPlan.map((day, idx) => (
                                                <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                                                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                                                        <h4 className="font-bold text-lg text-primary">{day.day} — {day.date_label}</h4>
                                                        <span className="text-xs text-white/50">{day.total_calories || '--'} kcal</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                                        {Object.entries(day.meals || {}).map(([mealName, meal]) => (
                                                            <div key={mealName} className="space-y-2">
                                                                <h5 className="text-[11px] font-black uppercase text-white/40 tracking-widest">
                                                                    {mealName.replace(/([A-Z])/g, ' $1').trim()} <span className="font-normal opacity-60">({meal?.time || ''})</span>
                                                                </h5>
                                                                <ul className="text-sm space-y-1">
                                                                    {(meal?.items || []).map((item, i) => (
                                                                        <li key={i} className="flex justify-between text-white/80 gap-2">
                                                                            <span>{item.quantity} {item.unit} {item.name}</span>
                                                                            <span className="text-xs text-white/40 shrink-0">{item.calories} kcal</span>
                                                                        </li>
                                                                    ))}
                                                                    {(!meal?.items || meal.items.length === 0) && (
                                                                        <li className="text-white/20 italic text-xs">No items listed</li>
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Workout Plan */}
                                {workoutPlan.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-bold font-display uppercase tracking-wider mb-6 flex items-center gap-2">
                                            <Dumbbell className="text-primary" size={20} /> 7-Day Training Split
                                        </h3>
                                        <div className="space-y-6">
                                            {workoutPlan.map((day, idx) => (
                                                <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                                                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                                                        <div>
                                                            <h4 className="font-bold text-lg text-primary">{day.day} — {day.date_label}</h4>
                                                            <p className="text-xs text-white/50">
                                                                {day.isRestDay ? '🛌 Rest & Recovery' : `${day.type || ''}${day.focus ? ` • ${day.focus}` : ''}`}
                                                            </p>
                                                        </div>
                                                        <span className="text-xs text-white/50">{day.total_duration_minutes || '--'} min</span>
                                                    </div>

                                                    {day.isRestDay ? (
                                                        <ul className="list-disc list-inside text-sm text-white/60 space-y-1">
                                                            {(day.active_recovery || []).map((r, i) => (
                                                                <li key={i}>{typeof r === 'string' ? r : r.activity || r.name || JSON.stringify(r)}</li>
                                                            ))}
                                                            {(!day.active_recovery || day.active_recovery.length === 0) && (
                                                                <li className="text-white/20 italic">Light stretching recommended</li>
                                                            )}
                                                        </ul>
                                                    ) : (
                                                        <div className="w-full overflow-x-auto">
                                                            <table className="w-full text-left text-sm">
                                                                <thead className="text-[10px] uppercase text-white/30 border-b border-white/10">
                                                                    <tr>
                                                                        <th className="pb-2 font-medium w-1/2">Exercise</th>
                                                                        <th className="pb-2 font-medium">Sets × Reps</th>
                                                                        <th className="pb-2 font-medium">Rest</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-white/5">
                                                                    {(day.main_workout || []).map((ex, i) => (
                                                                        <tr key={i} className="text-white/80">
                                                                            <td className="py-2 pr-4">{ex.name}</td>
                                                                            <td className="py-2 text-primary font-bold">{ex.sets} × {ex.reps}</td>
                                                                            <td className="py-2 text-white/40">{ex.rest_seconds}s</td>
                                                                        </tr>
                                                                    ))}
                                                                    {(!day.main_workout || day.main_workout.length === 0) && (
                                                                        <tr><td colSpan="3" className="py-2 text-white/20 italic text-xs">No exercises listed</td></tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Summary */}
                                {result.weeklySummary && (
                                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 space-y-3">
                                        <h3 className="text-lg font-bold font-display uppercase tracking-wider text-primary">Weekly Summary</h3>
                                        <p className="text-white/70 text-sm">{result.weeklySummary.goal_alignment_note}</p>
                                        <ul className="list-disc list-inside text-sm text-white/60 space-y-1">
                                            {(result.weeklySummary.top_3_tips || []).map((tip, i) => (
                                                <li key={i}>{tip}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                            </div>
                        </motion.div>
                    );
                })()}

            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .pdf-mode {
                    background: #ffffff !important;
                    color: #000000 !important;
                    padding: 20px !important;
                    font-family: Arial, sans-serif !important;
                }
                .pdf-mode * {
                    background: transparent !important;
                    border-color: #e5e7eb !important;
                    color: #000000 !important;
                }
                .pdf-mode .text-primary { color: #E34A29 !important; }
                .pdf-mode .text-white\\/40, .pdf-mode .text-white\\/50, .pdf-mode .text-white\\/60, .pdf-mode .text-white\\/70, .pdf-mode .text-white\\/80 {
                    color: #4b5563 !important;
                }
            `}} />
        </div>
    );
};

export default SmartNutrition;
