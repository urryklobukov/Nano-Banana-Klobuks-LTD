
import React, { useState, useCallback, useEffect } from 'react';
import { ResultItem, ComparisonMode, PromptMode, AspectRatio, GenerationMode, ImageState, CompositionImageSlotIndex } from './types';
import { restorePhoto, generateImageFromText, composeImages } from './services/geminiService';
import LeftPanel from './components/LeftPanel';
import CenterPanel from './components/CenterPanel';
import RightPanel from './components/RightPanel';
import { PRESET_PROMPTS, REIMAGINE_PRESET_PROMPTS, TEXT_TO_IMAGE_PRESET_PROMPTS, COMPOSITION_PRESET_PROMPTS } from './constants';
import SettingsModal from './components/SettingsModal';
import UpscalingModal from './components/UpscalingModal';
import { useTranslations } from './hooks/useTranslations'; // Import useTranslations

const COOLDOWN_SECONDS = 60;

const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = (err) => {
          console.error("Failed to load image for dimension check", err);
          reject(new Error("Failed to get image dimensions."));
      }
      img.src = dataUrl;
    });
};

const App: React.FC = () => {
  const t = useTranslations(); // Initialize translations
  const [originalImage, setOriginalImage] = useState<ImageState | null>(null); // Slot 1: Stays as the primary uploaded image
  const [processingImage, setProcessingImage] = useState<ImageState | null>(null); // Current image being displayed/processed in CenterPanel
  const [multiImageSlots, setMultiImageSlots] = useState<Array<ImageState | null>>(Array(4).fill(null)); // Slots 2-5
  const [results, setResults] = useState<ResultItem[]>([]);
  const [selectedResult, setSelectedResult] = useState<ResultItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>('');
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('slider');
  const [error, setError] = useState<string | null>(null);
  const [promptMode, setPromptMode] = useState<PromptMode>('retouch'); // Default for image-to-image
  const [customPrompts, setCustomPrompts] = useState<{ retouch: string[], reimagine: string[], textToImage: string[], composition: string[] }>({ retouch: [], reimagine: [], textToImage: [], composition: [] });
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [beforeImageDimensions, setBeforeImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [afterImageDimensions, setAfterImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [quotaCooldownEnd, setQuotaCooldownEnd] = useState<number | null>(null);
  const [timeNow, setTimeNow] = useState(() => Date.now());
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('auto');
  const [generationMode, setGenerationMode] = useState<GenerationMode>('image-to-image');


  useEffect(() => {
    try {
      const savedPrompts = localStorage.getItem('customPrompts');
      if (savedPrompts) {
        const parsed = JSON.parse(savedPrompts);
        // Handle legacy format (array) or new format (object)
        if (Array.isArray(parsed)) {
          setCustomPrompts({ retouch: parsed, reimagine: [], textToImage: [], composition: [] });
        } else {
          // Ensure all keys exist in the parsed object for consistency
          setCustomPrompts({ 
            retouch: parsed.retouch || [], 
            reimagine: parsed.reimagine || [], 
            textToImage: parsed.textToImage || [],
            composition: parsed.composition || [],
          });
        }
      }
    } catch (e) {
      console.error("Failed to load custom prompts from localStorage", e);
    }
  }, []);
  
  useEffect(() => {
    let timer: number | undefined;
    if (quotaCooldownEnd && timeNow < quotaCooldownEnd) {
      timer = setInterval(() => setTimeNow(Date.now()), 1000) as unknown as number;
    } else if (quotaCooldownEnd && timeNow >= quotaCooldownEnd) {
      // Cooldown is over, reset it.
      setQuotaCooldownEnd(null);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [quotaCooldownEnd, timeNow]);

  const updateAndSelectResult = useCallback(async (result: ResultItem | null) => {
      setSelectedResult(result);
      
      if (!result) {
          setBeforeImageDimensions(null);
          setAfterImageDimensions(null);
          setImageDimensions(null);
          return;
      }
      
      const beforeUrl = result.sourceImageUrl ?? originalImage?.dataUrl ?? null;
      const afterUrl = result.imageUrl;

      try {
          const beforeDims = beforeUrl ? await getImageDimensions(beforeUrl) : null;
          const afterDims = afterUrl ? await getImageDimensions(afterUrl) : null;
          setBeforeImageDimensions(beforeDims);
          setAfterImageDimensions(afterDims);
          setImageDimensions(afterDims ?? beforeDims);
      } catch (e) {
          setError("Could not load image properties.");
          setBeforeImageDimensions(null);
          setAfterImageDimensions(null);
          setImageDimensions(null);
      }
  }, [originalImage?.dataUrl]);

  const saveCustomPrompts = (prompts: { retouch: string[], reimagine: string[], textToImage: string[], composition: string[] }) => {
    try {
      localStorage.setItem('customPrompts', JSON.stringify(prompts));
    } catch (e) {
      console.error("Failed to save custom prompts to localStorage", e);
    }
  };

  const addCustomPrompt = (newPrompt: string) => {
    const allPresetPrompts = [...PRESET_PROMPTS, ...REIMAGINE_PRESET_PROMPTS, ...TEXT_TO_IMAGE_PRESET_PROMPTS, ...COMPOSITION_PRESET_PROMPTS].map(p => p.prompt);
    // Use `promptMode` to determine which category to save to
    const currentModeCustomPrompts = customPrompts[promptMode];

    if (newPrompt && !currentModeCustomPrompts.includes(newPrompt) && !allPresetPrompts.includes(newPrompt)) {
      const updatedPrompts = {
        ...customPrompts,
        [promptMode]: [...currentModeCustomPrompts, newPrompt]
      };
      setCustomPrompts(updatedPrompts);
      saveCustomPrompts(updatedPrompts);
    }
  };

  const deleteCustomPrompt = (promptToDelete: string) => {
    // Use `promptMode` to determine which category to delete from
    const updatedPrompts = {
      ...customPrompts,
      [promptMode]: customPrompts[promptMode].filter(p => p !== promptToDelete)
    };
    setCustomPrompts(updatedPrompts);
    saveCustomPrompts(updatedPrompts);
  };
  
  const handleClearAll = useCallback(() => {
    setOriginalImage(null);
    setProcessingImage(null);
    setMultiImageSlots(Array(4).fill(null)); // Clear multi-image slots
    setResults([]);
    setSelectedResult(null);
    setError(null);
    setPrompt('');
    setImageDimensions(null);
    setBeforeImageDimensions(null);
    setAfterImageDimensions(null);
    setPromptMode('retouch');
    setComparisonMode('slider');
    setQuotaCooldownEnd(null);
    setAspectRatio('auto'); // Reset aspect ratio to auto
    setGenerationMode('image-to-image'); // Reset generation mode
  }, []);

  const handleImageUpload = async (imageDataUrl: string, mimeType: string, slotIndex: CompositionImageSlotIndex) => {
    const imageState = { dataUrl: imageDataUrl, mimeType };
    setError(null);

    if (slotIndex === 0) { // Main image slot (Slot 1)
        // If uploading to main slot, perform a soft clear to keep other slots if in composition mode
        if (generationMode !== 'multi-image-composition') {
          handleClearAll(); // Full clear if not in multi-image composition mode
        } else {
          // If in multi-image composition, only clear results and center panel, keep other slots
          setResults([]);
          setSelectedResult(null);
          setError(null);
          setProcessingImage(null);
        }
        setOriginalImage(imageState);
        setProcessingImage(imageState); // This sets the current image for display/comparison
        setGenerationMode('image-to-image'); // Switch to image-to-image mode on upload to main slot
        setPromptMode('retouch');
        
        const originalResult: ResultItem = {
            id: `original-${Date.now()}`,
            imageUrl: imageDataUrl,
            mimeType: mimeType,
            prompt: "Original Image",
            sourceImageUrl: imageDataUrl,
        };
        setResults([originalResult]);
        await updateAndSelectResult(originalResult);
    } else { // Secondary image slots (Slots 2-5)
        // If this is the first image being added to secondary slots, set generationMode
        if (generationMode !== 'multi-image-composition') {
             // If switching to multi-image mode, clear results and center panel to avoid stale data
             setResults([]);
             setSelectedResult(null);
             setError(null);
             setProcessingImage(null);
             setGenerationMode('multi-image-composition');
             setPromptMode('composition'); // Also set promptMode
        }
        setMultiImageSlots(prev => {
            const newSlots = [...prev];
            newSlots[slotIndex - 1] = imageState;
            return newSlots;
        });
        // Clear any previous error on successful upload
        setError(null);
    }
  };

  const handleClearImageSlot = useCallback((slotIndex: CompositionImageSlotIndex) => {
    if (slotIndex === 0) { // Main image slot
      setOriginalImage(null);
      // If we clear the main image, and there are no other images in secondary slots,
      // and we are not in multi-image composition mode, then clear processing image and results.
      // Otherwise, keep processing image as it might be a result.
      if (!multiImageSlots.some(Boolean) && generationMode !== 'multi-image-composition') {
        setProcessingImage(null);
        setResults([]);
        setSelectedResult(null);
        setGenerationMode('text-to-image'); // Default to text-to-image if all image inputs are gone
        setPromptMode('textToImage');
        setAspectRatio('auto'); // Reset aspect ratio
      } else if (generationMode === 'multi-image-composition') {
        // If in multi-image composition, clearing main slot just removes it from inputs
        setProcessingImage(null); // Clear displayed image, but other slots remain
        setResults([]); // Clear results history too
        setSelectedResult(null);
      }
    } else { // Secondary slots (1-4 correspond to indices 0-3 in multiImageSlots array)
      setMultiImageSlots(prev => {
        const newSlots = [...prev];
        newSlots[slotIndex - 1] = null;
        return newSlots;
      });
      // If all images are cleared (main + all secondary), reset to text-to-image
      if (!originalImage && !multiImageSlots.filter((_, i) => i !== slotIndex - 1).some(Boolean)) {
          setGenerationMode('text-to-image');
          setPromptMode('textToImage');
          setProcessingImage(null);
          setResults([]);
          setSelectedResult(null);
          setAspectRatio('auto'); // Reset aspect ratio
      }
    }
    setError(null); // Clear any specific error related to that slot or operation
  }, [originalImage, multiImageSlots, generationMode, setGenerationMode, setPromptMode]);


  const handleImageToImage = useCallback(async () => {
    if (!originalImage || isLoading || (quotaCooldownEnd && Date.now() < quotaCooldownEnd)) return; // Use originalImage as the base for image-to-image

    setIsLoading(true);
    setError(null);
    try {
      const result = await restorePhoto(originalImage, prompt, aspectRatio);

      if (result) {
        const newResult: ResultItem = {
          id: `res-${Date.now()}`,
          imageUrl: result.imageUrl,
          mimeType: result.mimeType,
          prompt: prompt,
          sourceImageUrl: originalImage.dataUrl, // Source is the originalImage
        };
        
        setResults(prev => {
            const updatedResults = [newResult, ...prev];
            return updatedResults.length > 15 ? updatedResults.slice(0, 15) : updatedResults;
        });
        setProcessingImage({ dataUrl: newResult.imageUrl, mimeType: newResult.mimeType }); // Update displayed image

        if (comparisonMode === 'single') {
            setComparisonMode('slider');
        }
        
        await updateAndSelectResult(newResult);

      } else {
        // If result is null, it means no image was found in the model's response
        setError(t.modelNoImageOutput);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred.';
      setError(errorMessage.replace('QUOTA_EXCEEDED: ', ''));
      console.error(err);
      if (errorMessage.startsWith('QUOTA_EXCEEDED:')) {
        setQuotaCooldownEnd(Date.now() + COOLDOWN_SECONDS * 1000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt, isLoading, updateAndSelectResult, comparisonMode, quotaCooldownEnd, aspectRatio, t]);

  const handleTextToImageGenerate = useCallback(async () => {
    if (!prompt.trim() || isLoading || (quotaCooldownEnd && Date.now() < quotaCooldownEnd)) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await generateImageFromText(prompt, aspectRatio);

      if (result) {
        const newResult: ResultItem = {
          id: `gen-${Date.now()}`,
          imageUrl: result.imageUrl,
          mimeType: result.mimeType,
          prompt: prompt,
          sourceImageUrl: undefined, // No source image for text-to-image generation
        };
        
        setResults(prev => {
            const updatedResults = [newResult, ...prev];
            return updatedResults.length > 15 ? updatedResults.slice(0, 15) : updatedResults;
        });
        // For text-to-image, the generated image becomes the 'processingImage' for potential further edits.
        setProcessingImage({ dataUrl: newResult.imageUrl, mimeType: newResult.mimeType });
        // Input slots remain as they were before generation
        // setOriginalImage(null); // No longer clear
        // setMultiImageSlots(Array(4).fill(null)); // No longer clear

        if (comparisonMode === 'single') {
            setComparisonMode('slider');
        }
        
        await updateAndSelectResult(newResult);

      } else {
        // If result is null, it means no image was found in the model's response
        setError(t.modelNoImageOutput);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred.';
      setError(errorMessage.replace('QUOTA_EXCEEDED: ', ''));
      console.error(err);
      if (errorMessage.startsWith('QUOTA_EXCEEDED:')) {
        setQuotaCooldownEnd(Date.now() + COOLDOWN_SECONDS * 1000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading, updateAndSelectResult, comparisonMode, quotaCooldownEnd, aspectRatio, t]);

  const handleMultiImageComposition = useCallback(async () => {
    const allImages: ImageState[] = [];
    if (originalImage) allImages.push(originalImage);
    multiImageSlots.forEach(slot => {
        if (slot) allImages.push(slot);
    });

    if (allImages.length === 0 || !prompt.trim() || isLoading || (quotaCooldownEnd && Date.now() < quotaCooldownEnd)) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await composeImages(allImages, prompt, aspectRatio);

      if (result) {
        const newResult: ResultItem = {
          id: `comp-${Date.now()}`,
          imageUrl: result.imageUrl,
          mimeType: result.mimeType,
          prompt: prompt,
          sourceImageUrl: undefined, // Source images for composition could be many, not a single one
        };
        
        setResults(prev => {
            const updatedResults = [newResult, ...prev];
            return updatedResults.length > 15 ? updatedResults.slice(0, 15) : updatedResults;
        });
        setProcessingImage({ dataUrl: newResult.imageUrl, mimeType: newResult.mimeType });
        // Input slots remain as they were before generation
        // setOriginalImage(null); // No longer clear
        // setMultiImageSlots(Array(4).fill(null)); // No longer clear

        if (comparisonMode === 'single') {
            setComparisonMode('slider');
        }
        
        await updateAndSelectResult(newResult);

      } else {
        // If result is null, it means no image was found in the model's response
        setError(t.modelNoImageOutput);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred.';
      setError(errorMessage.replace('QUOTA_EXCEEDED: ', ''));
      console.error(err);
      if (errorMessage.startsWith('QUOTA_EXCEEDED:')) {
        setQuotaCooldownEnd(Date.now() + COOLDOWN_SECONDS * 1000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, multiImageSlots, prompt, isLoading, updateAndSelectResult, comparisonMode, quotaCooldownEnd, aspectRatio, t]);

  // FIX: Renamed handleUseResultAsSource to handleUseAsSource to match the prop name used in RightPanel.
  const handleUseAsSource = async (result: ResultItem) => {
    handleClearAll(); // Clear existing setup
    setProcessingImage({ dataUrl: result.imageUrl, mimeType: result.mimeType });
    setOriginalImage({ dataUrl: result.imageUrl, mimeType: result.mimeType }); // Set as new original for image-to-image editing
    setPromptMode('reimagine'); 
    setGenerationMode('image-to-image'); 
    
    // Add this new source as the first result in history
    const newOriginalResult: ResultItem = {
        id: `original-from-result-${Date.now()}`,
        imageUrl: result.imageUrl,
        mimeType: result.mimeType,
        prompt: "Original Image",
        sourceImageUrl: result.imageUrl,
    };
    setResults([newOriginalResult]);
    await updateAndSelectResult(newOriginalResult);
  };
  
  const handleResetToOriginal = async () => {
    if (generationMode === 'image-to-image' && originalImage) {
      setProcessingImage(originalImage); // Set center panel image back to original uploaded
      // Ensure image-to-image mode
      const originalResultItem = results.find(r => r.prompt === "Original Image");
      if (originalResultItem) {
          await updateAndSelectResult(originalResultItem);
      }
    } else {
      // If no original image (e.g., from text-to-image or composition), or in multi-image mode, clear everything.
      handleClearAll(); // Clears all images and resets mode to image-to-image
      setGenerationMode('text-to-image'); // Default to text-to-image after clearing
      setPromptMode('textToImage');
    }
  };
  
  const handleSelectResultForView = async (result: ResultItem) => {
    if (result.prompt === 'Image Edited') {
        setComparisonMode('single');
    } else if (comparisonMode === 'single') {
        setComparisonMode('slider');
    }
    await updateAndSelectResult(result);
  }

  const handleImageEdited = async (editedDataUrl: string, mimeType: string) => {
    const newResult: ResultItem = {
      id: `edit-${Date.now()}`,
      imageUrl: editedDataUrl,
      mimeType: mimeType,
      prompt: "Image Edited",
      sourceImageUrl: processingImage?.dataUrl,
    };
    
    setResults(prev => [newResult, ...prev]);
    setProcessingImage({ dataUrl: newResult.imageUrl, mimeType: newResult.mimeType });
    setComparisonMode('single');
    await updateAndSelectResult(newResult);
  };

  // FIX: Added a small timeout before removing the link element.
  const downloadImage = (imageUrl: string, id: string, suffix = '') => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `restored-${id}${suffix}.png`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100); // Small delay to allow download to initiate
  };

  const upscaleAndDownload = (result: ResultItem) => {
    setIsUpscaling(true);
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setIsUpscaling(false);
            setError("Could not create canvas context for upscaling.");
            return;
        }

        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Apply subtle enhancements to contrast and saturation during the upscale draw.
        // This makes the result look sharper and more vibrant without complex algorithms or API calls.
        ctx.filter = 'contrast(105%) saturate(105%) brightness(102%)';

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Reset the filter in case the context is reused elsewhere (good practice).
        ctx.filter = 'none';

        const upscaledDataUrl = canvas.toDataURL(result.mimeType, 1.0);
        downloadImage(upscaledDataUrl, result.id, '-2x');
        setIsUpscaling(false);
    };
    img.onerror = () => {
        setIsUpscaling(false);
        setError("Failed to load image for upscaling.");
    }
    img.src = result.imageUrl;
  };

  const cooldownRemaining = quotaCooldownEnd ? Math.max(0, Math.ceil((quotaCooldownEnd - timeNow) / 1000)) : 0;
  const isQuotaLimited = cooldownRemaining > 0;

  // Determine if there is *any* image to display or work with for CenterPanel
  const hasAnyImageLoaded = !!processingImage || generationMode === 'text-to-image';


  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100 font-sans overflow-hidden">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <UpscalingModal isOpen={isUpscaling} />
      <LeftPanel
        onImageUpload={handleImageUpload}
        onClearImageSlot={handleClearImageSlot}
        originalImage={originalImage} // Pass originalImage for the main slot
        processingImageUrl={processingImage?.dataUrl} // This is for context in LeftPanel, not for main slot currentImage
        multiImageSlots={multiImageSlots}
        prompt={prompt}
        setPrompt={setPrompt}
        onImageToImage={handleImageToImage}
        onTextToImageGenerate={handleTextToImageGenerate}
        onMultiImageComposition={handleMultiImageComposition}
        isLoading={isLoading}
        hasImage={!!originalImage} // This prop specifically refers to the primary original image for some logic
        onReset={handleResetToOriginal}
        isProcessingOriginal={originalImage?.dataUrl === processingImage?.dataUrl}
        customPrompts={customPrompts}
        onAddCustomPrompt={addCustomPrompt}
        onDeleteCustomPrompt={deleteCustomPrompt}
        promptMode={promptMode}
        setPromptMode={setPromptMode}
        isEditing={isEditing}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isQuotaLimited={isQuotaLimited}
        quotaCooldownRemaining={cooldownRemaining}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        generationMode={generationMode}
        setGenerationMode={setGenerationMode}
      />
      <CenterPanel
        beforeImage={selectedResult?.prompt === 'Original Image' ? null : (selectedResult?.sourceImageUrl ?? originalImage?.dataUrl ?? null)}
        afterImage={selectedResult?.imageUrl ?? null}
        mimeType={selectedResult?.mimeType ?? originalImage?.mimeType ?? 'image/png'}
        comparisonMode={comparisonMode}
        setComparisonMode={setComparisonMode}
        isLoading={isLoading}
        error={error}
        hasImage={hasAnyImageLoaded} // hasImage can be true even if no original image, if we're generating new ones.
        imageDimensions={imageDimensions}
        beforeImageDimensions={beforeImageDimensions}
        afterImageDimensions={afterImageDimensions}
        onImageEdited={handleImageEdited}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        selectedResult={selectedResult}
      />
      <RightPanel
        results={results}
        selectedResultId={selectedResult?.id ?? null}
        onSelectResult={handleSelectResultForView}
        onUseAsSource={handleUseAsSource}
        onDownloadResult={(result) => downloadImage(result.imageUrl, result.id)}
        onUpscaleAndDownload={upscaleAndDownload}
        onClearAll={handleClearAll}
        isLoading={isLoading}
      />
    </div>
  );
};

export default App;