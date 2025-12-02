
import React, { useState } from 'react';
import { CheckCircle2, Star, Copy, Smartphone, MessageCircle, ArrowRight, Key, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import { ToastType } from './Toast';

interface PaymentContentProps {
  paymentStatus: 'idle' | 'processing' | 'success';
  transactionId: string;
  setTransactionId: (id: string) => void;
  verifyPayment: () => void;
  user: UserProfile | null;
  onShowToast: (msg: string, type: ToastType) => void;
}

export const PaymentContent: React.FC<PaymentContentProps> = ({ 
  paymentStatus, 
  transactionId, 
  setTransactionId, 
  verifyPayment, 
  user,
  onShowToast
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyUPI = () => {
      navigator.clipboard.writeText('krishna.karoo@okaxis');
      setCopied(true);
      onShowToast("UPI ID Copied!", 'success');
      setTimeout(() => setCopied(false), 2000);
  };

  if (paymentStatus === 'success') {
    return (
       <div className="py-12 animate-fade-in-up text-center">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/30">
             <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-2">Payment Successful!</h3>
          <p className="text-slate-400 text-lg">Welcome to KrishnaLense Pro.</p>
       </div>
    );
  }

  return (
      <div className="w-full max-w-md mx-auto">
          <div className="mb-6 text-center">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
                <Star className="w-3 h-3 fill-amber-400" /> Premium Access
             </div>
             <h3 className="text-3xl font-bold text-white mb-2">Unlock Pro Features</h3>
             <div className="flex items-center justify-center gap-3 text-slate-400">
                <span className="text-lg text-slate-500 line-through decoration-red-500/50 decoration-2 font-medium">₹499</span>
                <span className="text-3xl font-bold text-white">₹99</span>
                <span className="text-sm font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">80% OFF</span>
             </div>
          </div>

          <div className="bg-slate-900/50 rounded-2xl p-1.5 mb-6 flex gap-1 border border-slate-700/50">
             <button className="flex-1 py-2 rounded-xl bg-slate-800 text-white text-sm font-bold shadow-sm ring-1 ring-white/5">Scan or Pay</button>
          </div>
          
          {/* Payment Card */}
          <div className="bg-white rounded-3xl p-6 shadow-xl mb-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              
              <div className="flex flex-col items-center">
                  <div className="bg-white p-2 rounded-xl border-2 border-slate-100 shadow-inner mb-4">
                      <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=krishna.karoo@okaxis&pn=KrishnaLenseAI&am=99&cu=INR`} 
                          alt="Payment QR" 
                          className="w-48 h-48 object-contain"
                      />
                  </div>
                  
                  <div className="flex items-center gap-2 w-full justify-center mb-4">
                      <span className="text-slate-900 font-mono font-bold bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-sm select-all">
                          krishna.karoo@okaxis
                      </span>
                      <button 
                          onClick={handleCopyUPI}
                          className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                          title="Copy UPI ID"
                      >
                          {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                      </button>
                  </div>

                  <div className="w-full">
                      <a 
                          href="upi://pay?pa=krishna.karoo@okaxis&pn=KrishnaLenseAI&am=99&cu=INR"
                          className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                      >
                          <Smartphone className="w-4 h-4" /> Open Payment App
                      </a>
                  </div>
              </div>
          </div>

          {/* Verification Section */}
          <div className="space-y-4">
              <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center">
                      <span className="bg-slate-800 px-2 text-xs text-slate-500 font-bold uppercase">Then Verify</span>
                  </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                  <button 
                       onClick={() => {
                          const message = `Hello Dr. Krishna Karoo, I have completed the payment of ₹99 for KrishnaLense.AI Pro. \n\nMy Name: ${user?.name || ''} \nUser ID: ${user?.userId || ''} \n\nPlease verify and send the access code.`;
                          window.open(`https://wa.me/919423403193?text=${encodeURIComponent(message)}`, '_blank');
                       }}
                       className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 rounded-2xl group transition-all cursor-pointer text-left w-full"
                  >
                       <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-green-500/20 rounded-full text-green-400 group-hover:bg-green-500 group-hover:text-white transition-colors">
                              <MessageCircle className="w-5 h-5" />
                          </div>
                          <div>
                              <p className="text-green-400 font-bold text-sm">Get Access Code</p>
                              <p className="text-slate-400 text-xs">Send screenshot via WhatsApp</p>
                          </div>
                       </div>
                       <ArrowRight className="w-5 h-5 text-green-500/50 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="flex gap-2">
                       <div className="relative flex-grow">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                             <Key className="w-4 h-4" />
                          </div>
                          <input 
                              type="text" 
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                              placeholder="Enter 15-Digit Code"
                              className="w-full bg-slate-900 border border-slate-700 rounded-2xl py-4 pl-10 pr-4 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono text-center tracking-widest text-sm uppercase"
                          />
                       </div>
                       <button 
                          onClick={verifyPayment}
                          disabled={paymentStatus === 'processing' || !transactionId}
                          className="px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:shadow-blue-600/20 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center min-w-[100px]"
                       >
                          {paymentStatus === 'processing' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Unlock'}
                       </button>
                  </div>
              </div>
          </div>
          
          <p className="text-[10px] text-slate-500 mt-6 text-center">
             Secure payments processed via standard banking channels. Access is granted instantly upon code verification.
          </p>
      </div>
  );
};
