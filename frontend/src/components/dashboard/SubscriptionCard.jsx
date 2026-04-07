import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { TrendingUp, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const SubscriptionCard = () => {
    const { token } = useContext(AuthContext);
    const [subscription, setSubscription] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSubscription = async () => {
        try {
            setLoading(true);
            
            // Fetch both subscription and payments in parallel
            const [subRes, payRes] = await Promise.allSettled([
                axios.get('/api/subscription/', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('/api/payments/my-payments', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (subRes.status === 'fulfilled') {
                setSubscription(subRes.value.data);
            } else if (subRes.reason?.response?.status === 404) {
                setSubscription(null);
            } else {
                setError('Failed to fetch subscription');
            }

            if (payRes.status === 'fulfilled') {
                setPayments(payRes.value.data);
            }

            setError(null);
        } catch (err) {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchSubscription();
        }
    }, [token]);

    useEffect(() => {
        const handleDbChange = () => {
            if (token) {
                fetchSubscription();
            }
        };
        
        import('../../utils/socket').then((module) => {
            const socket = module.default;
            socket.on('db_changed', handleDbChange);
            return () => {
                socket.off('db_changed', handleDbChange);
            };
        });
    }, [token]);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    if (loading) {
        return (
            <div className="space-y-4 pt-4 border-t border-white/10 flex items-center justify-center p-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!subscription) {
        return (
            <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Current Plan:</span>
                    <span className="text-gray-400 font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> No Active Plan
                    </span>
                </div>
            </div>
        );
    }

    const isExpired = subscription.status === 'expired';
    const overduePayment = payments.find(p => p.verificationStatus === 'overdue');
    let daysOverdue = 0;
    if (overduePayment && overduePayment.expiryDate) {
        daysOverdue = Math.floor((new Date() - new Date(overduePayment.expiryDate)) / (1000 * 60 * 60 * 24));
    }

    return (
        <div className="space-y-4 pt-4 border-t border-white/10">
            {overduePayment && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-xs text-left">
                    <span className="font-semibold block mb-1">⚠️ Your payment is overdue by {daysOverdue} day{daysOverdue !== 1 ? 's' : ''}.</span>
                    Please complete payment for your {overduePayment.planName} plan to continue your membership.
                </div>
            )}
            
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Next Renewal:</span>
                <span className={`font-semibold flex items-center gap-2 ${isExpired ? 'text-red-400' : 'text-white'}`}>
                    <Clock className="w-4 h-4" /> {formatDate(subscription.endDate)}
                </span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Current Plan:</span>
                <span className="text-white font-semibold flex items-center gap-2">
                    <TrendingUp className={`w-4 h-4 ${isExpired ? 'text-red-500' : 'text-primary'}`} /> {subscription.planName}
                </span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-400">Status:</span>
                <span className={`font-semibold flex items-center gap-1.5 text-[0.7rem] uppercase px-2 py-0.5 rounded-full ${isExpired ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                    {isExpired ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    {isExpired ? 'Expired' : 'Active'}
                </span>
            </div>
        </div>
    );
};

export default SubscriptionCard;
