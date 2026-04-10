import React from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, ShieldCheck, ArrowRight, Github, Chrome, XCircle } from 'lucide-react'
import api from '../utils/api'

const Auth = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isRegister = searchParams.get('mode') === 'register'
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  
  const [formData, setFormData] = React.useState({
    username: '',
    name: '',
    email: '',
    password: '',
    organizationName: '',
  })

  // Handle OAuth Redirect
  React.useEffect(() => {
    const token = searchParams.get('token');
    const userData = searchParams.get('user');

    if (token && userData) {
      try {
        const decodedUser = JSON.parse(decodeURIComponent(userData));
        localStorage.setItem('token', token);
        localStorage.setItem('role', decodedUser.role || 'user');
        localStorage.setItem('profile', JSON.stringify(decodedUser));
        navigate(decodedUser.role === 'admin' ? '/admin' : '/dashboard');
      } catch (err) {
        setError('Google login failed. Please try again.');
      }
    }
  }, [searchParams, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
    const role = isAdmin ? 'admin' : 'user';
    
    // If we're on a separate port/domain, we need the full URL
    // If apiUrl is empty, it assumes relative path (handled by proxy in dev)
    const targetUrl = apiUrl 
      ? `${apiUrl}/api/auth/google?role=${role}`
      : `/api/auth/google?role=${role}`;
      
    window.location.href = targetUrl;
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const endpoint = isAdmin 
        ? `/api/admin/${isRegister ? 'register' : 'login'}`
        : `/api/auth/${isRegister ? 'register' : 'login'}`
      
      const payload = isRegister 
        ? (isAdmin 
            ? { name: formData.name, email: formData.email, password: formData.password, organizationName: formData.organizationName }
            : { username: formData.username, email: formData.email, password: formData.password })
        : { email: formData.email, password: formData.password }

      const { data } = await api.post(endpoint, payload)
      
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', isAdmin ? 'admin' : 'user')
      localStorage.setItem('profile', JSON.stringify(data.admin || data.user))

      navigate(isAdmin ? '/admin' : '/dashboard')
      
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-6 py-20 flex items-center justify-center min-h-[80vh]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card max-w-lg w-full p-10 bg-surface/40 border-white/5 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
            <Lock className="text-primary" size={40} />
          </div>
          <h2 className="text-3xl font-bold mb-2 tracking-tight">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-slate-400">
            {isRegister ? 'Join the future of queuing today.' : 'Please sign in to continue.'}
          </p>
        </div>

        {/* Toggle Admin/User */}
        <div className="flex bg-background/50 p-1 rounded-2xl mb-8 border border-white/5">
          <button 
            type="button"
            onClick={() => setIsAdmin(false)}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!isAdmin ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            User Access
          </button>
          <button 
            type="button"
            onClick={() => setIsAdmin(true)}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isAdmin ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Admin Panel
          </button>
        </div>

        {/* Google Logic */}
        <>
          <button 
            onClick={handleGoogleLogin}
            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-bold flex items-center justify-center gap-3 transition-all mb-6 group"
          >
            <Chrome size={20} className="text-primary group-hover:rotate-[360deg] transition-transform duration-700" />
            Continue with Google
          </button>
          <div className="relative mb-8 text-center text-xs text-slate-500 uppercase font-black tracking-[0.2em]">
             <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -z-10"></div>
             <span className="bg-[#0f172a] px-4">Or use email</span>
          </div>
        </>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            {isRegister && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-5"
              >
                {isAdmin ? (
                  <>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                      <input 
                        type="text" 
                        name="name"
                        placeholder="Organization Admin Name" 
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-12 bg-background/50 border-white/5 focus:border-primary/50" 
                      />
                    </div>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                      <input 
                        type="text" 
                        name="organizationName"
                        placeholder="Full Organization Name" 
                        required
                        value={formData.organizationName}
                        onChange={handleChange}
                        className="w-full pl-12 bg-background/50 border-white/5 focus:border-primary/50" 
                      />
                    </div>
                  </>
                ) : (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input 
                      type="text" 
                      name="username"
                      placeholder="Username (e.g. rahul_01)" 
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full pl-12 bg-background/50 border-white/5 focus:border-primary/50" 
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="email" 
              name="email"
              placeholder="Primary Email" 
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-12 bg-background/50 border-white/5 focus:border-primary/50" 
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="password" 
              name="password"
              placeholder="Secure Password" 
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-12 bg-background/50 border-white/5 focus:border-primary/50" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? 'Authenticating...' : (isRegister ? 'Set Up Account' : 'Get Started')}
            <ArrowRight size={20} className={loading ? '' : 'group-hover:translate-x-1 transition-transform'} />
          </button>
        </form>

        {error && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-red-400 text-sm font-bold flex items-center justify-center gap-2"
            >
                <XCircle size={16} />
                {error}
            </motion.div>
        )}

        <div className="mt-8 pt-8 border-t border-white/5">
          <p className="text-center text-slate-400">
            {isRegister ? 'Already part of MyTurn?' : "New here?"}
            {' '}
            <Link to={isRegister ? '/auth' : '/auth?mode=register'} className="text-primary font-bold hover:text-white transition-colors">
              {isRegister ? 'Enter Application' : 'Become a Member'}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Auth
