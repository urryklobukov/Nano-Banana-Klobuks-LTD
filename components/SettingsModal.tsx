
import React from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslations } from '../hooks/useTranslations';
import { XIcon } from './icons/XIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700 w-full max-w-sm text-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-300">{t.settingsTitle}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t.languageLabel}</label>
                <LanguageSwitcher />
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;