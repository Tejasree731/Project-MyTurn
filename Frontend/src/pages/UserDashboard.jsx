import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusCircle, Search, Clock, Users, MapPin, LogOut, Ticket, Activity, CreditCard, Coins, CalendarDays, Plus, Minus, Download, CheckCircle2, History, X, Receipt, User, Shield, ExternalLink } from 'lucide-react'
import api from '../utils/api'
import socket from '../utils/socket'

const UserDashboard = () => {
    const navigate = useNavigate()
    const [queues, setQueues] = React.useState([])
    const [loading, setLoading] = React.useState(true)
    const [searchQuery, setSearchQuery] = React.useState('')
    const [joining, setJoining] = React.useState(null)
    const [selectedQueue, setSelectedQueue] = React.useState(null)
    const [tokenInfo, setTokenInfo] = React.useState({ tokens: 0, maxTokens: 5, activeTokens: 0 })
    const [dailyUsage, setDailyUsage] = React.useState({}) // { queueId: count }
    const [quantities, setQuantities] = React.useState({}) // { queueId: selectedQty }
    const [receipt, setReceipt] = React.useState(null) // holds receipt data on success
    const [showHistory, setShowHistory] = React.useState(false)
    const [historyData, setHistoryData] = React.useState([])
    const [broadcasts, setBroadcasts] = React.useState([])
    
    const profileStr = localStorage.getItem('profile')
    const profile = profileStr && profileStr !== 'undefined' ? JSON.parse(profileStr) : {}

    React.useEffect(() => {
        if(showHistory) fetchHistory()
    }, [showHistory])

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/api/payment/history')
            setHistoryData(data)
        } catch (err) {
            console.error('Failed to fetch history')
        }
    }

    React.useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) { navigate('/auth'); return }
        fetchQueues()
        fetchTokenInfo()
        fetchDailyUsage()
        fetchBroadcasts()

        // Socket listener for real-time broadcasts
        socket.connect()
        socket.on('globalBroadcast', (newBroadcast) => {
            setBroadcasts(prev => [newBroadcast, ...prev])
        })

        return () => {
            socket.off('globalBroadcast')
            socket.disconnect()
        }
    }, [])

    const fetchBroadcasts = async () => {
        try {
            const { data } = await api.get('/api/queues/broadcasts')
            setBroadcasts(data)
        } catch (err) {
            console.error('Failed to fetch broadcasts')
        }
    }

    const fetchQueues = async () => {
        try {
            const { data } = await api.get('/api/queues')
            // Init quantities to 1 for all queues
            const qtys = {};
            data.forEach(q => qtys[q._id] = 1);
            setQuantities(qtys);
            setQueues(data)
        } catch (err) {
            console.error('Failed to fetch queues')
        } finally {
            setLoading(false)
        }
    }

    const fetchTokenInfo = async () => {
        try {
            const { data } = await api.get('/api/payment/my-tokens')
            setTokenInfo(data)
        } catch (err) {
            console.error('Failed to fetch token info')
        }
    }

    const fetchDailyUsage = async () => {
        try {
            const { data } = await api.get('/api/payment/daily-usage')
            const usageMap = {}
            data.forEach(item => {
                usageMap[item._id] = item.count
            })
            setDailyUsage(usageMap)
        } catch (err) {
            console.error('Failed to fetch daily usage')
        }
    }

    const getQueueDailyUsage = (queueId) => dailyUsage[queueId] || 0
    const getMaxAllowedQty = (queueId) => Math.max(0, 5 - getQueueDailyUsage(queueId))

    const updateQuantity = (queueId, delta) => {
        setQuantities(prev => {
            const current = prev[queueId] || 1;
            const maxAllowed = getMaxAllowedQty(queueId);
            const next = current + delta;
            
            if (next >= 1 && next <= maxAllowed) {
                return { ...prev, [queueId]: next };
            }
            return prev;
        });
    }

    const isQueueLimitReached = (queueId) => {
        return getQueueDailyUsage(queueId) >= 5
    }

    const joinQueue = async (queueId) => {
        const qty = quantities[queueId] || 1;

        if (isQueueLimitReached(queueId) || qty > getMaxAllowedQty(queueId)) {
            alert('Daily limit reached for this queue! Max 5 tokens per queue per day.')
            return
        }

        setJoining(queueId)
        try {
            // Step 1: Create Razorpay order with Quantity
            const { data: orderData } = await api.post('/api/payment/create-order', { queueId, quantity: qty })

            // Step 2: Open Razorpay Checkout popup
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'MyTurn',
                description: `Purchase ${qty} Tokens for ${orderData.queueName}`,
                order_id: orderData.orderId,
                prefill: {
                    name: orderData.userName || profile.username || '',
                    email: orderData.userEmail || ''
                },
                theme: {
                    color: '#6366f1'
                },
                handler: async function (response) {
                    try {
                        // Step 3: Verify payment on backend
                        const { data: verifyData } = await api.post('/api/payment/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            queueId
                        })

                        if (verifyData.success) {
                            setTokenInfo(prev => ({ ...prev, tokens: prev.tokens + qty }))
                            setDailyUsage(prev => ({ ...prev, [queueId]: (prev[queueId] || 0) + qty }))
                            
                            // Show Receipt Modal
                            setReceipt({
                                ...verifyData,
                                queueId,
                                date: new Date().toLocaleString()
                            })
                        }
                    } catch (err) {
                        alert(err.response?.data?.message || 'Payment verification failed')
                    }
                },
                modal: {
                    ondismiss: function () {
                        setJoining(null)
                    }
                }
            }

            const rzp = new window.Razorpay(options)
            rzp.on('payment.failed', function (response) {
                alert('Payment failed. Please try again.')
                setJoining(null)
            })
            rzp.open()
            setSelectedQueue(null)

        } catch (err) {
            alert(err.response?.data?.message || 'Failed to initiate payment')
            setJoining(null)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        localStorage.removeItem('profile')
        navigate('/auth')
    }

    const printReceipt = (h) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to download the receipt.');
            return;
        }

        const date = new Date(h.createdAt).toLocaleString();
        const html = `
            <html>
                <head>
                    <title>MyTurn Receipt - ${h.razorpayOrderId}</title>
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; max-width: 600px; margin: 0 auto; }
                        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                        .header h1 { margin: 0; font-size: 28px; }
                        .header p { color: #666; margin: 5px 0 0 0; }
                        .row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
                        .label { font-weight: bold; color: #666; width: 40%; }
                        .val { flex: 1; text-align: right; }
                        .total { font-size: 20px; font-weight: bold; margin-top: 30px; border-top: 2px solid #333; padding-top: 20px; display: flex; justify-content: space-between; }
                        .footer { margin-top: 50px; text-align: center; color: #888; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>MyTurn Queue Receipt</h1>
                        <p>Transaction ID: ${h.razorpayOrderId}</p>
                    </div>
                    
                    <div class="row">
                        <div class="label">Date</div>
                        <div class="val">${date}</div>
                    </div>
                    <div class="row">
                        <div class="label">Queue</div>
                        <div class="val">${h.queueId?.name || 'N/A'}</div>
                    </div>
                    <div class="row">
                        <div class="label">Tokens Included</div>
                        <div class="val">${h.quantity}</div>
                    </div>
                    
                    <div class="total">
                        <div>Amount Settled</div>
                        <div>₹${h.amount / 100}</div>
                    </div>
                    
                    <div class="footer">
                        Securely routed. Thank you for using MyTurn!
                    </div>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    }

    const filteredQueues = queues.filter(q =>
        q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.organization.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-background relative overflow-x-hidden">
            {/* Receipt Modal Overlay */}
            <AnimatePresence>
                {receipt && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-surface border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full blur-2xl -z-10"></div>
                            
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h2 className="text-2xl font-bold">Payment Successful!</h2>
                                <p className="text-slate-400 text-sm mt-1">Your tokens have been securely generated.</p>
                            </div>

                            <div className="bg-background/80 rounded-2xl p-5 mb-6 border border-white/5 space-y-3 font-mono text-sm">
                                <div className="flex justify-between border-b border-white/5 pb-3">
                                    <span className="text-slate-500">Receipt ID:</span>
                                    <span className="font-bold tracking-wider">{receipt.transactionId}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-3">
                                    <span className="text-slate-500">Queue:</span>
                                    <span className="font-bold text-right pl-4">{receipt.queueName}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-3">
                                    <span className="text-slate-500">Tokens Purchased:</span>
                                    <span className="font-bold text-cyan-400">{receipt.quantity}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-3">
                                    <span className="text-slate-500">Amount Paid:</span>
                                    <span className="font-bold text-green-400">₹{receipt.amount / 100}</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span className="text-slate-500">Your Tickets:</span>
                                    <div className="flex flex-wrap gap-2 justify-end">
                                        {receipt.tickets.map(t => (
                                            <span key={t} className="bg-primary/20 text-primary px-2 py-0.5 rounded-md font-bold">#{t}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => window.print()}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-surface-hover border border-white/5 text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download size={18} /> Print
                                </button>
                                <button 
                                    onClick={() => navigate(`/queue/${receipt.queueId}`)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg transition-colors"
                                >
                                    Proceed to Queue
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Queue Details / Interaction Modal */}
            <AnimatePresence>
                {selectedQueue && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="bg-surface border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="bg-background/80 p-5 flex justify-between items-center border-b border-white/5">
                                <h3 className="text-xl font-bold flex items-center gap-2"><MapPin size={20} className="text-primary"/> Queue Hub</h3>
                                <button onClick={() => setSelectedQueue(null)} className="text-slate-400 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div className="p-6">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-background mx-auto flex items-center justify-center border border-white/5 shadow-inner mb-3">
                                        <Users size={32} className="text-primary/80" />
                                    </div>
                                    <h2 className="text-2xl font-black">{selectedQueue.name}</h2>
                                    <p className="text-slate-400">{selectedQueue.organization}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-background/80 p-4 rounded-xl border border-white/5 text-center">
                                        <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Queue Load</p>
                                        <p className="text-2xl font-bold text-white">{selectedQueue.entries?.length || 0} <span className="text-sm font-normal text-slate-400">Waiting</span></p>
                                    </div>
                                    <div className="bg-background/80 p-4 rounded-xl border border-white/5 text-center">
                                        <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Est. Wait</p>
                                        <p className="text-2xl font-bold text-primary">{(selectedQueue.entries?.length || 0) * 5} <span className="text-sm font-normal">mins</span></p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mb-6 px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <CreditCard size={18} className="text-primary" />
                                        <span className="text-sm font-bold text-primary">₹5 per token</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Coins size={16} className={getQueueDailyUsage(selectedQueue._id) >= 5 ? 'text-red-400' : 'text-amber-400'} />
                                        <span className={`text-sm font-bold ${getQueueDailyUsage(selectedQueue._id) >= 5 ? 'text-red-400' : 'text-amber-300'}`}>
                                            {getQueueDailyUsage(selectedQueue._id)}/5 Daily Limit
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 bg-background/50 border border-white/10 rounded-xl flex items-center overflow-hidden">
                                        <button 
                                            onClick={() => updateQuantity(selectedQueue._id, -1)}
                                            disabled={(quantities[selectedQueue._id] || 1) <= 1 || getQueueDailyUsage(selectedQueue._id) >= 5}
                                            className="w-12 h-14 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
                                        >
                                            <Minus size={20} />
                                        </button>
                                        <div className="w-10 text-center font-bold text-white text-lg select-none">
                                            {getQueueDailyUsage(selectedQueue._id) >= 5 ? 0 : (quantities[selectedQueue._id] || 1)}
                                        </div>
                                        <button 
                                            onClick={() => updateQuantity(selectedQueue._id, 1)}
                                            disabled={(quantities[selectedQueue._id] || 1) >= getMaxAllowedQty(selectedQueue._id) || getQueueDailyUsage(selectedQueue._id) >= 5}
                                            className="w-12 h-14 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => joinQueue(selectedQueue._id)}
                                        disabled={selectedQueue.status !== 'open' || joining === selectedQueue._id || getQueueDailyUsage(selectedQueue._id) >= 5}
                                        className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                                            getQueueDailyUsage(selectedQueue._id) >= 5
                                            ? 'bg-red-500/10 text-red-400 cursor-not-allowed border border-red-500/20'
                                            : selectedQueue.status === 'open'
                                            ? 'bg-primary flex items-center justify-center gap-2 hover:bg-primary-hover text-white shadow-xl shadow-primary/20 active:scale-[0.98]'
                                            : 'bg-surface text-slate-500 cursor-not-allowed border border-white/5'
                                        }`}
                                    >
                                        {getQueueDailyUsage(selectedQueue._id) >= 5 ? (
                                            <><Coins size={20} /> Limit Reached</>
                                        ) : joining === selectedQueue._id ? (
                                            <><Activity size={20} className="animate-spin" /> Processing...</>
                                        ) : selectedQueue.status === 'open' ? (
                                            <><CreditCard size={20} /> Pay ₹{(quantities[selectedQueue._id] || 1) * 5}</>
                                        ) : (
                                            'Temporarily Closed'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Payment History Slide-Over Modal */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-end bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-surface border-l border-white/10 w-full max-w-md h-full shadow-2xl overflow-y-auto flex flex-col"
                        >
                            <div className="p-6 border-b border-white/5 flex justify-between items-center sticky top-0 bg-surface/80 backdrop-blur-md z-10">
                                <h2 className="text-xl font-bold flex items-center gap-2"><History size={20} className="text-cyan-400" /> Transaction History</h2>
                                <button onClick={() => setShowHistory(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4 flex-1">
                                {historyData.length > 0 ? historyData.map(h => (
                                    <div key={h._id} className="bg-background/50 border border-white/5 rounded-2xl p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="font-bold text-white">{h.queueId?.name || 'Unknown Queue'}</h4>
                                                <p className="text-[11px] text-slate-500">{new Date(h.createdAt).toLocaleString()}</p>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-1 rounded uppercase bg-green-500/10 text-green-400">Success</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="bg-surface p-2 rounded-lg">
                                                <p className="text-[10px] uppercase text-slate-500 mb-0.5 font-bold">Tokens</p>
                                                <p className="font-medium text-cyan-400">{h.quantity}</p>
                                            </div>
                                            <div className="bg-surface p-2 rounded-lg">
                                                <p className="text-[10px] uppercase text-slate-500 mb-0.5 font-bold">Amount Paid</p>
                                                <p className="font-medium">₹{h.amount / 100}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 flex items-center justify-between border-t border-white/5">
                                            <div className="font-mono text-[10px] text-slate-500 truncate select-all">
                                                TXN: {h.razorpayOrderId}
                                            </div>
                                            <button 
                                                onClick={() => printReceipt(h)}
                                                className="text-[10px] uppercase font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                                            >
                                                <Download size={10} /> PDF
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-20 text-slate-500">
                                        <Receipt size={40} className="mx-auto mb-4 opacity-30" />
                                        <p>No transaction history found.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {broadcasts.length > 0 && (
                <div className="bg-primary/20 border-b border-primary/30 backdrop-blur-md">
                    <div className="container mx-auto px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="flex w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            <span className="text-sm font-bold text-primary">System Global Broadcast</span>
                            <span className="text-sm text-slate-300 ml-2 border-l border-white/10 pl-4">{broadcasts[0].message}</span>
                        </div>
                        <button onClick={() => setBroadcasts(prev => prev.slice(1))} className="text-slate-400 hover:text-white transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-6 py-10">
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black mb-3 text-text">Find a Queue</h1>
                        <p className="text-slate-400 text-lg">Browse available virtual queues and buy multiple tokens at once.</p>
                    </div>
                    <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-glass-border hover:border-primary/50 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors rounded-xl font-bold shadow-sm">
                        <History size={18} /> View Transaction History
                    </button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 p-5 bg-surface/40 border border-white/5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
                            <CreditCard size={24} className="text-amber-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-300">Queue Token System</h3>
                            <p className="text-xs text-slate-500">₹5 per token • Max 5 tokens per queue per day • Instant receipt</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="flex items-center gap-3 bg-background/60 border border-white/5 rounded-xl px-4 py-2.5">
                            <CalendarDays size={16} className="text-indigo-400" />
                            <div>
                                <p className="text-xs text-slate-500">Today's Total</p>
                                <p className="text-sm font-bold text-white">{tokenInfo.tokens} tokens purchased</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="relative w-full max-w-md mb-10">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search by queue name or organization..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-surface border border-white/5 rounded-xl text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-colors"
                    />
                </div>

                {loading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-surface/50 rounded-2xl animate-pulse border border-white/5"></div>
                        ))}
                    </div>
                ) : filteredQueues.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredQueues.map((queue, index) => {
                            const queueUsage = getQueueDailyUsage(queue._id)
                            const maxAllowed = getMaxAllowedQty(queue._id)
                            const limitReached = queueUsage >= 5
                            const currentQty = quantities[queue._id] || 1

                            return (
                                <motion.div
                                    key={queue._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => setSelectedQueue(queue)}
                                    className="bg-surface/40 border border-white/5 rounded-2xl p-6 hover:border-primary/50 transition-all cursor-pointer group flex flex-col"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center border border-white/5 shadow-inner">
                                                <Users size={24} className="text-primary/70" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold truncate pr-2 max-w-[140px]">{queue.name}</h3>
                                                <p className="text-sm text-slate-400 flex items-center gap-1"><MapPin size={12} /> {queue.organization}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase shrink-0 ${queue.status === 'open' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {queue.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-slate-400 mt-2">
                                        <span>Click to view details</span>
                                        <Activity size={16} className="text-primary group-hover:scale-110 transition-transform"/>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="bg-surface/30 border border-white/5 rounded-2xl py-20 text-center">
                        <Search size={48} className="mx-auto mb-4 text-slate-600" />
                        <h3 className="text-xl font-bold mb-2">No Queues Found</h3>
                        <p className="text-slate-500">Try a different search or check back later.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default UserDashboard
