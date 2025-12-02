
import React, { useState } from 'react';
import { Sparkles, Crown, Menu, X, LogOut, User, LogIn } from 'lucide-react';
import { Logo } from './Logo';

interface HeaderProps {
  onNavigate: (section: string) => void;
  isPremium?: boolean;
  user?: { name: string, userId: string } | null;
  onLogout?: () => void;
  onLogin?: () => void;
  activeTab?: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, isPremium = false, user, onLogout, onLogin, activeTab = 'Home' }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleNavClick = (section: string) => {
    onNavigate(section);
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  };

  // Grouped Navigation Items
  const navStructure = [
    { label: 'Home', action: () => handleNavClick('Home') },
    { 
      label: 'About', 
      isDropdown: true,
      items: [
        { label: 'Features', action: () => handleNavClick('Features') },
        { label: 'Pricing', action: () => handleNavClick('Pricing') },
        { label: 'Information', action: () => handleNavClick('Information') }
      ]
    },
    { label: 'Gallery', action: () => handleNavClick('Gallery') },
    { label: 'Tools', action: () => handleNavClick('Tools') },
  ];

  return (
    <>
      <header className="w-full py-4 md:py-6 flex justify-between items-center px-6 md:px-12 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 shadow-2xl shadow-black/20">
        
        {/* Logo Section */}
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => handleNavClick('Home')}>
          <div className="relative">
             <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
             <Logo className="w-10 h-10 md:w-12 md:h-12 relative z-10" />
             <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-slate-900 z-20">
                <Sparkles className="w-1.5 h-1.5 md:w-2 md:h-2 text-white" />
             </div>
          </div>
          
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-[length:200%_auto] animate-text-shimmer">
                KrishnaLense.AI
              </span>
              {isPremium && (
                <span className="px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[9px] md:text-[10px] font-bold shadow-lg shadow-orange-500/20 flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5 md:w-3 md:h-3 fill-black" />
                  PRO
                </span>
              )}
            </h1>
            <div className="flex items-center gap-2">
               <span className="h-[1px] w-6 bg-slate-700"></span>
               <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">By Dr. Krishna Karoo</p>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navStructure.map((item, idx) => {
            if (item.isDropdown && item.items) {
               const isDropdownActive = activeDropdown === item.label;
               const isAnyChildActive = item.items.some(sub => activeTab === sub.label);
               return (
                 <div 
                    key={idx} 
                    className="relative group/dropdown"
                    onMouseEnter={() => setActiveDropdown(item.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                 >
                    <button className={`flex items-center gap-1 text-sm font-medium transition-colors outline-none ${isAnyChildActive ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
                       {item.label}
                       <svg className={`w-3 h-3 transition-transform ${isDropdownActive ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-4 transition-all duration-200 ${isDropdownActive ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
                       <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[160px] flex flex-col p-1">
                          {item.items.map((subItem, subIdx) => (
                             <button
                               key={subIdx}
                               onClick={subItem.action}
                               className={`text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${activeTab === subItem.label ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                             >
                                {subItem.label}
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>
               );
            }

            const isActive = activeTab === item.label;
            return (
              <button 
                key={idx} 
                onClick={item.action}
                className={`text-sm font-medium transition-colors relative group bg-transparent border-none cursor-pointer outline-none ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {item.label}
                <span className={`absolute -bottom-1 left-0 h-[2px] bg-blue-500 transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </button>
            );
          })}
          
          <div className="h-8 w-[1px] bg-slate-700 mx-2"></div>
          
          {user ? (
            <div className="flex items-center gap-4">
               <div className="text-right">
                  <p className="text-xs font-bold text-white">{user.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono tracking-wider">{user.userId}</p>
               </div>
               <button 
                onClick={onLogout}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-red-400 transition-colors"
                title="Logout"
               >
                 <LogOut className="w-5 h-5" />
               </button>
            </div>
          ) : (
             <button 
               onClick={onLogin}
               className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full text-sm font-bold transition-colors border border-slate-700"
             >
               <LogIn className="w-4 h-4" /> Login
             </button>
          )}
        </nav>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2 text-slate-300 hover:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/95 backdrop-blur-xl md:hidden flex flex-col items-center justify-center animate-fade-in pt-20 overflow-y-auto">
          <nav className="flex flex-col items-center gap-6 text-lg w-full px-6 pb-10">
             {user && (
               <div className="bg-slate-800 p-4 rounded-xl flex flex-col items-center mb-2 min-w-[200px] border border-slate-700">
                  <User className="w-8 h-8 text-blue-400 mb-2" />
                  <p className="font-bold text-white">{user.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{user.userId}</p>
               </div>
             )}

            {navStructure.map((item, idx) => {
               if (item.isDropdown && item.items) {
                  return (
                     <div key={idx} className="w-full flex flex-col items-center gap-4 bg-slate-800/30 p-4 rounded-2xl border border-white/5">
                        <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">{item.label}</span>
                        {item.items.map((sub, subIdx) => (
                           <button 
                              key={subIdx}
                              onClick={sub.action}
                              className={`font-bold text-lg transition-colors ${activeTab === sub.label ? 'text-blue-400' : 'text-slate-300'}`}
                           >
                              {sub.label}
                           </button>
                        ))}
                     </div>
                  )
               }
               
               const isActive = activeTab === item.label;
               return (
                <button 
                  key={idx} 
                  onClick={item.action}
                  className={`font-bold text-xl transition-all duration-300 relative ${
                    isActive 
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 scale-110' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                  )}
                </button>
              );
            })}
            
            <div className="w-12 h-[1px] bg-slate-700 my-2"></div>
            
            {user ? (
                <button 
                  onClick={() => { onLogout?.(); setIsMobileMenuOpen(false); }}
                  className="px-8 py-3 bg-slate-800 text-red-400 rounded-full font-bold shadow-lg border border-slate-700 hover:bg-red-500/10 flex items-center gap-2 transition-colors w-full justify-center max-w-[200px]"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
            ) : (
                <button 
                  onClick={() => { onLogin?.(); setIsMobileMenuOpen(false); }}
                  className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-500 flex items-center gap-2 transition-colors w-full justify-center max-w-[200px]"
                >
                  <LogIn className="w-4 h-4" /> Login
                </button>
            )}
          </nav>
        </div>
      )}
    </>
  );
};
