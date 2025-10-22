import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'wo', name: 'Wolof', flag: '🇸🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export function LanguageSelector() {
  const { currentLanguage, setLanguage } = useLanguage();

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLang.flag}</span>
          <span className="hidden md:inline">{currentLang.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setLanguage(language.code)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span>{language.flag}</span>
              <span>{language.name}</span>
            </div>
            {currentLanguage === language.code && (
              <Check className="h-4 w-4 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LanguageToggle() {
  const { currentLanguage, setLanguage } = useLanguage();

  const cycleLanguage = () => {
    const currentIndex = languages.findIndex(lang => lang.code === currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex].code);
  };

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleLanguage}
      className="gap-2"
    >
      <span>{currentLang.flag}</span>
      <span className="hidden sm:inline">{currentLang.name}</span>
    </Button>
  );
}
