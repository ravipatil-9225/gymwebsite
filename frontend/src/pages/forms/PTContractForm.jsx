import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import SignatureCanvas from 'react-signature-canvas';
import { CheckCircle, User, Mail, Trash2 } from 'lucide-react';

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
                        style: { display: 'block', width: '100%', height: '140px', background: 'transparent' }
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
                <button
                    type="button"
                    onClick={handleClear}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors"
                >
                    <Trash2 size={12} /> Clear
                </button>
            </div>
        </div>
    );
};

const PTContractForm = () => {
    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        type: 'pt-contract',
        name: '',
        email: '',
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
        const witnessSig = witnessSigRef.current?.isEmpty() ? '' : witnessSigRef.current?.toDataURL();

        if (!clientSig) {
            setStatus('error');
            setErrorMessage('Client signature is required.');
            return;
        }
        if (!witnessSig) {
            setStatus('error');
            setErrorMessage('Witness signature is required.');
            return;
        }

        try {
            const response = await fetch('/api/forms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: formData.type,
                    name: formData.name,
                    email: formData.email,
                    message: `Client Signed: Yes (${formData.clientDate}) | Parent Signed: ${parentSigRef.current?.isEmpty() ? 'No' : 'Yes'} (${formData.parentDate}) | Witness Signed: Yes (${formData.witnessDate})`,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
            } else {
                setStatus('error');
                setErrorMessage(data.message || 'Something went wrong. Please try again.');
            }
        } catch (error) {
            setStatus('error');
            setErrorMessage('Network error. Please make sure the server is running.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 relative bg-dark mt-16">
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl w-full glass-card p-8 md:p-12 rounded-3xl relative z-10 shadow-2xl border-white/10"
            >
                {status === 'success' ? (
                    <div className="text-center py-16">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30"
                        >
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </motion.div>
                        <h2 className="text-3xl font-display font-bold text-white mb-4 tracking-widest uppercase">Contract Secured</h2>
                        <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto font-sans leading-relaxed">
                            Your Personal Training contract has been received and logged. Your designated trainer will reach out to begin your first phase.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="text-center mb-10 border-b border-white/10 pb-8">
                            <h1 className="text-white text-2xl md:text-3xl font-display font-bold uppercase tracking-wider mb-6 underline underline-offset-4">
                                Personal Training Contract
                            </h1>
                            <div className="text-gray-300 font-sans text-sm max-w-3xl mx-auto leading-relaxed text-left space-y-4">
                                <p>
                                    Congratulations on your decision to participate in an exercise program! With the help of your personal trainer, you greatly improve your ability to accomplish your training goals faster, safer, and with maximum benefits. The details of these training sessions can be used for a lifetime.
                                </p>
                                <p>
                                    In order to maximize progress, it will be necessary for you to follow program guidelines during supervised and (if applicable) unsupervised training days. Remember, exercise and healthy eating are equally important. During your exercise program, every effort will be made to assure your safety. However, as with any exercise program, there are risks, including heart stress and the chance of musculoskeletal injuries. In volunteering for this program, you agree to assume responsibility for these risks and waive any possibility for personal damage. You also agree that, to your knowledge, you have no limiting physical conditions or a disability that would preclude an exercise program. By signing below, you accept full responsibility for your own health and well-being AND you acknowledge and understand that no responsibility is assumed by the leaders of the program.
                                </p>
                                <p>
                                    It is recommended that all program participants work with their personal trainer 2 to 3 times per week. However, due to scheduling conflicts and financial considerations, a combination of supervised, unsupervised and managed training programs is possible.
                                </p>

                                <div>
                                    <p className="font-bold text-white mb-2">Personal Training Term & Conditions:</p>
                                    <ol className="list-decimal list-inside space-y-2 text-gray-300">
                                        <li>All sessions must be fully paid prior to session date.</li>
                                        <li>Personal training sessions that are not rescheduled or cancelled 24 hours in advance will result in forfeiture of the session and a loss of the financial investment at the rate of one session.</li>
                                        <li>Clients arriving late will receive the remaining scheduled session time, unless other arrangements have been previously made with the trainer.</li>
                                        <li>
                                            The expiration policy requires completion of all personal training sessions within the following days from the date of the contract. Personal training sessions are void after this time period:
                                            <ul className="mt-2 ml-4 space-y-1 text-gray-400">
                                                <li className="flex justify-between max-w-xs"><span>8 sessions package</span><span>- 60 days</span></li>
                                                <li className="flex justify-between max-w-xs"><span>12 sessions package</span><span>- 90 days</span></li>
                                                <li className="flex justify-between max-w-xs"><span>24 sessions package</span><span>- 150 days</span></li>
                                                <li className="flex justify-between max-w-xs"><span>Managed Programming</span><span>- 30 days</span></li>
                                            </ul>
                                        </li>
                                        <li>No personal training refunds will be issued for any reason, including but not limited to relocation, illness and unused sessions.</li>
                                    </ol>
                                </div>

                                <div>
                                    <p className="font-bold text-white mb-2">Online Training ( 1-on-1, Partner, Group, Minors and Managed Programming ) Term & Conditions:</p>
                                    <ol className="list-decimal list-inside space-y-2 text-gray-300">
                                        <li>Online training cancellations are subject to the same 24 hour rule.</li>
                                        <li>Regardless of if only one person attends the session, they will be booked for the partner training rate.</li>
                                        <li>Same terms & conditions apply as stated above for personal training.</li>
                                    </ol>
                                </div>

                                <p className="text-gray-700 dark:text-gray-200 italic">We look forward to providing the best coaching experience for you.</p>
                            </div>
                        </div>

                        <form className="space-y-8" onSubmit={handleSubmit}>
                            {/* Personal Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-xl border border-white/5">
                                <div>
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
                                <div>
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
                            </div>

                            {/* Signature Sections */}
                            <div className="space-y-8">
                                {/* Client Signature */}
                                <div className="bg-white/5 p-6 rounded-xl border border-white/5 space-y-4">
                                    <SignaturePad label="Client Signature" sigRef={clientSigRef} />
                                    <div>
                                        <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1 font-semibold">Date</label>
                                        <input
                                            name="clientDate" type="date"
                                            className="appearance-none rounded-lg block w-48 px-3 py-2 border border-white/10 bg-dark text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                                            value={formData.clientDate} onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {/* Parent / Guardian Signature */}
                                <div className="bg-white/5 p-6 rounded-xl border border-white/5 space-y-4">
                                    <SignaturePad label="Parent/guardian's signature (If needed)" sigRef={parentSigRef} />
                                    <div>
                                        <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1 font-semibold">Date</label>
                                        <input
                                            name="parentDate" type="date"
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
                                            name="witnessDate" type="date"
                                            className="appearance-none rounded-lg block w-48 px-3 py-2 border border-white/10 bg-dark text-white focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                                            value={formData.witnessDate} onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {status === 'error' && (
                                <div className="text-red-500 text-sm font-semibold text-center bg-red-500/10 py-4 rounded-xl border border-red-500/20">
                                    {errorMessage}
                                </div>
                            )}

                            <button
                                type="submit" disabled={status === 'submitting'}
                                className="w-full py-4 px-4 border border-transparent text-sm font-bold uppercase rounded-xl text-white bg-primary hover:bg-primary-hover transition-all tracking-widest shadow-[0_0_20px_rgba(227,74,41,0.4)] disabled:opacity-50"
                            >
                                {status === 'submitting' ? 'PROCESSING CONTRACT...' : 'Submit'}
                            </button>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default PTContractForm;
