import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import SignatureCanvas from 'react-signature-canvas';
import { CheckCircle, User, Mail, Phone, Target, Trash2 } from 'lucide-react';
import axios from 'axios';

const SignaturePad = ({ label, sigRef, onEnd }) => {
    const [isEmpty, setIsEmpty] = useState(true);

    const handleClear = () => {
        sigRef.current?.clear();
        setIsEmpty(true);
        if (onEnd) onEnd(null);
    };

    const handleEnd = () => {
        setIsEmpty(false);
        if (onEnd && sigRef.current) onEnd(sigRef.current.toDataURL());
    };

    return (
        <div className="space-y-2">
            <label className="block text-gray-400 text-xs uppercase tracking-wider font-semibold">{label}</label>
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5">
                <SignatureCanvas
                    ref={sigRef}
                    penColor="#ffffff"
                    canvasProps={{
                        className: 'w-full',
                        style: { display: 'block', width: '100%', height: '140px', background: 'transparent' }
                    }}
                    onEnd={handleEnd}
                />
                {isEmpty && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-gray-600 text-sm font-sans italic">Sign here</p>
                    </div>
                )}
            </div>
            <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors"
            >
                <Trash2 size={12} /> Clear
            </button>
        </div>
    );
};

const TrialWaiverForm = () => {
    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        type: 'trial-waiver',
        name: '',
        email: '',
        phone: '',
        inquiryFor: '',
        clientDate: today,
        parentDate: today,
        witnessDate: today,
    });
    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const clientSigRef = useRef(null);
    const parentSigRef = useRef(null);
    const witnessSigRef = useRef(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        setErrorMessage('');

        const clientSig = clientSigRef.current?.isEmpty() ? '' : clientSigRef.current?.toDataURL();
        const parentSig = parentSigRef.current?.isEmpty() ? '' : parentSigRef.current?.toDataURL();
        const witnessSig = witnessSigRef.current?.isEmpty() ? '' : witnessSigRef.current?.toDataURL();

        if (!clientSig) {
            setStatus('error');
            setErrorMessage('Client signature is required. Please sign in the box above.');
            return;
        }
        if (!witnessSig) {
            setStatus('error');
            setErrorMessage('Witness signature is required.');
            return;
        }

        try {
            const response = await axios.post('/api/forms', {
                type: formData.type,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                message: `Inquiry For: ${formData.inquiryFor} | Client Signed: Yes (${formData.clientDate}) | Parent Signed: ${parentSig ? 'Yes' : 'No'} (${formData.parentDate}) | Witness Signed: Yes (${formData.witnessDate})`,
            });

            if (response.data.success) {
                setStatus('success');
            } else {
                setStatus('error');
                setErrorMessage(response.data.message || 'Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setStatus('error');
            setErrorMessage(error.response?.data?.message || 'Network error. Please make sure the server is running.');
        }
    };

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
                        <h2 className="text-3xl font-display font-bold text-white mb-4 tracking-wider uppercase">Waiver Signed</h2>
                        <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
                            Thank you. Your trial waiver has been recorded securely in our system. Welcome to Tara Fitness!
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="text-center mb-10 border-b border-white/10 pb-8">
                            <h1 className="text-white text-2xl md:text-3xl font-display font-bold uppercase tracking-wider mb-6 underline underline-offset-4">
                                Trial Waiver and Release Form
                            </h1>
                            <div className="text-gray-300 font-sans text-sm max-w-3xl mx-auto leading-relaxed text-justify space-y-4">
                                <p>
                                    Physical exercise can be strenuous and subject to risk of serious injury; we urge you to obtain a physical examination from a doctor before using any exercise equipment or participating in any exercise activity. You agree that by participating in physical exercise or training activities, you do so entirely at your own risk. You agree that you are voluntarily participating in these activities and use of this facilities and premises and sure all risks of injury, illness, or death. We are also not responsible for any loss of your personal property.
                                </p>
                                <p>
                                    During your exercise program, every effort will be made to assure your safety. However, as with any exercise program, there are risks, including heart stress and the chance of musculoskeletal injuries. In volunteering for this program, you agree to assume responsibility for these risks and waive any possibility for personal damage. You also agree that, to your knowledge, you have no limiting physical conditions or disability that would preclude an exercise program.
                                </p>
                                <p className="font-semibold text-white">
                                    By signing below, you accept full responsibility for your own health and well-being and you acknowledge and understand that no responsibility is assumed by the leaders of the program.
                                </p>
                            </div>
                        </div>

                        <form className="space-y-8" onSubmit={handleSubmit}>
                            {/* Personal Details Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white/5 p-6 rounded-xl border border-white/5">
                                <div className="relative">
                                    <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1 font-semibold">Client Name</label>
                                    <div className="relative">
                                        <User className="absolute top-3.5 left-3 h-4 w-4 text-gray-400 pointer-events-none" />
                                        <input
                                            name="name" type="text" required disabled={status === 'submitting'}
                                            className="appearance-none rounded-lg block w-full pl-9 px-3 py-3 border border-white/10 bg-dark text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                                            placeholder="Full Name"
                                            value={formData.name} onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1 font-semibold">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute top-3.5 left-3 h-4 w-4 text-gray-400 pointer-events-none" />
                                        <input
                                            name="email" type="email" required disabled={status === 'submitting'}
                                            className="appearance-none rounded-lg block w-full pl-9 px-3 py-3 border border-white/10 bg-dark text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                                            placeholder="Email Address"
                                            value={formData.email} onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1 font-semibold">TEL</label>
                                    <div className="relative">
                                        <Phone className="absolute top-3.5 left-3 h-4 w-4 text-gray-400 pointer-events-none" />
                                        <input
                                            name="phone" type="tel" required disabled={status === 'submitting'}
                                            className="appearance-none rounded-lg block w-full pl-9 px-3 py-3 border border-white/10 bg-dark text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                                            placeholder="Mobile Number"
                                            value={formData.phone} onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1 font-semibold">Inquiry for</label>
                                    <div className="relative">
                                        <Target className="absolute top-3.5 left-3 h-4 w-4 text-gray-400 pointer-events-none" />
                                        <select
                                            name="inquiryFor" required disabled={status === 'submitting'}
                                            className="appearance-none rounded-lg block w-full pl-9 px-3 py-3 border border-white/10 bg-dark text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                                            value={formData.inquiryFor} onChange={handleChange}
                                        >
                                            <option value="" disabled>--Select--</option>
                                            <option value="1 Day Trial">1 Day Trial</option>
                                            <option value="3 Day Trial">3 Day Trial</option>
                                            <option value="1 Week Trial">1 Week Trial</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Signature Sections */}
                            <div className="space-y-8">
                                {/* Client Signature */}
                                <div className="bg-white/5 p-6 rounded-xl border border-white/5 space-y-4">
                                    <SignaturePad label="Printed Name and Signature" sigRef={clientSigRef} />
                                    <div>
                                        <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1 font-semibold">Date</label>
                                        <input
                                            name="clientDate" type="date" disabled={status === 'submitting'}
                                            className="appearance-none rounded-lg block w-48 px-3 py-2 border border-white/10 bg-dark text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                                            value={formData.clientDate} onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* Parent Signature */}
                                <div className="bg-white/5 p-6 rounded-xl border border-white/5 space-y-4">
                                    <SignaturePad label="Parent/guardian's signature (If needed)" sigRef={parentSigRef} />
                                    <div>
                                        <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1 font-semibold">Date</label>
                                        <input
                                            name="parentDate" type="date" disabled={status === 'submitting'}
                                            className="appearance-none rounded-lg block w-48 px-3 py-2 border border-white/10 bg-dark text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                                            value={formData.parentDate} onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* Witness Signature */}
                                <div className="bg-white/5 p-6 rounded-xl border border-white/5 space-y-4">
                                    <SignaturePad label="Witness' signature" sigRef={witnessSigRef} />
                                    <div>
                                        <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1 font-semibold">Date</label>
                                        <input
                                            name="witnessDate" type="date" disabled={status === 'submitting'}
                                            className="appearance-none rounded-lg block w-48 px-3 py-2 border border-white/10 bg-dark text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                                            value={formData.witnessDate} onChange={handleChange}
                                        />
                                    </div>
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
                                {status === 'submitting' ? 'PROCESSING...' : 'Submit'}
                            </button>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default TrialWaiverForm;
