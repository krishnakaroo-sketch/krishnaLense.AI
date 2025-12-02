
import React, { useRef, useState, useMemo } from 'react';
import { HEADSHOT_STYLES } from '../constants';
import { StyleOption, StyleCategory } from '../types';
import { Briefcase, Building2, Sun, Camera, Coffee, Monitor, Check, ArrowRight, Hammer, PartyPopper, Landmark, Shirt, TreeDeciduous, Cpu, Flower2, Crown, ImagePlus, Upload, Stethoscope, Home, HardHat, User, AlertTriangle, BookOpen, GraduationCap, Laptop, Palette, Moon, Feather, Shield, Award, Plane, Flame, Sparkles, Heart, Church, Sunrise, Film, Scale, Ruler, LineChart, Flag, Mic2, Megaphone, Gem, Trophy, ChefHat, PenTool, Brush, Gamepad2, Hand, Bike, Target, Zap, Flower, Anchor, Star, Hexagon, Watch, Leaf, Sprout, Dumbbell, MapPin, Car, Wine, Gift, CloudRain, Snowflake, Rocket, Eye, Speaker, Grid, Search, Settings, Waves, Footprints, Droplets, Users, Music, Disc, Lock, Armchair, MoveVertical } from 'lucide-react';

// Map icon strings to components
const IconMap: Record<string, React.ElementType> = {
  Briefcase,
  Building2,
  Sun,
  Camera,
  Coffee,
  Monitor,
  Hammer,
  PartyPopper,
  Landmark,
  Shirt,
  TreeDeciduous,
  Cpu,
  Flower2,
  Crown,
  ImagePlus,
  Stethoscope,
  Home,
  HardHat,
  User,
  BookOpen,
  GraduationCap,
  Laptop,
  Palette,
  Moon,
  Feather,
  Shield,
  Award,
  Plane,
  Flame,
  Sparkles,
  Heart,
  Church,
  Sunrise,
  Film,
  Scale,
  Ruler,
  LineChart,
  Flag,
  Mic2,
  Megaphone,
  Gem,
  Trophy,
  ChefHat,
  PenTool,
  Brush,
  Gamepad2,
  Hand,
  Bike,
  Target,
  Zap,
  Flower,
  Anchor,
  Star,
  Hexagon,
  Watch,
  Leaf,
  Sprout,
  Dumbbell,
  MapPin,
  Car,
  Wine,
  Gift,
  CloudRain,
  Snowflake,
  Rocket,
  Eye,
  Speaker,
  Grid,
  Search,
  Settings,
  Waves,
  Footprints,
  Droplets,
  Users,
  Music,
  Disc,
  Armchair,
  MoveVertical
};

interface StyleSelectorProps {
  selectedStyle: StyleOption | null;
  onSelect: (style: StyleOption) => void;
  onConfirm: () => void;
  previewImage: string;
  isPremium?: boolean;
}

const CATEGORIES: StyleCategory[] = ['Professional', 'Political', 'Casual', 'Formal Events', 'Cultural', 'Creative', 'Group Photos', 'Social Media Status', 'Profile Poses'];

export const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onSelect, onConfirm, previewImage, isPremium = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customStyle, setCustomStyle] = useState<StyleOption | null>(null);
  const [activeCategory, setActiveCategory] = useState<StyleCategory>('Professional');
  
  // Confirmation Modal State
  const [pendingStyle, setPendingStyle] = useState<StyleOption | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const filteredStyles = useMemo(() => {
    return HEADSHOT_STYLES.filter(s => s.category === activeCategory);
  }, [activeCategory]);

  const handleCustomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      
      const newCustomStyle: StyleOption = {
        id: 'custom-background',
        name: 'Custom Background',
        category: 'Creative', // Default to Creative
        description: 'Using your uploaded background image.',
        promptModifier: 'using the provided custom background',
        iconName: 'ImagePlus',
        colorFrom: 'from-gray-700',
        colorTo: 'to-slate-900',
        previewUrl: previewUrl,
        customBackground: file,
        isPremium: false
      };
      
      setCustomStyle(newCustomStyle);
      
      // If we are already on custom background, just update the selection with new file
      // to avoid triggering confirmation for the same style type
      if (selectedStyle?.id === 'custom-background') {
          onSelect(newCustomStyle);
      } else {
          // Otherwise go through confirmation flow
          initiateSelection(newCustomStyle);
      }
    }
  };

  const initiateSelection = (style: StyleOption) => {
    // Check for Premium lock first
    if (style.isPremium && !isPremium) {
      onSelect(style); // Parent handles opening payment modal
      return;
    }

    // If no style is currently selected, select immediately
    if (!selectedStyle) {
        onSelect(style);
        return;
    }

    // If clicking the already selected style
    if (selectedStyle.id === style.id) {
        // If it's the custom background card, allow changing the image
        if (style.id === 'custom-background') {
            fileInputRef.current?.click();
        }
        return;
    }

    // If switching to a new style, prompt for confirmation
    setPendingStyle(style);
    setShowConfirmation(true);
  };

  const confirmSwitch = () => {
    if (pendingStyle) {
      onSelect(pendingStyle);
    }
    setShowConfirmation(false);
    setPendingStyle(null);
  };

  const cancelSwitch = () => {
    setShowConfirmation(false);
    setPendingStyle(null);
  };

  const handleCustomCardClick = () => {
    if (customStyle && selectedStyle?.id === 'custom-background') {
       // Already active, click to change image
       fileInputRef.current?.click();
    } else if (customStyle) {
       // Have a custom style but not active, initiate switch logic
       initiateSelection(customStyle);
    } else {
       // No custom style yet, trigger upload
       fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in relative">
      
      {/* Confirmation Modal */}
      {showConfirmation && pendingStyle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl transform scale-100 animate-scale-in">
              <div className="flex items-center gap-3 mb-4 text-amber-400">
                 <AlertTriangle className="w-8 h-8" />
                 <h3 className="text-xl font-bold text-white">Change Style?</h3>
              </div>
              <p className="text-slate-300 mb-6 leading-relaxed">
                 You currently have <span className="font-bold text-white">{selectedStyle?.name}</span> selected. 
                 Switching to <span className="font-bold text-white">{pendingStyle.name}</span> will replace your current settings.
                 <span className="block mt-2 text-sm text-slate-400">Current progress for the selected style will be lost. Do you want to continue?</span>
              </p>
              <div className="flex gap-3 justify-end">
                 <button 
                   onClick={cancelSwitch}
                   className="px-4 py-2 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                 >
                   No, Keep Current
                 </button>
                 <button 
                   onClick={confirmSwitch}
                   className="px-5 py-2 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg"
                 >
                   Yes, Change Style
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Preview Sidebar */}
        <div className="w-full lg:w-1/4 sticky top-24">
           <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-xl mb-6">
             <p className="text-slate-400 text-xs font-bold tracking-wider mb-3 uppercase">Original Image</p>
             <div className="aspect-[4/5] w-full rounded-xl overflow-hidden bg-slate-900 relative">
               <img 
                 src={previewImage} 
                 alt="Original" 
                 className="w-full h-full object-cover opacity-80" 
               />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col justify-end p-4">
                  <span className="text-white font-medium">Your Upload</span>
               </div>
             </div>
           </div>
        </div>

        {/* Style Grid */}
        <div className="w-full lg:w-3/4">
          <div className="mb-6">
             <h2 className="text-2xl font-bold text-white">Choose your style</h2>
             <p className="text-slate-400">Select a professional aesthetic for your photo.</p>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap
                  ${activeCategory === cat 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Custom Background Upload Card - Shown in Creative tab */}
            {activeCategory === 'Creative' && (
              <button
                 onClick={handleCustomCardClick}
                 className={`relative group rounded-2xl border text-left transition-all duration-500 overflow-hidden flex flex-col h-full min-h-[320px]
                   ${selectedStyle?.id === 'custom-background'
                     ? 'border-blue-500 bg-slate-800 ring-2 ring-blue-500/50 shadow-2xl shadow-blue-500/20 transform -translate-y-2' 
                     : 'border-dashed border-slate-600 bg-slate-800/20 hover:bg-slate-800 hover:border-slate-500 hover:-translate-y-2 hover:shadow-xl'
                   }`}
              >
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleCustomFileChange} 
                   accept="image/*" 
                   className="hidden" 
                 />
                 
                 <div className="w-full aspect-[4/5] relative overflow-hidden border-b border-slate-700/50 bg-slate-900 flex items-center justify-center">
                   {customStyle ? (
                      <>
                        <img 
                          src={customStyle.previewUrl} 
                          alt="Custom Background" 
                          className={`w-full h-full object-cover transition-all duration-700 ease-out
                            ${selectedStyle?.id === 'custom-background' ? 'scale-110' : 'grayscale group-hover:grayscale-0'}`} 
                        />
                         {selectedStyle?.id === 'custom-background' && (
                          <div className="absolute top-3 right-3 bg-blue-500 text-white p-2 rounded-full shadow-lg animate-scale-in z-10">
                            <Check className="w-5 h-5" />
                          </div>
                        )}
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-slate-900/80 p-3 rounded-full backdrop-blur">
                              <Upload className="w-6 h-6 text-white" />
                            </div>
                         </div>
                      </>
                   ) : (
                      <div className="flex flex-col items-center gap-3 text-slate-500 group-hover:text-blue-400 transition-colors p-6 text-center">
                         <div className="p-4 rounded-full bg-slate-800 group-hover:bg-blue-500/20 transition-colors">
                           <ImagePlus className="w-10 h-10" />
                         </div>
                         <span className="font-medium">Upload Background</span>
                      </div>
                   )}
                   
                   {/* Icon Overlay for Custom */}
                   {customStyle && (
                      <div className="absolute bottom-0 left-0 p-5 w-full">
                         <div className={`flex items-center gap-3 transition-transform duration-300 ${selectedStyle?.id === 'custom-background' ? 'translate-y-0' : 'translate-y-1 group-hover:translate-y-0'}`}>
                            <div className={`p-2 rounded-lg backdrop-blur-sm ${selectedStyle?.id === 'custom-background' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white group-hover:bg-white/20'}`}>
                              <ImagePlus className="w-5 h-5" />
                            </div>
                            <span className={`font-bold text-lg tracking-tight text-white drop-shadow-md`}>
                              Custom
                            </span>
                         </div>
                       </div>
                   )}
                 </div>

                 <div className="p-5 relative flex-1 flex flex-col bg-slate-800/50">
                    <div className={`absolute inset-0 bg-gradient-to-br from-gray-800 to-black transition-opacity duration-500 ${selectedStyle?.id === 'custom-background' ? 'opacity-20' : 'opacity-0'}`} />
                    <p className="text-sm text-slate-400 leading-relaxed relative z-10">
                      {customStyle ? "Using your custom uploaded background." : "Upload your own background image to use."}
                    </p>
                 </div>
              </button>
            )}

            {/* Filtered Styles */}
            {filteredStyles.map((style) => {
              const Icon = IconMap[style.iconName] || Camera;
              const isSelected = selectedStyle?.id === style.id;
              const isLocked = style.isPremium && !isPremium;

              return (
                <button
                  key={style.id}
                  onClick={() => initiateSelection(style)}
                  className={`relative group rounded-2xl border text-left transition-all duration-500 overflow-hidden flex flex-col h-full
                    ${isSelected 
                      ? 'border-blue-500 bg-slate-800 ring-2 ring-blue-500/50 shadow-2xl shadow-blue-500/20 transform -translate-y-2' 
                      : isLocked 
                        ? 'border-slate-700 bg-slate-800/20 hover:border-amber-500/50 hover:shadow-lg opacity-80 hover:opacity-100'
                        : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-600 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/20'
                    }`}
                >
                  {/* Style Preview Image */}
                  <div className="w-full aspect-[4/5] relative overflow-hidden border-b border-slate-700/50 bg-slate-900">
                    <img 
                      src={style.previewUrl} 
                      alt={style.name}
                      loading="lazy"
                      className={`w-full h-full object-cover transition-all duration-700 ease-out 
                        ${isSelected 
                          ? 'scale-110 grayscale-0 brightness-105' 
                          : isLocked
                            ? 'scale-100 grayscale brightness-50 group-hover:scale-105'
                            : 'scale-100 grayscale-[0.3] brightness-90 group-hover:scale-110 group-hover:grayscale-0 group-hover:brightness-105'
                        }`}
                    />
                    
                    {/* Cinematic Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-60" />
                    
                    {/* Locked Overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                        <div className="p-3 bg-amber-500 text-white rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                          <Lock className="w-6 h-6" />
                        </div>
                      </div>
                    )}
                    
                    {/* Selection Indicator Badge */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 bg-blue-500 text-white p-2 rounded-full shadow-lg animate-scale-in z-10">
                        <Check className="w-5 h-5" />
                      </div>
                    )}

                    {/* Icon Overlay */}
                     <div className="absolute bottom-0 left-0 p-5 w-full">
                       <div className={`flex items-center gap-3 transition-transform duration-300 ${isSelected ? 'translate-y-0' : 'translate-y-1 group-hover:translate-y-0'}`}>
                          <div className={`p-2 rounded-lg backdrop-blur-sm ${isSelected ? 'bg-blue-500 text-white' : isLocked ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white group-hover:bg-white/20'}`}>
                            {isLocked ? <Gem className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                          </div>
                          <span className={`font-bold text-lg tracking-tight text-white drop-shadow-md ${isSelected ? 'text-blue-100' : isLocked ? 'text-amber-100' : ''}`}>
                            {style.name}
                          </span>
                          {style.isPremium && !isLocked && (
                             <span className="text-[10px] font-bold bg-amber-500 text-black px-1.5 py-0.5 rounded">PRO</span>
                          )}
                       </div>
                     </div>
                  </div>

                  {/* Content Description */}
                  <div className="p-5 relative flex-1 flex flex-col bg-slate-800/50">
                    <div className={`absolute inset-0 bg-gradient-to-br ${style.colorFrom} ${style.colorTo} transition-opacity duration-500 ${isSelected ? 'opacity-10' : 'opacity-0 group-hover:opacity-5'}`} />
                    
                    <p className="text-sm text-slate-400 leading-relaxed relative z-10 group-hover:text-slate-300 transition-colors">
                      {isLocked ? "Upgrade to PRO to unlock this premium style." : style.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={onConfirm}
            disabled={!selectedStyle}
            className={`w-full py-5 rounded-xl font-bold text-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-xl
              ${selectedStyle 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-600/20 transform hover:-translate-y-1' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
          >
            Generate
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes scale-in {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};