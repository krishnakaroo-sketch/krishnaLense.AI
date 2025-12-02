
import { GoogleGenAI } from "@google/genai";

// Helper to get the AI client instance
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Compresses an image file to ensure it fits within API payload limits.
 * Resizes to max 1536x1536 and converts to JPEG quality 0.8.
 */
const compressImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_DIM = 1536;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          } else {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress to JPEG with 0.8 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        // Remove prefix
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = (err) => reject(new Error("Failed to load image for compression"));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Converts a File object to a Generative Part, compressing it first.
 */
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  try {
    // Compress image to avoid payload size errors (RPC/XHR 500)
    const base64Data = await compressImage(file);
    return {
      inlineData: {
        data: base64Data,
        mimeType: 'image/jpeg', // Always converting to JPEG
      },
    };
  } catch (error) {
    console.warn("Image compression failed, falling back to raw file", error);
    // Fallback to original logic if compression fails
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};

/**
 * Retry utility for transient API errors
 */
const retry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (err: any) {
    if (retries > 0) {
       const msg = err.message || '';
       // Retry on server errors or specific XHR network errors
       if (msg.includes('500') || msg.includes('503') || msg.includes('xhr error') || msg.includes('fetch failed') || msg.includes('overloaded')) {
         console.warn(`Attempt failed, retrying in ${delay}ms...`, err);
         await new Promise(r => setTimeout(r, delay));
         return retry(fn, retries - 1, delay * 2);
       }
    }
    throw err;
  }
};

/**
 * Generates a headshot based on the uploaded image and selected style.
 * Optionally accepts a custom background file.
 */
export const generateHeadshot = async (
  imageFile: File, 
  promptModifier: string,
  customBackgroundFile?: File
): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Prepare the subject image part
    const imagePart = await fileToGenerativePart(imageFile);
    const parts: any[] = [imagePart];
    
    let textPrompt = '';

    if (customBackgroundFile) {
      // If a custom background is provided, add it as the second part
      const bgPart = await fileToGenerativePart(customBackgroundFile);
      parts.push(bgPart);

      textPrompt = `
        Act as a world-class professional photographer and photo editor.
        Input 1: Image of subject(s) (person or group).
        Input 2: Image of a background.
        
        TASK:
        Composite the subject(s) from Input 1 into the background from Input 2.
        
        INSTRUCTIONS:
        1. Keep the facial identity of the subject(s) in Input 1 exactly as is.
        2. Replace the original background with the background from Input 2.
        3. Adjust the lighting, color temperature, and shadows of the subject(s) to match the environment of the new background perfectly.
        4. Ensure the cut-out and blending is seamless and professional.
        5. Output a high-resolution photorealistic image.
        6. Do not include any text.
      `;
    } else {
      // Standard style generation
      textPrompt = `
        Act as a world-class professional photographer.
        Transform the subject(s) (person or group) in this image into a professional portrait.
        
        STYLE REQUIREMENTS:
        ${promptModifier}
        
        CRITICAL INSTRUCTIONS:
        1. Preserve the facial identity (eyes, nose, mouth structure) of the subject(s) in the original photo strictly.
        2. Change the clothing to match the described style (for all subjects if group).
        3. Change the background completely to match the described style.
        4. Improve lighting to be professional studio or natural quality.
        5. Ensure the result is a high-resolution image.
        6. Do not include any text in the image.
        
        Generate the image now.
      `;
    }

    // Call the Gemini API with retry mechanism
    const response = await retry(async () => {
        return await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [...parts, { text: textPrompt }],
          }
        });
    });

    // Extract the image from the response
    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          }
        }
      }
    }

    throw new Error("No image generated in the response.");

  } catch (error) {
    console.error("Error generating headshot:", error);
    throw error;
  }
};

/**
 * Upscales the generated headshot to 2K resolution.
 */
export const upscaleHeadshot = async (imageBase64: string): Promise<string> => {
  const performUpscale = async (forceKeySelection: boolean = false): Promise<string> => {
    try {
      // Check/Request API Key for high-res model usage
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        const aistudio = (window as any).aistudio;
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey || forceKeySelection) {
          await aistudio.openSelectKey();
        }
      }

      // Create a new instance to ensure the latest API key is used
      const aiHighRes = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const response = await retry(async () => {
         return await aiHighRes.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
              parts: [
                { 
                  inlineData: { 
                    mimeType: 'image/png', 
                    data: base64Data 
                  } 
                },
                { text: "Upscale this image to 2K resolution. Enhance texture, sharpness, and lighting while strictly preserving the original facial identity and composition. Output a photorealistic high-quality professional portrait." }
              ]
            },
            config: {
              imageConfig: {
                imageSize: '2K',
                aspectRatio: '1:1'
              }
            }
          });
      });

      if (response.candidates && response.candidates.length > 0) {
        const content = response.candidates[0].content;
        if (content.parts) {
          for (const part of content.parts) {
            if (part.inlineData && part.inlineData.data) {
              return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            }
          }
        }
      }

      throw new Error("Upscaling failed - no image returned");
    } catch (error: any) {
      // If we haven't already retried and we get a permission error (403 or 404 on model)
      if (!forceKeySelection && (error.message?.includes('403') || error.message?.includes('PERMISSION_DENIED') || error.message?.includes('404'))) {
        console.warn("Permission denied for Upscale model. Prompting for fresh API Key selection...");
        // Retry once with forced key selection
        return performUpscale(true);
      }
      console.error("Error upscaling headshot:", error);
      throw error;
    }
  };

  return performUpscale(false);
};

/**
 * Chat with Agent functionality
 */
export const chatWithAgent = async (history: {role: string, parts: {text: string}[]}[], message: string): Promise<string> => {
  try {
    const ai = getAiClient();
    
    const systemInstruction = `
      You are the AI Support Agent for KrishnaLense.AI, a professional AI Headshot Studio founded by Dr. Krishna Karoo.
      
      KEY INFORMATION:
      - App Name: KrishnaLense.AI
      - Founder: Dr. Krishna Karoo (CEO).
      - Purpose: Generate professional studio-quality headshots from selfies using AI.
      - Pricing: 
        * Free Plan: 1K resolution, Watermarked, Limited styles.
        * Pro Plan: ₹99 (Limited offer, originally ₹499). Includes 4K Upscaling, No Watermarks, Commercial Rights, Priority Processing.
      - Features: 100+ Styles (Professional, Political, Casual, Cultural, etc.), 4K Upscaling, Passport Photo Studio (A4 print ready).
      - Privacy: Images are processed in RAM and deleted immediately. No training on user data.
      - Support Contact: support@krishnalense.ai, +91 94234 03193.
      
      BEHAVIOR:
      - Be helpful, professional, and concise.
      - Answer questions about pricing, how to use the app, and technical issues.
      - If asked about the founder, speak respectfully about Dr. Krishna Karoo.
      - If asked about payment issues, advise them to send the screenshot to WhatsApp +91 94234 03193.
      - Keep responses short (under 50 words) unless detailed explanation is needed.
    `;

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash-lite',
      config: {
        systemInstruction: systemInstruction,
      },
      history: history
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Chat error:", error);
    return "I'm having trouble connecting to the server. Please try again later.";
  }
};

/**
 * Generate Video using Veo Model
 * Now includes retry logic for 404 errors (Key issues) and explicit 429 (Quota) handling.
 */
export const generateVeoVideo = async (
  prompt: string, 
  imageFile?: File | null, 
  aspectRatio: '16:9' | '9:16' = '9:16',
  retryCount = 0
): Promise<string> => {
  // 1. API Key Selection (Mandatory for Veo)
  if (typeof window !== 'undefined' && (window as any).aistudio) {
    const aistudio = (window as any).aistudio;
    const hasKey = await aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await aistudio.openSelectKey();
    }
  }

  // Create new instance to pick up the key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let operation;

  try {
    if (imageFile) {
        const imagePart = await fileToGenerativePart(imageFile);
        
        operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: {
                imageBytes: imagePart.inlineData.data,
                mimeType: imagePart.inlineData.mimeType as any,
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
        });
    } else {
        operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
        });
    }

    // Polling Loop
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
        operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation completed but no URI returned.");

    // Fetch the video data to create a local blob URL
    // We must append the API key to the download link as per documentation
    const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    if (!response.ok) throw new Error("Failed to download generated video.");
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);

  } catch (error: any) {
    console.error("Veo generation failed:", error);
    
    // Handle Quota Limit
    if (error.message && (error.message.includes("429") || error.message.includes("RESOURCE_EXHAUSTED"))) {
        throw new Error("You have exceeded your current quota for Video generation. Please check your plan and billing details in Google AI Studio.");
    }

    // Handle specific Veo errors (e.g., entity not found if key expired or not selected properly)
    if (error.message && (error.message.includes("Requested entity was not found") || error.message.includes("404"))) {
        if (retryCount < 1 && typeof window !== 'undefined' && (window as any).aistudio) {
            console.warn("API Key might be invalid or missing permissions. Retrying selection...");
            await (window as any).aistudio.openSelectKey();
            return generateVeoVideo(prompt, imageFile, aspectRatio, retryCount + 1);
        }
        throw new Error("Unable to access Veo model. Please ensure you have selected a valid API Key with access to the Veo model.");
    }
    
    throw error;
  }
};
