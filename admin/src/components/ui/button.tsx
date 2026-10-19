import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonStyles = cva(
  'inline-flex items-center justify-center gap-[7px] font-medium cursor-pointer whitespace-nowrap border border-solid disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-accent border-accent text-white hover:bg-accent-hover',
        secondary: 'bg-surface border-border-strong text-text hover:bg-hover',
        ghost: 'bg-transparent border-transparent text-text-2 hover:bg-hover',
        danger: 'bg-bad border-bad text-white hover:opacity-90',
      },
      size: {
        sm: 'h-[30px] px-[10px] rounded-[8px] text-[12.5px]',
        md: 'h-[36px] px-[14px] rounded-[9px] text-[13px]',
        lg: 'h-[42px] px-[18px] rounded-[10px] text-[14px]',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonStyles> {}

export function Button({ className, variant, size, type = 'button', ...p }: ButtonProps) {
  return <button type={type} className={cn(buttonStyles({ variant, size }), className)} {...p} />;
}
