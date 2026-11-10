import React from 'react';

export interface MySpaceLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  withContainer?: boolean;
  alt?: string;
}

export const LOGO_ASSET_PATH = '/assets/aistudio/Interlocking_Gold_and_Black_Maze_Cube_ea4a1a4a.png';

export const MySpaceLogo: React.FC<MySpaceLogoProps> = ({
  size = 'md',
  className = '',
  withContainer = true,
  alt = 'MySpace 3D Golden & Black Maze Cube Logo',
}) => {
  const containerSizeClasses = {
    xs: 'w-6 h-6 rounded-lg p-[1px]',
    sm: 'w-8 h-8 rounded-xl p-[1.5px]',
    md: 'w-9 h-9 rounded-xl p-[1.5px]',
    lg: 'w-12 h-12 rounded-2xl p-[2px]',
    xl: 'w-16 h-16 rounded-2xl p-[2.5px]',
  };

  const bareSizeClasses = {
    xs: 'w-5 h-5 rounded-md',
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-16 h-16 rounded-2xl',
  };

  const innerRadiusClasses = {
    xs: 'rounded-[6px]',
    sm: 'rounded-[9px]',
    md: 'rounded-[10px]',
    lg: 'rounded-[14px]',
    xl: 'rounded-[18px]',
  };

  if (!withContainer) {
    return (
      <img
        src={LOGO_ASSET_PATH}
        alt={alt}
        className={`${bareSizeClasses[size]} object-contain select-none ${className}`}
        loading="eager"
        decoding="async"
      />
    );
  }

  return (
    <div
      className={`relative shrink-0 bg-gradient-to-tr from-[#D6AD60] to-[#F5B942] dark:from-[#D6AD60] dark:to-[#F5B942] flex items-center justify-center shadow-lg shadow-[#F5B942]/20 ring-1 ring-[#F5B942]/40 overflow-hidden select-none ${containerSizeClasses[size]} ${className}`}
    >
      <div
        className={`w-full h-full bg-[#080808] flex items-center justify-center overflow-hidden ${innerRadiusClasses[size]}`}
      >
        <img
          src={LOGO_ASSET_PATH}
          alt={alt}
          className="w-full h-full object-contain transform scale-[1.04] transition-transform duration-200"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  );
};
