
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTranslations } from '../hooks/useTranslations';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', nameKey: 'lang_en', flag: '🇺🇸' },
    { code: 'uk', nameKey: 'lang_uk', flag: '🇺🇦' },
    { code: 'ru', nameKey: 'lang_ru', flag: '🇷🇺' },
  ] as const;

  type LanguageCode = typeof languages[number]['code'];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);
  
  const selectedLanguage = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-gray-700 text-gray-100 py-2 px-4 rounded-lg hover:bg-gray-600 transition text-left"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="flex items-center space-x-3">
          <span>{selectedLanguage.flag}</span>
          <span className="font-medium">{t[selectedLanguage.nameKey]}</span>
        </span>
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg z-20">
          <ul className="py-1" role="menu">
            {languages.map((lang) => (
              <li key={lang.code}>
                <button
                  onClick={() => {
                    setLanguage(lang.code as LanguageCode);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${
                    language === lang.code
                      ? 'bg-yellow-400 text-gray-900 font-semibold'
                      : 'text-gray-200 hover:bg-gray-700'
                  }`}
                  role="menuitem"
                >
                  <span>{lang.flag}</span>
                  <span>{t[lang.nameKey]}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;