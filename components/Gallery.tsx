
import React, { useState, useEffect } from 'react';
import { Download, Trash2, Image as ImageIcon, AlertCircle, Calendar, Clock, Link, Check } from 'lucide-react';
import { ToastType } from './Toast';

interface GalleryProps {
  userId: string;
  onShowToast?: (msg: string, type: ToastType) => void;
}

interface GalleryItem {
  id: string;
  url: string;
  timestamp: number;
  styleName: string;
}

export const Gallery: React.FC<GalleryProps> = ({ userId, onShowToast }) => {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const loadImages = () => {
      try {
        const key = `krishnalense_gallery_${userId}`;
        const data = localStorage.getItem(key);
        if (data) {
          // Stored as Old -> New, so reverse to show Newest first
          setImages(JSON.parse(data).reverse());
        }
      } catch (e) {
        console.error("Gallery load error", e);
      }
    };
    loadImages();
  }, [userId]);

  const deleteImage = (id: string) => {
    if(!window.confirm("Are you sure you want to delete this image?")) return;
    
    // Filter out the deleted image
    const newImages = images.filter(img => img.id !== id);
    setImages(newImages);
    
    // Update local storage (We reverse it back to chronological order for consistency with append logic)
    try {
        const key = `krishnalense_gallery_${userId}`;
        localStorage.setItem(key, JSON.stringify(newImages.slice().reverse()));
        onShowToast?.("Image Deleted", 'info');
    } catch (e) {
        console.error("Failed to update storage", e);
    }
  };

  const downloadImage = (img: GalleryItem) => {
     const link = document.createElement('a');
     link.href = img.url;
     link.download = `KL_Headshot_${img.id}.png`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     onShowToast?.("Download Started", 'success');
  };

  const copyImageLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url).then(() => {
        setCopiedId(id);
        onShowToast?.("Link Copied!", 'success');
        setTimeout(() => setCopiedId(null), 2000);
    }).catch(err => {
        console.error('Failed to copy link', err);
        onShowToast?.('Failed to copy link', 'error');
    });
  };

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center">
         <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <ImageIcon className="w-10 h-10 text-slate-600" />
         </div>
         <h3 className="text-2xl font-bold text-white mb-2">Gallery is Empty</h3>
         <p className="text-slate-400 max-w-sm mx-auto">
            You haven't generated any headshots yet. Start creating to build your portfolio.
         </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 animate-fade-in">
       <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-white mb-2">Your Gallery</h2>
          <p className="text-slate-400">Manage your previously generated headshots.</p>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4 md:px-0">
          {images.map(img => (
            <div key={img.id} className="group bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 hover:border-blue-500/50 transition-all shadow-xl hover:shadow-2xl hover:shadow-blue-900/20 relative flex flex-col">
               <div className="aspect-[4/5] bg-slate-900 relative overflow-hidden">
                  <img 
                    src={img.url} 
                    alt={img.styleName} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-6 gap-3">
                     <button 
                        onClick={() => downloadImage(img)} 
                        className="p-3 bg-white text-slate-900 rounded-full hover:bg-blue-50 transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 hover:scale-110"
                        title="Download"
                     >
                        <Download className="w-5 h-5"/>
                     </button>
                     <button 
                        onClick={() => copyImageLink(img.id, img.url)} 
                        className="p-3 bg-white text-slate-900 rounded-full hover:bg-blue-50 transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75 hover:scale-110"
                        title="Copy Link"
                     >
                        {copiedId === img.id ? <Check className="w-5 h-5 text-green-600" /> : <Link className="w-5 h-5"/>}
                     </button>
                     <button 
                        onClick={() => deleteImage(img.id)} 
                        className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-150 hover:scale-110"
                        title="Delete"
                     >
                        <Trash2 className="w-5 h-5"/>
                     </button>
                  </div>
               </div>
               
               <div className="p-5 border-t border-slate-700/50 flex flex-col gap-2 bg-slate-800/50">
                  <div className="flex justify-between items-start">
                     <p className="font-bold text-white text-lg truncate pr-2">{img.styleName}</p>
                     <span className="text-[10px] font-mono bg-slate-700 text-slate-400 px-2 py-1 rounded-md opacity-70">
                        {img.id.slice(-4)}
                     </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                     <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(img.timestamp).toLocaleDateString()}</span>
                     </div>
                     <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(img.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                     </div>
                  </div>
               </div>
            </div>
          ))}
       </div>
       
       <div className="mt-12 flex items-center justify-center gap-3 text-xs text-slate-500 bg-slate-800/30 p-4 rounded-xl max-w-2xl mx-auto border border-slate-700/50">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
          <span>Note: Images are stored securely in your browser's local storage. Clearing your browser cache or data will remove this gallery.</span>
       </div>
    </div>
  );
};
