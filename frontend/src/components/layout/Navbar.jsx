import React, { useState, useContext, useEffect } from 'react';
import { Menu, X, Zap } from 'lucide-react';
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
    { title: 'SMARTNUTRITION HUB', path: '/smart-nutrition' },
    { title: 'SETTINGS', path: '/settings' },
];

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const { user } = useContext(AuthContext);

    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

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
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`relative px-3 py-2 text-[11px] font-bold tracking-[0.18em] uppercase transition-all duration-200 rounded-md group ${
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
                            {user?.role === 'admin' && (
                                <Link
                                    to="/admin"
                                    className="relative px-3 py-2 text-[11px] font-bold tracking-[0.18em] uppercase transition-all duration-200 rounded-md text-yellow-400/80 hover:text-yellow-400 group"
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
                                JOIN US TODAY
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

                            {user?.role === 'admin' && (
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
