
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { StyleSelector } from './components/StyleSelector';
import { LoadingState } from './components/LoadingState';
import { ResultDisplay } from './components/ResultDisplay';
import { InfoModal } from './components/InfoModal';
import { AuthScreen } from './components/AuthScreen';
import { AgenticChat } from './components/AgenticChat';
import { Gallery } from './components/Gallery';
import { ExtraTools } from './components/ExtraTools';
import { PaymentContent } from './components/PaymentContent';
import { Toast, ToastType } from './components/Toast';
import { AppState, StyleOption, GeneratedImage, UserProfile } from './types';
import { generateHeadshot, upscaleHeadshot } from './services/geminiService';
import { AlertTriangle, Shield, CheckCircle2, Server, Star, Lock, Smartphone, Loader2, FileText, MessageCircle, Key, Download, Globe, Cpu, Layers, Palette, Eye, HelpCircle, FileBadge, Bot, Lightbulb, Camera, Sparkles } from 'lucide-react';
import jsPDF from 'jspdf';

export const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [generatedResult, setGeneratedResult] = useState<GeneratedImage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // User Account State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  
  // Navigation State - Tabs
  const [activeTab, setActiveTab] = useState<string>('Home');
  
  // Modal State for Payment
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [transactionId, setTransactionId] = useState('');

  // Admin State
  const [showAdminAccess, setShowAdminAccess] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{message: string, type: ToastType, isVisible: boolean}>({
    message: '', type: 'info', isVisible: false
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // Check for active session on load
  useEffect(() => {
    const storedUser = localStorage.getItem('krishnalense_active_user');
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        setUser(userObj);
        setIsPremium(userObj.isPremium || false);
      } catch (e) {
        console.error("Failed to parse session", e);
      }
    }
  }, []);

  const handleLogin = (loggedInUser: any) => {
    setUser({
      name: loggedInUser.name,
      userId: loggedInUser.userId,
      isPremium: loggedInUser.isPremium,
      email: loggedInUser.email,
      mobile: loggedInUser.mobile
    });
    setIsPremium(loggedInUser.isPremium);
    // Persist session
    localStorage.setItem('krishnalense_active_user', JSON.stringify(loggedInUser));
    
    // Close auth screen
    setShowAuth(false);
    showToast(`Welcome back, ${loggedInUser.name}`, 'success');

    // If there was a pending upload, resume it
    if (pendingFile) {
        setSelectedImage(pendingFile);
        // URL is already created in previewUrl if we set it during handleImageSelect
        setAppState(AppState.SELECTING_STYLE);
        setErrorMessage(null);
        setPendingFile(null);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsPremium(false);
    localStorage.removeItem('krishnalense_active_user');
    setAppState(AppState.IDLE);
    setActiveTab('Home');
    setPreviewUrl(null);
    setShowAdminAccess(false); // Reset admin visibility on logout
    setIsAdminUnlocked(false);
    showToast("Logged out successfully", 'info');
  };

  const handleImageSelect = (file: File) => {
    // Generate preview URL immediately for visual feedback
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // If not logged in, prompt for auth but keep the preview on the main page
    if (!user) {
        setPendingFile(file);
        setShowAuth(true);
        return;
    }

    setSelectedImage(file);
    setAppState(AppState.SELECTING_STYLE);
    setErrorMessage(null);
  };

  const handleStyleSelect = (style: StyleOption) => {
    // Check if the style is premium and user is not
    if (style.isPremium && !isPremium) {
      // Trigger payment flow
      initiatePayment();
      return;
    }
    setSelectedStyle(style);
  };

  const handleStyleConfirm = async () => {
    if (!selectedImage || !selectedStyle) return;

    setAppState(AppState.GENERATING);
    setErrorMessage(null);

    try {
      // Pass the customBackground if it exists
      const resultBase64 = await generateHeadshot(
        selectedImage, 
        selectedStyle.promptModifier,
        selectedStyle.customBackground
      );
      
      const result = {
        url: resultBase64,
        timestamp: Date.now()
      };

      setGeneratedResult(result);
      setAppState(AppState.SUCCESS);
      showToast("Headshot generated successfully!", 'success');

      // Save to Gallery if user is logged in
      if (user) {
         try {
             const key = `krishnalense_gallery_${user.userId}`;
             const existingStr = localStorage.getItem(key);
             let gallery = existingStr ? JSON.parse(existingStr) : [];
             
             // Initial soft limit - start removing if we have too many, 
             // but dynamic removal below handles size constraints better.
             if (gallery.length >= 10) {
                 gallery = gallery.slice(gallery.length - 9); 
             }
             
             gallery.push({
                 id: Date.now().toString(),
                 url: resultBase64,
                 timestamp: Date.now(),
                 styleName: selectedStyle.name
             });
             
             // Robust Save with Quota Handling
             // Loop until save is successful or we run out of images to delete
             while (true) {
                 try {
                     localStorage.setItem(key, JSON.stringify(gallery));
                     break; // Success
                 } catch (e: any) {
                     // Check for Quota Exceeded Error
                     if (
                        e.name === 'QuotaExceededError' || 
                        e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                        (e.message && e.message.toLowerCase().includes('quota')) ||
                        e.code === 22 || 
                        e.code === 1014
                     ) {
                         if (gallery.length <= 1) {
                             console.error("Unable to save image: exceeds storage quota even when empty.");
                             break;
                         }
                         // Remove oldest image (index 0) to make space
                         // Note: The new image is at the end, we preserve that.
                         gallery.shift();
                     } else {
                         throw e; // Throw other errors
                     }
                 }
             }

         } catch (storageErr) {
             console.error("Storage full or error", storageErr);
             showToast("Storage full: Could not save to gallery", 'error');
         }
      }

    } catch (error: any) {
      console.error("Generation failed", error);
      setAppState(AppState.ERROR);
      setErrorMessage(error.message || "Something went wrong during generation. Please try again.");
      showToast("Generation failed. Please try again.", 'error');
    }
  };

  const handleUpscale = async () => {
    if (!generatedResult) return;
    try {
      const newUrl = await upscaleHeadshot(generatedResult.url);
      setGeneratedResult({
        url: newUrl,
        timestamp: Date.now()
      });
      showToast("Image upscaled to 4K!", 'success');
    } catch (error: any) {
      console.error("Upscaling failed", error);
      showToast("Upscaling failed: " + (error.message || "Unknown error"), 'error');
      throw error; 
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setSelectedImage(null);
    setPreviewUrl(null);
    setSelectedStyle(null);
    setGeneratedResult(null);
    setErrorMessage(null);
  };

  const handleBackToStyle = () => {
    setAppState(AppState.SELECTING_STYLE);
    setErrorMessage(null);
  };

  const handleNavigate = (section: string) => {
    // If payment modal is open, close it
    if (activeModal) setActiveModal(null);

    // Set the active tab
    setActiveTab(section);

    // If we are not in IDLE state (e.g. generating or viewing result), reset to home/IDLE state first
    // UNLESS we are navigating to Gallery and want to come back? 
    // For simplicity, reset app state when navigating top-level tabs.
    if (appState !== AppState.IDLE && section !== 'Home') {
       handleReset();
    }
    
    // Scroll to top to ensure content is visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const initiatePayment = () => {
    setActiveModal('Payment');
    setPaymentStatus('idle');
    setTransactionId('');
  };

  const handleAdminUnlock = () => {
    if (adminCodeInput === '21081981') {
      setIsAdminUnlocked(true);
      setAdminCodeInput('');
      showToast("Admin Panel Unlocked", 'success');
    } else {
      showToast("Invalid Admin Passcode", 'error');
    }
  };

  const generateLicenseKeys = () => {
    const codes: string[] = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    // Generate 1000 codes
    for (let i = 0; i < 1000; i++) {
      let code = '';
      for (let j = 0; j < 15; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      codes.push(code);
    }

    // Save to localStorage so verifyPayment can see them
    localStorage.setItem('krishnalense_valid_codes', JSON.stringify(codes));

    // Create a Blob for download
    const blob = new Blob([codes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `KL_License_Keys_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Generated 1000 License Keys!", 'success');
  };

  const verifyPayment = () => {
    if (!transactionId || transactionId.length < 15) {
      showToast("Please enter a valid 15-digit code.", 'error');
      return;
    }

    setPaymentStatus('processing');
    
    // Simulate API verification delay
    setTimeout(() => {
        // Validation Logic
        const storedCodesStr = localStorage.getItem('krishnalense_valid_codes');
        const validCodes = storedCodesStr ? JSON.parse(storedCodesStr) : [];
        
        // Remove spaces and uppercase
        const inputCode = transactionId.trim().toUpperCase();

        // Check if code exists (OR if it's a specific master bypass for testing/fallback if no codes generated yet)
        const isValid = validCodes.includes(inputCode) || (validCodes.length === 0 && inputCode.length >= 15); 

        if (isValid) {
            setPaymentStatus('success');
            setIsPremium(true);
            showToast("Pro features unlocked!", 'success');
            
            // Update user record in storage
            if (user) {
               const updatedUser = { ...user, isPremium: true };
               setUser(updatedUser);
               localStorage.setItem('krishnalense_active_user', JSON.stringify(updatedUser));
               
               // Also update in the main users list
               const existingUsersStr = localStorage.getItem('krishnalense_users');
               if (existingUsersStr) {
                  const allUsers = JSON.parse(existingUsersStr);
                  const index = allUsers.findIndex((u: any) => u.userId === user.userId);
                  if (index !== -1) {
                     allUsers[index].isPremium = true;
                     localStorage.setItem('krishnalense_users', JSON.stringify(allUsers));
                  }
               }
            }
            
            // Remove used code if we want them to be one-time use
            if (validCodes.includes(inputCode)) {
                const newCodes = validCodes.filter((c: string) => c !== inputCode);
                localStorage.setItem('krishnalense_valid_codes', JSON.stringify(newCodes));
            }

            // Auto close after success
            setTimeout(() => {
                setActiveModal(null);
            }, 3000);
        } else {
            showToast("Invalid or expired Verification Code.", 'error');
            setPaymentStatus('idle');
        }
    }, 2000);
  };

  // Helper to draw the geometric brand logo on canvas
  const drawBrandLogo = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) => {
    // 1. Draw Outer Ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = radius * 0.1;
    // Gradient for stroke
    const grad = ctx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
    grad.addColorStop(0, '#3b82f6');
    grad.addColorStop(1, '#ec4899');
    ctx.strokeStyle = grad;
    ctx.stroke();

    // 2. Draw Aperture Blades (simplified)
    const bladeCount = 6;
    ctx.fillStyle = '#3b82f6'; // Fallback color
    // Use the same gradient for fill
    ctx.fillStyle = grad;
    
    // Draw 6 interlocking triangles
    for(let i=0; i<bladeCount; i++) {
        const angle = (i * Math.PI * 2) / bladeCount;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        // Geometry to mimic the SVG blade path roughly
        // Start center-ish, go out
        ctx.moveTo(0, 0); 
        ctx.lineTo(radius * 0.9, -radius * 0.4);
        ctx.lineTo(radius * 0.9, radius * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // 3. Central "Iris" Circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 1.0;
    ctx.fill();

    // 4. Center Sparkle
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.fillStyle = '#3b82f6';
    const sparkleSize = radius * 0.15;
    ctx.beginPath();
    ctx.moveTo(0, -sparkleSize);
    ctx.lineTo(sparkleSize * 0.3, -sparkleSize * 0.3);
    ctx.lineTo(sparkleSize, 0);
    ctx.lineTo(sparkleSize * 0.3, sparkleSize * 0.3);
    ctx.lineTo(0, sparkleSize);
    ctx.lineTo(-sparkleSize * 0.3, sparkleSize * 0.3);
    ctx.lineTo(-sparkleSize, 0);
    ctx.lineTo(-sparkleSize * 0.3, -sparkleSize * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const downloadSOP = () => {
    const canvas = document.createElement('canvas');
    const width = 1600;
    const height = 2200; // A4 ratio
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Header Background
    ctx.fillStyle = '#1e293b'; // Slate 800
    ctx.fillRect(0, 0, width, 380);

    // --- BRAND LOGO GEOMETRY ---
    // Draw logo to the left of the title
    drawBrandLogo(ctx, width/2, 100, 50);

    // Text Content
    ctx.textAlign = 'center';
    const logoSize = 60;
    ctx.font = `900 ${logoSize}px Inter, sans-serif`;
    
    // Gradient text for logo
    const gradient = ctx.createLinearGradient(width/2 - 200, 0, width/2 + 200, 0);
    gradient.addColorStop(0, '#60a5fa'); // blue-400
    gradient.addColorStop(0.5, '#c084fc'); // purple-400
    gradient.addColorStop(1, '#60a5fa');
    
    ctx.fillStyle = gradient;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 15;
    // Shift text down slightly since logo is drawn at y=100
    ctx.fillText('KrishnaLense.AI', width / 2, 200);
    
    // Logo Subtitle
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#94a3b8'; // Slate 400
    ctx.font = `700 ${logoSize * 0.35}px Inter, sans-serif`;
    ctx.fillText('By Dr. Krishna Karoo', width / 2, 240);

    // Document Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px Inter, sans-serif';
    ctx.fillText('Standard Operating Procedures', width / 2, 330);
    
    // Content Settings
    ctx.textAlign = 'left';
    ctx.fillStyle = '#334155'; // Slate 700
    const startX = 150;
    let currentY = 520;
    const lineHeight = 60;
    const sectionGap = 90;

    // Helper for drawing text sections
    const drawSection = (title: string, lines: string[]) => {
        ctx.font = 'bold 50px Inter, sans-serif';
        ctx.fillStyle = '#0f172a'; // Slate 900
        ctx.fillText(title, startX, currentY);
        currentY += 70;

        ctx.font = '35px Inter, sans-serif';
        ctx.fillStyle = '#334155'; // Slate 700
        lines.forEach(line => {
            ctx.fillText('• ' + line, startX + 20, currentY);
            currentY += lineHeight;
        });
        currentY += sectionGap;
    };

    drawSection('1. Purpose & Scope', [
        'To ensure the ethical, legal, and responsible use of Generative AI.',
        'Applies to all registered users utilizing image generation features.'
    ]);

    drawSection('2. Input Data Policy', [
        'Users must only upload photos of themselves.',
        'Uploading photos of non-consenting third parties is strictly prohibited.',
        'Images containing nudity, violence, or hate symbols are banned.'
    ]);

    drawSection('3. Privacy & Security', [
        'All uploaded data is processed in volatile memory (RAM).',
        'Source images are permanently deleted immediately after processing.',
        'We do not use user data to train public AI models.'
    ]);

    drawSection('4. Ethical Usage', [
        'Generated images must not be used for impersonation or fraud.',
        'Users retain commercial rights to their Pro-generated images.',
        'KrishnaLense.AI reserves the right to suspend accounts for violations.'
    ]);

    // Footer
    currentY = height - 250;
    ctx.fillStyle = '#f1f5f9'; // Slate 100
    ctx.fillRect(0, currentY, width, 250);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = '30px Inter, sans-serif';
    ctx.fillText('Authorized by', width / 2, currentY + 80);
    
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 40px Inter, sans-serif';
    ctx.fillText('Dr. Krishna Karoo', width / 2, currentY + 140);
    
    ctx.font = 'italic 30px Inter, sans-serif';
    ctx.fillText('Founder & CEO, KrishnaLense.AI', width / 2, currentY + 190);

    // Convert to PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('KrishnaLense_SOP.pdf');
    showToast("SOP Downloaded", 'success');
  };

  const downloadCertificate = () => {
    if (!user) return;
    
    const canvas = document.createElement('canvas');
    const width = 2000;
    const height = 1400;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Decorative Pattern Background
    ctx.fillStyle = '#f8fafc';
    for(let i=0; i<width; i+=40) {
        for(let j=0; j<height; j+=40) {
            if((i+j)%80 === 0) ctx.fillRect(i, j, 20, 20);
        }
    }

    // Border
    const padding = 60;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 15;
    ctx.strokeRect(padding, padding, width - padding*2, height - padding*2);
    
    ctx.strokeStyle = '#cca529'; // Gold-ish
    ctx.lineWidth = 5;
    ctx.strokeRect(padding + 20, padding + 20, width - (padding*2 + 40), height - (padding*2 + 40));

    // Corner decorations (Simple triangles)
    ctx.fillStyle = '#0f172a';
    // Top Left
    ctx.beginPath(); ctx.moveTo(padding, padding); ctx.lineTo(padding + 100, padding); ctx.lineTo(padding, padding + 100); ctx.fill();
    // Top Right
    ctx.beginPath(); ctx.moveTo(width - padding, padding); ctx.lineTo(width - padding - 100, padding); ctx.lineTo(width - padding, padding + 100); ctx.fill();
    // Bottom Left
    ctx.beginPath(); ctx.moveTo(padding, height - padding); ctx.lineTo(padding + 100, height - padding); ctx.lineTo(padding, height - padding - 100); ctx.fill();
    // Bottom Right
    ctx.beginPath(); ctx.moveTo(width - padding, height - padding); ctx.lineTo(width - padding - 100, height - padding); ctx.lineTo(width - padding, height - padding - 100); ctx.fill();

    // Text Content
    ctx.textAlign = 'center';

    // --- BRAND LOGO GEOMETRY ---
    // Draw at top center
    drawBrandLogo(ctx, width/2, 120, 60);

    // --- BRAND TEXT ---
    const logoSize = 70;
    ctx.font = `900 ${logoSize}px Inter, sans-serif`;
    
    // Gradient text for logo
    const gradient = ctx.createLinearGradient(width/2 - 250, 0, width/2 + 250, 0);
    gradient.addColorStop(0, '#60a5fa');
    gradient.addColorStop(0.5, '#c084fc');
    gradient.addColorStop(1, '#60a5fa');
    
    ctx.fillStyle = gradient;
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 10;
    ctx.fillText('KrishnaLense.AI', width / 2, 230);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#64748b';
    ctx.font = `700 ${logoSize * 0.3}px Inter, sans-serif`;
    ctx.fillText('By Dr. Krishna Karoo', width / 2, 280);
    
    // Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 90px "Times New Roman", serif';
    ctx.fillText('CERTIFICATE OF COMPLIANCE', width / 2, 380);
    
    // Subtitle
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 45px Arial, sans-serif';
    ctx.fillText('Anti-Discrimination & SOP Usage Policy', width / 2, 460);

    // Separator
    ctx.beginPath();
    ctx.moveTo(width/2 - 200, 500);
    ctx.lineTo(width/2 + 200, 500);
    ctx.strokeStyle = '#cca529';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Body
    ctx.fillStyle = '#334155';
    ctx.font = '40px Arial, sans-serif';
    ctx.fillText('This certifies that', width / 2, 600);

    ctx.fillStyle = '#1e40af'; // Blue
    ctx.font = 'bold italic 100px "Times New Roman", serif';
    ctx.fillText(user.name, width / 2, 720);
    
    ctx.fillStyle = '#64748b';
    ctx.font = '30px Arial, sans-serif';
    ctx.fillText(`User ID: ${user.userId}`, width / 2, 780);

    // NEW: Email and Mobile
    let yPos = 830;
    ctx.font = '30px Arial, sans-serif';
    
    if (user.email) {
        ctx.fillText(`Email: ${user.email}`, width / 2, yPos);
        yPos += 50;
    }
    if (user.mobile) {
        ctx.fillText(`Mobile: ${user.mobile}`, width / 2, yPos);
    }

    ctx.fillStyle = '#334155';
    ctx.font = '40px Arial, sans-serif';
    const line1 = "Has formally acknowledged and agreed to abide by the ethical guidelines,";
    const line2 = "anti-discrimination policies, and standard operating procedures (SOP)";
    const line3 = "established by KrishnaLense.AI for the use of Generative AI technology.";
    
    // Adjusted Y coordinates for body text
    ctx.fillText(line1, width / 2, 980);
    ctx.fillText(line2, width / 2, 1040);
    ctx.fillText(line3, width / 2, 1100);

    // Signatures
    const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Date (Left)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 35px Arial, sans-serif';
    // Pushed down to 1250
    ctx.fillText('Date of Issue:', 300, 1250);
    ctx.font = '35px Arial, sans-serif';
    ctx.fillText(dateStr, 300, 1300);

    // Signature (Right)
    ctx.textAlign = 'center';
    ctx.font = 'bold 35px Arial, sans-serif';
    ctx.fillText('Authorized Signature', width - 400, 1250);
    
    // Fake Signature Script
    ctx.font = 'italic 60px "Brush Script MT", cursive';
    ctx.fillStyle = '#1e40af';
    ctx.fillText('Dr. Krishna Karoo', width - 400, 1320);
    
    ctx.beginPath();
    ctx.moveTo(width - 550, 1330);
    ctx.lineTo(width - 250, 1330);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '25px Arial, sans-serif';
    ctx.fillText('Founder & CEO, KrishnaLense.AI', width - 400, 1370);

    // Convert to PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`KrishnaLense_Certificate_${user.userId}.pdf`);
    showToast("Certificate Downloaded", 'success');
  };

  const [visitCount, setVisitCount] = useState(0);
  useEffect(() => {
    const stored = localStorage.getItem('krishnalense_visits');
    const count = stored ? parseInt(stored) : 10240;
    const newCount = count + 1;
    setVisitCount(newCount);
    localStorage.setItem('krishnalense_visits', newCount.toString());
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 flex flex-col relative overflow-hidden">
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={hideToast} 
      />

      <Header 
        onNavigate={handleNavigate} 
        isPremium={isPremium} 
        user={user} 
        onLogout={handleLogout} 
        onLogin={() => setShowAuth(true)}
        activeTab={activeTab}
      />
      
      {/* Auth Screen Overlay */}
      {showAuth && (
         <div className="fixed inset-0 z-[100] animate-fade-in">
             <AuthScreen 
                onLogin={handleLogin} 
                onCancel={() => {
                    setShowAuth(false);
                    setPendingFile(null);
                    setPreviewUrl(null); // Reset preview on cancel
                }} 
             />
         </div>
      )}

      {/* Agentic Help Chat */}
      <AgenticChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      <InfoModal 
        isOpen={activeModal === 'Payment'}
        onClose={() => setActiveModal(null)}
        title="Secure Payment"
        content={
            <PaymentContent 
                paymentStatus={paymentStatus}
                transactionId={transactionId}
                setTransactionId={setTransactionId}
                verifyPayment={verifyPayment}
                user={user}
                onShowToast={showToast}
            />
        }
      />
      
      <main className="container mx-auto px-4 py-12 max-w-7xl flex-grow relative z-10">
        
        {/* Landing Page Content - Conditioned by Active Tab */}
        {appState === AppState.IDLE && (
          <div className="animate-fade-in">
            {/* --- HOME TAB --- */}
            {activeTab === 'Home' && (
              <div className="flex items-center justify-center min-h-[60vh]">
                <UploadSection 
                    onImageSelect={handleImageSelect} 
                    customPreview={previewUrl} // Pass the uploaded preview immediately
                />
              </div>
            )}

            {/* --- GALLERY TAB --- */}
            {activeTab === 'Gallery' && user && (
                <Gallery userId={user.userId} onShowToast={showToast} />
            )}
            {activeTab === 'Gallery' && !user && (
                 <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <Lock className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Gallery Locked</h3>
                    <p className="text-slate-400 mb-6">Please login to view your saved headshots.</p>
                    <button 
                       onClick={() => setShowAuth(true)}
                       className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-50 transition-colors"
                    >
                       Login to Access
                    </button>
                 </div>
            )}

            {/* --- TOOLS TAB --- */}
            {activeTab === 'Tools' && (
               <ExtraTools onShowToast={showToast} />
            )}

            {/* --- FEATURES TAB --- */}
            {activeTab === 'Features' && (
               <div className="py-8">
                  <div className="text-center mb-16 animate-fade-in-up">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Next-Gen AI Technology</h2>
                    <p className="text-slate-400 max-w-3xl mx-auto text-lg leading-relaxed">
                      KrishnaLense.AI combines state-of-the-art computer vision with generative AI to deliver studio-grade photography without the studio.
                    </p>
                  </div>
                  
                  {/* Core Features Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 animate-fade-in-up delay-100">
                     <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-3xl hover:bg-slate-800/60 transition-colors">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                           <Cpu className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Distilled Diffusion Models</h3>
                        <p className="text-slate-400 leading-relaxed">
                           Our proprietary Flash 2.5 engine uses distilled diffusion to generate photorealistic textures in under 10 seconds. We analyze skin tones and lighting dynamics to ensure natural results.
                        </p>
                     </div>

                     <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-3xl hover:bg-slate-800/60 transition-colors">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
                           <Layers className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">3D Facial Mapping</h3>
                        <p className="text-slate-400 leading-relaxed">
                           Before generation, we construct a 3D mesh of your facial landmarks. This ensures that when we change the lighting or angle, your identity remains 100% consistent.
                        </p>
                     </div>

                     <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-3xl hover:bg-slate-800/60 transition-colors">
                        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
                           <Shield className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Zero-Retention Privacy</h3>
                        <p className="text-slate-400 leading-relaxed">
                           We operate on a strict volatile memory architecture. Your uploaded photos are processed in RAM and are permanently wiped from our servers the moment your session ends.
                        </p>
                     </div>

                     <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-3xl hover:bg-slate-800/60 transition-colors">
                        <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-6">
                           <Palette className="w-6 h-6 text-amber-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">100+ Curated Styles</h3>
                        <p className="text-slate-400 leading-relaxed">
                           From Corporate boardrooms to Traditional weddings, our style library is hand-tuned by professional photographers to match specific cultural and professional contexts.
                        </p>
                     </div>

                     <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-3xl hover:bg-slate-800/60 transition-colors">
                        <div className="w-12 h-12 bg-pink-500/20 rounded-2xl flex items-center justify-center mb-6">
                           <Eye className="w-6 h-6 text-pink-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Generative Upscaling</h3>
                        <p className="text-slate-400 leading-relaxed">
                           Our 4K upscaler doesn't just stretch pixels; it hallucinates missing details like iris patterns, fabric weave, and hair texture for large-format printing.
                        </p>
                     </div>

                     <div className="bg-slate-800/40 border border-slate-700 p-8 rounded-3xl hover:bg-slate-800/60 transition-colors">
                        <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-6">
                           <Smartphone className="w-6 h-6 text-cyan-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Cross-Platform</h3>
                        <p className="text-slate-400 leading-relaxed">
                           Accessible from any device. Whether you are on a desktop or mobile, our responsive web app delivers the same high-quality processing power.
                        </p>
                     </div>
                  </div>

                  {/* Technical Specs Table */}
                  <div className="max-w-4xl mx-auto space-y-8">
                     <div className="text-center">
                        <h3 className="text-2xl font-bold text-white mb-2">Technical Specifications</h3>
                        <p className="text-slate-400">Comparing Standard and Professional Output</p>
                     </div>
                     <div className="bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-800 border-b border-slate-700">
                              <th className="p-6 font-bold text-slate-300">Feature</th>
                              <th className="p-6 font-bold text-slate-300">Standard (Free)</th>
                              <th className="p-6 font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">PRO (Premium)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            <tr className="hover:bg-slate-800/50 transition-colors">
                              <td className="p-6 text-slate-400 font-medium">Output Resolution</td>
                              <td className="p-6 text-slate-300">1024 x 1024 (1 Megapixel)</td>
                              <td className="p-6 text-white font-bold">4096 x 4096 (16 Megapixels)</td>
                            </tr>
                            <tr className="hover:bg-slate-800/50 transition-colors">
                              <td className="p-6 text-slate-400 font-medium">File Format</td>
                              <td className="p-6 text-slate-300">JPG (Compressed)</td>
                              <td className="p-6 text-white font-bold">PNG (Lossless) / RAW Quality</td>
                            </tr>
                            <tr className="hover:bg-slate-800/50 transition-colors">
                              <td className="p-6 text-slate-400 font-medium">Print Density</td>
                              <td className="p-6 text-slate-300">72 DPI (Screen only)</td>
                              <td className="p-6 text-white font-bold">300 DPI (Print Ready)</td>
                            </tr>
                            <tr className="hover:bg-slate-800/50 transition-colors">
                              <td className="p-6 text-slate-400 font-medium">Processing Priority</td>
                              <td className="p-6 text-slate-300">Standard Queue</td>
                              <td className="p-6 text-white font-bold">Instant GPU Allocation</td>
                            </tr>
                            <tr className="hover:bg-slate-800/50 transition-colors">
                              <td className="p-6 text-slate-400 font-medium">Commercial Usage</td>
                              <td className="p-6 text-slate-300">Personal Use Only</td>
                              <td className="p-6 text-white font-bold">Commercial License Included</td>
                            </tr>
                          </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            )}

            {/* --- PRICING TAB --- */}
            {activeTab === 'Pricing' && (
               <div className="py-8">
                 <div className="text-center mb-16 animate-fade-in-up">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Transparent Pricing</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                       Experience the power of AI photography. Start for free, or upgrade for professional capabilities.
                    </p>
                  </div>

                 <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto animate-fade-in-up delay-100 items-start">
                    {/* Free Plan */}
                    <div className="p-10 rounded-[2.5rem] border border-slate-700 bg-slate-800/30 relative overflow-hidden flex flex-col transition-all hover:bg-slate-800/50">
                      <div className="mb-8">
                         <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                         <p className="text-slate-400 text-sm">For casual users & testing.</p>
                      </div>
                      
                      <div className="mb-8 pb-8 border-b border-slate-700/50">
                        <span className="text-5xl font-black text-white">₹0</span>
                        <span className="text-slate-500 font-medium"> / forever</span>
                      </div>
                      
                      <ul className="space-y-5 mb-10 flex-1">
                        <li className="flex items-start gap-3 text-slate-300">
                           <CheckCircle2 className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" /> 
                           <span>Access to 1 Style per Category</span>
                        </li>
                        <li className="flex items-start gap-3 text-slate-300">
                           <CheckCircle2 className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" /> 
                           <span>Standard 1K Resolution</span>
                        </li>
                        <li className="flex items-start gap-3 text-slate-300">
                           <CheckCircle2 className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" /> 
                           <span>Watermarked Downloads</span>
                        </li>
                        <li className="flex items-start gap-3 text-slate-300">
                           <CheckCircle2 className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" /> 
                           <span>Basic Filter Adjustments</span>
                        </li>
                      </ul>
                      
                      <button disabled className="w-full py-4 rounded-2xl bg-slate-700/50 text-slate-400 font-bold cursor-not-allowed border border-slate-700">
                         Current Plan
                      </button>
                    </div>

                    {/* Pro Plan */}
                    <div className="p-10 rounded-[2.5rem] bg-white text-slate-900 border border-blue-500 relative overflow-hidden flex flex-col shadow-2xl shadow-blue-500/20 transform md:-translate-y-4">
                        {/* Embed Payment Card Content Logic Directly Here */}
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-6 py-2 rounded-bl-2xl shadow-lg">
                             RECOMMENDED
                        </div>

                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                            Professional
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
                            </h3>
                            <p className="text-slate-500 text-sm">For professionals, teams & content creators.</p>
                        </div>

                        {/* If User is Premium, show Active Status */}
                        {isPremium ? (
                             <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-4">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900">Active Plan</h3>
                                <p className="text-slate-500 text-center">Your Pro subscription is active.</p>
                                <div className="w-full h-[1px] bg-slate-200 my-4"></div>
                                <div className="text-left w-full space-y-3">
                                    <p className="font-bold text-slate-700">Your Benefits:</p>
                                    <ul className="space-y-2 text-sm text-slate-600">
                                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500"/> Unlimited 4K Generations</li>
                                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500"/> No Watermarks</li>
                                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500"/> Priority Support</li>
                                    </ul>
                                </div>
                             </div>
                        ) : (
                            <PaymentContent 
                                paymentStatus={paymentStatus}
                                transactionId={transactionId}
                                setTransactionId={setTransactionId}
                                verifyPayment={verifyPayment}
                                user={user}
                                onShowToast={showToast}
                            />
                        )}
                    </div>
                 </div>

                 {/* FAQ Section */}
                 <div className="max-w-3xl mx-auto mt-20">
                    <h3 className="text-2xl font-bold text-white text-center mb-10">Frequently Asked Questions</h3>
                    <div className="space-y-6">
                       <div className="bg-slate-800/30 border border-slate-700 p-6 rounded-2xl">
                          <h4 className="font-bold text-white mb-2 flex items-center gap-2"><HelpCircle className="w-4 h-4 text-slate-400"/> Is my payment information secure?</h4>
                          <p className="text-slate-400 text-sm">Yes. We use standard UPI secure payment gateways. We do not store any credit card or banking information on our servers.</p>
                       </div>
                       <div className="bg-slate-800/30 border border-slate-700 p-6 rounded-2xl">
                          <h4 className="font-bold text-white mb-2 flex items-center gap-2"><HelpCircle className="w-4 h-4 text-slate-400"/> Can I cancel anytime?</h4>
                          <p className="text-slate-400 text-sm">The ₹99 plan is a monthly access pass. You can choose not to renew next month. There are no long-term contracts.</p>
                       </div>
                       <div className="bg-slate-800/30 border border-slate-700 p-6 rounded-2xl">
                          <h4 className="font-bold text-white mb-2 flex items-center gap-2"><HelpCircle className="w-4 h-4 text-slate-400"/> What if I am not satisfied with the results?</h4>
                          <p className="text-slate-400 text-sm">Our AI is highly advanced, but results depend on the input photo quality. We recommend uploading clear, well-lit photos. If you face technical issues, contact our support.</p>
                       </div>
                    </div>
                 </div>
               </div>
            )}

            {/* --- INFORMATION TAB --- */}
            {activeTab === 'Information' && (
              <div className="py-8 max-w-4xl mx-auto space-y-12 animate-fade-in-up">
                 <div className="text-center mb-8">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Company Information</h2>
                    <p className="text-slate-400">Policies, Support, and About Us.</p>
                 </div>

                 {/* How It Works & Tips Section */}
                 <div className="bg-slate-800/50 border border-slate-700 rounded-3xl overflow-hidden shadow-xl mb-8">
                    <div className="p-8 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900">
                       <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                          <Sparkles className="w-6 h-6 text-yellow-400" />
                          How It Works
                       </h3>
                       <p className="text-slate-400">Follow these simple steps to generate your professional headshot.</p>
                    </div>
                    
                    <div className="p-8">
                       {/* Steps */}
                       <div className="grid md:grid-cols-3 gap-8 mb-10">
                          <div className="relative">
                             <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-4 text-blue-400 font-bold text-xl border border-blue-600/30">
                                <Camera className="w-6 h-6" />
                             </div>
                             <h4 className="text-lg font-bold text-white mb-2">1. Upload Selfie</h4>
                             <p className="text-slate-400 text-sm leading-relaxed">
                                Upload a clear, high-quality selfie. Ideally with good lighting and your face clearly visible without obstructions.
                             </p>
                          </div>
                          <div className="relative">
                             <div className="w-12 h-12 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-4 text-purple-400 font-bold text-xl border border-purple-600/30">
                                <Palette className="w-6 h-6" />
                             </div>
                             <h4 className="text-lg font-bold text-white mb-2">2. Choose Style</h4>
                             <p className="text-slate-400 text-sm leading-relaxed">
                                Browse our library of 100+ curated styles. Filter by category (Professional, Creative, Cultural) to find your perfect match.
                             </p>
                          </div>
                          <div className="relative">
                             <div className="w-12 h-12 bg-emerald-600/20 rounded-2xl flex items-center justify-center mb-4 text-emerald-400 font-bold text-xl border border-emerald-600/30">
                                <Download className="w-6 h-6" />
                             </div>
                             <h4 className="text-lg font-bold text-white mb-2">3. Generate</h4>
                             <p className="text-slate-400 text-sm leading-relaxed">
                                Our AI transforms your photo in seconds. Download your high-res headshot or use our tools to create social banners.
                             </p>
                          </div>
                       </div>

                       {/* Pro Tips */}
                       <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 flex flex-col md:flex-row gap-6">
                          <div className="shrink-0">
                             <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400">
                                <Lightbulb className="w-5 h-5" />
                             </div>
                          </div>
                          <div>
                             <h4 className="text-white font-bold mb-3">Tips for Best Results</h4>
                             <ul className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-400">
                                <li className="flex items-center gap-2">
                                   <CheckCircle2 className="w-3 h-3 text-amber-500/70" /> Avoid wearing glasses or hats.
                                </li>
                                <li className="flex items-center gap-2">
                                   <CheckCircle2 className="w-3 h-3 text-amber-500/70" /> Ensure even lighting on your face.
                                </li>
                                <li className="flex items-center gap-2">
                                   <CheckCircle2 className="w-3 h-3 text-amber-500/70" /> Look directly at the camera.
                                </li>
                                <li className="flex items-center gap-2">
                                   <CheckCircle2 className="w-3 h-3 text-amber-500/70" /> Use a high-resolution input image.
                                </li>
                             </ul>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* About Us Card */}
                 <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                       <div className="p-3 bg-blue-500/20 rounded-xl">
                          <Globe className="w-8 h-8 text-blue-400" />
                       </div>
                       <div>
                          <h3 className="text-2xl font-bold text-white">About KrishnaLense.AI</h3>
                          <p className="text-blue-400 text-sm font-medium">By Dr. Krishna Karoo</p>
                       </div>
                    </div>
                    <div className="space-y-4 text-slate-300 leading-relaxed">
                       <p>
                          Founded in 2024, KrishnaLense.AI was born from a simple mission: <strong>To democratize professional personal branding.</strong>
                       </p>
                       <p>
                          Traditional studio photography is expensive, time-consuming, and inaccessible to many. By leveraging cutting-edge generative AI, we allow anyone with a smartphone to generate Forbes-quality headshots in seconds. 
                       </p>
                       <p>
                          Our technology is built on a foundation of ethical AI use, ensuring strict privacy standards and authentic representation across diverse demographics.
                       </p>
                       <div className="pt-4 mt-4 border-t border-slate-700 flex gap-6 text-sm text-slate-500">
                          <span>Version 2.0.0</span>
                          <span>•</span>
                          <span>Headquarters: Nagpur, India</span>
                          <span>•</span>
                          <span>Est. 2024</span>
                       </div>
                    </div>
                 </div>
                 
                 {/* Compliance Certificate Section */}
                 <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-amber-500/20 rounded-xl">
                              <FileBadge className="w-8 h-8 text-amber-500" />
                           </div>
                           <div>
                              <h3 className="text-xl font-bold text-white">Compliance Certificate</h3>
                              <p className="text-amber-400 text-sm font-medium">Anti-Discrimination & Ethical AI SOP</p>
                           </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button 
                                onClick={downloadSOP}
                                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all shadow-lg border border-slate-600 flex items-center gap-2"
                            >
                                <FileText className="w-5 h-5" />
                                Download SOP (PDF)
                            </button>
                            {user && (
                                <button 
                                    onClick={downloadCertificate}
                                    className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-600/20 flex items-center gap-2"
                                >
                                    <Download className="w-5 h-5" />
                                    Download Certificate (PDF)
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="mt-4 text-slate-400 text-sm leading-relaxed">
                       As a registered user, you are entitled to a Certificate of Compliance issued by Dr. Krishna Karoo. This document certifies your acknowledgement of our Anti-Discrimination Policy and Standard Operating Procedures (SOP) regarding the ethical use of AI-generated imagery.
                    </p>
                 </div>

                 {/* Policies Grid */}
                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-slate-800/30 border border-slate-700 rounded-3xl p-8">
                       <div className="flex items-center gap-3 mb-4 text-white">
                          <Shield className="w-6 h-6 text-emerald-400" />
                          <h3 className="text-xl font-bold">Privacy & Data Security</h3>
                       </div>
                       <ul className="space-y-3 text-slate-400 text-sm">
                          <li className="flex gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></div>
                             <span><strong>Zero-Retention Policy:</strong> Images are processed in volatile memory (RAM) and deleted immediately post-generation.</span>
                          </li>
                          <li className="flex gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></div>
                             <span><strong>No Training:</strong> We do NOT use your photos to train our public models.</span>
                          </li>
                          <li className="flex gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></div>
                             <span><strong>Encryption:</strong> All data transfer is secured via SSL/TLS encryption.</span>
                          </li>
                       </ul>
                    </div>

                    <div className="bg-slate-800/30 border border-slate-700 rounded-3xl p-8">
                       <div className="flex items-center gap-3 mb-4 text-white">
                          <FileText className="w-6 h-6 text-purple-400" />
                          <h3 className="text-xl font-bold">Terms of Service</h3>
                       </div>
                       <ul className="space-y-3 text-slate-400 text-sm">
                          <li className="flex gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5"></div>
                             <span><strong>Commercial Rights:</strong> Pro users own full commercial rights to their generated images.</span>
                          </li>
                          <li className="flex gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5"></div>
                             <span><strong>Ownership:</strong> You retain ownership of your original uploads.</span>
                          </li>
                       </ul>
                    </div>
                 </div>
              </div>
            )}

            {/* --- ADMIN PANEL (Hidden) --- */}
            {activeTab === 'Admin' && (
               <div className="flex flex-col items-center justify-center min-h-[50vh]">
                  {!isAdminUnlocked ? (
                     <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center">
                        <Lock className="w-8 h-8 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-4">Restricted Access</h3>
                        <div className="flex gap-2">
                           <input 
                              type="password" 
                              value={adminCodeInput}
                              onChange={(e) => setAdminCodeInput(e.target.value)}
                              className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-white"
                              placeholder="Passcode"
                           />
                           <button onClick={handleAdminUnlock} className="bg-red-600 px-4 py-2 rounded-lg font-bold text-white">Unlock</button>
                        </div>
                     </div>
                  ) : (
                     <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full max-w-lg">
                        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                           <Server className="w-6 h-6 text-green-500" /> Admin Console
                        </h3>
                        <div className="space-y-4">
                           <button onClick={generateLicenseKeys} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                              <Key className="w-5 h-5" /> Generate 1000 License Keys
                           </button>
                           <div className="p-4 bg-slate-900 rounded-xl text-xs text-slate-400">
                              <p>System Status: Operational</p>
                              <p>Active Users: {localStorage.getItem('krishnalense_visits') || 0}</p>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            )}

          </div>
        )}

        {/* --- STATE: STYLE SELECTION --- */}
        {appState === AppState.SELECTING_STYLE && previewUrl && (
          <StyleSelector 
            selectedStyle={selectedStyle} 
            onSelect={handleStyleSelect} 
            onConfirm={handleStyleConfirm}
            previewImage={previewUrl}
            isPremium={isPremium}
          />
        )}

        {/* --- STATE: LOADING --- */}
        {appState === AppState.GENERATING && (
          <LoadingState />
        )}

        {/* --- STATE: RESULT --- */}
        {appState === AppState.SUCCESS && generatedResult && selectedStyle && previewUrl && (
          <ResultDisplay 
            originalImage={previewUrl} 
            generatedImage={generatedResult}
            selectedStyle={selectedStyle}
            onReset={handleReset}
            onUpscale={handleUpscale}
            isPremium={isPremium}
            onShowToast={showToast}
          />
        )}

        {/* --- STATE: ERROR --- */}
        {appState === AppState.ERROR && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Generation Failed</h3>
            <p className="text-slate-400 max-w-md mb-8">{errorMessage}</p>
            <div className="flex gap-4">
              <button 
                onClick={handleBackToStyle}
                className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors"
              >
                Change Style
              </button>
              <button 
                onClick={handleStyleConfirm}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-slate-800 bg-slate-900/50 backdrop-blur-xl relative z-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
           <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400">KrishnaLense.AI</span>
              <span>© 2024</span>
           </div>
           
           <div className="flex items-center gap-6">
              <a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-blue-400 transition-colors">SOP</a>
           </div>

           <div className="flex items-center gap-2">
              <span>Visits:</span>
              <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-blue-400 font-bold">{visitCount.toLocaleString()}</span>
           </div>
        </div>
        <div className="text-center mt-4 opacity-30 text-[10px]">
           Dr. Krishna Karoo, Founder & CEO, KrishnaLense.AI
        </div>
      </footer>

      {/* Floating Agent Trigger - Fixed Bottom Right */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 group animate-float"
          aria-label="Help Agent"
        >
           {/* WhatsApp Icon */}
           <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 fill-white stroke-none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
           <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white text-slate-900 px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              Need Help?
           </span>
        </button>
      )}
    </div>
  );
};
