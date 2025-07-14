import { baseTemplate } from '../layouts/base';

export interface ResetPasswordProps {
  name: string;
  resetUrl: string;
  expiryHours: number;
  clinicName: string;
  clinicLogo?: string;
  doctorName?: string;
}

export const createResetPasswordEmail = ({
  name,
  resetUrl,
  expiryHours,
  clinicName,
  clinicLogo = '',
  doctorName = ''
}: ResetPasswordProps) => {
  const content = `
    <div>
      <p>Reset your password</p>
      
      <p>
        Hi ${name},<br>
        Click the link below to reset your password
      </p>
      
      <p>
        <a href="${resetUrl}" style="color: #111; text-decoration: none;">
          Reset password →
        </a>
      </p>

      <p style="color: #666; font-size: 14px;">
        This link expires in ${expiryHours}h
      </p>
    </div>
  `;

  return baseTemplate({
    content,
    clinicName,
    clinicLogo,
    doctorName
  });
}; 