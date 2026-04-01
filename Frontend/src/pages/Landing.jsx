import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Users,
    Clock,
    ShieldCheck,
    Sparkles,
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    Github,
    Twitter,
    Linkedin,
    Monitor,
    LayoutDashboard,
    Menu,
    X
} from 'lucide-react'

const Landing = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false)

    const features = [
        {
            title: 'Smart Queuing',
            description: 'Join virtual queues from anywhere. No more standing in long lines.',
            icon: <Users className="text-primary" size={24} />,
        },
        {
            title: 'Real-time Updates',
            description: 'Get instant notifications about your queue position and wait time.',
            icon: <Clock className="text-accent" size={24} />,
        },
        {
            title: 'Secure & Private',
            description: 'Your data is encrypted and protected using industry-grade security standards.',
            icon: <ShieldCheck className="text-green-400" size={24} />,
        },
        {
            title: 'Modern Interface',
            description: 'A beautiful and intuitive interface designed to work seamlessly across all devices.',
            icon: <Sparkles className="text-orange-400" size={24} />,
        },
    ]

    const steps = [
        {
            number: '01',
            title: 'Join Queue',
            description: 'Customers join a virtual queue from their phone with a single tap.'
        },
        {
            number: '02',
            title: 'Track Progress',
            description: 'They receive real-time updates on their position and estimated wait.'
        },
        {
            number: '03',
            title: 'Get Called',
            description: "When it's their turn, they receive an instant notification to report."
        }
    ]

    return (
        <div className="bg-background min-h-screen text-slate-100 selection:bg-primary/30">
            {/* Custom Nav for Landing Page */}
            <nav className="fixed top-0 left-0 w-full z-[100] bg-background/50 backdrop-blur-xl border-b border-white/5">
                <div className="container mx-auto px-6 h-20 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Users className="text-white" size={24} />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white">MyTurn</span>
                    </Link>

                    <div className="hidden lg:flex items-center gap-10">
                        {['Features', 'Dashboard', 'How it Works'].map(item => (
                            <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">{item}</a>
                        ))}
                        <Link to="/auth" className="text-sm font-semibold hover:text-primary transition-colors">Sign In</Link>
                        <Link to="/auth?mode=register" className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-full shadow-lg shadow-primary/20 transition-all">Get Started</Link>
                    </div>

                    <button className="lg:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 lg:pt-48 pb-20 overflow-hidden bg-animated-gradient">
                <div className="absolute inset-0 bg-background/20 pointer-events-none"></div>
                <div className="container mx-auto px-6 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-8">
                            <Sparkles size={14} /> Efficiency Reimagined
                        </span>
                        <h1 className="text-5xl lg:text-8xl font-black mb-8 leading-[1.05] tracking-tight">
                            Skip the Line. <br />
                            <span className="text-gradient">Manage Queues Smarter.</span>
                        </h1>
                        <p className="text-lg lg:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                            MyTurn helps businesses manage customer queues digitally with real-time waitlist tracking, smart notifications, and powerful analytics.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-24">
                            <Link to="/auth?mode=register" cl
                                assName="btn-primary flex items-center gap-2">
                                Get Started Free <ArrowRight size={20} />
                            </Link>
                            <button className="btn-secondary">View Demo</button>
                        </div>

                        {/* Responsive Dashboard Mockup */}
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative mx-auto rounded-2xl p-1 bg-white/5 border border-white/10 shadow-[0_0_80px_rgba(30,27,75,0.4)] max-w-5xl overflow-hidden"
                        >
                            <img
                                src="/assets/image.png"
                                alt="Dashboard Interface"
                                className="w-full h-full object-contain rounded-xl opacity-90 hover:opacity-100 transition-opacity"
                            />
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="section-container">
                <div className="text-center mb-20">
                    <h2 className="text-4xl lg:text-6xl font-black mb-6">Built for High Volume</h2>
                    <p className="text-slate-400 max-w-xl mx-auto text-lg leading-relaxed">
                        Industry-grade queue management with zero performance overhead.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, id) => (
                        <div key={id} className="glass-card bg-surface/30 p-10 hover:bg-white/5 group border border-white/5 transition-all">
                            <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:border-primary transition-colors">
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                            <p className="text-slate-400 leading-relaxed text-sm">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Benefits / Illustration Section */}
            <section id="benefits" className="bg-surface/10 py-32 border-y border-white/5">
                <div className="container mx-auto px-6 grid lg:grid-cols-2 items-center gap-24">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl lg:text-7xl font-black mb-10 leading-tight">Designed for <br /><span className="text-primary">Modern Teams</span></h2>
                        <div className="grid gap-8">
                            {[
                                { title: 'Scalable Architecture', text: 'Handles thousands of concurrent users with zero latency.' },
                                { title: 'Predictive Wait Times', text: 'AI-driven estimations keeping your customers informed.' },
                                { title: 'Brand First', text: 'White-labeling options for consistent brand experiences.' },
                                { title: 'Deep Insights', text: 'Powerful analytics dashboard for performance metrics.' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-5">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                        <CheckCircle2 className="text-primary" size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-1">{item.title}</h4>
                                        <p className="text-slate-400 leading-relaxed text-sm">{item.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="glass-card p-2 bg-gradient-to-tr from-white/10 to-transparent border border-white/10 shadow-2xl rounded-[2rem]">
                            <img
                                src="/assets/image copy.png"
                                alt="Analytics View"
                                className="w-full h-auto rounded-[1.5rem] opacity-80"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="section-container">
                <div className="text-center mb-24">
                    <h2 className="text-4xl lg:text-6xl font-black mb-6 tracking-tight">Three Simple Steps</h2>
                    <p className="text-slate-400 text-lg">Effortless for you, seamless for your customers.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-16 lg:gap-24 relative">
                    {steps.map((step, i) => (
                        <div key={i} className="text-center group">
                            <div className="w-20 h-20 bg-surface rounded-3xl flex items-center justify-center mx-auto mb-10 border border-white/5 group-hover:border-primary transition-all duration-700">
                                <span className="text-4xl font-black text-white/20 select-none group-hover:text-primary transition-colors">{step.number}</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                            <p className="text-slate-400 leading-relaxed text-sm max-w-xs mx-auto">{step.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA & Footer */}
            <section className="section-container relative">
                <div className="absolute inset-0 bg-primary/10 blur-[150px] -z-10"></div>
                <div className="glass-card bg-primary/5 border-primary/20 p-20 text-center rounded-[3rem]">
                    <h2 className="text-4xl lg:text-6xl font-black mb-8">Ready to skip the line?</h2>
                    <p className="text-xl text-slate-400 mb-12 max-w-xl mx-auto font-medium">Join the thousands of smart locations managing queues better with MyTurn.</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link to="/auth?mode=register" className="btn-primary w-full sm:w-auto px-12 text-xl">Get Started Now</Link>
                        <button className="btn-secondary w-full sm:w-auto px-12 text-xl font-bold">Contact Sales</button>
                    </div>
                </div>
            </section>

            <footer className="pt-24 pb-12 border-t border-white/5 opacity-80">
                <div className="container mx-auto px-6 h-full flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <Users className="text-primary" />
                        <span className="text-xl font-bold">MyTurn</span>
                    </div>
                    <div className="flex gap-8 text-sm text-slate-400 font-medium tracking-tight">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <div className="flex gap-4 ml-8">
                            <Twitter size={18} className="hover:text-primary" />
                            <Github size={18} className="hover:text-primary" />
                            <Linkedin size={18} className="hover:text-primary" />
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">© {new Date().getFullYear()} MyTurn Inc.</p>
                </div>
            </footer>
        </div>
    )
}

export default Landing
