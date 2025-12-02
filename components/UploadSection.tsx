
import React, { ChangeEvent, useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, AlertCircle, Sparkles, Shield, Zap, Star, Camera, X, Linkedin, Check, Smartphone, Aperture, Wand2, ArrowRight } from 'lucide-react';

interface UploadSectionProps {
  onImageSelect: (file: File) => void;
  customPreview?: string | null;
}

// Comparison Slider Component with Scanner Effect
const ComparisonSlider = ({ customPreview }: { customPreview?: string | null }) => {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setPosition(percentage);
    }
  };

  const handleMouseDown = () => (isDragging.current = true);
  const handleMouseUp = () => (isDragging.current = false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) handleMove(e.clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => (isDragging.current = false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // If a custom preview is available (user uploaded), we show it as the main image
  // This provides immediate feedback instead of the slider
  if (customPreview) {
    return (
      <div className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-blue-500/50 ring-4 ring-blue-500/20 group">
         <img 
            src={customPreview} 
            alt="Your Upload" 
            className="absolute inset-0 w-full h-full object-cover"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
         
         <div className="absolute top-4 right-4 bg-green-500 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1.5 animate-pulse">
            <Check className="w-3 h-3" /> Image Ready
         </div>

         <div className="absolute bottom-8 left-0 right-0 text-center px-4 animate-fade-in-up">
            <p className="text-white text-xl font-bold mb-2">Excellent Choice!</p>
            <div className="inline-flex items-center gap-2 text-blue-300 text-sm font-medium bg-blue-900/50 px-4 py-2 rounded-full border border-blue-500/30 backdrop-blur-md">
               <Sparkles className="w-4 h-4 text-yellow-400" />
               Ready to Transform
            </div>
         </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden cursor-ew-resize shadow-2xl border-4 border-slate-800 group select-none ring-1 ring-white/10"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* After Image (Background) - Professional Indian Subject */}
      <img 
        src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=90" 
        alt="After" 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
      />
      <div className="absolute top-4 right-4 bg-blue-600/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-white z-10 border border-white/10 shadow-lg flex items-center gap-1.5">
         <Sparkles className="w-3 h-3 text-yellow-300" /> AI STUDIO
      </div>

      {/* Before Image (Foreground Masked) - Casual Indian Subject */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img 
          src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=90" 
          alt="Before" 
          className="absolute inset-0 w-full h-full object-cover max-w-none" 
          style={{ width: containerRef.current?.offsetWidth }}
        />
        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-slate-300 border border-white/10">
           ORIGINAL
        </div>
        {/* Overlay to darken Before slightly */}
        <div className="absolute inset-0 bg-slate-900/20 pointer-events-none"></div>
      </div>

      {/* Scanner Line Effect */}
      <div 
         className="absolute top-0 bottom-0 w-1.5 z-20"
         style={{ left: `${position}%`, background: 'linear-gradient(to bottom, transparent, #60a5fa, #c084fc, transparent)' }}
      >
         <div className="absolute inset-0 bg-blue-500 blur-[4px]"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center border-[3px] border-blue-500 z-30">
             <div className="flex gap-1">
                <div className="w-0.5 h-3 bg-slate-300"></div>
                <div className="w-0.5 h-3 bg-slate-300"></div>
             </div>
         </div>
      </div>

      {/* Floating LinkedIn Badge */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-slate-900/60 backdrop-blur-md rounded-2xl p-2.5 flex items-center gap-3 border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
         <div className="p-2 bg-[#0077b5] rounded-xl shadow-lg">
            <Linkedin className="w-5 h-5 text-white" />
         </div>
         <div>
            <p className="text-white text-xs font-bold leading-tight">LinkedIn Optimized</p>
            <p className="text-slate-300 text-[10px]">Professional framing & lighting</p>
         </div>
         <div className="ml-auto pr-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
         </div>
      </div>
    </div>
  );
};

export const UploadSection: React.FC<UploadSectionProps> = ({ onImageSelect, customPreview }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
       setError('File size too large. Please upload an image under 15MB.');
       return;
    }
    setError(null);
    onImageSelect(file);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      const constraints = { 
        video: { 
          facingMode: 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 } 
        } 
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setShowCamera(true);
    } catch (err) {
      console.error("Camera access error:", err);
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else {
        setError("Could not access camera. Please check permissions.");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' });
            validateAndSetFile(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, showCamera]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="w-full relative z-10 -mt-8 md:-mt-0">
       {/* Cinematic Background Ambience */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] -z-20 pointer-events-none overflow-hidden">
          {/* Spotlight Effect */}
          <div className="absolute top-[-10%] left-[20%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen animate-blob"></div>
          
          {/* Grid */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="absolute inset-0 bg-grid-white opacity-[0.03] mask-image-gradient"></div>
       </div>

       {/* Floating Elements */}
       <div className="absolute top-10 right-[10%] hidden lg:block animate-float -z-10">
          <div className="w-16 h-16 bg-slate-800/50 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl rotate-12">
             <Aperture className="w-8 h-8 text-blue-400" />
          </div>
       </div>
       <div className="absolute bottom-20 left-[5%] hidden lg:block animate-float animation-delay-2000 -z-10">
          <div className="w-12 h-12 bg-slate-800/50 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-center shadow-2xl -rotate-6">
             <Wand2 className="w-6 h-6 text-purple-400" />
          </div>
       </div>

       <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Hero Text & Upload */}
          <div className="lg:col-span-7 flex flex-col gap-10">
             
             {/* Text Content */}
             <div className="text-left animate-fade-in-up relative">
                {/* Spotlight Behind Text */}
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[80px] -z-10"></div>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs md:text-sm font-bold uppercase tracking-wider mb-8 shadow-lg backdrop-blur-md hover:bg-slate-800 transition-colors cursor-default group">
                   <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                   </span>
                   #1 AI Headshot Generator
                </div>
                
                <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-white tracking-tight leading-[1] mb-8 drop-shadow-2xl">
                   Turn Selfies into <br />
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 animate-text-shimmer bg-[length:200%_auto]">
                      Pro Headshots.
                   </span>
                </h1>
                
                <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-xl font-light mb-2">
                   Your Personalized AI Photographer. Get <span className="text-white font-medium">Forbes-quality</span> portraits generated in seconds.
                </p>
                
                {/* Social Proof Pills */}
                <div className="flex flex-wrap gap-4 mt-8">
                   <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/5 shadow-sm">
                      <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                           <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border border-slate-800 overflow-hidden">
                              <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" className="w-full h-full object-cover" />
                           </div>
                        ))}
                      </div>
                      <div className="flex flex-col">
                         <div className="flex gap-0.5 text-amber-400">
                           <Star className="w-3 h-3 fill-amber-400" />
                           <Star className="w-3 h-3 fill-amber-400" />
                           <Star className="w-3 h-3 fill-amber-400" />
                           <Star className="w-3 h-3 fill-amber-400" />
                           <Star className="w-3 h-3 fill-amber-400/50" />
                         </div>
                         <span className="text-[10px] text-slate-400 font-medium">Trusted by 10k+ Pros</span>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/5 shadow-sm text-slate-300 text-sm">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>100% Private</span>
                   </div>
                </div>
             </div>

             {/* Holographic Upload Card */}
             <div className="relative group animate-fade-in-up delay-100 max-w-2xl mt-4">
                {/* Animated Border Gradient */}
                <div className={`absolute -inset-[2px] rounded-[2rem] bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-50 blur-sm group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-xy ${isDragging ? 'opacity-100' : ''}`}></div>
                
                <div 
                  className={`relative bg-slate-900 rounded-[2rem] p-8 border border-slate-700/50 transition-all duration-300 overflow-hidden
                    ${isDragging ? 'bg-slate-800' : 'hover:bg-slate-900/80'}
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                    {/* Inner Texture */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>

                    <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />
                    <input type="file" ref={cameraInputRef} accept="image/*" capture="user" className="hidden" onChange={handleFileChange} />

                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                        {/* Animated Icon Box */}
                        <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)] border border-slate-700 shrink-0 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <UploadCloud className={`w-10 h-10 ${isDragging ? 'text-blue-400 animate-bounce' : 'text-slate-400 group-hover:text-blue-400'} transition-colors`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-2xl font-bold text-white mb-2">Upload your Selfie</h3>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                               Drop your image here or tap to browse.<br/>
                               <span className="text-slate-500">Supports JPG, PNG (Max 15MB)</span>
                            </p>
                            
                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                <button 
                                  onClick={handleUploadClick}
                                  className="px-8 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg hover:shadow-white/20 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 group/btn"
                                >
                                   <ImageIcon className="w-5 h-5 text-slate-900" /> 
                                   Select Image
                                   <span className="hidden group-hover/btn:inline-block transition-all">→</span>
                                </button>
                                <button 
                                  onClick={startCamera}
                                  className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all border border-slate-600 hover:border-slate-500 active:scale-95 flex items-center gap-2"
                                >
                                   <Camera className="w-5 h-5" /> Camera
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                  <div className="absolute -bottom-16 left-0 right-0 mx-auto flex items-center gap-2 text-red-400 bg-red-950/50 border border-red-500/20 p-4 rounded-xl animate-fade-in text-sm backdrop-blur-md shadow-lg">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}
             </div>
          </div>

          {/* Right Column: Visual Showcase */}
          <div className="lg:col-span-5 hidden lg:flex flex-col items-center justify-center relative animate-fade-in-up delay-200">
              {/* Back Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/20 blur-[100px] rounded-full -z-10"></div>
              
              <div className="relative w-full max-w-md">
                  <ComparisonSlider customPreview={customPreview} />
                  
                  {/* Decorative Card Behind */}
                  <div className="absolute -inset-4 bg-slate-800 rounded-[2.5rem] -z-10 rotate-3 border border-slate-700/50 shadow-2xl opacity-50"></div>
              </div>
          </div>
       </div>

       {/* Camera Overlay */}
       {showCamera && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in">
           <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-400" /> Take Selfie
              </h3>
              <button 
                onClick={stopCamera} 
                className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 backdrop-blur-md transition-colors"
              >
                 <X className="w-6 h-6" />
              </button>
           </div>
           <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover md:object-contain" />
              
              {/* Camera Guide Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-70">
                 <div className="w-64 h-80 border-2 border-white/50 rounded-[50%] relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/80 text-xs font-medium bg-black/50 px-2 py-1 rounded">Position Face Here</div>
                 </div>
              </div>
           </div>
           <div className="p-10 bg-black/80 backdrop-blur-xl flex justify-center pb-12">
              <button 
                onClick={capturePhoto} 
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                <div className="w-16 h-16 bg-white rounded-full"></div>
              </button>
           </div>
        </div>
      )}

      <style>{`
        .mask-image-gradient {
          mask-image: radial-gradient(circle at center, black 40%, transparent 80%);
          -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 80%);
        }
        @keyframes gradient-xy {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-xy {
          background-size: 200% 200%;
          animation: gradient-xy 6s ease infinite;
        }
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};
