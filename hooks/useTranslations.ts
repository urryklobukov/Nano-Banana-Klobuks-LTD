
import { useLanguage } from '../context/LanguageContext';
import en from '../locales/en';
import ru from '../locales/ru';
import uk from '../locales/uk';

const translations = { en, ru, uk };

export const useTranslations = () => {
  const { language } = useLanguage();
  return translations[language];
};