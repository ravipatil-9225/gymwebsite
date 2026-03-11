import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import SignatureCanvas from 'react-signature-canvas';
import { CheckCircle, User, Mail, Phone, Target, Calendar, Trash2 } from 'lucide-react';
import axios from 'axios';

const SignaturePad = ({ label, sigRef }) => {
    const [isEmpty, setIsEmpty] = useState(true);

    const handleClear = () => {
        sigRef.current?.clear();
        setIsEmpty(true);
    };

    return (
        <div className="space-y-2">
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5">
                <SignatureCanvas
                    ref={sigRef}
                    penColor="#ffffff"
                    canvasProps={{
                        className: 'w-full',
                        style: { display: 'block', width: '100%', height: '120px', background: 'transparent' }
                    }}
                    onEnd={() => setIsEmpty(false)}
                />
                {isEmpty && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-gray-600 text-sm font-sans italic">Sign here</p>
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between">
                <label className="text-gray-400 text-xs uppercase tracking-wider font-semibold">{label}</label>
                <button type="button" onClick={handleClear} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors">
                    <Trash2 size={12} /> Clear
                </button>
            </div>
        </div>
    );
};

const ParQForm = () => {
    const [formData, setFormData] = useState({
        type: 'par-q',
        name: '',
        dob: '',
        email: '',
        phone: '',
        inquiryFor: '',
        q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '',
        comment: ''
    });
    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const sigRef = useRef(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRadioChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMessage('');

        try {
            const response = await axios.post('/api/forms', {
                type: formData.type,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                message: `DOB: ${formData.dob} | Inquiry For: ${formData.inquiryFor} | Q1:${formData.q1} | Q2:${formData.q2} | Q3:${formData.q3} | Q4:${formData.q4} | Q5:${formData.q5} | Q6:${formData.q6} | Q7:${formData.q7} | Comments: ${formData.comment}`
            });

            if (response.data.success) {
                setStatus('success');
            } else {
                setStatus('error');
                setErrorMessage(response.data.message || 'Something went wrong. Please try again.');
            }
        } catch (error) {
            setStatus('error');
            setErrorMessage(error.response?.data?.message || 'Network error. Please make sure the server is running.');
        }
    };

    const questions = [
        { id: 'q1', text: 'Has your doctor ever said you have a heart condition and that you should only do physical activity recommended by a doctor?' },
        { id: 'q2', text: 'Do you feel pain in your chest when you do physical activity?' },
        { id: 'q3', text: 'In the past month, have you had a chest pain when you were not doing physical activity?' },
        { id: 'q4', text: 'Do you lose balance because of dizziness or do you ever lose consciousness?' },
        { id: 'q5', text: 'Do you have a bone or joint problem ( for example back, knee or hip) that could be made worse by a change in your physical activity?' },
        { id: 'q6', text: 'Is your doctor currently prescribing medication for your blood pressure or heart condition?' },
        { id: 'q7', text: 'Do you know of any other reason why you should not take part in physical activity?' },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 relative bg-dark mt-16">
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-primary/5 blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl w-full glass-card p-8 md:p-12 rounded-2xl relative z-10 shadow-2xl border-white/10"
            >
                {status === 'success' ? (
                    <div className="text-center py-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </motion.div>
                        <h2 className="text-3xl font-display font-bold text-white mb-4 tracking-wider">PAR-Q SUBMITTED</h2>
                        <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
                            Thank you for completing your Physical Activity Readiness Questionnaire. Our team will review your responses.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="text-center mb-10 border-b border-white/10 pb-8">
                            <h1 className="text-white text-2xl md:text-3xl font-display font-bold uppercase tracking-wider">
                                Physical Activity Readiness Questionnaire (PAR-Q)
                            </h1>
                        </div>

                        <form className="space-y-8" onSubmit={handleSubmit}>
                            {/* Personal Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1 font-semibold">NAME</label>
                                    <div className="relative">
                                        <input
                                            name="name" type="text" required disabled={status === 'submitting'}
                                            className="appearance-none rounded-lg block w-full px-3 py-3 border border-white/10 bg-dark text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                                            value={formData.name} onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1 font-semibold">DOB</label>
                                    <input
                                        name="dob" type="date" required disabled={status === 'submitting'}
                                        className="appearance-none rounded-lg block w-full px-3 py-3 border border-white/10 bg-dark text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                                        value={formData.dob} onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1 font-semibold">EMAIL</label>
                                    <div className="relative">
                                        <input
                                            name="email" type="email" required disabled={status === 'submitting'}
                                            className="appearance-none rounded-lg block w-full px-3 py-3 border border-white/10 bg-dark text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                                            value={formData.email} onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1 font-semibold">TEL</label>
                                    <div className="relative">
                                        <Phone className="absolute top-3.5 left-3 h-4 w-4 text-gray-400 pointer-events-none" />
                                        <input
                                            name="phone" type="tel" required disabled={status === 'submitting'}
                                            className="appearance-none rounded-lg block w-full pl-9 px-3 py-3 border border-white/10 bg-dark text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                                            placeholder="Mobile Number*"
                                            value={formData.phone} onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1 font-semibold">Inquiry for</label>
                                    <div className="relative">
                                        <Target className="absolute top-3.5 left-3 h-4 w-4 text-gray-400 pointer-events-none" />
                                        <select
                                            name="inquiryFor" required disabled={status === 'submitting'}
                                            className="appearance-none rounded-lg block w-full pl-9 px-3 py-3 border border-white/10 bg-dark text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                                            value={formData.inquiryFor} onChange={handleChange}
                                        >
                                            <option value="" disabled>--Select--</option>
                                            <option value="General Gym Use">General Gym Use</option>
                                            <option value="Personal Training">Personal Training</option>
                                            <option value="Group Classes">Group Classes</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="text-gray-300 font-sans text-sm leading-relaxed space-y-3 border-t border-white/10 pt-6">
                                <p>
                                    If you're aged 15-69, the PAR-Q will tell you if you should check with your doctor before significantly changing your physical activity patterns. If you're over 69 years and aren't used to being very active, check with your doctor. <span className="underline font-semibold">Please read each question carefully and answer honestly by ticking YES/NO. YES NO</span>
                                </p>
                            </div>

                            {/* Questions Table */}
                            <div className="space-y-3">
                                {questions.map((q) => (
                                    <div key={q.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-primary/20 transition-colors">
                                        <p className="text-gray-300 font-sans text-sm flex-1">{q.text}</p>
                                        <div className="flex items-center gap-6 shrink-0">
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="radio" name={q.id} value="Yes" required
                                                    className="w-4 h-4 accent-primary"
                                                    onChange={() => handleRadioChange(q.id, 'Yes')}
                                                    checked={formData[q.id] === 'Yes'}
                                                />
                                                <span className="text-white text-sm group-hover:text-primary transition-colors">Yes</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="radio" name={q.id} value="No"
                                                    className="w-4 h-4 accent-primary"
                                                    onChange={() => handleRadioChange(q.id, 'No')}
                                                    checked={formData[q.id] === 'No'}
                                                />
                                                <span className="text-white text-sm group-hover:text-primary transition-colors">No</span>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* If YES comment */}
                            <div>
                                <label className="block text-gray-300 font-sans text-sm mb-2">If YES, please comment:</label>
                                <textarea
                                    name="comment" disabled={status === 'submitting'}
                                    className="appearance-none rounded-lg block w-full px-4 py-3 border border-white/10 bg-dark text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary text-sm resize-y min-h-[80px]"
                                    value={formData.comment} onChange={handleChange}
                                />
                            </div>

                            {/* YES / NO Explanations */}
                            <div className="font-sans text-sm space-y-4 bg-white/5 p-6 rounded-xl border border-white/5">
                                <div>
                                    <p className="font-bold text-white">If you answered YES to one or more questions:</p>
                                    <p className="text-gray-300 mt-1">You should consult with your doctor to clarify that it's safe for you to become physically active at the current time.</p>
                                </div>
                                <div>
                                    <p className="font-bold text-white">If you answered NO to ALL of the questions:</p>
                                    <p className="text-gray-300 mt-1">It is reasonably safe for you to participate in physical activity, gradually building up from your current ability level.</p>
                                </div>
                                <div className="pt-2 border-t border-white/10">
                                    <p className="text-gray-700 dark:text-gray-200">I have read, understood and accurately completed this questionnaire. I confirm that I am voluntarily engaging in an acceptable level of exercise, and my participation involves a risk of injury.</p>
                                </div>
                            </div>

                            {status === 'error' && (
                                <div className="text-red-500 text-sm text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                    {errorMessage}
                                </div>
                            )}

                            <button
                                type="submit" disabled={status === 'submitting'}
                                className="w-full py-4 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-primary hover:bg-primary-hover transition-all tracking-widest shadow-[0_0_15px_rgba(227,74,41,0.3)] disabled:opacity-50"
                            >
                                {status === 'submitting' ? 'SUBMITTING...' : 'Submit'}
                            </button>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default ParQForm;
