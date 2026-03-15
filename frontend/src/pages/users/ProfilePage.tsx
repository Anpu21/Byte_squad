export default function ProfilePage() {
    return (
        <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white tracking-tight">My Profile</h1>
                <p className="text-sm text-slate-400 mt-1">Manage your account settings and preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Avatar & Quick Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center shadow-2xl">
                        
                        {/* Avatar with Hover Edit State */}
                        <div className="relative group cursor-pointer mb-5">
                            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-bold text-white shadow-inner overflow-hidden transition-transform group-hover:scale-105 duration-300">
                                JD
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                        <circle cx="12" cy="13" r="4"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <h2 className="text-lg font-bold text-white tracking-tight">John Doe</h2>
                        <p className="text-sm text-slate-400 mb-4">john.doe@ledgerpro.com</p>
                        
                        {/* Role Badge */}
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-white text-slate-900 uppercase tracking-widest shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
                            Administrator
                        </span>
                    </div>

                    {/* Meta Information */}
                    <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Account Status</span>
                            <span className="text-white font-medium flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-white/40"></span>
                                Active
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Member Since</span>
                            <span className="text-white font-medium">Oct 2024</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings Forms */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Personal Info Card */}
                    <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/10 bg-white/[0.02]">
                            <h3 className="text-base font-semibold text-white tracking-tight">Personal Information</h3>
                            <p className="text-xs text-slate-400 mt-1">Update your personal details and contact information.</p>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                                        First Name
                                    </label>
                                    <input 
                                        defaultValue="John"
                                        className="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                                        Last Name
                                    </label>
                                    <input 
                                        defaultValue="Doe"
                                        className="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all" 
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                                        Email Address
                                    </label>
                                    <input 
                                        defaultValue="john.doe@ledgerpro.com"
                                        type="email"
                                        className="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all" 
                                    />
                                </div>
                            </div>
                        </div>
                        {/* Footer Action */}
                        <div className="p-5 border-t border-white/10 bg-white/[0.02] flex justify-end">
                            <button className="h-9 px-5 rounded-lg bg-white text-slate-900 text-sm font-bold hover:shadow-[0_4px_12px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 transition-all">
                                Save Changes
                            </button>
                        </div>
                    </div>

                    {/* Security Card */}
                    <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/10 bg-white/[0.02]">
                            <h3 className="text-base font-semibold text-white tracking-tight">Security</h3>
                            <p className="text-xs text-slate-400 mt-1">Update your password to keep your account secure.</p>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                                    Current Password
                                </label>
                                <input 
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-slate-600" 
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]">
                                    New Password
                                </label>
                                <input 
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full h-11 px-4 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-slate-600" 
                                />
                            </div>
                        </div>
                        {/* Footer Action - Secondary Style */}
                        <div className="p-5 border-t border-white/10 bg-white/[0.02] flex justify-end">
                            <button className="h-9 px-5 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors">
                                Update Password
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}