
import { GoogleGenAI, Modality } from "@google/genai";
import { AspectRatio, ImageState } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

// Initialize AI client only once.
const ai = new GoogleGenAI({ apiKey: API_KEY });

async function callGeminiForImage(
  prompt: string,
  aspectRatio: AspectRatio,
  imagesToProcess: ImageState[] = [], // New parameter for multiple images
): Promise<{ imageUrl: string; mimeType: string } | null> {
  try {
    const contents: Array<any> = [];

    // Add image data parts first
    imagesToProcess.forEach(imageState => {
      contents.push({
        inlineData: {
          data: imageState.dataUrl.split(',')[1], // Split base64 from dataUrl
          mimeType: imageState.mimeType,
        },
      });
    });

    // Add the text prompt part
    contents.push({ text: prompt });

    const config: any = {
      responseModalities: [Modality.IMAGE, Modality.TEXT], // Explicitly allow both image and text
    };

    if (aspectRatio !== 'auto') {
      config.imageConfig = {
        aspectRatio: aspectRatio,
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview', // Using a specific model for image generation
      contents: { parts: contents },
      config: config, // Use the dynamically built config
    });

    // Handle cases where the prompt was blocked or no candidates were returned.
    if (!response.candidates || response.candidates.length === 0) {
      if (response.promptFeedback?.blockReason) {
        throw new Error(`Request was blocked: ${response.promptFeedback.blockReason}. Please adjust your prompt or image.`);
      }
      throw new Error("The model did not return any content. Please try a different prompt.");
    }
    
    const candidate = response.candidates[0];
    const imagePart = candidate.content?.parts?.find(part => part.inlineData);

    if (imagePart && imagePart.inlineData) {
      const restoredBase64 = imagePart.inlineData.data;
      const restoredMimeType = imagePart.inlineData.mimeType;
      return {
        imageUrl: `data:${restoredMimeType};base64,${restoredBase64}`,
        mimeType: restoredMimeType,
      };
    }
    
    // If no image is found, return null. Do NOT throw an error if text is present,
    // as text is an allowed modality. The UI will handle the null image.
    return null;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
             throw new Error(`QUOTA_EXCEEDED: You have exceeded your API quota. To prevent further errors, the process button will be disabled for 60 seconds.`);
        }
        // Let our custom, more informative errors pass through without being re-wrapped.
        if (error.message.startsWith('Request was blocked') || 
            error.message.startsWith('The model did not return')) {
            throw error; // Re-throw specific errors for App.tsx to handle
        }
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
}

// Existing function for image-to-image restoration, now accepting ImageState[]
export function restorePhoto(
  imageState: ImageState, // Now accepts a single ImageState object
  prompt: string,
  aspectRatio: AspectRatio,
): Promise<{ imageUrl: string; mimeType: string } | null> {
  return callGeminiForImage(prompt, aspectRatio, [imageState]);
}

// New function for text-to-image generation
export function generateImageFromText(
  prompt: string,
  aspectRatio: AspectRatio,
): Promise<{ imageUrl: string; mimeType: string } | null> {
  return callGeminiForImage(prompt, aspectRatio);
}

// New function for multi-image composition
export function composeImages(
  images: ImageState[], // Array of ImageState objects
  prompt: string,
  aspectRatio: AspectRatio,
): Promise<{ imageUrl: string; mimeType: string } | null> {
  return callGeminiForImage(prompt, aspectRatio, images);
}