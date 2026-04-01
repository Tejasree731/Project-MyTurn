import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Building, History, Receipt, CreditCard, Clock, CheckCircle2 } from 'lucide-react'
import api from '../utils/api'
import { motion } from 'framer-motion'

const Profile = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = React.useState(true)
    const [profileData, setProfileData] = React.useState(null)
    const [historyData, setHistoryData] = React.useState([])
    const role = localStorage.getItem('role') || 'user'

    React.useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) { navigate('/auth'); return }

        if (role === 'admin') {
            fetchAdminProfile()
        } else {
            fetchUserProfile()
            fetchHistory()
        }
    }, [role, navigate])

    const fetchAdminProfile = async () => {
        try {
            const { data } = await api.get('/api/admin/profile')
            setProfileData(data)
        } catch (err) {
            console.error('Failed to fetch admin profile')
        } finally {
            setLoading(false)
        }
    }

    const fetchUserProfile = () => {
       // Since user side does not have a dedicated getProfile endpoint, we use token decode or local storage cache
       const localProfile = localStorage.getItem('profile')
       if(localProfile && localProfile !== 'undefined') {
           setProfileData(JSON.parse(localProfile))
       }
       setLoading(false)
    }

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/api/payment/history')
            setHistoryData(data)
        } catch (err) {
            console.error('Failed to fetch history')
        }
    }

    const handleLogout = () => {
        localStorage.clear()
        navigate('/auth')
    }

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading Profile...</div>

    return (
        <div className="min-h-screen bg-background relative selection:bg-primary/30">
            {/* Top Bar Navigation */}
            <div className="bg-surface/50 border-b border-white/5 sticky top-0 z-50 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-16 flex justify-between items-center">
                    <Link to={role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={18} /> Back to Dashboard
                    </Link>
                    <span className="font-bold">Account Settings</span>
                </div>
            </div>

            <div className="container mx-auto px-6 py-12 max-w-4xl">
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Left: Profile Information Card */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-surface/40 border border-white/5 rounded-3xl p-6 text-center select-none shadow-xl">
                            <div className="w-24 h-24 bg-gradient-to-br from-primary to-cyan-400 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold border-4 border-background shadow-lg shadow-primary/20">
                                {(profileData?.name || profileData?.username || 'U')[0].toUpperCase()}
                            </div>
                            <h2 className="text-xl font-bold capitalize">{profileData?.name || profileData?.username || 'User Profile'}</h2>
                            <p className="text-sm text-slate-500 mb-6 uppercase tracking-wider font-semibold bg-white/5 inline-block px-3 py-1 rounded-full mt-2">
                                {role === 'admin' ? 'Administrator' : 'Standard User'}
                            </p>
                            
                            <div className="space-y-4 text-left">
                                <div className="bg-background/50 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                                    <Mail size={16} className="text-slate-400" />
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Email Address</p>
                                        <p className="text-sm font-medium truncate">{profileData?.email || 'N/A'}</p>
                                    </div>
                                </div>
                                {role === 'admin' && (
                                    <div className="bg-background/50 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                                        <Building size={16} className="text-slate-400" />
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold">Organization</p>
                                            <p className="text-sm font-medium truncate">{profileData?.organizationName || 'N/A'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button onClick={handleLogout} className="mt-8 w-full py-3 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-xl font-bold transition-colors">
                                Sign Out Everywhere
                            </button>
                        </div>
                    </div>

                    {/* Right: Data / History */}
                    <div className="md:col-span-2">
                        {role === 'user' ? (
                            <div className="bg-surface/40 border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                                    <History className="text-primary" size={24} /> Payment & Booking History
                                </h3>
                                
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {historyData.length > 0 ? historyData.map((tx, i) => (
                                        <motion.div 
                                            key={tx._id} 
                                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                            className="bg-background/80 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-bold text-lg">{tx.queueId?.name || 'Deleted Queue'}</h4>
                                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                        <Clock size={12} /> {new Date(tx.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1">
                                                    <CheckCircle2 size={12} /> Success
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-surface p-3 rounded-xl border border-white/5 relative overflow-hidden">
                                                    <CreditCard size={40} className="absolute -right-2 -bottom-2 text-white/5" />
                                                    <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Amount Paid</p>
                                                    <p className="text-xl font-black text-white">₹{tx.amount / 100}</p>
                                                </div>
                                                <div className="bg-surface p-3 rounded-xl border border-white/5 relative overflow-hidden">
                                                    <Receipt size={40} className="absolute -right-2 -bottom-2 text-white/5" />
                                                    <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Tokens Issued</p>
                                                    <p className="text-xl font-black text-cyan-400">{tx.quantity}</p>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                                                <span className="text-[10px] text-slate-500 font-mono">TXN:</span>
                                                <span className="text-xs font-mono text-slate-400 selection:bg-primary/30">{tx.razorpayOrderId}</span>
                                            </div>
                                        </motion.div>
                                    )) : (
                                        <div className="text-center py-20 text-slate-500 bg-background/30 rounded-2xl border border-dashed border-white/10">
                                            <Receipt size={48} className="mx-auto mb-4 opacity-50" />
                                            <p className="font-medium text-lg text-slate-400">No transactions recorded.</p>
                                            <p className="text-sm">When you book tokens, your receipts will appear here perpetually.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                           <div className="bg-surface/40 border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl flex items-center justify-center min-h-[400px] text-center">
                               <div>
                                    <Building size={64} className="mx-auto mb-6 text-primary opacity-50" />
                                    <h3 className="text-2xl font-bold mb-2">Welcome, Admin.</h3>
                                    <p className="text-slate-400 max-w-sm mx-auto">Your organization's configuration and security settings are currently optimized. Head back to the dashboard to manage live virtual queues.</p>
                               </div>
                           </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile
