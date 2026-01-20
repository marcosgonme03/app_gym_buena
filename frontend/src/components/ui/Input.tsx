import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-dark-200 mb-2"
          >
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-3 rounded-lg
            bg-dark-800/50 border transition-all duration-200
            text-dark-50 placeholder:text-dark-500
            focus-ring
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error 
              ? 'border-red-500/50 focus:border-red-500' 
              : 'border-dark-700 focus:border-primary-500'
            }
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-sm text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-2 text-sm text-dark-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
