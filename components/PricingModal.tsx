import React, { useState } from 'react';
import { PLANS, SubscriptionService } from '../services/subscriptionService';
import { PlanType, UserProfile } from '../types';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserProfile: UserProfile | null;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, currentUserProfile }) => {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const currentPlan = currentUserProfile?.planType || 'free';

    const handleUpgrade = async (planType: PlanType) => {
        if (planType === 'free') return;

        const plan = PLANS[planType];
        if (plan.paymentUrl) {
            window.location.href = plan.paymentUrl;
            return;
        }

        setLoading(true);
        try {
            const orderData = await SubscriptionService.createSubscriptionOrder(planType);
            if (!orderData) {
                alert('This plan is free.');
                setLoading(false);
                return;
            }

            const options: any = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'Nexus Analyst',
                description: `Upgrade to ${PLANS[planType]?.label} Plan`,
                handler: function (response: any) {
                    alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
                    onClose();
                    window.location.reload();
                },
                prefill: {
                    name: currentUserProfile?.displayName || '',
                    email: currentUserProfile?.email || '',
                },
                theme: {
                    color: '#6366f1'
                }
            };

            // Use subscription_id for recurring plans, order_id for one-time credits
            if (orderData.subscriptionId) {
                options.subscription_id = orderData.subscriptionId;
            } else if (orderData.orderId) {
                options.order_id = orderData.orderId;
            }

            const rzp1 = new (window as any).Razorpay(options);
            rzp1.on('payment.failed', function (response: any) {
                alert(`Payment Failed: ${response.error.description}`);
            });
            rzp1.open();

        } catch (error: any) {
            console.error('Payment Error:', error);
            alert(`Payment initialization failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const planOrder: PlanType[] = ['free', 'pro', 'agency'];

    const planIcons: Record<PlanType, string> = {
        free: 'fas fa-paper-plane',
        pro: 'fas fa-rocket',
        agency: 'fas fa-building',
    };

    const planColors: Record<PlanType, { bg: string; border: string; badge: string; button: string; buttonHover: string }> = {
        free: {
            bg: 'bg-white dark:bg-slate-800/50',
            border: 'border-slate-200 dark:border-slate-700',
            badge: '',
            button: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
            buttonHover: 'hover:bg-slate-200 dark:hover:bg-slate-600',
        },
        pro: {
            bg: 'bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950/40 dark:to-slate-800/50',
            border: 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-900/50',
            badge: 'bg-indigo-600 text-white',
            button: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30',
            buttonHover: 'hover:bg-indigo-700 hover:shadow-indigo-500/40',
        },
        agency: {
            bg: 'bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-800/50',
            border: 'border-amber-300 dark:border-amber-600',
            badge: 'bg-amber-500 text-white',
            button: 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg',
            buttonHover: 'hover:bg-slate-800 dark:hover:bg-slate-200',
        },
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md transition-colors duration-300">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-white/20 dark:border-slate-800 transition-colors duration-300">
                <div className="p-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white transition-colors">
                                Choose Your Plan
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors mt-1">
                                Unlock powerful AI-driven business insights.
                            </p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            <i className="fas fa-times text-slate-500 dark:text-slate-400"></i>
                        </button>
                    </div>

                    {/* Launch Offer Banner */}
                    <div className="mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4 flex items-center gap-4 text-white">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-bolt text-xl"></i>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg">🎉 Launch Offer — 50% OFF All Paid Plans</h4>
                            <p className="text-white/80 text-sm">Limited-time pricing. Lock in these rates before they go up!</p>
                        </div>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid md:grid-cols-3 gap-6">
                        {planOrder.map((planKey) => {
                            const plan = PLANS[planKey];
                            const isCurrent = currentPlan === planKey;
                            const colors = planColors[planKey];
                            const isPopular = planKey === 'pro';

                            return (
                                <div
                                    key={planKey}
                                    className={`relative p-8 rounded-[2rem] border-2 transition-all ${colors.bg} ${colors.border} ${!isCurrent ? 'hover:shadow-xl hover:-translate-y-1' : ''}`}
                                >
                                    {/* MOST POPULAR badge */}
                                    {isPopular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-black px-5 py-1.5 rounded-full shadow-lg shadow-indigo-500/30 uppercase tracking-wider whitespace-nowrap">
                                            ⭐ Most Popular
                                        </div>
                                    )}

                                    {/* Current Plan badge */}
                                    {isCurrent && (
                                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-[1.5rem] rounded-tr-[1.5rem]">
                                            CURRENT
                                        </div>
                                    )}

                                    {/* Plan Icon + Title */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${planKey === 'free' ? 'bg-slate-100 dark:bg-slate-700 text-slate-500' : planKey === 'pro' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'}`}>
                                            <i className={`${planIcons[planKey]} text-lg`}></i>
                                        </div>
                                        <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white transition-colors">
                                            {plan.label}
                                        </h3>
                                    </div>

                                    {/* Pricing */}
                                    <div className="mb-6">
                                        {plan.discount > 0 && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="line-through text-slate-400 dark:text-slate-500 text-lg font-semibold">
                                                    {plan.currency === 'INR' ? '₹' : '$'}{plan.originalPrice}
                                                </span>
                                                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${colors.badge}`}>
                                                    {plan.discount}% OFF
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black text-slate-900 dark:text-white transition-colors">
                                                {plan.price === 0 ? 'Free' : `${plan.currency === 'INR' ? '₹' : '$'}${plan.price}`}
                                            </span>
                                            {plan.price > 0 && (
                                                <span className="text-slate-400 font-medium">/month</span>
                                            )}
                                        </div>
                                        {plan.price === 0 && (
                                            <p className="text-sm text-slate-400 mt-1">No credit card needed</p>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-3.5 mb-8">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-300 font-medium text-sm transition-colors">
                                                <i className={`fas fa-check-circle mt-0.5 ${planKey === 'free' ? 'text-slate-400' : planKey === 'pro' ? 'text-indigo-500 dark:text-indigo-400' : 'text-amber-500 dark:text-amber-400'}`}></i>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA Button */}
                                    <button
                                        onClick={() => handleUpgrade(planKey)}
                                        disabled={isCurrent || loading || planKey === 'free'}
                                        className={`w-full py-4 rounded-xl font-bold transition-all ${isCurrent
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 cursor-not-allowed border border-emerald-200 dark:border-emerald-800'
                                            : planKey === 'free'
                                                ? `${colors.button} cursor-default`
                                                : `${colors.button} ${colors.buttonHover}`
                                            }`}
                                    >
                                        {loading
                                            ? 'Processing...'
                                            : isCurrent
                                                ? '✓ Active Plan'
                                                : planKey === 'free'
                                                    ? 'Current Default'
                                                    : `Upgrade to ${plan.label}`
                                        }
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Trust Badges */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400 dark:text-slate-500">
                        <div className="flex items-center gap-2">
                            <i className="fas fa-shield-alt text-emerald-500"></i>
                            <span>Secure payments via Razorpay</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <i className="fas fa-undo text-blue-500"></i>
                            <span>Cancel anytime</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <i className="fas fa-globe text-purple-500"></i>
                            <span>Secure Global Payments</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
