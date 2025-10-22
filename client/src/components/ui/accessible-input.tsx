import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Label } from './label';
import { Button } from './button';
import { AlertCircle, Eye, EyeOff, CheckCircle, X } from 'lucide-react';

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  error,
  helperText,
  required = false,
  icon,
  rightIcon,
  onRightIconClick,
  variant = 'default',
  size = 'md',
  className,
  id,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-base',
    lg: 'h-12 px-4 text-lg'
  };

  const variantClasses = {
    default: 'border border-gray-300 bg-white',
    filled: 'border-0 bg-gray-100',
    outlined: 'border-2 border-gray-300 bg-transparent'
  };

  const focusClasses = isFocused 
    ? 'border-black ring-2 ring-black/20' 
    : 'border-gray-300';

  const errorClasses = error 
    ? 'border-red-500 ring-2 ring-red-500/20' 
    : '';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label 
          htmlFor={inputId}
          className={cn(
            'text-sm font-medium',
            error ? 'text-red-700' : 'text-gray-700',
            required && 'after:content-["*"] after:ml-1 after:text-red-500'
          )}
        >
          {label}
        </Label>
        {helperText && (
          <span className="text-xs text-gray-500">{helperText}</span>
        )}
      </div>
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <Input
          ref={inputRef}
          id={inputId}
          className={cn(
            sizeClasses[size],
            variantClasses[variant],
            focusClasses,
            errorClasses,
            icon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        
        {rightIcon && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={onRightIconClick}
            tabIndex={-1}
          >
            {rightIcon}
          </button>
        )}
      </div>
      
      {error && (
        <div 
          id={`${inputId}-error`}
          className="flex items-center space-x-1 text-sm text-red-600"
          role="alert"
        >
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="text-xs text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

// Password input with show/hide toggle
export const PasswordInput: React.FC<Omit<AccessibleInputProps, 'type' | 'rightIcon' | 'onRightIconClick'>> = ({
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AccessibleInput
      {...props}
      type={showPassword ? 'text' : 'password'}
      rightIcon={showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      onRightIconClick={() => setShowPassword(!showPassword)}
    />
  );
};

// Phone input with Senegalese formatting
export const PhoneInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  label?: string;
  required?: boolean;
  helperText?: string;
}> = ({ 
  value, 
  onChange, 
  error, 
  className,
  label = "Numéro de téléphone",
  required = false,
  helperText = "Utilisez votre numéro Sénégalais"
}) => {
  const [isValid, setIsValid] = useState(false);

  const formatPhoneNumber = (text: string): string => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Senegalese phone number formatting: 77 123 45 67
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 4) {
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    } else if (cleaned.length <= 7) {
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4)}`;
    } else {
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)}`;
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    // Senegalese mobile numbers start with 77, 78, 70, 76, 75
    const validPrefixes = ['77', '78', '70', '76', '75'];
    return cleaned.length === 9 && validPrefixes.includes(cleaned.slice(0, 2));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange(formatted);
    setIsValid(validatePhoneNumber(formatted));
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label className={cn(
          'text-sm font-medium',
          error ? 'text-red-700' : 'text-gray-700',
          required && 'after:content-["*"] after:ml-1 after:text-red-500'
        )}>
          {label}
        </Label>
        {helperText && (
          <span className="text-xs text-gray-500">{helperText}</span>
        )}
      </div>
      
      <div className="relative">
        <Input
          type="tel"
          value={value}
          onChange={handleChange}
          placeholder="77 123 45 67"
          maxLength={11} // 2 + space + 2 + space + 2 + space + 2
          className={cn(
            'h-11 px-4 text-base',
            error ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-300',
            isValid && !error && 'border-green-500 ring-2 ring-green-500/20'
          )}
          aria-invalid={!!error}
        />
        
        {isValid && !error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            <CheckCircle className="w-4 h-4" />
          </div>
        )}
      </div>
      
      {error && (
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      
      {!error && value && !isValid && (
        <div className="flex items-center space-x-1 text-sm text-yellow-600">
          <AlertCircle className="w-4 h-4" />
          <span>Format de numéro invalide</span>
        </div>
      )}
    </div>
  );
};

// Search input with clear button
export const SearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onSearch?: (value: string) => void;
}> = ({ value, onChange, placeholder = "Rechercher...", className, onSearch }) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        className="pr-10"
      />
      
      {value && (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          onClick={() => onChange('')}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Currency input for FCFA
export const CurrencyInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
  error?: string;
  label?: string;
  required?: boolean;
  helperText?: string;
  className?: string;
  currency?: 'FCFA' | 'USD' | 'EUR';
}> = ({
  value,
  onChange,
  error,
  label = "Montant",
  required = false,
  helperText,
  className,
  currency = 'FCFA'
}) => {
  const [displayValue, setDisplayValue] = useState(value.toString());

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/\D/g, '');
    const numericValue = parseInt(inputValue) || 0;
    
    setDisplayValue(formatCurrency(numericValue));
    onChange(numericValue);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label className={cn(
          'text-sm font-medium',
          error ? 'text-red-700' : 'text-gray-700',
          required && 'after:content-["*"] after:ml-1 after:text-red-500'
        )}>
          {label}
        </Label>
        {helperText && (
          <span className="text-xs text-gray-500">{helperText}</span>
        )}
      </div>
      
      <div className="relative">
        <Input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder="0"
          className={cn(
            'h-11 px-4 text-base pr-16',
            error ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-300'
          )}
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
          {currency}
        </div>
      </div>
      
      {error && (
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// OTP input for verification codes
export const OTPInput: React.FC<{
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}> = ({ length = 6, value, onChange, error, className }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, inputValue: string) => {
    if (inputValue.length > 1) return; // Only allow single character
    
    const newValue = value.split('');
    newValue[index] = inputValue;
    const updatedValue = newValue.join('').slice(0, length);
    
    onChange(updatedValue);
    
    // Auto-focus next input
    if (inputValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex space-x-2 justify-center">
        {Array.from({ length }).map((_, index) => (
          <Input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={cn(
              'w-12 h-12 text-center text-lg font-semibold',
              error ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-300'
            )}
          />
        ))}
      </div>
      
      {error && (
        <div className="flex items-center justify-center space-x-1 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
