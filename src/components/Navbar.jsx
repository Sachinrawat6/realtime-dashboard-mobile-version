import React, { useState } from "react";
import { FaChartBar, FaUser, FaTrophy, FaBars, FaTimes } from "react-icons/fa";

function Navbar({ activeTab, setActiveTab }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { id: 0, name: "Dashboard", icon: FaChartBar },
        { id: 1, name: "Employee Selector", icon: FaUser },
        { id: 2, name: "Top Performers", icon: FaTrophy },
        { id: 3, name: "Picklist Report", icon: FaChartBar }
    ];

    return (
        <nav className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center min-w-0">
                        <div className="flex-shrink-0">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="p-2 bg-blue-600 rounded-lg shrink-0">
                                    <FaChartBar className="text-white text-lg sm:text-xl" />
                                </div>
                                <h1 className="text-white text-base sm:text-xl font-bold truncate">
                                    Production Analytics
                                </h1>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:block">
                        <div className="flex items-center space-x-1">
                            {navItems.map((item) => {
                                const IconComponent = item.icon;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === item.id
                                            ? 'bg-blue-600 text-white transform scale-105'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-700'
                                            }`}
                                    >
                                        <IconComponent className="text-sm" />
                                        {item.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-gray-300 hover:text-white focus:outline-none focus:text-white"
                        >
                            {isMobileMenuOpen ? (
                                <FaTimes className="text-xl" />
                            ) : (
                                <FaBars className="text-xl" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-700">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navItems.map((item) => {
                                const IconComponent = item.icon;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveTab(item.id);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`flex items-center gap-3 w-full text-left px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 ${activeTab === item.id
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-700'
                                            }`}
                                    >
                                        <IconComponent className="text-lg" />
                                        {item.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navbar;