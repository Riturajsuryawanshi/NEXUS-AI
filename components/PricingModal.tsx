import React, { useState } from 'react';
import { PLANS, CREDIT_PACKS, SubscriptionService } from '../services/subscriptionService';
import { PlanType, UserProfile } from '../types';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserProfile: UserProfile | null;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, currentUserProfile }) => {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [view, setView] = useState<'plans' | 'credits'>('plans');

    if (!isOpen) return null;

    const currentPlan = currentUserProfile?.planType || 'free';

    const handlePayment = async (itemId: string, itemType: 'plan' | 'credit', amount: number, currency: string) => {
        setLoadingId(itemId);
        try {
            // Mocking Razorpay Opening
            const options = {
                key: "YOUR_RAZORPAY_KEY", // Enter the Key ID generated from the Dashboard
                amount: amount * 100, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
                currency: currency,
                name: "NexusAnalyst",
                description: `Payment for ${itemId}`,
                image: "https://example.com/your_logo",
                handler: async function (response: any) {
                    // alert(response.razorpay_payment_id);
                    // simulate success backend call
                    if (itemType === 'plan') {
                        await SubscriptionService.upgradePlan(currentUserProfile!.userId, itemId as PlanType);
                        alert(`Successfully upgraded to ${PLANS[itemId as PlanType].label}!`);
                    } else {
                        await SubscriptionService.purchaseCredits(currentUserProfile!.userId, itemId);
                        alert('Credits purchased successfully!');
                    }
                    onClose();
                },
                prefill: {
                    name: currentUserProfile?.displayName || "",
                    email: currentUserProfile?.email || "",
                    contact: ""
                },
                theme: {
                    color: "#4f46e5"
                }
            };

            // Check if Razorpay is loaded
            if ((window as any).Razorpay) {
                const rzp1 = new (window as any).Razorpay(options);
                rzp1.open();
            } else {
                // Fallback if Razorpay script fails or for dev testing without script
                console.warn("Razorpay SDK not loaded. Simulating direct success.");
                await new Promise(resolve => setTimeout(resolve, 1000));
                if (itemType === 'plan') {
                    await SubscriptionService.upgradePlan(currentUserProfile!.userId, itemId as PlanType);
                    alert(`Successfully upgraded to ${PLANS[itemId as PlanType].label}!`);
                } else {
                    await SubscriptionService.purchaseCredits(currentUserProfile!.userId, itemId);
                    alert('Credits purchased successfully!');
                }
                onClose();
            }

        } catch (error: any) {
            alert(`Payment failed: ${error.message}`);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-3xl font-display font-black text-slate-900">Upgrade Your Arsenal</h2>
                            <p className="text-slate-500 font-medium">Unlock professional tools and maximize your earnings.</p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                            <i className="fas fa-times text-slate-500"></i>
                        </button>
                    </div>

                    <div className="flex gap-4 mb-8">
                        <button
                            onClick={() => setView('plans')}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${view === 'plans' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                            Subscription Plans
                        </button>
                        <button
                            onClick={() => setView('credits')}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${view === 'credits' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                            Report Credits
                        </button>
                    </div>

                    {view === 'plans' ? (
                        <div className="grid md:grid-cols-3 gap-6">
                            {(Object.keys(PLANS) as PlanType[]).filter(p => p !== 'enterprise').map((planKey) => {
                                const plan = PLANS[planKey];
                                const isCurrent = currentPlan === planKey;
                                const isPro = planKey === 'pro';

                                return (
                                    <div key={planKey} className={`relative p-8 rounded-[2rem] border-2 transition-all ${isCurrent ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-xl'}`}>
                                        {isCurrent && (
                                            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-[1.5rem] rounded-tr-[1.5rem]">
                                                CURRENT PLAN
                                            </div>
                                        )}
                                        <h3 className="text-2xl font-display font-black text-slate-900 mb-2">{plan.label}</h3>
                                        <div className="flex items-baseline gap-1 mb-6">
                                            <span className="text-4xl font-black text-slate-900">
                                                {plan.price === 0 ? 'Free' : `${plan.currency === 'INR' ? '₹' : '$'}${plan.price}`}
                                            </span>
                                            {plan.price > 0 && <span className="text-slate-400 font-medium">/month</span>}
                                        </div>

                                        <ul className="space-y-4 mb-8">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-start gap-3 text-slate-600 font-medium text-sm">
                                                    <i className="fas fa-check-circle text-indigo-500 mt-1"></i>
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <button
                                            onClick={() => handlePayment(planKey, 'plan', plan.price, plan.currency)}
                                            disabled={isCurrent || loadingId !== null}
                                            className={`w-full py-4 rounded-xl font-bold transition-all ${isCurrent
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                : isPro
                                                    ? 'bg-slate-900 text-white hover:bg-indigo-600 shadow-lg hover:shadow-indigo-500/20'
                                                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                                }`}
                                        >
                                            {loadingId === planKey ? 'Processing...' : isCurrent ? 'Active Plan' : `Upgrade to ${plan.label}`}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-3 bg-indigo-50 p-6 rounded-2xl mb-4 border border-indigo-100 flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                    <i className="fas fa-bolt text-xl"></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-indigo-900">Pay-Per-Report</h4>
                                    <p className="text-indigo-700 text-sm">Don't need a subscription? Buy credits intended for single reports. Credits never expire.</p>
                                </div>
                            </div>

                            {CREDIT_PACKS.map((pack) => (
                                <div key={pack.id} className="p-8 rounded-[2rem] border-2 border-slate-100 bg-white hover:border-indigo-100 hover:shadow-xl transition-all">
                                    <h3 className="text-xl font-display font-black text-slate-900 mb-2">{pack.label}</h3>
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-4xl font-black text-slate-900">₹{pack.price}</span>
                                    </div>

                                    <div className="flex items-center gap-2 mb-8 text-slate-600 font-medium bg-slate-50 p-3 rounded-xl">
                                        <i className="fas fa-coins text-amber-500"></i>
                                        <span>{pack.credits} Credits</span>
                                    </div>

                                    <button
                                        onClick={() => handlePayment(pack.id, 'credit', pack.price, 'INR')}
                                        disabled={loadingId !== null}
                                        className="w-full py-4 rounded-xl font-bold bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-all"
                                    >
                                        {loadingId === pack.id ? 'Processing...' : 'Buy Pack'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
