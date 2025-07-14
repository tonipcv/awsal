import { colors, spacing, borderRadius } from '../utils/styles';

export interface ButtonProps {
  text: string;
  url: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

const buttonSizes = {
  small: {
    padding: `${spacing.xs} ${spacing.md}`,
    fontSize: '14px'
  },
  medium: {
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: '16px'
  },
  large: {
    padding: `${spacing.md} ${spacing.xl}`,
    fontSize: '18px'
  }
};

const buttonVariants = {
  primary: {
    background: colors.primary,
    color: colors.background
  },
  secondary: {
    background: colors.secondary,
    color: colors.background
  },
  success: {
    background: colors.success,
    color: colors.background
  },
  warning: {
    background: colors.warning,
    color: colors.text.primary
  },
  error: {
    background: colors.error,
    color: colors.background
  }
};

export const button = ({
  text,
  url,
  variant = 'primary',
  size = 'medium',
  fullWidth = false
}: ButtonProps) => {
  const variantStyles = buttonVariants[variant];
  const sizeStyles = buttonSizes[size];

  return `
    <div style="text-align: center; margin: ${spacing.md} 0;">
      <a href="${url}" 
         style="
           display: ${fullWidth ? 'block' : 'inline-block'};
           padding: ${sizeStyles.padding};
           background: ${variantStyles.background};
           color: ${variantStyles.color};
           text-decoration: none;
           border-radius: ${borderRadius.md};
           font-weight: 600;
           font-size: ${sizeStyles.fontSize};
           text-align: center;
           ${fullWidth ? 'width: 100%;' : ''}
         ">
        ${text}
      </a>
    </div>
  `;
}; 