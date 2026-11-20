import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  hint,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full space-y-1.5 font-satoshi text-left">
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="block text-[11px] font-bold text-[#1E1E1E] uppercase tracking-widest"
        >
          {label}
        </label>
        {hint && <span className="text-[10px] text-[#444444] font-medium">{hint}</span>}
      </div>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#444444]">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full rounded-none border bg-[#FFFFFF] px-3.5 py-3 text-xs sm:text-sm text-[#1E1E1E] placeholder-[#444444]/60 transition-colors duration-200 focus:outline-none ${
            icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-2 border-[#DB4A2B] focus:border-[#DB4A2B]'
              : 'border border-[#1E1E1E]/25 focus:border-2 focus:border-[#1E1E1E]'
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-[#DB4A2B] font-semibold flex items-center gap-1 mt-1 tracking-tight">
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
