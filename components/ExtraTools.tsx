import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Download, Crop, Circle, ArrowLeft, ArrowRight, Image as ImageIcon, 
  Check, Minimize2, IdCard, RefreshCcw, Linkedin, Youtube, 
  Sparkles, Facebook, Twitter, Instagram, ChevronRight, PenTool, QrCode, Eraser, Trash2, Link,
  Stamp, Palette, Video, Loader2, Monitor, Smartphone, Wand2
} from 'lucide-react';
import { generateVeoVideo } from '../services/geminiService';
import { ToastType } from './Toast';

type ToolType = 'cropper' | 'ring' | 'compressor' | 'id_badge' | 'converter' | 'signature' | 'qr' | 'watermark' | 'palette' | 'video_gen';

interface ExtraToolsProps {
  onShowToast?: (message: string, type: ToastType) => void;
}

// --- Configuration & Data ---

const SOCIAL_PRESETS: Record<string, { w: number; h: number; icon: React.ElementType; label: string }> = {
  'insta_story': { w: 1080, h: 1920, icon: Instagram, label: 'Insta Story' },
  'insta_post': { w: 1080, h: 1080, icon: Instagram, label: 'Insta Post' },
  'linkedin_banner': { w: 1584, h: 396, icon: Linkedin, label: 'LinkedIn Cover' },
  'linkedin_post': { w: 1200, h: 627, icon: Linkedin, label: 'LinkedIn Post' },
  'twitter_header': { w: 1500, h: 500, icon: Twitter, label: 'X Header' },
  'fb_cover': { w: 820, h: 312, icon: Facebook, label: 'FB Cover' },
  'yt_thumb': { w: 1280, h: 720, icon: Youtube, label: 'YT Thumb' },
};

const TOOLS_CONFIG = [
  { id: 'video_gen', name: 'AI Video Animator', icon: Video, desc: 'Animate photos with Veo AI.', color: 'from-pink-600 to-rose-600', iconColor: 'text-pink-400' },
  { id: 'id_badge', name: 'ID Card Creator', icon: IdCard, desc: 'Design professional corporate badges.', color: 'from-indigo-500 to-blue-500', iconColor: 'text-indigo-400' },
  { id: 'watermark', name: 'Watermarker', icon: Stamp, desc: 'Protect your images with custom text.', color: 'from-red-500 to-pink-500', iconColor: 'text-red-400' },
  { id: 'palette', name: 'Brand Palette', icon: Palette, desc: 'Extract dominant colors & create brand sheet.', color: 'from-violet-500 to-purple-500', iconColor: 'text-violet-400' },
  { id: 'cropper', name: 'Smart Resizer', icon: Crop, desc: 'Crop & Resize for any platform.', color: 'from-blue-500 to-cyan-500', iconColor: 'text-blue-400' },
  { id: 'ring', name: 'Profile Ring', icon: Circle, desc: 'Add branding rings to profile pics.', color: 'from-purple-500 to-pink-500', iconColor: 'text-purple-400' },
  { id: 'compressor', name: 'Image Compressor', icon: Minimize2, desc: 'Shrink file size, keep quality.', color: 'from-amber-500 to-orange-500', iconColor: 'text-amber-400' },
  { id: 'converter', name: 'Format Converter', icon: RefreshCcw, desc: 'Convert JPG, PNG, WebP.', color: 'from-pink-500 to-rose-500', iconColor: 'text-pink-400' },
  { id: 'signature', name: 'Signature Creator', icon: PenTool, desc: 'Create digital signatures for docs.', color: 'from-slate-500 to-gray-500', iconColor: 'text-slate-400' },
  { id: 'qr', name: 'QR Generator', icon: QrCode, desc: 'Custom QR codes for links & vCards.', color: 'from-green-500 to-emerald-500', iconColor: 'text-green-400' }
];

export const ExtraTools: React.FC<ExtraToolsProps> = ({ onShowToast }) => {
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- Tool States ---
  
  // Cropper
  const [resizeMode, setResizeMode] = useState<'aspect' | 'custom'>('aspect');
  const [cropPreset, setCropPreset] = useState<string>('insta_post');
  const [customW, setCustomW] = useState(1080);
  const [customH, setCustomH] = useState(1080);

  // Ring
  const [ringColor, setRingColor] = useState('#3b82f6');
  const [ringWidth, setRingWidth] = useState(15);

  // Compressor
  const [compressionQuality, setCompressionQuality] = useState(0.8);
  const [originalSizeStr, setOriginalSizeStr] = useState<string>('0 KB');
  const [compressedSizeStr, setCompressedSizeStr] = useState<string>('0 KB');

  // ID Badge
  const [idName, setIdName] = useState('Dr. Krishna Karoo');
  const [idRole, setIdRole] = useState('Founder & CEO');
  const [idNumber, setIdNumber] = useState('KL-8291');
  const [idCompany, setIdCompany] = useState('KrishnaLense.AI');
  const [idColor, setIdColor] = useState('#1e293b');

  // Converter
  const [targetFormat, setTargetFormat] = useState<'png' | 'jpeg' | 'webp'>('png');

  // Signature
  const [sigColor, setSigColor] = useState('#000000');
  const [sigWidth, setSigWidth] = useState(3);
  const isDrawing = useRef(false);

  // QR
  const [qrData, setQrData] = useState('https://krishnalense.ai');
  const [qrColor, setQrColor] = useState('#000000');
  const [qrBg, setQrBg] = useState('#ffffff');

  // Watermark
  const [wmText, setWmText] = useState('© KrishnaLense.AI');
  const [wmOpacity, setWmOpacity] = useState(0.5);
  const [wmColor, setWmColor] = useState('#ffffff');
  const [wmSize, setWmSize] = useState(40);

  // Palette
  const [paletteColors, setPaletteColors] = useState<string[]>([]);

  // Video Gen (Veo)
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Utilities ---

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      setOriginalSizeStr(formatBytes(file.size));
      setCompressionQuality(0.8); 
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setOriginalSizeStr('0 KB');
    setCompressedSizeStr('0 KB');
    setGeneratedVideoUrl(null);
    clearSignature();
    setPaletteColors([]);
  };

  const clearSignature = () => {
      const canvas = canvasRef.current;
      if (canvas && activeTool === 'signature') {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
  };

  const handleVeoGeneration = async () => {
    if (!selectedFile) {
        onShowToast?.("Please upload an image first.", 'error');
        return;
    }
    setIsVideoGenerating(true);
    setGeneratedVideoUrl(null);
    onShowToast?.("Sending to Veo AI... This may take a minute.", 'info');
    
    try {
      const prompt = videoPrompt.trim() || "Cinematic movement, 4k, photorealistic";
      const url = await generateVeoVideo(prompt, selectedFile, videoAspectRatio);
      setGeneratedVideoUrl(url);
      onShowToast?.("Video generated successfully!", 'success');
    } catch (err: any) {
      onShowToast?.(err.message || "Failed to generate video", 'error');
    } finally {
      setIsVideoGenerating(false);
    }
  };

  // --- Drawing Logic for Image Tools ---

  useEffect(() => {
    // Only run this effect for image-based tools (excluding video_gen which handles its own view)
    if (['signature', 'qr', 'video_gen'].includes(activeTool || '')) return;

    if (!selectedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = selectedImage;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // ----------------- CROPPER -----------------
      if (activeTool === 'cropper') {
        let targetW = customW;
        let targetH = customH;

        if (resizeMode === 'aspect') {
           const preset = SOCIAL_PRESETS[cropPreset];
           if (preset) {
               targetW = preset.w;
               targetH = preset.h;
           }
        }

        const imgRatio = img.width / img.height;
        const targetRatio = targetW / targetH;
        let sX, sY, sW, sH;

        if (imgRatio > targetRatio) {
          sH = img.height;
          sW = sH * targetRatio;
          sX = (img.width - sW) / 2;
          sY = 0;
        } else {
          sW = img.width;
          sH = sW / targetRatio;
          sX = 0;
          sY = (img.height - sH) / 2;
        }

        canvas.width = targetW;
        canvas.height = targetH;
        ctx.drawImage(img, sX, sY, sW, sH, 0, 0, targetW, targetH);
      
      // ----------------- RING -----------------
      } else if (activeTool === 'ring') {
        const size = Math.min(img.width, img.height);
        canvas.width = size;
        canvas.height = size;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2 - ringWidth, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        
        const sX = (img.width - size) / 2;
        const sY = (img.height - size) / 2;
        ctx.drawImage(img, sX, sY, size, size, 0, 0, size, size);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2 - ringWidth/2, 0, Math.PI * 2, true);
        ctx.lineWidth = ringWidth;
        ctx.strokeStyle = ringColor;
        ctx.stroke();

      // ----------------- COMPRESSOR / CONVERTER -----------------
      } else if (activeTool === 'compressor' || activeTool === 'converter') {
        const maxW = 2048;
        let w = img.width;
        let h = img.height;
        if (w > maxW) {
            h = h * (maxW / w);
            w = maxW;
        }
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        if (activeTool === 'compressor') {
            const dataUrl = canvas.toDataURL('image/jpeg', compressionQuality);
            const head = 'data:image/jpeg;base64,'.length;
            const sizeInBytes = Math.round((dataUrl.length - head) * 3/4);
            setCompressedSizeStr(formatBytes(sizeInBytes));
        }

      // ----------------- WATERMARK -----------------
      } else if (activeTool === 'watermark') {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        ctx.save();
        ctx.globalAlpha = wmOpacity;
        ctx.fillStyle = wmColor;
        // Scale font relative to image size if using raw pixel size, but for now fixed px adjusted by user
        ctx.font = `bold ${wmSize}px Inter, sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        const padding = img.width * 0.03;
        ctx.fillText(wmText, img.width - padding, img.height - padding);
        ctx.restore();

      // ----------------- PALETTE -----------------
      } else if (activeTool === 'palette') {
        // Generate Brand Card with palette bar
        const paletteBarHeight = Math.max(100, img.height * 0.15);
        canvas.width = img.width;
        canvas.height = img.height + paletteBarHeight;
        
        ctx.drawImage(img, 0, 0);
        
        // Draw Bar Background
        ctx.fillStyle = '#0f172a'; // Slate 900
        ctx.fillRect(0, img.height, img.width, paletteBarHeight);
        
        // Palette Logic (Simple Quantization)
        if (paletteColors.length === 0) {
            const smCanvas = document.createElement('canvas');
            smCanvas.width = 50; smCanvas.height = 50;
            const smCtx = smCanvas.getContext('2d');
            if (smCtx) {
                smCtx.drawImage(img, 0, 0, 50, 50);
                const data = smCtx.getImageData(0,0,50,50).data;
                const counts: Record<string, number> = {};
                for(let i=0; i<data.length; i+=4) {
                    // Group similar colors
                    const r = Math.round(data[i]/20)*20;
                    const g = Math.round(data[i+1]/20)*20;
                    const b = Math.round(data[i+2]/20)*20;
                    const hex = `#${((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}`;
                    counts[hex] = (counts[hex] || 0) + 1;
                }
                const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 5).map(x => x[0]);
                setPaletteColors(sorted);
            }
        }

        // Draw Swatches
        if (paletteColors.length > 0) {
            const swatchW = img.width / paletteColors.length;
            paletteColors.forEach((color, i) => {
                const x = i * swatchW;
                const y = img.height;
                
                // Color Box
                ctx.fillStyle = color;
                ctx.fillRect(x + 10, y + 20, swatchW - 20, paletteBarHeight - 60);
                
                // Text
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${Math.max(16, paletteBarHeight * 0.15)}px monospace`;
                ctx.textAlign = 'center';
                ctx.fillText(color.toUpperCase(), x + swatchW/2, y + paletteBarHeight - 15);
            });
        }

      // ----------------- ID BADGE -----------------
      } else if (activeTool === 'id_badge') {
         const cardW = 638;
         const cardH = 1012;
         canvas.width = cardW;
         canvas.height = cardH;
         
         // Card Base
         ctx.fillStyle = "#ffffff";
         ctx.fillRect(0, 0, cardW, cardH);
         
         // Top Header Shape
         ctx.fillStyle = idColor;
         ctx.beginPath();
         ctx.moveTo(0, 0);
         ctx.lineTo(cardW, 0);
         ctx.lineTo(cardW, 350);
         ctx.bezierCurveTo(cardW, 350, cardW/2, 420, 0, 350);
         ctx.fill();
         
         // Company Name
         ctx.textAlign = "center";
         ctx.fillStyle = "rgba(255,255,255,0.9)";
         ctx.font = "bold 32px Inter, sans-serif";
         ctx.fillText(idCompany.toUpperCase(), cardW/2, 60);
         
         // Photo Circle
         const photoSize = 300;
         const photoY = 180;
         ctx.save();
         ctx.beginPath();
         ctx.arc(cardW/2, photoY + photoSize/2, photoSize/2, 0, Math.PI * 2);
         ctx.lineWidth = 10;
         ctx.strokeStyle = "#ffffff";
         ctx.stroke();
         ctx.clip();
         const minDim = Math.min(img.width, img.height);
         const sx = (img.width - minDim) / 2;
         const sy = (img.height - minDim) / 2;
         ctx.drawImage(img, sx, sy, minDim, minDim, cardW/2 - photoSize/2, photoY, photoSize, photoSize);
         ctx.restore();
         
         // Details
         const textStart = 550;
         ctx.fillStyle = "#1e293b";
         ctx.font = "bold 42px Inter, sans-serif";
         ctx.fillText(idName, cardW/2, textStart);
         
         ctx.fillStyle = idColor;
         ctx.font = "bold 24px Inter, sans-serif";
         ctx.fillText(idRole.toUpperCase(), cardW/2, textStart + 40);
         
         ctx.fillStyle = "#64748b";
         ctx.font = "24px Inter, sans-serif";
         ctx.fillText(`ID: ${idNumber}`, cardW/2, textStart + 80);
         
         // QR Code
         const qrSize = 150;
         const qrY = textStart + 140;
         ctx.fillStyle = "#ffffff"; 
         ctx.fillRect(cardW/2 - qrSize/2 - 10, qrY - 10, qrSize + 20, qrSize + 20);
         const qrImg = new Image();
         qrImg.crossOrigin = "anonymous";
         qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ID:${idNumber}`;
         qrImg.onload = () => {
             ctx.drawImage(qrImg, cardW/2 - qrSize/2, qrY, qrSize, qrSize);
         }
         
         // Bottom Stripe
         ctx.fillStyle = idColor;
         ctx.fillRect(0, cardH - 40, cardW, 40);
      }
    };
  }, [selectedImage, activeTool, resizeMode, cropPreset, customW, customH, ringColor, ringWidth, compressionQuality, idName, idRole, idCompany, idNumber, idColor, targetFormat, wmText, wmColor, wmOpacity, wmSize, paletteColors]);

  // --- Signature Drawing Logic ---
  useEffect(() => {
      if (activeTool !== 'signature' || !canvasRef.current) return;
      const canvas = canvasRef.current;
      
      // Initialize blank canvas
      canvas.width = 800;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
      }

      const getPos = (e: MouseEvent | TouchEvent) => {
          const rect = canvas.getBoundingClientRect();
          let x, y;
          if ((e as TouchEvent).touches) {
              x = (e as TouchEvent).touches[0].clientX - rect.left;
              y = (e as TouchEvent).touches[0].clientY - rect.top;
          } else {
              x = (e as MouseEvent).clientX - rect.left;
              y = (e as MouseEvent).clientY - rect.top;
          }
          return { x, y };
      };

      const startDraw = (e: any) => {
          isDrawing.current = true;
          const { x, y } = getPos(e);
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.strokeStyle = sigColor;
              ctx.lineWidth = sigWidth;
          }
      };

      const draw = (e: any) => {
          if (!isDrawing.current) return;
          e.preventDefault();
          const { x, y } = getPos(e);
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.lineTo(x, y);
              ctx.stroke();
          }
      };

      const stopDraw = () => {
          isDrawing.current = false;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.closePath();
      };

      canvas.addEventListener('mousedown', startDraw);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDraw);
      canvas.addEventListener('mouseout', stopDraw);
      canvas.addEventListener('touchstart', startDraw);
      canvas.addEventListener('touchmove', draw);
      canvas.addEventListener('touchend', stopDraw);

      return () => {
          canvas.removeEventListener('mousedown', startDraw);
          canvas.removeEventListener('mousemove', draw);
          canvas.removeEventListener('mouseup', stopDraw);
          canvas.removeEventListener('mouseout', stopDraw);
          canvas.removeEventListener('touchstart', startDraw);
          canvas.removeEventListener('touchmove', draw);
          canvas.removeEventListener('touchend', stopDraw);
      };
  }, [activeTool, sigColor, sigWidth]);

  // --- QR Code Logic ---
  useEffect(() => {
      if (activeTool !== 'qr' || !canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width = 500;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw Background
      ctx.fillStyle = qrBg;
      ctx.fillRect(0,0,500,500);

      // Fetch and Draw QR
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const cleanColor = qrColor.replace('#', '');
      const cleanBg = qrBg.replace('#', '');
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrData)}&color=${cleanColor}&bgcolor=${cleanBg}&margin=10`;
      
      img.onload = () => {
          // Center it
          ctx.drawImage(img, 50, 50, 400, 400);
      };
  }, [activeTool, qrData, qrColor, qrBg]);


  const handleDownload = () => {
    if (activeTool === 'video_gen') {
      if (generatedVideoUrl) {
        const link = document.createElement('a');
        link.href = generatedVideoUrl;
        link.download = `KL_Veo_Video_${Date.now()}.mp4`;
        link.click();
        onShowToast?.("Downloading Video...", 'success');
      }
      return;
    }

    if (canvasRef.current) {
      const link = document.createElement('a');
      let mime = 'image/png';
      let ext = 'png';
      if (activeTool === 'compressor') {
          mime = 'image/jpeg';
          ext = 'jpg';
      } else if (activeTool === 'converter') {
          mime = `image/${targetFormat}`;
          ext = targetFormat;
      }
      link.href = canvasRef.current.toDataURL(mime, compressionQuality);
      link.download = `KL_${activeTool}_${Date.now()}.${ext}`;
      link.click();
      onShowToast?.("Image Downloaded!", 'success');
    }
  };

  // --- TOOL LANDING PAGE ---
  if (!activeTool) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 animate-fade-in">
        <div className="text-center mb-16">
           <h2 className="text-5xl font-black text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-text-shimmer bg-[length:200%_auto]">
              Professional Tool Suite
           </h2>
           <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Everything you need to enhance your personal brand. Powered by AI and precision engineering.
           </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           {TOOLS_CONFIG.map(tool => {
               const Icon = tool.icon;
               return (
                   <button 
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id as ToolType)} 
                      className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 hover:bg-slate-800 hover:border-slate-600 transition-all hover:-translate-y-2 group text-left relative overflow-hidden"
                   >
                      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${tool.color} blur-[50px] opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
                      
                      <div className={`w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/5 group-hover:scale-110 transition-transform duration-300`}>
                         <Icon className={`w-7 h-7 ${tool.iconColor}`} />
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2">{tool.name}</h3>
                      <p className="text-slate-400 text-sm mb-6 leading-relaxed min-h-[40px]">{tool.desc}</p>
                      
                      <span className={`flex items-center gap-2 ${tool.iconColor} font-bold text-sm group-hover:gap-3 transition-all`}>
                         Launch Tool <ChevronRight className="w-4 h-4"/>
                      </span>
                   </button>
               )
           })}
        </div>
      </div>
    );
  }

  // --- EDITOR VIEW ---
  const currentToolConfig = TOOLS_CONFIG.find(t => t.id === activeTool);
  const requiresImage = !['signature', 'qr'].includes(activeTool);

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-slate-950 animate-fade-in">
       {/* Toolbar Header */}
       <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
             <button 
                onClick={() => { setActiveTool(null); handleReset(); }}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-700 hover:border-slate-500"
             >
                <ArrowLeft className="w-5 h-5" />
             </button>
             <div className="h-8 w-[1px] bg-slate-800 mx-2"></div>
             <div className="flex items-center gap-2">
                {currentToolConfig && React.createElement(currentToolConfig.icon, { className: `w-5 h-5 ${currentToolConfig.iconColor}` })}
                <span className="font-bold text-white text-lg">{currentToolConfig?.name}</span>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
             >
                Reset
             </button>
             <button 
                onClick={handleDownload}
                disabled={(requiresImage && !selectedImage) || (activeTool === 'video_gen' && !generatedVideoUrl)}
                className="px-5 py-2 bg-white text-slate-900 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <Download className="w-4 h-4" /> Download
             </button>
          </div>
       </div>

       <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT SIDEBAR: CONTROLS */}
          <div className="w-80 md:w-96 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-hidden">
             
             {/* Upload Area (Conditional) */}
             {requiresImage && (
                 <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                    {!selectedImage ? (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center cursor-pointer hover:bg-slate-800/50 hover:border-blue-500 transition-all group"
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/20 transition-colors">
                                <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-400" />
                            </div>
                            <p className="text-white font-medium text-sm">Upload Source Image</p>
                        </div>
                    ) : (
                        <div className="relative group">
                            <img src={selectedImage} alt="Source" className="w-full h-32 object-cover rounded-xl opacity-50 group-hover:opacity-100 transition-opacity border border-slate-700" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <button onClick={handleReset} className="bg-slate-900/80 text-white px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur border border-white/10 hover:bg-blue-600 transition-colors">Change Image</button>
                            </div>
                        </div>
                    )}
                 </div>
             )}

             {/* Dynamic Controls Area */}
             <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                
                {/* VIDEO GEN CONTROLS */}
                {activeTool === 'video_gen' && selectedImage && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aspect Ratio</label>
                            <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
                                <button onClick={() => setVideoAspectRatio('9:16')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${videoAspectRatio === '9:16' ? 'bg-slate-700 text-white shadow' : 'text-slate-400'}`}>
                                    <Smartphone className="w-3 h-3" /> 9:16
                                </button>
                                <button onClick={() => setVideoAspectRatio('16:9')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${videoAspectRatio === '16:9' ? 'bg-slate-700 text-white shadow' : 'text-slate-400'}`}>
                                    <Monitor className="w-3 h-3" /> 16:9
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prompt</label>
                            <textarea value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)} rows={3} placeholder="Describe your video..." className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-pink-500 outline-none resize-none" />
                        </div>
                        <button onClick={handleVeoGeneration} disabled={isVideoGenerating} className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all">
                            {isVideoGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : <><Wand2 className="w-5 h-5" /> Generate Video</>}
                        </button>
                    </div>
                )}

                {/* SIGNATURE CONTROLS */}
                {activeTool === 'signature' && (
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-400 mb-4 flex gap-3">
                            <PenTool className="w-5 h-5 shrink-0 text-slate-300" />
                            <p>Draw your signature on the canvas area. Works with mouse or touchscreen.</p>
                        </div>
                        <div>
                            <div className="flex justify-between mb-2"><label className="text-xs font-bold text-slate-400 uppercase">Ink Thickness</label><span className="text-xs text-white">{sigWidth}px</span></div>
                            <input type="range" min="1" max="20" value={sigWidth} onChange={(e) => setSigWidth(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Ink Color</label>
                            <div className="flex flex-wrap gap-2">
                                {['#000000', '#1e3a8a', '#dc2626', '#166534'].map(c => (
                                    <button key={c} onClick={() => setSigColor(c)} className={`w-8 h-8 rounded-full border-2 ${sigColor === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                                ))}
                                <input type="color" value={sigColor} onChange={(e) => setSigColor(e.target.value)} className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-none p-0" />
                            </div>
                        </div>
                        <button onClick={clearSignature} className="w-full py-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                            <Eraser className="w-4 h-4" /> Clear Canvas
                        </button>
                    </div>
                )}

                {/* QR CONTROLS */}
                {activeTool === 'qr' && (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Link className="w-3 h-3"/> Data / URL</label>
                            <input type="text" value={qrData} onChange={(e) => setQrData(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-white text-sm focus:border-green-500 outline-none" placeholder="https://..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Foreground</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={qrColor} onChange={(e) => setQrColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
                                    <span className="text-xs font-mono text-slate-500">{qrColor}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Background</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={qrBg} onChange={(e) => setQrBg(e.target.value)} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
                                    <span className="text-xs font-mono text-slate-500">{qrBg}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* WATERMARK CONTROLS */}
                {activeTool === 'watermark' && selectedImage && (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase">Text</label>
                            <input type="text" value={wmText} onChange={(e) => setWmText(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 text-white text-sm outline-none" placeholder="© Copyright" />
                        </div>
                        <div>
                            <div className="flex justify-between mb-2"><label className="text-xs font-bold text-slate-400 uppercase">Opacity</label><span className="text-xs text-white">{Math.round(wmOpacity * 100)}%</span></div>
                            <input type="range" min="0" max="1" step="0.1" value={wmOpacity} onChange={(e) => setWmOpacity(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white" />
                        </div>
                        <div>
                            <div className="flex justify-between mb-2"><label className="text-xs font-bold text-slate-400 uppercase">Size</label><span className="text-xs text-white">{wmSize}px</span></div>
                            <input type="range" min="10" max="200" step="5" value={wmSize} onChange={(e) => setWmSize(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-3 block">Color</label>
                            <div className="flex items-center gap-3">
                                <input type="color" value={wmColor} onChange={(e) => setWmColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
                                <span className="text-xs font-mono text-slate-500">{wmColor}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* PALETTE CONTROLS */}
                {activeTool === 'palette' && selectedImage && (
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-400">
                            <p className="mb-2 font-bold text-white">Dominant Colors Found:</p>
                            <div className="flex flex-col gap-2">
                                {paletteColors.map((color, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-slate-900 p-2 rounded-lg cursor-pointer hover:bg-slate-700" onClick={() => {navigator.clipboard.writeText(color); onShowToast?.("Color Copied!", 'info');}}>
                                        <div className="w-8 h-8 rounded border border-white/20" style={{backgroundColor: color}}></div>
                                        <span className="font-mono text-slate-300">{color.toUpperCase()}</span>
                                        <CopyIcon className="w-3 h-3 ml-auto text-slate-500" />
                                    </div>
                                ))}
                            </div>
                            <p className="mt-4 opacity-50">Image will export with a brand strip at the bottom.</p>
                        </div>
                    </div>
                )}

                {/* ID BADGE CONTROLS */}
                {activeTool === 'id_badge' && selectedImage && (
                    <div className="space-y-5">
                       <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Identity</label>
                          <input type="text" value={idName} onChange={(e) => setIdName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="Full Name" />
                          <input type="text" value={idRole} onChange={(e) => setIdRole(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="Job Title" />
                          <input type="text" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="ID Number" />
                       </div>
                       <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Details</label>
                          <input type="text" value={idCompany} onChange={(e) => setIdCompany(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="Company Name" />
                          <div className="flex items-center gap-3">
                             <input type="color" value={idColor} onChange={(e) => setIdColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
                             <span className="text-xs text-slate-400">Brand Color</span>
                          </div>
                       </div>
                    </div>
                )}

                {/* CROPPER CONTROLS */}
                {activeTool === 'cropper' && selectedImage && (
                    <div className="space-y-6">
                        <div className="flex bg-slate-800 p-1 rounded-lg">
                            <button onClick={() => setResizeMode('aspect')} className={`flex-1 py-1.5 text-xs font-bold rounded ${resizeMode === 'aspect' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Social Presets</button>
                            <button onClick={() => setResizeMode('custom')} className={`flex-1 py-1.5 text-xs font-bold rounded ${resizeMode === 'custom' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Custom Size</button>
                        </div>
                        {resizeMode === 'aspect' ? (
                            <div className="grid grid-cols-2 gap-2">
                               {Object.entries(SOCIAL_PRESETS).map(([key, preset]) => { 
                                   const Icon = preset.icon; 
                                   return (
                                       <button key={key} onClick={() => setCropPreset(key)} className={`p-2 text-xs rounded border flex flex-col items-center justify-center gap-2 h-20 transition-all ${cropPreset === key ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                                           <Icon className="w-5 h-5" /> 
                                           <span>{preset.label}</span>
                                       </button>
                                   ); 
                               })}
                            </div>
                        ) : (
                            <div className="space-y-4">
                               <div><label className="text-xs text-slate-400 block mb-1">Width (px)</label><input type="number" value={customW} onChange={(e) => setCustomW(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm" /></div>
                               <div><label className="text-xs text-slate-400 block mb-1">Height (px)</label><input type="number" value={customH} onChange={(e) => setCustomH(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm" /></div>
                            </div>
                        )}
                    </div>
                )}

                {/* COMPRESSOR CONTROLS */}
                {activeTool === 'compressor' && selectedImage && (
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-800 rounded-xl space-y-3 border border-slate-700">
                           <div className="flex justify-between text-sm items-center"><span className="text-slate-400">Original Size</span><span className="text-white font-mono bg-slate-700 px-2 py-1 rounded">{originalSizeStr}</span></div>
                           <div className="w-full h-[1px] bg-slate-700"></div>
                           <div className="flex justify-between text-sm items-center"><span className="text-slate-400">Compressed</span><span className="text-green-400 font-mono font-bold bg-green-900/30 px-2 py-1 rounded border border-green-500/30">{compressedSizeStr}</span></div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-2"><label className="text-xs font-bold text-slate-400 uppercase">Quality Level</label><span className="text-xs text-amber-400 font-bold">{Math.round(compressionQuality * 100)}%</span></div>
                            <input type="range" min="0.1" max="1.0" step="0.1" value={compressionQuality} onChange={(e) => setCompressionQuality(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                            <div className="flex justify-between text-[10px] text-slate-600 mt-1"><span>Low Quality</span><span>High Quality</span></div>
                        </div>
                    </div>
                )}

                {/* CONVERTER CONTROLS */}
                {activeTool === 'converter' && selectedImage && (
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Format</label>
                        <div className="flex flex-col gap-2">
                            {['png', 'jpeg', 'webp'].map(fmt => (
                                <button key={fmt} onClick={() => setTargetFormat(fmt as any)} className={`w-full py-3 px-4 rounded-xl flex items-center justify-between border transition-all ${targetFormat === fmt ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                                    <span className="uppercase font-bold">{fmt}</span>
                                    {targetFormat === fmt && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* RING CONTROLS */}
                {activeTool === 'ring' && selectedImage && (
                    <div className="space-y-6">
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Ring Color</label><div className="flex flex-wrap gap-2">{['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#ffffff'].map(color => (<button key={color} onClick={() => setRingColor(color)} className={`w-8 h-8 rounded-full border-2 transition-transform ${ringColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: color }} />))}<input type="color" value={ringColor} onChange={(e) => setRingColor(e.target.value)} className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-none p-0" /></div></div>
                        <div><div className="flex justify-between mb-2"><label className="text-xs font-bold text-slate-500 uppercase">Thickness</label><span className="text-xs text-slate-400">{ringWidth}px</span></div><input type="range" min="0" max="50" value={ringWidth} onChange={(e) => setRingWidth(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500" /></div>
                    </div>
                )}

             </div>
          </div>

          {/* RIGHT CANVAS: PREVIEW */}
          <div className="flex-1 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-950 flex items-center justify-center p-8 relative overflow-hidden">
             {/* Checkered Background for Transparency */}
             <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}></div>
             
             {/* Video Gen Preview */}
             {activeTool === 'video_gen' ? (
                generatedVideoUrl ? (
                    <div className="relative shadow-2xl shadow-black/50">
                        <video src={generatedVideoUrl} controls autoPlay loop className="max-h-[80vh] border border-slate-700/50 rounded-xl" />
                    </div>
                ) : (
                    <div className="text-center text-slate-600 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 shadow-lg">
                            <Video className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="font-medium">{isVideoGenerating ? "Generating your video..." : "Ready to Animate"}</p>
                        <p className="text-sm opacity-60">{isVideoGenerating ? "This may take a minute" : "Configure settings on the left"}</p>
                    </div>
                )
             ) : (
                 // Canvas Tools
                 requiresImage && !selectedImage ? (
                     <div className="text-center text-slate-600 flex flex-col items-center">
                         <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 shadow-lg">
                            <ImageIcon className="w-8 h-8 opacity-50" />
                         </div>
                         <p className="font-medium">No Image Selected</p>
                         <p className="text-sm opacity-60">Upload an image from the sidebar</p>
                     </div>
                 ) : (
                     <div className="relative shadow-2xl shadow-black/50 transition-all duration-300">
                         <canvas ref={canvasRef} className={`max-w-full max-h-[80vh] rounded-sm border border-slate-700/50 block ${activeTool === 'signature' ? 'bg-white cursor-crosshair' : 'bg-slate-900'}`} />
                     </div>
                 )
             )}
          </div>
       </div>
    </div>
  );
};

const CopyIcon = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
);
