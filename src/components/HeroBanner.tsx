import React from 'react';
import { useI18n } from '../i18n/i18nContext';
import { Hotel, Sparkles } from 'lucide-react';

interface HeroBannerProps {
  showSearch?: boolean;
  onSearch?: (token: string) => void;
  compact?: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ showSearch, onSearch, compact = false }) => {
  const { t } = useI18n();
  const [searchInput, setSearchInput] = React.useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim() && onSearch) {
      onSearch(searchInput.trim());
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden bg-slate-900 flex flex-col justify-end ${
        compact
          ? 'min-h-[260px] sm:min-h-[320px] md:min-h-[400px]'
          : 'min-h-[380px] sm:min-h-[480px] md:min-h-[560px] lg:min-h-[620px]'
      }`}
    >
      {/* Responsive Picture: Desktop view uses HeroDesktop.webp with object-position shifted upwards (15%), Mobile view uses heoMobileCropped.webp */}
      <picture className="absolute inset-0 w-full h-full">
        <source media="(min-width: 768px)" srcSet="/images/HeroDesktop.webp" type="image/webp" />
        <img
          src="/images/heoMobileCropped.webp"
          alt="Balasangham State Conference Children with Flag"
          className="w-full h-full object-cover object-top md:object-[center_15%] filter brightness-95"
          loading="eager"
        />
      </picture>

      {/* Warm Gradient Overlay ensuring crisp contrast for white Malayalam text while leaving the flag visible */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />

      {/* Content Container spanning the max content width and centered */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col items-start gap-2.5">
        {/* Conference Tag Pill with Official Logo */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-slate-900 text-xs font-bold tracking-wide shadow-md border border-white/40">
          <img src="/images/logo.png" alt="Balasangham Logo" className="w-5 h-5 object-contain" />
          <span className="text-primary font-black uppercase tracking-wider">{t('app_name')}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-700 font-semibold">{t('portal_title')}</span>
        </div>

        {/* Main Title strictly using Anek Malayalam 800 Bold */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-malayalam-bold drop-shadow-md leading-tight">
          {t('event_title')}
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm md:text-base text-white/90 font-medium">
          {t('event_subtitle')}
        </p>

        {/* Quick Search on Desktop / Landing */}
        {showSearch && (
          <form onSubmit={handleSearchSubmit} className="w-full max-w-lg mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('search_placeholder')}
                className="w-full px-4 py-3 rounded-xl bg-white/95 text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-lg placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-primary hover:bg-primary-600 text-white text-sm font-bold shadow-lg transition-transform active:scale-95 touch-target flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('search_button')}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
