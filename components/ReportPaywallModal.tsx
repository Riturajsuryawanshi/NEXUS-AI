import React, { useState, useEffect } from 'react';
import { SubscriptionService } from '../services/subscriptionService';
import { UserProfile } from '../types';

interface ReportPaywallModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDownloadReady: () => void; // Called after successful credit deduction
    currentUserProfile: UserProfile | null;
    businessName?: string;
}

const CREDIT_PACKS = [
    {
        id: 'pack_1',
        credits: 1,
        price: 15,
        label: 'Single Report',
        badge: null,
        highlight: false,
        pricePerReport: '₹15',
        color: 'from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-800/40',
        border: 'border-slate-200 dark:border-slate-700',
        buttonClass: 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-900',
    },
    {
        id: 'pack_5',
        credits: 5,
        price: 49,
        label: '5 Report Credits',
        badge: 'Popular',
        highlight: true,
        pricePerReport: '₹9.8/report',
        color: 'from-indigo-50 to-white dark:from-indigo-950/40 dark:to-slate-800/50',
        border: 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-900/50',
        buttonClass: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25',
    },
    {
        id: 'pack_15',
        credits: 15,
        price: 129,
        label: '15 Report Credits',
        badge: 'Best Value',
        highlight: false,
        pricePerReport: '₹8.6/report',
        color: 'from-emerald-50 to-white dark:from-emerald-950/30 dark:to-slate-800/50',
        border: 'border-emerald-300 dark:border-emerald-700',
        buttonClass: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/25',
    },
    {
        id: 'pack_40',
        credits: 40,
        price: 299,
        label: '40 Report Credits',
        badge: 'Agency',
        highlight: false,
        pricePerReport: '₹7.5/report',
        color: 'from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-800/50',
        border: 'border-amber-300 dark:border-amber-700',
        buttonClass: 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/25',
    },
];

const UPSELL_THRESHOLD = 3; // Show upsell after this many per-report purchases
const PURCHASE_COUNT_KEY = 'nexus_report_purchase_count';

export const ReportPaywallModal: React.FC<ReportPaywallModalProps> = ({
    isOpen,
    onClose,
    onDownloadReady,
    currentUserProfile,
    businessName,
}) => {
    const [loadingPackId, setLoadingPackId] = useState<string | null>(null);
    const [successCredits, setSuccessCredits] = useState<number | null>(null);
    const [purchaseCount, setPurchaseCount] = useState(0);

    useEffect(() => {
        const count = parseInt(localStorage.getItem(PURCHASE_COUNT_KEY) || '0', 10);
        setPurchaseCount(count);
    }, [isOpen]);

    if (!isOpen) return null;

    const userId = currentUserProfile?.userId;
    const credits = currentUserProfile?.creditsAvailable ?? 0;
    const totalSpent = purchaseCount * 15;
    const proSavings = totalSpent >= 30 ? (849 - (totalSpent + 15)) > 0 ? 849 - (totalSpent + 15) : 0 : 0;
    const showUpsell = purchaseCount >= UPSELL_THRESHOLD;

    const handleBuyPack = async (pack: typeof CREDIT_PACKS[0]) => {
        if (!userId) return;
        setLoadingPackId(pack.id);

        try {
            const orderData = await SubscriptionService.createCreditOrder(pack.id);
            if (!orderData) throw new Error('Could not create order');

            const options: any = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'Nexus Analyst',
                description: pack.label,
                handler: async function (response: any) {
                    console.log('Payment success:', response.razorpay_payment_id);

                    // Award credits by incrementing in DB
                    // The webhook handles this server-side, but we also consume 1 credit immediately for download
                    const newCount = purchaseCount + 1;
                    localStorage.setItem(PURCHASE_COUNT_KEY, String(newCount));
                    setPurchaseCount(newCount);

                    setSuccessCredits(pack.credits);
                    
                    // The webhook adds credits asynchronously. We poll to ensure they are added 
                    // before we consume one and trigger the download.
                    let attempts = 0;
                    const pollCredits = setInterval(async () => {
                        attempts++;
                        // Pass a flag to avoid caching if possible, or just rely on direct DB fetch
                        const currentCredits = await SubscriptionService.getCredits(userId);
                        if (currentCredits >= pack.credits || attempts > 10) {
                            clearInterval(pollCredits);
                            setSuccessCredits(null);
                            
                            // Consume 1 credit for this download
                            await SubscriptionService.consumeCredit(userId);
                            onDownloadReady();
                            onClose();
                        }
                    }, 1500);
                },
                prefill: {
                    name: currentUserProfile?.displayName || '',
                    email: currentUserProfile?.email || '',
                },
                theme: { color: '#6366f1' },
                modal: {
                    ondismiss: () => setLoadingPackId(null)
                }
            };

            if (orderData.orderId) options.order_id = orderData.orderId;

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', (r: any) => {
                alert(`Payment Failed: ${r.error.description}`);
                setLoadingPackId(null);
            });
            rzp.open();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
            setLoadingPackId(null);
        }
    };

    const handleUseExistingCredit = async () => {
        if (!userId || credits <= 0) return;
        setLoadingPackId('existing');
        const ok = await SubscriptionService.consumeCredit(userId);
        if (ok) {
            onDownloadReady();
            onClose();
        } else {
            alert('Could not consume credit. Please try again.');
        }
        setLoadingPackId(null);
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/80 backdrop-blur-md"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Success State */}
                {successCredits !== null && (
                    <div className="flex flex-col items-center justify-center p-16 text-center">
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mb-4 animate-bounce">
                            <i className="fas fa-check text-3xl text-emerald-600 dark:text-emerald-400"></i>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Payment Successful!</h3>
                        <p className="text-slate-500 dark:text-slate-400">
                            {successCredits} credit{successCredits > 1 ? 's' : ''} added. Downloading your report…
                        </p>
                    </div>
                )}

                {successCredits === null && (
                    <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                    <i className="fas fa-file-download text-white text-lg"></i>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Download Report</h2>
                                    {businessName && (
                                        <p className="text-sm text-slate-400 dark:text-slate-500 font-medium truncate max-w-xs">{businessName}</p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
                            >
                                <i className="fas fa-times text-slate-500 dark:text-slate-400 text-sm"></i>
                            </button>
                        </div>

                        {/* Upsell Banner */}
                        {showUpsell && (
                            <div className="mt-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-4 flex items-start gap-3 text-white">
                                <i className="fas fa-lightbulb text-yellow-300 mt-0.5 flex-shrink-0"></i>
                                <div>
                                    <p className="font-bold text-sm">
                                        💡 You've spent ₹{totalSpent} on {purchaseCount} reports.
                                    </p>
                                    <p className="text-white/80 text-xs mt-0.5">
                                        Pro Plan gives 50 reports/month for ₹849. You'd save ₹{Math.max(0, totalSpent + 15 - 849)} vs buying separately!
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Existing Credits Banner */}
                        {credits > 0 && (
                            <div className="mt-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center">
                                        <i className="fas fa-coins text-emerald-600 dark:text-emerald-400"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                                            You have {credits} credit{credits !== 1 ? 's' : ''} available!
                                        </p>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-500">Use 1 credit to download this report for free</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleUseExistingCredit}
                                    disabled={loadingPackId === 'existing'}
                                    className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap flex-shrink-0 disabled:opacity-60"
                                >
                                    {loadingPackId === 'existing' ? (
                                        <><i className="fas fa-spinner fa-spin mr-2"></i>Processing…</>
                                    ) : (
                                        <><i className="fas fa-bolt mr-1.5"></i>Use 1 Credit</>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-5">
                            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest">
                                {credits > 0 ? 'Or buy more credits' : 'Choose a plan'}
                            </span>
                            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                        </div>

                        {/* Credit Packs Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {CREDIT_PACKS.map(pack => (
                                <div
                                    key={pack.id}
                                    className={`relative rounded-2xl border-2 p-4 bg-gradient-to-br ${pack.color} ${pack.border} transition-all hover:-translate-y-0.5 hover:shadow-lg`}
                                >
                                    {/* Badge */}
                                    {pack.badge && (
                                        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap uppercase tracking-wider ${pack.highlight ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30' : pack.id === 'pack_15' ? 'bg-emerald-600' : 'bg-amber-500'}`}>
                                            {pack.badge}
                                        </div>
                                    )}

                                    <div className="mt-1">
                                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{pack.label}</p>
                                        <div className="flex items-baseline gap-1 mb-0.5">
                                            <span className="text-2xl font-black text-slate-900 dark:text-white">₹{pack.price}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mb-3">{pack.pricePerReport}</p>
                                        <button
                                            onClick={() => handleBuyPack(pack)}
                                            disabled={loadingPackId !== null}
                                            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60 ${pack.buttonClass}`}
                                        >
                                            {loadingPackId === pack.id ? (
                                                <><i className="fas fa-spinner fa-spin mr-2"></i>Opening…</>
                                            ) : (
                                                `Buy ${pack.credits === 1 ? 'for' : pack.credits + ' for'} ₹${pack.price}`
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pro Upsell Footer */}
                        <div className="mt-5 text-center">
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                Want unlimited downloads?{' '}
                                <button
                                    onClick={onClose}
                                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                                >
                                    Upgrade to Pro — ₹849/month
                                </button>
                                <span className="ml-1">for 50 reports/month</span>
                            </p>
                            <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-2 flex items-center justify-center gap-1.5">
                                <i className="fas fa-shield-alt text-emerald-400"></i>
                                Secure payments via Razorpay · Instant delivery
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
