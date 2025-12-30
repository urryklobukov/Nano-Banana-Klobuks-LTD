
import React, { useEffect, useCallback } from 'react';
import ImageUploader from './ImageUploader';
import { PRESET_PROMPTS, REIMAGINE_PRESET_PROMPTS, TEXT_TO_IMAGE_PRESET_PROMPTS, COMPOSITION_PRESET_PROMPTS, ASPECT_RATIOS } from '../constants';
import { RestoreIcon } from './icons/RestoreIcon';
import { ResetIcon } from './icons/ResetIcon';
import { PlusIcon } from './icons/PlusIcon';
import { SaveIcon } from './icons/SaveIcon';
import { TrashIcon } from './icons/TrashIcon';
import { useTranslations } from '../hooks/useTranslations';
import { PromptMode, AspectRatio, GenerationMode, ImageState, CompositionImageSlotIndex } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { SettingsIcon } from './icons/SettingsIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { SparkleIcon } from './icons/SparkleIcon'; // Icon for text-to-image
import { LayersIcon } from './icons/LayersIcon'; // Icon for multi-image composition
import MultiImageUploadGrid from './MultiImageUploadGrid';

interface LeftPanelProps {
  onImageUpload: (imageDataUrl: string, mimeType: string, slotIndex: CompositionImageSlotIndex) => void;
  onClearImageSlot: (slotIndex: CompositionImageSlotIndex) => void;
  originalImage: ImageState | null; // Pass originalImage for the main slot
  processingImageUrl: string | null; // This is for internal use for context, not for main slot currentImage
  multiImageSlots: Array<ImageState | null>; // New prop for multi-image slots
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  onImageToImage: () => void;
  onTextToImageGenerate: () => void;
  onMultiImageComposition: () => void; // New prop for multi-image composition
  isLoading: boolean;
  hasImage: boolean; // Refers to originalImage for image-to-image mode
  onReset: () => void;
  isProcessingOriginal: boolean;
  customPrompts: { retouch: string[], reimagine: string[], textToImage: string[], composition: string[] }; // Updated type
  onAddCustomPrompt: (prompt: string) => void;
  onDeleteCustomPrompt: (prompt: string) => void;
  promptMode: PromptMode;
  setPromptMode: (mode: PromptMode) => void;
  isEditing: boolean;
  onOpenSettings: () => void;
  isQuotaLimited: boolean;
  quotaCooldownRemaining: number;
  aspectRatio: AspectRatio;
  setAspectRatio: React.Dispatch<React.SetStateAction<AspectRatio>>;
  generationMode: GenerationMode;
  setGenerationMode: React.Dispatch<React.SetStateAction<GenerationMode>>;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  onImageUpload,
  onClearImageSlot,
  originalImage, // Use this for main image uploader
  processingImageUrl, // This prop is not directly used for ImageUploader.currentImage now
  multiImageSlots,
  prompt,
  setPrompt,
  onImageToImage,
  onTextToImageGenerate,
  onMultiImageComposition,
  isLoading,
  hasImage,
  onReset,
  isProcessingOriginal,
  customPrompts,
  onAddCustomPrompt,
  onDeleteCustomPrompt,
  promptMode,
  setPromptMode,
  isEditing,
  onOpenSettings,
  isQuotaLimited,
  quotaCooldownRemaining,
  aspectRatio,
  setAspectRatio,
  generationMode,
  setGenerationMode,
}) => {
  const t = useTranslations();
  const { language } = useLanguage();
  
  let currentPresets: any[] = [];
  if (generationMode === 'text-to-image') {
    currentPresets = []; // No presets for text-to-image tab as requested
  } else if (generationMode === 'multi-image-composition') {
    currentPresets = []; // No presets for multi-image composition tab as requested
  } else if (promptMode === 'retouch') { // image-to-image, retouch
    currentPresets = PRESET_PROMPTS;
  } else { // image-to-image, reimagine
    currentPresets = []; // No presets for reimagine tab as requested
  }

  // Consolidated all preset prompts for checking against custom prompts
  const allPresetPromptsFullText = [
    ...PRESET_PROMPTS, 
    ...REIMAGINE_PRESET_PROMPTS,
    ...TEXT_TO_IMAGE_PRESET_PROMPTS,
    ...COMPOSITION_PRESET_PROMPTS,
  ].map(p => p.prompt);

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    error: speechError,
  } = useSpeechRecognition();

  useEffect(() => {
    if (!isListening && transcript) {
      const currentFullPrompt = prompt.trim();
      const newSegment = transcript.trim();

      if (newSegment && !currentFullPrompt.endsWith(newSegment)) {
        setPrompt(prevPrompt => {
          const trimmedPrev = prevPrompt.trim();
          return trimmedPrev ? `${trimmedPrev} ${newSegment}` : newSegment;
        });
      }
      resetTranscript();
    }
  }, [isListening, transcript, prompt, setPrompt, resetTranscript]);

  const handleGenerationModeChange = useCallback((mode: GenerationMode) => {
    setGenerationMode(mode);
    setPrompt(''); // Clear prompt when switching generation mode
    // Reset prompt mode based on the new generation mode
    if (mode === 'image-to-image') {
        setPromptMode('retouch'); 
    } else if (mode === 'text-to-image') {
        setPromptMode('textToImage');
    } else { // multi-image-composition
        setPromptMode('composition');
    }
    // Clear processingImageUrl if it's not relevant to the new mode's current inputs,
    // but DON'T clear originalImage or multiImageSlots unless explicitly intended by clearAll.
    // The goal here is to switch *mode*, not necessarily clear *inputs*.
    if (mode === 'text-to-image' && (originalImage || multiImageSlots.some(Boolean))) {
      // If switching to text-to-image from modes that use image inputs, clear processing image
      // but keep originalImage and multiImageSlots in case the user switches back.
      // This is a more complex state management, for now, we follow the previous `App.tsx` logic for simplicity,
      // which clears history and processing image on mode change if images are present.
      // The `App.tsx`'s `handleClearAll` already handles this more broadly.
    }
  }, [setGenerationMode, setPrompt, setPromptMode, originalImage, multiImageSlots]);

  const getButtonText = () => {
    if (isQuotaLimited) {
      return `${t.quotaLimitReached} (${quotaCooldownRemaining}s)`;
    }
    if (isLoading) {
      return t.processingBtn;
    }
    if (generationMode === 'text-to-image') {
      return t.generateImageBtn;
    }
    if (generationMode === 'multi-image-composition') {
      return t.composeImagesBtn;
    }
    return t.processImageBtn;
  };

  const getActionButtonHandler = () => {
    if (generationMode === 'text-to-image') {
      return onTextToImageGenerate;
    }
    if (generationMode === 'multi-image-composition') {
      return onMultiImageComposition;
    }
    return onImageToImage;
  };

  const isActionButtonDisabled = () => {
    if (isLoading || isEditing || isQuotaLimited || isListening) return true;
    if (generationMode === 'image-to-image') {
      return !hasImage; // hasImage from App.tsx which means !!originalImage
    }
    if (generationMode === 'multi-image-composition') {
        // At least one image (main or secondary) and a prompt are required
        return !(originalImage || multiImageSlots.some(Boolean)) || !prompt.trim();
    }
    // For text-to-image, prompt must not be empty
    return !prompt.trim();
  };

  const currentPromptValue = isListening
    ? (prompt.trim() ? `${prompt.trim()} ${transcript}`.trim() : transcript.trim())
    : prompt;

  return (
    <div className="w-1/4 max-w-sm flex flex-col bg-gray-800 p-6 border-r border-gray-700 space-y-6 flex-shrink-0">
      <header className="flex items-start justify-between">
        <div>
            <h1 className={`font-bold text-yellow-400 whitespace-nowrap ${language === 'en' ? 'text-xl' : 'text-lg'}`}>
                <img 
                    src="https://em-content.zobj.net/source/google/387/banana_1f34c.png" 
                    alt="Banana Icon" 
                    className="w-8 h-8 inline-block align-middle mr-2"
                />
                {t.appTitle}
            </h1>
            <p className="text-sm text-gray-400">{t.appSubtitle}</p>
        </div>
        <button onClick={onOpenSettings} className="p-2 rounded-md hover:bg-gray-700 transition-colors" aria-label={t.settingsTitle}>
            <SettingsIcon className="w-6 h-6 text-gray-300"/>
        </button>
      </header>
      
      <div className="flex-grow flex flex-col space-y-6 overflow-y-auto pr-2 -mr-2">

        {/* Generation Mode Toggle */}
        <div className="flex bg-gray-700 rounded-lg p-1 text-sm font-semibold mb-4">
            <button 
                onClick={() => handleGenerationModeChange('image-to-image')}
                className={`flex-1 py-2 px-3 text-center rounded-md transition-colors ${generationMode === 'image-to-image' ? 'bg-yellow-400 text-gray-900' : 'text-gray-400 hover:text-gray-100'}`}
                disabled={isListening}
            >
                {t.imageToImageTab}
            </button>
            <button 
                onClick={() => handleGenerationModeChange('text-to-image')}
                className={`flex-1 py-2 px-3 text-center rounded-md transition-colors ${generationMode === 'text-to-image' ? 'bg-yellow-400 text-gray-900' : 'text-gray-400 hover:text-gray-100'}`}
                disabled={isListening}
            >
                {t.textToImageTab}
            </button>
            <button 
                onClick={() => handleGenerationModeChange('multi-image-composition')}
                className={`flex-1 py-2 px-3 text-center rounded-md transition-colors ${generationMode === 'multi-image-composition' ? 'bg-yellow-400 text-gray-900' : 'text-gray-400 hover:text-gray-100'}`}
                disabled={isListening}
            >
                {t.multiImageCompositionTab}
            </button>
        </div>

        {(generationMode === 'image-to-image' || generationMode === 'multi-image-composition') && (
          <ImageUploader 
            onImageUpload={(dataUrl, mimeType) => onImageUpload(dataUrl, mimeType, 0)} 
            currentImage={originalImage?.dataUrl ?? null} // Use originalImage here
            slotNumber={1}
            onClear={() => onClearImageSlot(0)}
            label={t.mainImageLabel}
          />
        )}

        {generationMode === 'multi-image-composition' && (
            <MultiImageUploadGrid
                images={multiImageSlots}
                onImageUpload={(dataUrl, mimeType, index) => onImageUpload(dataUrl, mimeType, (index + 1) as CompositionImageSlotIndex)}
                onClear={(index) => onClearImageSlot((index + 1) as CompositionImageSlotIndex)}
                disabled={isListening}
            />
        )}
        
        {/* Prompt Mode Tabs (only for image-to-image mode) */}
        {generationMode === 'image-to-image' && (
            <div className="flex border-b border-gray-700 mb-4">
                <button 
                    onClick={() => setPromptMode('retouch')}
                    className={`flex-1 py-2 text-sm font-semibold transition-colors ${promptMode === 'retouch' ? 'text-yellow-300 border-b-2 border-yellow-300' : 'text-gray-400 hover:text-gray-100'}`}
                    disabled={isListening}
                >
                    {t.retouchTab}
                </button>
                <button 
                    onClick={() => setPromptMode('reimagine')}
                    className={`flex-1 py-2 text-sm font-semibold transition-colors ${promptMode === 'reimagine' ? 'text-yellow-300 border-b-2 border-yellow-300' : 'text-gray-400 hover:text-gray-100'}`}
                    disabled={isListening}
                >
                    {t.reimagineTab}
                </button>
            </div>
        )}

        {/* Prompt Input Field (moved to the bottom of the upload sections) */}
        <div>
          <label htmlFor="prompt-input" className="block text-sm font-medium text-gray-300 mb-2">
            {t.promptLabel}
          </label>
          <div className="relative">
            <textarea
              id="prompt-input"
              rows={4}
              className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 pr-20 text-gray-100 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
              value={currentPromptValue}
              onChange={(e) => {
                if (!isListening) {
                    setPrompt(e.target.value);
                }
              }}
              placeholder={t.promptPlaceholder}
            />
            {(!browserSupportsSpeechRecognition || speechError) && (
                <p className="absolute -bottom-6 left-0 text-red-400 text-xs mt-1">
                  {!browserSupportsSpeechRecognition ? t.voiceInputNotSupported : `${t.speechRecognitionError}: ${speechError}`}
                </p>
            )}
            <button 
              onClick={isListening ? stopListening : startListening}
              disabled={!browserSupportsSpeechRecognition}
              className={`absolute top-2 right-12 p-1.5 text-gray-400 hover:text-yellow-400 bg-gray-800 rounded-md transition ${isListening ? 'text-red-500 animate-pulse' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isListening ? t.stopVoiceInput : t.startVoiceInput}
              aria-label={isListening ? t.stopVoiceInput : t.startVoiceInput}
            >
                <MicrophoneIcon className="h-5 w-5"/>
            </button>
            <button 
              onClick={() => onAddCustomPrompt(prompt)} 
              disabled={!prompt.trim() || allPresetPromptsFullText.includes(prompt.trim()) || isListening}
              className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-yellow-400 bg-gray-800 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              title={t.saveCustomPromptTitle}
              aria-label={t.saveCustomPromptTitle}
            >
                <SaveIcon className="h-5 w-5"/>
            </button>
          </div>
        </div>

        <div>
            <label htmlFor="aspect-ratio-select" className="block text-sm font-medium text-gray-300 mb-2">
                {t.aspectRatioLabel}
            </label>
            <select
                id="aspect-ratio-select"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-100 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                disabled={isListening}
            >
                {ASPECT_RATIOS.map((ratio) => (
                    <option key={ratio} value={ratio}>
                        {ratio === 'auto' ? t.aspectRatioAuto : ratio}
                    </option>
                ))}
            </select>
        </div>

        {/* Only show Preset Prompts if currentPresets has items */}
        {currentPresets.length > 0 && (
            <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">{t.presetPromptsTitle}:</h3>
            <div className="grid grid-cols-1 gap-2">
                {currentPresets.map((p) => (
                <div key={p.id} className="flex items-center space-x-1">
                    <button
                    onClick={() => setPrompt(p.prompt)}
                    className={`flex-grow text-xs text-left p-2 rounded-l-md transition truncate ${
                        prompt === p.prompt
                        ? 'bg-yellow-400 text-gray-900 font-semibold'
                        : 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                    }`}
                    title={p.prompt}
                    disabled={isListening}
                    >
                    {t[p.id as keyof typeof t] || p.prompt}
                    </button>
                    <button
                        onClick={() => setPrompt(current => current ? `${current}, ${p.prompt}` : p.prompt)}
                        className="bg-gray-600 p-2 rounded-r-md hover:bg-yellow-400 hover:text-gray-900 transition"
                        aria-label={`${t.appendPromptLabel}: ${t[p.id as keyof typeof t]}`}
                        title={`${t.appendPromptTitle}: ${t[p.id as keyof typeof t]}`}
                        disabled={isListening}
                    >
                        <PlusIcon className="h-4 w-4"/>
                    </button>
                </div>
                ))}
            </div>
            </div>
        )}

        <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">{t.customPromptsTitle}:</h3>
            <div className="space-y-2">
                {customPrompts[promptMode].length === 0 && (
                    <p className="text-xs text-gray-400 text-center italic">{t.noCustomPrompts}</p>
                )}
                {customPrompts[promptMode].map(p => (
                     <div key={p} className="flex items-center space-x-1">
                        <button
                          onClick={() => setPrompt(p)}
                          className={`flex-grow text-xs text-left p-2 rounded-l-md transition truncate ${
                              prompt === p
                              ? 'bg-yellow-400 text-gray-900 font-semibold'
                              : 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                          }`}
                          title={p}
                          disabled={isListening}
                        >
                          {p}
                        </button>
                        <button
                            onClick={() => setPrompt(current => current ? `${current}, ${p}` : p)}
                            className="bg-gray-600 p-2 hover:bg-yellow-400 hover:text-gray-900 transition"
                            aria-label={`${t.appendPromptLabel}: ${p}`}
                            title={`${t.appendPromptTitle}: ${p}`}
                            disabled={isListening}
                        >
                            <PlusIcon className="h-4 w-4"/>
                        </button>
                        <button
                            onClick={() => onDeleteCustomPrompt(p)}
                            className="bg-gray-600 p-2 rounded-r-md hover:bg-red-500 transition"
                            aria-label={`${t.deletePromptLabel}: ${p}`}
                            title={`${t.deletePromptTitle}: ${p}`}
                            disabled={isListening}
                        >
                            <TrashIcon className="h-4 w-4"/>
                        </button>
                    </div>
                ))}
            </div>
        </div>

      </div>
      
      <div className="space-y-3 pt-4 border-t border-gray-700">
         <button
            onClick={onReset}
            disabled={
                (generationMode === 'image-to-image' && !hasImage) || 
                ((generationMode === 'text-to-image' || generationMode === 'multi-image-composition') && !originalImage && !multiImageSlots.some(Boolean)) || 
                isLoading || isListening
            }
            className="w-full flex items-center justify-center bg-gray-700 text-gray-300 font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
            <ResetIcon className="h-5 w-5 mr-2"/>
            {generationMode === 'text-to-image' || generationMode === 'multi-image-composition' ? t.clearGeneration : t.resetToOriginalBtn}
        </button>
        <button
          onClick={getActionButtonHandler()}
          disabled={isActionButtonDisabled()}
          className="w-full flex items-center justify-center bg-yellow-400 text-gray-900 font-bold py-3 px-4 rounded-lg shadow-md hover:bg-yellow-300 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          {generationMode === 'text-to-image' && <SparkleIcon className="h-5 w-5 mr-2"/>}
          {generationMode === 'multi-image-composition' && <LayersIcon className="h-5 w-5 mr-2"/>}
          {generationMode === 'image-to-image' && <RestoreIcon className="h-5 w-5 mr-2"/>}
          {getButtonText()}
        </button>
      </div>
    </div>
  );
};

export default LeftPanel;