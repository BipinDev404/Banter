import React from 'react';

export type ClayAvatarId = string;

export interface Human3DAvatarItem {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'group';
  bgColor: string;
  gradientFrom: string;
  gradientTo: string;
  skinTone: string;
  hairColor: string;
  outfitColor: string;
  style: 'short' | 'long' | 'curly' | 'ponytail' | 'cap' | 'beanie' | 'afro' | 'glasses' | 'group';
  description: string;
}

export const CLAY_AVATARS_LIST: Human3DAvatarItem[] = [
  { id: 'h_alex', name: 'Alex', gender: 'male', bgColor: '#007AFF', gradientFrom: '#007AFF', gradientTo: '#4F46E5', skinTone: '#FFDFC4', hairColor: '#2D3748', outfitColor: '#3B82F6', style: 'short', description: 'Cool techie' },
  { id: 'h_sarah', name: 'Sarah', gender: 'female', bgColor: '#EC4899', gradientFrom: '#EC4899', gradientTo: '#8B5CF6', skinTone: '#FFF0E5', hairColor: '#7C2D12', outfitColor: '#F43F5E', style: 'long', description: 'Friendly listener' },
  { id: 'h_marco', name: 'Marco', gender: 'male', bgColor: '#10B981', gradientFrom: '#10B981', gradientTo: '#059669', skinTone: '#E0A370', hairColor: '#1E293B', outfitColor: '#10B981', style: 'glasses', description: 'Designer' },
  { id: 'h_taylor', name: 'Taylor', gender: 'female', bgColor: '#8B5CF6', gradientFrom: '#8B5CF6', gradientTo: '#6366F1', skinTone: '#FFE5D9', hairColor: '#F59E0B', outfitColor: '#A855F7', style: 'short', description: 'Creator' },
  { id: 'h_dennis', name: 'Dennis', gender: 'male', bgColor: '#F97316', gradientFrom: '#F97316', gradientTo: '#EA580C', skinTone: '#8D5524', hairColor: '#0F172A', outfitColor: '#F97316', style: 'cap', description: 'Gamer' },
  { id: 'h_lisa', name: 'Lisa', gender: 'female', bgColor: '#06B6D4', gradientFrom: '#06B6D4', gradientTo: '#3B82F6', skinTone: '#F0C097', hairColor: '#451A03', outfitColor: '#06B6D4', style: 'ponytail', description: 'Adventurer' },
  { id: 'h_sam', name: 'Sam', gender: 'male', bgColor: '#6366F1', gradientFrom: '#6366F1', gradientTo: '#1E40AF', skinTone: '#D1A176', hairColor: '#1E1B4B', outfitColor: '#4F46E5', style: 'short', description: 'Musician' },
  { id: 'h_maya', name: 'Maya', gender: 'female', bgColor: '#D946EF', gradientFrom: '#D946EF', gradientTo: '#9333EA', skinTone: '#5C3317', hairColor: '#09090B', outfitColor: '#E11D48', style: 'afro', description: 'Artist' },
  { id: 'h_david', name: 'David', gender: 'male', bgColor: '#0EA5E9', gradientFrom: '#0EA5E9', gradientTo: '#2563EB', skinTone: '#FFE0BD', hairColor: '#334155', outfitColor: '#0284C7', style: 'glasses', description: 'Strategist' },
  { id: 'h_chloe', name: 'Chloe', gender: 'female', bgColor: '#F43F5E', gradientFrom: '#F43F5E', gradientTo: '#D946EF', skinTone: '#FFD1BA', hairColor: '#D97706', outfitColor: '#FB7185', style: 'short', description: 'Photographer' },
  { id: 'h_leo', name: 'Leo', gender: 'male', bgColor: '#EF4444', gradientFrom: '#EF4444', gradientTo: '#B91C1C', skinTone: '#FFDFC4', hairColor: '#78350F', outfitColor: '#DC2626', style: 'curly', description: 'Traveler' },
  { id: 'h_zara', name: 'Zara', gender: 'female', bgColor: '#7C3AED', gradientFrom: '#7C3AED', gradientTo: '#4C1D95', skinTone: '#6F3D21', hairColor: '#18181B', outfitColor: '#9333EA', style: 'afro', description: 'Founder' },
  { id: 'h_ryan', name: 'Ryan', gender: 'male', bgColor: '#64748B', gradientFrom: '#64748B', gradientTo: '#334155', skinTone: '#F2C9AC', hairColor: '#1E293B', outfitColor: '#475569', style: 'short', description: 'Developer' },
  { id: 'h_emma', name: 'Emma', gender: 'female', bgColor: '#14B8A6', gradientFrom: '#14B8A6', gradientTo: '#047857', skinTone: '#E5B891', hairColor: '#B45309', outfitColor: '#0D9488', style: 'ponytail', description: 'Explorer' },
  { id: 'h_noah', name: 'Noah', gender: 'male', bgColor: '#EAB308', gradientFrom: '#EAB308', gradientTo: '#D97706', skinTone: '#D09B6A', hairColor: '#1E293B', outfitColor: '#27272A', style: 'beanie', description: 'Skater' },
  { id: 'h_zoe', name: 'Zoe', gender: 'female', bgColor: '#FF8A65', gradientFrom: '#FF8A65', gradientTo: '#E64A19', skinTone: '#FFDFC4', hairColor: '#CA8A04', outfitColor: '#F97316', style: 'curly', description: 'Blogger' },
  { id: 'h_kai', name: 'Kai', gender: 'male', bgColor: '#22C55E', gradientFrom: '#22C55E', gradientTo: '#15803D', skinTone: '#F0C097', hairColor: '#0F172A', outfitColor: '#16A34A', style: 'short', description: 'Athlete' },
  { id: 'h_nina', name: 'Nina', gender: 'female', bgColor: '#FF6B6B', gradientFrom: '#FF6B6B', gradientTo: '#C53030', skinTone: '#C68642', hairColor: '#172554', outfitColor: '#E11D48', style: 'glasses', description: 'Student' },
  { id: 'g_squad', name: 'Banter Squad', gender: 'group', bgColor: '#7E57C2', gradientFrom: '#7E57C2', gradientTo: '#4338CA', skinTone: '#FFDFC4', hairColor: '#1E293B', outfitColor: '#6366F1', style: 'group', description: 'Group Chat' },
  { id: 'g_party', name: 'Party Pack', gender: 'group', bgColor: '#26A69A', gradientFrom: '#26A69A', gradientTo: '#0F766E', skinTone: '#F0C097', hairColor: '#7C2D12', outfitColor: '#14B8A6', style: 'group', description: 'Party Group' },
];

interface ClayAvatarSVGProps {
  clayId: ClayAvatarId | string;
  className?: string;
}

export const ClayAvatarSVG: React.FC<ClayAvatarSVGProps> = ({ clayId, className = 'w-full h-full' }) => {
  const item = CLAY_AVATARS_LIST.find((c) => c.id === clayId) || CLAY_AVATARS_LIST[0];

  return (
    <div
      className={`relative rounded-full flex items-center justify-center overflow-hidden select-none shadow-xs ${className}`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id={`grad-${item.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={item.gradientFrom} />
            <stop offset="100%" stopColor={item.gradientTo} />
          </linearGradient>

          <radialGradient id={`clay-specular-${item.id}`} cx="35%" cy="25%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        {/* 3D Studio Background Circle */}
        <circle cx="50" cy="50" r="50" fill={`url(#grad-${item.id})`} />

        {item.style === 'group' ? (
          /* Clean 3D Group Avatar */
          <g>
            {/* Person Left */}
            <path d="M 12 100 Q 30 70 48 100" fill="#3B82F6" />
            <ellipse cx="30" cy="56" rx="14" ry="16" fill="#FFDFC4" />
            <path d="M 18 52 Q 30 36 42 52 Q 30 42 18 52 Z" fill="#1E293B" />

            {/* Person Right */}
            <path d="M 52 100 Q 70 70 88 100" fill="#EC4899" />
            <ellipse cx="70" cy="56" rx="14" ry="16" fill="#F0C097" />
            <path d="M 58 52 Q 70 36 82 52 Q 70 42 58 52 Z" fill="#7C2D12" />

            {/* Center Person */}
            <path d="M 28 100 Q 50 62 72 100" fill="#8B5CF6" />
            <ellipse cx="50" cy="48" rx="16" ry="18" fill="#FFE0BD" />
            <path d="M 34 42 Q 50 24 66 42 Q 50 32 34 42 Z" fill="#0F172A" />
          </g>
        ) : (
          /* Simple 3D Human Bust */
          <g>
            {/* Torso / Outfit */}
            <path d="M 16 100 Q 50 62 84 100" fill={item.outfitColor} />
            <path d="M 38 72 L 50 86 L 62 72" fill={item.skinTone} />

            {/* Neck */}
            <rect x="42" y="52" width="16" height="22" rx="8" fill={item.skinTone} />

            {/* Ears */}
            <circle cx="26" cy="46" r="4.5" fill={item.skinTone} />
            <circle cx="74" cy="46" r="4.5" fill={item.skinTone} />

            {/* Face Shape */}
            <ellipse cx="50" cy="45" rx="22" ry="25" fill={item.skinTone} />

            {/* Hair / Headwear styles */}
            {item.style === 'cap' && (
              <g>
                <path d="M 24 42 Q 50 18 76 42 Z" fill="#DC2626" />
                <path d="M 20 42 Q 50 36 80 42 L 86 46 Q 50 40 14 46 Z" fill="#B91C1C" />
              </g>
            )}

            {item.style === 'beanie' && (
              <g>
                <path d="M 24 42 Q 50 16 76 42 Z" fill="#1E293B" />
                <rect x="22" y="38" width="56" height="8" rx="4" fill="#334155" />
              </g>
            )}

            {item.style === 'short' && (
              <path d="M 25 42 Q 50 16 75 42 Q 50 28 25 42 Z" fill={item.hairColor} />
            )}

            {item.style === 'long' && (
              <g>
                <path d="M 22 40 Q 50 14 78 40 Q 82 65 74 80 Q 70 50 68 45 Q 50 28 32 45 Q 30 50 26 80 Q 18 65 22 40 Z" fill={item.hairColor} />
              </g>
            )}

            {item.style === 'ponytail' && (
              <g>
                <path d="M 25 40 Q 50 16 75 40 Q 50 28 25 40 Z" fill={item.hairColor} />
                <circle cx="76" cy="30" r="10" fill={item.hairColor} />
              </g>
            )}

            {item.style === 'curly' && (
              <g>
                <circle cx="32" cy="28" r="12" fill={item.hairColor} />
                <circle cx="50" cy="22" r="14" fill={item.hairColor} />
                <circle cx="68" cy="28" r="12" fill={item.hairColor} />
                <circle cx="26" cy="38" r="10" fill={item.hairColor} />
                <circle cx="74" cy="38" r="10" fill={item.hairColor} />
              </g>
            )}

            {item.style === 'afro' && (
              <circle cx="50" cy="38" r="28" fill={item.hairColor} />
            )}

            {item.style === 'glasses' && (
              <path d="M 25 40 Q 50 16 75 40 Q 50 28 25 40 Z" fill={item.hairColor} />
            )}

            {/* Re-apply face on top of afro/curly back layer if needed */}
            {item.style === 'afro' && (
              <ellipse cx="50" cy="47" rx="20" ry="22" fill={item.skinTone} />
            )}

            {/* Eyes */}
            <ellipse cx="40" cy="46" rx="2.8" ry="3.5" fill="#1E293B" />
            <ellipse cx="60" cy="46" rx="2.8" ry="3.5" fill="#1E293B" />
            <circle cx="41" cy="45" r="1" fill="#FFFFFF" />
            <circle cx="61" cy="45" r="1" fill="#FFFFFF" />

            {/* Eyebrows */}
            <path d="M 36 40 Q 40 38 44 40" stroke={item.hairColor} strokeWidth="1.8" strokeLinecap="round" fill="none" />
            <path d="M 56 40 Q 60 38 64 40" stroke={item.hairColor} strokeWidth="1.8" strokeLinecap="round" fill="none" />

            {/* Glasses Frames */}
            {item.style === 'glasses' && (
              <g>
                <circle cx="40" cy="46" r="7.5" stroke="#1E293B" strokeWidth="2.2" fill="none" />
                <circle cx="60" cy="46" r="7.5" stroke="#1E293B" strokeWidth="2.2" fill="none" />
                <line x1="47.5" y1="46" x2="52.5" y2="46" stroke="#1E293B" strokeWidth="2" />
              </g>
            )}

            {/* Nose */}
            <path d="M 50 47 Q 48 51 51 51" stroke="#D1A176" strokeWidth="1.5" strokeLinecap="round" fill="none" />

            {/* Friendly Smile */}
            <path d="M 43 56 Q 50 63 57 56" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </g>
        )}

        {/* 3D Clay Soft Specular Highlight Overlay */}
        <circle cx="50" cy="50" r="50" fill={`url(#clay-specular-${item.id})`} />
      </svg>
    </div>
  );
};
