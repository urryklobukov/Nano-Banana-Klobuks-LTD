
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { XIcon } from './icons/XIcon'; // Import XIcon for clear button
import { useTranslations } from '../hooks/useTranslations';

interface ImageUploaderProps {
  onImageUpload: (imageDataUrl: string, mimeType: string) => void;
  currentImage: string | null;
  slotNumber?: number; // Optional prop to display a slot number
  onClear?: () => void; // Optional prop to clear the current image
  label?: string; // Optional label for the uploader
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, currentImage, slotNumber, onClear, label }) => {
  const t = useTranslations();
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageUpload(result, file.type);
      };
      reader.readAsDataURL(file);
    } else {
        alert(t.invalidFileError);
    }
  }, [onImageUpload, t]);

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
    // Clear the input value to allow re-uploading the same file
    e.target.value = '';
  };

  return (
    <div>
      {label && (
        <label htmlFor={`file-upload-input-${slotNumber ?? 'main'}`} className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <label
        htmlFor={`file-upload-input-${slotNumber ?? 'main'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex justify-center items-center w-full h-48 px-1 pt-1 pb-1 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
          isDragging ? 'border-yellow-400 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'
        }`}
      >
        {currentImage ? (
          <>
            <img src={currentImage} alt={t.currentSourceAlt} className="h-full w-full object-contain rounded-md" />
            {onClear && (
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClear(); }}
                    className="absolute top-1 right-1 p-1 bg-gray-900/70 rounded-full text-gray-100 hover:bg-red-500 transition"
                    title={t.clearSlot}
                    aria-label={t.clearSlot}
                >
                    <XIcon className="w-5 h-5" />
                </button>
            )}
          </>
        ) : (
            <div className="space-y-1 text-center">
                {slotNumber && (
                    <span className="absolute inset-0 flex items-center justify-center text-5xl font-bold text-gray-600/50 pointer-events-none">
                        {slotNumber}
                    </span>
                )}
                <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                <div className="flex text-sm text-gray-400">
                    <p className="pl-1" dangerouslySetInnerHTML={{ __html: t.dragDropOrBrowse }} />
                </div>
                <p className="text-xs text-gray-500">{t.supportedFormats}</p>
            </div>
        )}
        <input id={`file-upload-input-${slotNumber ?? 'main'}`} name="file-upload" type="file" className="sr-only" onChange={handleChange} accept="image/*" />
      </label>
    </div>
  );
};

export default ImageUploader;