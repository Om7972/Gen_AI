import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';

const UserSettings = () => {
    const { user, isDark } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const [activeTab, setActiveTab] = useState('profile');
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        notifications: {
            emailUpdates: true,
            summaryReady: true,
            weeklyReport: false
        }
    });

    const [saving, setSaving] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleToggle = (key) => {
        setFormData(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [key]: !prev.notifications[key]
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        // Simulate API call to save settings
        setTimeout(() => {
            setSaving(false);
            toast.success('Settings saved successfully!');
        }, 1000);
    };

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 animate-fade-in text-gray-900 dark:text-gray-100">
            <div className="max-w-4xl mx-auto space-y-8">

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-600 to-secondary-600 mb-6 shadow-2xl">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold heading-gradient mb-2">User Settings</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage your profile, preferences, and account settings</p>
                </div>

                <div className="glass-card rounded-3xl overflow-hidden shadow-xl">
                    <div className="flex flex-col md:flex-row">
                        {/* Sidebar Navigation */}
                        <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700/50 p-6 flex flex-col space-y-2">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${activeTab === 'profile'
                                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-md'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Profile</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('notifications')}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${activeTab === 'notifications'
                                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-md'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <span>Notifications</span>
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 p-8">

                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div className="space-y-6 animate-fade-in">
                                    <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>

                                    <div className="flex items-center space-x-6 mb-8">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                            {formData.name.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <button className="px-4 py-2 border-2 border-primary-500 text-primary-600 dark:text-primary-400 font-semibold rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                                                Change Avatar
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Full Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="input-modern"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="input-modern"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notifications Tab */}
                            {activeTab === 'notifications' && (
                                <div className="space-y-6 animate-fade-in">
                                    <h2 className="text-2xl font-bold mb-6">Notification Preferences</h2>

                                    <div className="space-y-4">

                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors hover:border-primary-300 dark:hover:border-primary-700">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white">Summary Ready Alerts</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when an AI summary finishes processing.</p>
                                            </div>
                                            <button
                                                onClick={() => handleToggle('summaryReady')}
                                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${formData.notifications.summaryReady ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                            >
                                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${formData.notifications.summaryReady ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors hover:border-primary-300 dark:hover:border-primary-700">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white">Weekly Reports</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Receive a weekly digest of your summary analytics.</p>
                                            </div>
                                            <button
                                                onClick={() => handleToggle('weeklyReport')}
                                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${formData.notifications.weeklyReport ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                            >
                                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${formData.notifications.weeklyReport ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors hover:border-primary-300 dark:hover:border-primary-700">
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white">Product Updates</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Stay in the loop with new AI features and platform improvements.</p>
                                            </div>
                                            <button
                                                onClick={() => handleToggle('emailUpdates')}
                                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${formData.notifications.emailUpdates ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                            >
                                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${formData.notifications.emailUpdates ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            )}

                            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 flex items-center"
                                >
                                    {saving ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : 'Save Changes'}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default UserSettings;
