
import React from 'react';
import ImageUploader from './ImageUploader';
import { ImageState } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface MultiImageUploadGridProps {
  images: Array<ImageState | null>;
  onImageUpload: (imageDataUrl: string, mimeType: string, slotIndex: number) => void;
  onClear: (slotIndex: number) => void;
  disabled: boolean;
}

const MultiImageUploadGrid: React.FC<MultiImageUploadGridProps> = ({ images, onImageUpload, onClear, disabled }) => {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      <h3 className="block text-sm font-medium text-gray-300 mb-2">{t.additionalImagesLabel}</h3>
      <div className="grid grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((index) => (
          <ImageUploader
            key={index}
            slotNumber={index + 2} // Slots 2, 3, 4, 5
            currentImage={images[index]?.dataUrl ?? null}
            onImageUpload={(dataUrl, mimeType) => onImageUpload(dataUrl, mimeType, index)}
            onClear={() => onClear(index)}
            // Disabled status for multi-image slots is handled by the parent
            // But if the whole grid is disabled, the uploader should reflect it
            // (e.g., if listening to voice input)
            // The actual input `disabled` attribute is managed internally by ImageUploader
          />
        ))}
      </div>
    </div>
  );
};

export default MultiImageUploadGrid;