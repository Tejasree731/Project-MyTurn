import React from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, ShieldCheck, ArrowRight, Github, Chrome } from 'lucide-react'
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
      
      // Store token
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', isAdmin ? 'admin' : 'user')
      localStorage.setItem('profile', JSON.stringify(data.admin || data.user))

      // Navigate
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-lg w-full p-10 bg-surface/40"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-primary" size={32} />
          </div>
          <h2 className="text-3xl font-bold mb-2">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-text-muted">
            {isRegister ? 'Join the future of queuing today.' : 'Please sign in to continue.'}
          </p>
        </div>

        {/* Toggle Admin/User */}
        <div className="flex bg-background/50 p-1 rounded-xl mb-8 border border-glass-border">
          <button 
            type="button"
            onClick={() => setIsAdmin(false)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${!isAdmin ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text'}`}
          >
            I'm a User
          </button>
          <button 
            type="button"
            onClick={() => setIsAdmin(true)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${isAdmin ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text'}`}
          >
            I'm an Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            {isRegister && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {isAdmin ? (
                  <>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                      <input 
                        type="text" 
                        name="name"
                        placeholder="Full Name" 
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-12" 
                      />
                    </div>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                      <input 
                        type="text" 
                        name="organizationName"
                        placeholder="Organization Name" 
                        required
                        value={formData.organizationName}
                        onChange={handleChange}
                        className="w-full pl-12" 
                      />
                    </div>
                  </>
                ) : (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                    <input 
                      type="text" 
                      name="username"
                      placeholder="Username" 
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full pl-12" 
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
            <input 
              type="email" 
              name="email"
              placeholder="Email Address" 
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-12" 
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
            <input 
              type="password" 
              name="password"
              placeholder="Password" 
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-12" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Sign In')}
            <ArrowRight size={20} />
          </button>
        </form>

        {error && (
            <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="mt-4 text-center text-danger text-sm font-medium"
            >
                {error}
            </motion.p>
        )}

        <div className="mt-8 pt-8 border-t border-glass-border">
          <p className="text-center text-text-muted">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            {' '}
            <Link to={isRegister ? '/auth' : '/auth?mode=register'} className="text-primary font-bold hover:underline">
              {isRegister ? 'Sign In' : 'Sign Up'}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Auth
