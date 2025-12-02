
import React, { useState } from 'react';
import { User, Lock, ArrowRight, CheckCircle2, Copy, LogIn, UserPlus, AlertCircle, Mail, Phone, X } from 'lucide-react';
import { Logo } from './Logo';

interface AuthScreenProps {
  onLogin: (user: any) => void;
  onCancel?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onCancel }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loginId, setLoginId] = useState('');
  
  // Status State
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [generatedUser, setGeneratedUser] = useState<{name: string, userId: string} | null>(null);

  // Validation Helpers
  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const validateMobile = (mobile: string) => {
    // Check for exactly 10 digits
    return /^[0-9]{10}$/.test(mobile);
  };

  const validateName = (name: string) => {
    // Min 3 chars, letters, spaces, dots only
    return name.trim().length >= 3 && /^[a-zA-Z\s\.]+$/.test(name);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Strict Validation
    if (!validateName(name)) {
      setError("Please enter a valid full name (at least 3 letters).");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!validateMobile(mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    // Generate unique User ID
    const randomSuffix = Math.floor(10000 + Math.random() * 90000); // 5 digit random
    const newUserId = `KL-${randomSuffix}`;

    const newUser = {
      userId: newUserId,
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      password, // In a real app, hash this!
      isPremium: false,
      joinedAt: Date.now()
    };

    // Save to localStorage
    const existingUsersStr = localStorage.getItem('krishnalense_users');
    const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : [];
    
    // Check Email or Mobile duplication
    if (existingUsers.some((u: any) => u.email === email || u.mobile === mobile)) {
        setError("Account with this Email or Mobile already exists.");
        return;
    }
    
    // Check ID duplication (rare)
    if (existingUsers.some((u: any) => u.userId === newUserId)) {
        handleRegister(e); // Retry recursion if collision
        return;
    }

    existingUsers.push(newUser);
    localStorage.setItem('krishnalense_users', JSON.stringify(existingUsers));

    setGeneratedUser({ name: newUser.name, userId: newUserId });
    setSuccessMsg("Registration Successful!");
    setMode('login'); // Switch to login view visually, but show overlay
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanLoginId = loginId.trim().toUpperCase();

    if (!cleanLoginId || !password) {
      setError("Please enter User ID and Password.");
      return;
    }

    // Basic format check for ID (KL-XXXX)
    if (!cleanLoginId.startsWith('KL-') || cleanLoginId.length < 6) {
       setError("Invalid User ID format. It should start with 'KL-'.");
       return;
    }

    const existingUsersStr = localStorage.getItem('krishnalense_users');
    const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : [];

    const user = existingUsers.find((u: any) => u.userId === cleanLoginId && u.password === password);

    if (user) {
      onLogin(user);
    } else {
      setError("Invalid User ID or Password.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
    setName('');
    setEmail('');
    setMobile('');
    setPassword('');
    setLoginId('');
  };

  return (
    <div className="w-full h-full bg-slate-900/95 backdrop-blur-sm overflow-y-auto overflow-x-hidden relative">
      {/* Fixed Background Ambience - Keeps blobs static while content scrolls */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[100px] animate-blob"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
      </div>

      {/* Close Button - Fixed to stay visible */}
      {onCancel && (
        <button 
          onClick={onCancel}
          className="fixed top-6 right-6 p-2 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors z-[60] backdrop-blur-md border border-white/10"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Generated Credentials Overlay Modal - Fixed on top of everything */}
      {generatedUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
           <div className="bg-slate-800 border border-green-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center my-auto">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
              
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Registration Successful!</h3>
              <p className="text-slate-400 mb-6">Here are your generated credentials. Please save them.</p>
              
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 mb-6 text-left relative group">
                 <div className="mb-4">
                    <label className="text-xs text-slate-500 uppercase tracking-wider font-bold">User Name</label>
                    <p className="text-white font-medium text-lg">{generatedUser.name}</p>
                 </div>
                 <div>
                    <label className="text-xs text-blue-400 uppercase tracking-wider font-bold">Generated User ID</label>
                    <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-3xl font-mono font-bold text-white tracking-widest">{generatedUser.userId}</p>
                        <button 
                          onClick={() => copyToClipboard(generatedUser.userId)}
                          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                          title="Copy ID"
                        >
                           <Copy className="w-5 h-5" />
                        </button>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => {
                   setLoginId(generatedUser.userId); // Auto-fill login
                   setGeneratedUser(null);
                }}
                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-green-600/20"
              >
                 Go to Login
              </button>
           </div>
        </div>
      )}

      {/* Scrollable Content Wrapper */}
      <div className="min-h-full flex items-center justify-center p-4 py-12 relative z-10">
        <div className="w-full max-w-md">
            {/* Header Logo */}
            <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
                <Logo className="w-12 h-12" disableAnimation />
                <h1 className="text-2xl font-black tracking-tight text-white">KrishnaLense.AI</h1>
            </div>
            <p className="text-slate-400">Professional AI Headshot Studio</p>
            </div>

            {/* Auth Card */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8 shadow-2xl">
            
            {/* Tabs */}
            <div className="flex bg-slate-900/50 p-1 rounded-xl mb-8">
                <button 
                    onClick={() => { setMode('login'); resetForm(); }}
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'login' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <LogIn className="w-4 h-4" /> Login
                </button>
                <button 
                    onClick={() => { setMode('register'); resetForm(); }}
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'register' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <UserPlus className="w-4 h-4" /> Register
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm animate-fade-in">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-5">
                
                {mode === 'register' && (
                    <>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 ml-1 uppercase">Full Name</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                            <User className="w-5 h-5" />
                            </div>
                            <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Dr. Krishna Karoo"
                            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 ml-1 uppercase">Email Address</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                            <Mail className="w-5 h-5" />
                            </div>
                            <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 ml-1 uppercase">Mobile Number</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                            <Phone className="w-5 h-5" />
                            </div>
                            <input 
                            type="tel" 
                            value={mobile}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                if (val.length <= 10) setMobile(val);
                            }}
                            placeholder="9876543210"
                            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                    </>
                )}

                {mode === 'login' && (
                    <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 ml-1 uppercase">User ID</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                            <User className="w-5 h-5" />
                        </div>
                        <input 
                            type="text" 
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value.toUpperCase())}
                            placeholder="KL-XXXX"
                            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono tracking-wider"
                        />
                    </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 ml-1 uppercase">Password</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Lock className="w-5 h-5" />
                        </div>
                        <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl transition-all hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2 mt-4
                    ${mode === 'register' 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-600/20' 
                        : 'bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500'}`}
                >
                    {mode === 'register' ? 'Create Account' : 'Login Securely'}
                    <ArrowRight className="w-5 h-5" />
                </button>
            </form>
            
            <p className="text-center text-xs text-slate-500 mt-6">
                {mode === 'register' 
                    ? "Your User ID will be generated automatically." 
                    : "Don't have an ID? Register first to generate one."}
            </p>
            </div>
        </div>
      </div>
    </div>
  );
};
