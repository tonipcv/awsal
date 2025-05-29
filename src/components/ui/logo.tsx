import Image from 'next/image';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={`relative group ${className || ''}`}>
      <Image 
        src="/logo.png" 
        alt="Logo" 
        width={80} 
        height={26} 
        className="object-contain"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-turquoise/0 via-turquoise/10 to-turquoise/0 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl" />
    </div>
  );
} 