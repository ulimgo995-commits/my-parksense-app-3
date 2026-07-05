import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white shadow-card hover:bg-primary-dark active:scale-[0.98] disabled:bg-primary/50',
  secondary:
    'bg-white text-text-primary border border-divider hover:bg-gray-50 active:scale-[0.98] disabled:text-text-secondary',
  icon: 'bg-white text-text-primary shadow-floating hover:bg-gray-50 active:scale-95',
};

/**
 * 디자인 가이드 9. 버튼 규격(Rounded-xl, 48px, hover scale, 200ms transition)을 따르는
 * 공용 버튼 컴포넌트.
 */
export function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
