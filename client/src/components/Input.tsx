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
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider"
        >
          {label}
        </label>
        {hint && <span className="text-[11px] text-zinc-400">{hint}</span>}
      </div>
      <div className="relative rounded-lg shadow-2xs">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full rounded-lg border bg-zinc-50/50 hover:bg-white focus:bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 transition-all duration-150 focus:outline-none focus:ring-3 ${
            icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10'
              : 'border-zinc-200 focus:border-zinc-900 focus:ring-zinc-900/5'
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
