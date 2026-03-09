import React, { useState, useContext } from 'react';
import { Menu, X, Dumbbell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const navItems = [
    { title: 'HOME', path: '/home' },
    { title: 'SERVICES', path: '/services' },
    { title: 'PACKAGES', path: '/packages' },
    { title: 'TRAINERS', path: '/trainers' },
    { title: 'MEDIA', path: '/media' },
    { title: 'CONTACT', path: '/contact' },
    { title: 'MEMBER PORTAL', path: '/portal' },
    { title: 'SETTINGS', path: '/settings' },
];

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { user } = useContext(AuthContext);

    // Check if the current route is Login or Register
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    return (
        <nav className="bg-dark backdrop-blur-md border-b border-white/5 top-0 w-full z-40 sticky">
            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`flex items-stretch h-20 ${isAuthPage ? 'justify-center' : 'justify-between'}`}>

                    {/* Logo Section */}
                    <div className="flex items-center">
                        <Link to={isAuthPage ? "#" : "/home"} onClick={() => setIsOpen(false)} className="flex items-center gap-2">
                            <div className="text-primary flex items-center justify-center">
                                <Dumbbell size={36} strokeWidth={2.5} />
                            </div>
                            <span className="font-display font-bold text-2xl md:text-3xl tracking-widest text-white mt-1">
                                TARA <span className="text-primary font-light">FITNESS</span>
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Menu - Hidden on Auth Pages */}
                    {!isAuthPage && (
                        <div className="hidden xl:flex items-center space-x-5">
                            {navItems.map((item, index) => (
                                <Link
                                    key={index}
                                    to={item.path}
                                    className={`nav-link py-8 text-sm relative group overflow-hidden ${location.pathname === item.path ? 'text-primary' : ''}`}
                                >
                                    <span className="relative z-10 whitespace-nowrap">{item.title}</span>
                                    <span className={`absolute bottom-6 left-0 w-full h-0.5 bg-primary transform origin-left transition-transform duration-300 ${location.pathname === item.path ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* CTA & Mobile Toggle - Hidden on Auth Pages */}
                    {!isAuthPage && (
                        <div className="flex items-stretch">
                            {user ? (
                                <Link to="/join" className="hidden xl:flex items-center bg-primary hover:bg-primary-hover text-white font-display font-bold px-8 tracking-[0.2em] transition-colors h-full text-lg shadow-[0_0_20px_rgba(227,74,41,0.3)] whitespace-nowrap">
                                    JOIN US TODAY
                                </Link>
                            ) : (
                                <Link to="/join" className="hidden xl:flex items-center bg-primary hover:bg-primary-hover text-white font-display font-bold px-8 tracking-[0.2em] transition-colors h-full text-lg shadow-[0_0_20px_rgba(227,74,41,0.3)] whitespace-nowrap">
                                    JOIN US TODAY
                                </Link>
                            )}
                            <div className="flex items-center xl:hidden px-4">
                                <button
                                    onClick={() => setIsOpen(!isOpen)}
                                    className="text-white hover:text-primary p-2 focus:outline-none transition-colors border border-white/10 rounded-lg"
                                >
                                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Mobile Menu - Hidden on Auth Pages */}
            {!isAuthPage && isOpen && (
                <div className="xl:hidden bg-dark-card border-t border-white/5 max-h-[calc(100vh-80px)] overflow-y-auto">
                    <div className="px-4 py-6 space-y-2">
                        {/* Navigation Links */}
                        {navItems.map((item, index) => (
                            <div key={index} className="border-b border-white/5 last:border-0 pb-2">
                                <Link
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`block px-2 py-3 font-display font-medium tracking-widest transition-colors ${location.pathname === item.path ? 'text-primary' : 'text-white hover:text-primary'}`}
                                >
                                    {item.title}
                                </Link>
                            </div>
                        ))}

                        <div className="pt-6 pb-4">
                            <Link
                                to="/join"
                                onClick={() => setIsOpen(false)}
                                className="block w-full py-4 text-center bg-primary hover:bg-primary-hover text-white font-display font-bold tracking-[0.2em] text-lg rounded-sm shadow-[0_0_15px_rgba(227,74,41,0.3)] transition-colors"
                            >
                                JOIN US TODAY
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
