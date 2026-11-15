import React from 'react';

export const OFFICIAL_LOGO_URL = '/logo.png';

export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'document' | 'header';

interface CompanyLogoProps {
  customLogoUrl?: string;
  size?: LogoSize;
  align?: 'left' | 'center' | 'right';
  className?: string;
  onDarkBg?: boolean;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  customLogoUrl,
  size = 'md',
  align = 'left',
  className = '',
  onDarkBg = false,
}) => {
  const logoSrc = customLogoUrl || OFFICIAL_LOGO_URL;

  // Sizing calibrated specifically for the Yokohama Trading & Logistics emblem (694x356 - 1.95:1 ratio)
  // Ensures all ship details and bottom text ('TRADING AND LOGISTICS • ジャパン') remain legible and crisp
  const sizeClasses: Record<LogoSize, string> = {
    xs: 'h-8 max-h-8 w-auto',
    sm: 'h-10 max-h-10 w-auto',
    md: 'h-11 sm:h-12 max-h-12 w-auto',
    header: 'h-11 sm:h-12 max-h-12 w-auto',
    lg: 'h-16 sm:h-20 max-h-20 w-auto',
    document: 'h-16 sm:h-20 max-h-20 w-auto',
    xl: 'h-20 sm:h-24 max-h-24 w-auto',
  };

  const alignClass =
    align === 'center'
      ? 'object-center mx-auto'
      : align === 'right'
      ? 'object-right ml-auto'
      : 'object-left';

  const imageElement = (
    <img
      src={logoSrc}
      alt="Yokohama Trading & Logistics"
      referrerPolicy="no-referrer"
      style={{
        imageRendering: 'auto',
      }}
      className={`object-contain block transition-all duration-150 ${sizeClasses[size]} ${alignClass} ${className}`}
      onError={(e) => {
        // Fall back to official asset if custom URL fails
        if (e.currentTarget.src !== window.location.origin + OFFICIAL_LOGO_URL) {
          e.currentTarget.src = OFFICIAL_LOGO_URL;
        }
      }}
    />
  );

  if (onDarkBg) {
    return (
      <div className="bg-white px-4 py-2 rounded-xl shadow-md border border-slate-200 inline-flex items-center justify-center">
        {imageElement}
      </div>
    );
  }

  return imageElement;
};
