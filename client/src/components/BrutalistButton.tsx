import React from 'react';
import { Loader2 } from 'lucide-react';

export type BrutalistButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type BrutalistButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface BrutalistButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BrutalistButtonVariant;
  size?: BrutalistButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

export const BrutalistButton: React.FC<BrutalistButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'right',
  children,
  className = '',
  disabled,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const sizeClasses: Record<BrutalistButtonSize, string> = {
    sm: 'px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider',
    md: 'px-6 py-3 text-xs font-bold uppercase tracking-wider',
    lg: 'px-8 py-4 text-sm font-bold uppercase tracking-wider',
    icon: 'p-3',
  };

  const variantClasses: Record<BrutalistButtonVariant, string> = {
    primary:
      'bg-[#1E1E1E] text-[#E4E2DD] border border-[#1E1E1E] hover:text-[#DB4A2B]',
    secondary:
      'bg-[#D9D6D0] text-[#1E1E1E] border border-[#1E1E1E]/20 hover:bg-[#FFFFFF] hover:text-[#DB4A2B]',
    outline:
      'bg-transparent text-[#1E1E1E] border-2 border-[#1E1E1E] hover:text-[#DB4A2B]',
    ghost:
      'bg-transparent text-[#1E1E1E] hover:bg-[#1E1E1E]/5 hover:text-[#DB4A2B]',
    danger:
      'bg-[#DB4A2B] text-[#E4E2DD] border border-[#DB4A2B] hover:bg-[#FFFFFF] hover:text-[#DB4A2B]',
  };

  return (
    <button
      disabled={isDisabled}
      className={`relative inline-flex items-center justify-center font-satoshi rounded-none overflow-hidden select-none cursor-pointer group transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        variantClasses[variant]
      } ${sizeClasses[size]} ${
        isDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'active:translate-y-0.5'
      } ${className}`}
      {...props}
    >
      {/* Directional left-to-right fill on hover */}
      {variant === 'primary' && (
        <span
          className="absolute inset-0 bg-white origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] -z-0"
          aria-hidden="true"
        />
      )}
      {variant === 'outline' && (
        <span
          className="absolute inset-0 bg-[#FFFFFF] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] -z-0"
          aria-hidden="true"
        />
      )}

      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="transition-transform duration-300 group-hover:-translate-x-0.5">
                {icon}
              </span>
            )}
            {children && <span>{children}</span>}
            {icon && iconPosition === 'right' && (
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                {icon}
              </span>
            )}
          </>
        )}
      </span>
    </button>
  );
};

export default BrutalistButton;
