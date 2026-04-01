import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, UserCog, Calendar, CalendarClock, PhoneCall, MessageSquare, Image, HandCoins, FileText, Settings, LogOut, Menu, X, Coins, Settings2, BarChart2
} from 'lucide-react';

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('gymToken');
        localStorage.removeItem('gymUser');
        navigate('/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Summary Dashboard', href: '/admin/summary', icon: BarChart2 },
        { name: 'User Management', href: '/admin/users', icon: Users },
        { name: 'Enquiries', href: '/admin/enquiries', icon: PhoneCall },
        { name: 'Class Bookings', href: '/admin/classes', icon: Calendar },
        { name: 'PT Sessions', href: '/admin/pt-sessions', icon: CalendarClock },
        { name: 'Trainer Management', href: '/admin/trainers', icon: UserCog },
        { name: 'Payments', href: '/admin/payments', icon: HandCoins },
        { name: 'Packages Management', href: '/admin/packages', icon: HandCoins },
        { name: 'Offers Management', href: '/admin/offers', icon: Coins },
        { name: 'Gallery Management', href: '/admin/gallery', icon: Image },
        { name: 'Feedback', href: '/admin/feedback', icon: MessageSquare },
        { name: 'Documents', href: '/admin/documents', icon: FileText },
        { name: 'Content CMS', href: '/admin/cms', icon: Settings2 },
    ];

    const isActive = (path) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="flex bg-gray-50 min-h-screen">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:flex border-r border-gray-200
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full w-full">
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between h-16 px-6 bg-gray-900 text-white">
                        <span className="text-xl font-bold tracking-wider text-primary">TARA FITNESS</span>
                        <button className="lg:hidden text-white hover:text-gray-300" onClick={() => setSidebarOpen(false)}>
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto bg-gray-900 text-gray-300">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
                            Admin Menu
                        </div>
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                      flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                                      ${isActive(item.href)
                                            ? 'bg-primary text-white'
                                            : 'hover:bg-gray-800 hover:text-white'
                                        }
                                  `}
                                >
                                    <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive(item.href) ? 'text-white' : 'text-gray-400'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="p-4 bg-gray-900 border-t border-gray-800">
                        <Link to="/" className="flex items-center px-4 py-3 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors mb-2">
                            <LayoutDashboard className="w-5 h-5 mr-3 text-gray-400" /> Back to Website
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-400 rounded-lg hover:bg-gray-800 hover:text-red-300 transition-colors"
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-0 overflow-hidden text-gray-900 bg-gray-50">
                {/* Mobile Header */}
                <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 lg:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 text-gray-500 rounded-md hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="text-lg font-bold">Admin Panel</span>
                    <div className="w-8"></div> {/* Spacer */}
                </header>

                {/* Desktop Header */}
                <header className="hidden lg:flex items-center justify-between h-16 px-8 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full text-xs">
                          <span className="w-2 h-2 inline-block bg-green-500 rounded-full mr-2"></span>Admin Active
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{localStorage.getItem('gymUser') ? JSON.parse(localStorage.getItem('gymUser')).name : 'Admin'}</p>
                          <p className="text-[10px] text-gray-500 font-sans tracking-wider uppercase">Gym Management</p>
                        </div>
                        <Link to="/settings" className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 p-0.5 overflow-hidden hover:scale-105 transition-transform active:scale-95">
                          {localStorage.getItem('gymUser') && JSON.parse(localStorage.getItem('gymUser')).profileImage?.url ? (
                            <img 
                              src={JSON.parse(localStorage.getItem('gymUser')).profileImage.url} 
                              alt="Profile" 
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-full">
                              <Users className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto p-4 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
