import React from 'react';
import { cn } from '../lib/utils';

interface ClinicImagePlaceholderProps {
  name: string;
  initials?: string;
  size?: 'sm' | 'lg';
  className?: string;
}

export const ClinicImagePlaceholder: React.FC<ClinicImagePlaceholderProps> = ({ 
  name, 
  initials: customInitials,
  size = 'sm',
  className 
}) => {
  const getInitials = (name: string) => {
    if (customInitials) return customInitials;
    if (!name) return 'IV';
    
    // 1. Split name into words
    let words = name.trim().split(/\s+/);
    
    // Ignore "The", "A", "An" as first word
    if (words.length > 1 && ['the', 'a', 'an'].includes(words[0].toLowerCase())) {
      words = words.slice(1);
    }
    
    // 2. Take first letter of word 1 + first letter of word 2
    const firstInitial = words[0]?.[0] || '';
    const secondInitial = words[1]?.[0] || '';
    
    const initials = (firstInitial + secondInitial).toUpperCase();
    
    // Max 2 characters
    return initials.slice(0, 2);
  };

  const getColor = (name: string) => {
    if (!name) return '#0F6E56';
    const firstChar = name.trim()[0].toUpperCase();
    
    if (firstChar >= 'A' && firstChar <= 'F') return '#0F6E56'; // primary teal
    if (firstChar >= 'G' && firstChar <= 'L') return '#0D5E49'; // darker teal
    if (firstChar >= 'M' && firstChar <= 'R') return '#1A8068'; // lighter teal
    if (firstChar >= 'S' && firstChar <= 'Z') return '#0B4F3D'; // deepest teal
    
    return '#0F6E56';
  };

  const initials = getInitials(name);
  const bgColor = getColor(name);

  return (
    <div 
      className={cn(
        "flex items-center justify-center text-white font-black select-none",
        size === 'lg' ? "w-full h-full text-[72px]" : "w-full h-full text-[40px]",
        className
      )}
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </div>
  );
};
