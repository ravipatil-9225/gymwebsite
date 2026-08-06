import React, { useState, useContext, useEffect } from 'react';
import { Menu, X, Zap, ClipboardCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
    { title: 'HOME', path: '/home' },
    { title: 'SERVICES', path: '/services' },
    { title: 'PACKAGES', path: '/packages' },
    { title: 'TRAINERS', path: '/trainers' },
    { title: 'MEDIA', path: '/media' },
    { title: 'CONTACT', path: '/contact' },
    { title: 'PORTAL', path: '/portal' },
    { title: 'PRODUCTS', path: '/products' },
    { title: 'SMARTNUTRITION HUB', path: '/smart-nutrition' },
    { title: 'SETTINGS', path: '/settings' },
    { title: 'ATTENDANCE', path: '/dashboard', hash: '#attendance', userOnly: true },
];

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const { user, adminUser } = useContext(AuthContext);

    const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password' || location.pathname === '/reset-password';

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => { setIsOpen(false); }, [location.pathname]);

    return (
        <nav
            className={`top-0 w-full z-50 sticky transition-all duration-500 ${
                scrolled
                    ? 'bg-[#050505]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
                    : 'bg-transparent border-b border-transparent'
            }`}
        >
            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-10">
                <div className={`flex items-stretch transition-all duration-500 ${isAuthPage ? 'h-[140px] justify-center pt-8' : 'h-[96px] justify-between'}`}>

                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to={isAuthPage ? '#' : '/home'} className="flex items-center group">
                            <div
                                style={{ height: isAuthPage ? '135px' : '85px', width: isAuthPage ? '135px' : '85px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}
                                className="drop-shadow-[0_0_12px_rgba(212,175,55,0.6)] group-hover:drop-shadow-[0_0_24px_rgba(212,175,55,0.9)] transition-all duration-300 group-hover:scale-105"
                            >
                                <img
                                    src="/logo.png"
                                    alt="Tara Fitness Center"
                                    style={{ height: '100%', width: '100%', objectFit: 'cover', display: 'block' }}
                                />
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    {!isAuthPage && (
                        <div className="hidden xl:flex items-center gap-1">
                            {navItems.map((item) => {
                                if (item.path === '/smart-nutrition' && user?.role !== 'admin' && !adminUser) return null;
                                // Attendance pill — only for logged-in regular users
                                if (item.userOnly) {
                                    if (!user) return null;
                                    const isActive = location.pathname === '/dashboard';
                                    return (
                                        <Link
                                            key="attendance-pill"
                                            to="/dashboard"
                                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-display text-[13px] tracking-[0.05em] uppercase transition-all duration-300 hover:scale-105 active:scale-95 shrink-0 ml-1 ${
                                                isActive
                                                    ? 'bg-primary text-white border-primary shadow-[0_0_12px_rgba(227,74,41,0.4)]'
                                                    : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary hover:text-white hover:shadow-[0_0_12px_rgba(227,74,41,0.4)]'
                                            }`}
                                            title="My Attendance"
                                        >
                                            <ClipboardCheck size={11} />
                                            ATTENDANCE
                                        </Link>
                                    );
                                }
                                if (item.isExternal) {
                                    return (
                                        <a
                                            key={item.path}
                                            href="https://wa.me/917387452750?text=Hi%20Tara%20Fitness!%20I%20just%20registered%20on%20the%20website%20and%20want%20to%20activate%20my%20account."
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white px-2.5 py-1.5 rounded-full border border-[#25D366]/20 transition-all duration-300 font-bold text-[9px] tracking-[0.1em] hover:scale-105 active:scale-95 shrink-0 ml-1 mr-1 shadow-sm uppercase"
                                            title="Connect with us on WhatsApp"
                                        >
                                            <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                                            </svg>
                                            <span>{item.title}</span>
                                        </a>
                                    );
                                }
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`relative px-2 py-2 text-[15px] font-display tracking-[0.08em] uppercase transition-all duration-200 rounded-md group ${
                                            isActive
                                                ? 'text-primary'
                                                : 'text-white/60 hover:text-white'
                                        }`}
                                    >
                                        <span className="relative z-10">{item.title}</span>
                                        {isActive && (
                                            <motion.span
                                                layoutId="nav-active"
                                                className="absolute inset-0 rounded-md bg-primary/10"
                                                style={{ borderBottom: '2px solid #E34A29' }}
                                            />
                                        )}
                                        <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-4/5 rounded-full ${isActive ? 'hidden' : ''}`} />
                                    </Link>
                                );
                            })}
                            {(!user && adminUser) && (
                                <Link
                                    to="/admin"
                                    className="relative px-2 py-2 text-[15px] font-display tracking-[0.08em] uppercase transition-all duration-200 rounded-md text-yellow-400/80 hover:text-yellow-400 group"
                                >
                                    <span className="relative z-10 flex items-center gap-1.5">
                                        <Zap size={11} className="fill-yellow-400" /> ADMIN
                                    </span>
                                    <span className="absolute inset-0 rounded-md bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            )}
                        </div>
                    )}

                    {/* CTA + Mobile Toggle */}
                    {!isAuthPage && (
                        <div className="flex items-center gap-3">
                            <Link
                                to="/join"
                                className="hidden xl:flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs tracking-[0.2em] uppercase px-6 py-2.5 rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(227,74,41,0.4)] hover:shadow-[0_0_30px_rgba(227,74,41,0.6)] hover:-translate-y-0.5"
                            >
                                {user ? 'MEMBERSHIP' : 'JOIN US TODAY'}
                            </Link>

                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="xl:hidden w-10 h-10 flex items-center justify-center text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all bg-white/5 hover:bg-white/10"
                            >
                                {isOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {!isAuthPage && isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="xl:hidden overflow-hidden bg-[#080808]/98 backdrop-blur-xl border-t border-white/[0.06]"
                    >
                        <div className="px-4 py-6 space-y-1">
                             {navItems.map((item, index) => {
                                if (item.path === '/smart-nutrition' && user?.role !== 'admin' && !adminUser) return null;
                                // Attendance pill — mobile
                                if (item.userOnly) {
                                    if (!user) return null;
                                    const isActive = location.pathname === '/dashboard';
                                    return (
                                        <motion.div
                                            key="attendance-mobile"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Link
                                                to="/dashboard"
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-display text-sm tracking-wider border transition-all ${
                                                    isActive
                                                        ? 'bg-primary/15 text-primary border-primary/30'
                                                        : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                                                }`}
                                            >
                                                <ClipboardCheck size={16} />
                                                ATTENDANCE
                                            </Link>
                                        </motion.div>
                                    );
                                }
                                if (item.isExternal) {
                                    return (
                                        <motion.div
                                            key={item.path}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <a
                                                href="https://wa.me/917387452750?text=Hi%20Tara%20Fitness!%20I%20just%20registered%20on%20the%20website%20and%20want%20to%20activate%20my%20account."
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 px-4 py-3 rounded-xl font-display text-sm tracking-wider bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366] hover:text-white transition-all duration-300"
                                            >
                                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                                                </svg>
                                                <span>{item.title}</span>
                                            </a>
                                        </motion.div>
                                    );
                                }
                                const isActive = location.pathname === item.path;
                                return (
                                    <motion.div
                                        key={item.path}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Link
                                            to={item.path}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-display text-sm tracking-wider transition-all ${
                                                isActive
                                                    ? 'bg-primary/15 text-primary border border-primary/20'
                                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                                            {item.title}
                                        </Link>
                                    </motion.div>
                                );
                            })}

                            {(!user && adminUser) && (
                                <Link
                                    to="/admin"
                                    className="flex items-center gap-2 px-4 py-3 rounded-xl font-display text-sm tracking-wider text-yellow-400 hover:bg-yellow-400/10 transition-all"
                                >
                                    <Zap size={13} className="fill-yellow-400" /> ADMIN PANEL
                                </Link>
                            )}

                            <div className="pt-4">
                                <Link
                                    to="/join"
                                    className="block w-full py-4 text-center bg-primary hover:bg-primary-hover text-white font-display font-bold tracking-[0.2em] text-sm rounded-xl shadow-[0_0_20px_rgba(227,74,41,0.3)] transition-all"
                                >
                                    JOIN US TODAY
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
