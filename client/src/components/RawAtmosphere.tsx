import React from 'react';

interface RawAtmosphereProps {
  className?: string;
  variant?: 'subtle' | 'vibrant' | 'editorial';
}

export const RawAtmosphere: React.FC<RawAtmosphereProps> = ({
  className = '',
  variant = 'editorial',
}) => {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none -z-10 ${className}`}
      aria-hidden="true"
    >
      {/* Noise Texture layer */}
      <div className="absolute inset-0 raw-grain-overlay opacity-30 z-10" />

      {/* Atmospheric organic radial gradient blobs with multiply blending and 120px blur */}
      <div className="absolute inset-0">
        {/* Warm Orange Blob */}
        <div
          className={`absolute -top-32 -left-24 w-[38rem] h-[38rem] rounded-full bg-[#F8A348] mix-blend-multiply filter blur-[120px] animate-blob-1 ${
            variant === 'subtle' ? 'opacity-25' : variant === 'vibrant' ? 'opacity-60' : 'opacity-40'
          }`}
        />

        {/* Soft Pink Blob */}
        <div
          className={`absolute top-1/4 -right-28 w-[42rem] h-[42rem] rounded-full bg-[#FF89A9] mix-blend-multiply filter blur-[130px] animate-blob-2 ${
            variant === 'subtle' ? 'opacity-20' : variant === 'vibrant' ? 'opacity-55' : 'opacity-35'
          }`}
        />

        {/* Accent Red-Orange Blob */}
        <div
          className={`absolute bottom-[-10%] left-1/3 w-[36rem] h-[36rem] rounded-full bg-[#DB4A2B] mix-blend-multiply filter blur-[140px] animate-blob-3 ${
            variant === 'subtle' ? 'opacity-20' : variant === 'vibrant' ? 'opacity-45' : 'opacity-30'
          }`}
        />
      </div>
    </div>
  );
};

export default RawAtmosphere;
