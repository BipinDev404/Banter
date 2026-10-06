import React from 'react';

export type ClayAvatarId =
  // Male Clay Avatars
  | 'clay_m_beanie'
  | 'clay_m_curly'
  | 'clay_m_sidepart'
  | 'clay_m_curtains'
  | 'clay_m_cap'
  | 'clay_m_dreads'
  | 'clay_m_glasses'
  | 'clay_m_headphones'
  | 'clay_m_buzz'
  | 'clay_m_wavy'
  | 'clay_m_hoodie'
  | 'clay_m_mustache'
  // Female Clay Avatars
  | 'clay_f_bob'
  | 'clay_f_wavy'
  | 'clay_f_bun'
  | 'clay_f_braids'
  | 'clay_f_afro'
  | 'clay_f_pixie'
  | 'clay_f_straight'
  | 'clay_f_hijab'
  | 'clay_f_curly_bob'
  | 'clay_f_ponytail'
  | 'clay_f_beret'
  | 'clay_f_spacebuns'
  // Group Clay Badges
  | 'clay_g_squad'
  | 'clay_g_work'
  | 'clay_g_code'
  | 'clay_g_gaming'
  | 'clay_g_creative'
  | 'clay_g_lounge';

export interface ClayAvatarInfo {
  id: ClayAvatarId;
  name: string;
  gender: 'male' | 'female' | 'group';
  bgColor: string; // Pastel light background color
  description: string;
}

export const CLAY_AVATARS_LIST: ClayAvatarInfo[] = [
  // --- Male Clay Avatars (12) ---
  { id: 'clay_m_beanie', name: 'Leo', gender: 'male', bgColor: '#F5DCD3', description: 'Beanie & Wire Glasses' },
  { id: 'clay_m_curly', name: 'Oliver', gender: 'male', bgColor: '#FAF0CA', description: 'Fluffy Curly Hair' },
  { id: 'clay_m_sidepart', name: 'Lucas', gender: 'male', bgColor: '#E2E8F0', description: 'Side Part & Collar' },
  { id: 'clay_m_curtains', name: 'Ethan', gender: 'male', bgColor: '#FCE7F3', description: 'Swoop Hair & Hoodie' },
  { id: 'clay_m_cap', name: 'Noah', gender: 'male', bgColor: '#D1FAE5', description: 'Baseball Cap' },
  { id: 'clay_m_dreads', name: 'Marcus', gender: 'male', bgColor: '#FEF3C7', description: 'Locs & Teal Sweater' },
  { id: 'clay_m_glasses', name: 'Liam', gender: 'male', bgColor: '#EDE9FE', description: 'Smart Glasses & Fade' },
  { id: 'clay_m_headphones', name: 'Kai', gender: 'male', bgColor: '#FFE4E6', description: 'Studio Headphones' },
  { id: 'clay_m_buzz', name: 'Daniel', gender: 'male', bgColor: '#E0F2FE', description: 'Buzz Cut & Denim' },
  { id: 'clay_m_wavy', name: 'Mateo', gender: 'male', bgColor: '#E6F4EA', description: 'Wavy Flow & Turtleneck' },
  { id: 'clay_m_hoodie', name: 'Ryan', gender: 'male', bgColor: '#FEF9C3', description: 'Messy Fringe & Cobalt Hoodie' },
  { id: 'clay_m_mustache', name: 'Julian', gender: 'male', bgColor: '#F3E8FF', description: 'Mustache & Slicked Hair' },

  // --- Female Clay Avatars (12) ---
  { id: 'clay_f_bob', name: 'Maya', gender: 'female', bgColor: '#FFFBEB', description: 'Bob Cut & Red Glasses' },
  { id: 'clay_f_wavy', name: 'Chloe', gender: 'female', bgColor: '#FCE7F3', description: 'Long Wavy Hair' },
  { id: 'clay_f_bun', name: 'Sophia', gender: 'female', bgColor: '#D1FAE5', description: 'High Bun & Gold Hoops' },
  { id: 'clay_f_braids', name: 'Zoe', gender: 'female', bgColor: '#E0F2FE', description: 'Side Braids & Cap' },
  { id: 'clay_f_afro', name: 'Amara', gender: 'female', bgColor: '#FFEDD5', description: 'Afro Puff & Hoops' },
  { id: 'clay_f_pixie', name: 'Emma', gender: 'female', bgColor: '#EDE9FE', description: 'Pixie & Cat-Eye Glasses' },
  { id: 'clay_f_straight', name: 'Aria', gender: 'female', bgColor: '#FEF3C7', description: 'Long Straight & Headband' },
  { id: 'clay_f_hijab', name: 'Layla', gender: 'female', bgColor: '#FCE7F3', description: 'Silk Hijab & Pearls' },
  { id: 'clay_f_curly_bob', name: 'Isla', gender: 'female', bgColor: '#E6F4EA', description: 'Bouncy Curly Bob' },
  { id: 'clay_f_ponytail', name: 'Nina', gender: 'female', bgColor: '#F3E8FF', description: 'High Ponytail & Glasses' },
  { id: 'clay_f_beret', name: 'Hannah', gender: 'female', bgColor: '#FFE4E6', description: 'French Beret & Bangs' },
  { id: 'clay_f_spacebuns', name: 'Priya', gender: 'female', bgColor: '#E0F2FE', description: 'Double Space Buns' },

  // --- Group Clay Badges (6) ---
  { id: 'clay_g_squad', name: 'Squad', gender: 'group', bgColor: '#E0F2FE', description: 'Friend Group' },
  { id: 'clay_g_work', name: 'Workgroup', gender: 'group', bgColor: '#F3F4F6', description: 'Project Team' },
  { id: 'clay_g_code', name: 'Dev Team', gender: 'group', bgColor: '#D1FAE5', description: 'Coders & Builders' },
  { id: 'clay_g_gaming', name: 'Gamers', gender: 'group', bgColor: '#FCE7F3', description: 'Gaming Hub' },
  { id: 'clay_g_creative', name: 'Studio', gender: 'group', bgColor: '#FFEDD5', description: 'Designers & Creators' },
  { id: 'clay_g_lounge', name: 'Lounge', gender: 'group', bgColor: '#FFE4E6', description: 'Chill Hangout' },
];

interface ClayAvatarSVGProps {
  id: string;
  className?: string;
}

export const ClayAvatarSVG: React.FC<ClayAvatarSVGProps> = ({ id, className = 'w-full h-full' }) => {
  // Common Clay Parameters
  const skinTone = '#EBB298';
  const skinHighlight = '#FADACD';
  const skinShadow = '#D1967F';
  const noseGradientId = `clay_nose_${id.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const renderBaseBodyAndHead = (clothingColor: string, isCollar = false, skinOverride?: string) => {
    const currentSkin = skinOverride || skinTone;
    return (
      <>
        {/* Background light glow */}
        <circle cx="100" cy="100" r="92" fill="white" opacity="0.22" />

        {/* Oversized Left Clay Ear */}
        <circle cx="48" cy="104" r="18" fill={currentSkin} />
        <circle cx="48" cy="104" r="11" fill={skinShadow} opacity="0.35" />

        {/* Oversized Right Clay Ear */}
        <circle cx="152" cy="104" r="18" fill={currentSkin} />
        <circle cx="152" cy="104" r="11" fill={skinShadow} opacity="0.35" />

        {/* Neck */}
        <rect x="88" y="132" width="24" height="28" rx="12" fill={currentSkin} />

        {/* Clothing Bust */}
        <path d="M 52 188 C 52 152, 148 152, 148 188 Z" fill={clothingColor} />
        {isCollar && (
          <>
            <path d="M 86 150 L 100 168 L 78 160 Z" fill="#FFFFFF" opacity="0.9" />
            <path d="M 114 150 L 100 168 L 122 160 Z" fill="#FFFFFF" opacity="0.9" />
          </>
        )}

        {/* Head Sphere */}
        <circle cx="100" cy="98" r="42" fill={currentSkin} />
        {/* Forehead Light Highlight */}
        <ellipse cx="100" cy="74" rx="28" ry="12" fill={skinHighlight} opacity="0.35" />

        {/* Glossy Black Clay Eyes with White Glints */}
        <ellipse cx="80" cy="96" rx="4.5" ry="6.5" fill="#1A1817" />
        <circle cx="82" cy="93" r="1.8" fill="#FFFFFF" />

        <ellipse cx="120" cy="96" rx="4.5" ry="6.5" fill="#1A1817" />
        <circle cx="122" cy="93" r="1.8" fill="#FFFFFF" />

        {/* Eyebrows */}
        <path d="M 72 84 Q 80 80 88 84" stroke="#2B211E" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 112 84 Q 120 80 128 84" stroke="#2B211E" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Iconic 3D Clay Nose */}
        <defs>
          <linearGradient id={noseGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EE907C" />
            <stop offset="100%" stopColor="#D8604B" />
          </linearGradient>
        </defs>
        <rect x="91" y="90" width="18" height="24" rx="9" fill={`url(#${noseGradientId})`} />
        <ellipse cx="97" cy="96" rx="4" ry="7" fill="#FFAAA0" opacity="0.6" />

        {/* Gentle Clay Mouth */}
        <path d="M 90 122 Q 100 127 110 122" stroke="#A85748" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </>
    );
  };

  switch (id) {
    // 1. Male: Leo (Beanie & Wire Glasses)
    case 'clay_m_beanie':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#F5DCD3" />
          {renderBaseBodyAndHead('#212121')}
          <path d="M 58 84 C 58 52, 142 52, 142 84 Z" fill="#2B2929" />
          <rect x="54" y="78" width="92" height="12" rx="6" fill="#1C1B1B" />
          <circle cx="78" cy="96" r="12" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
          <circle cx="122" cy="96" r="12" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
          <line x1="90" y1="96" x2="110" y2="96" stroke="#FFFFFF" strokeWidth="2.5" />
        </svg>
      );

    // 2. Male: Oliver (Fluffy Curly Hair)
    case 'clay_m_curly':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#FAF0CA" />
          <circle cx="70" cy="62" r="18" fill="#3D2319" />
          <circle cx="92" cy="54" r="20" fill="#3D2319" />
          <circle cx="114" cy="54" r="20" fill="#3D2319" />
          <circle cx="134" cy="64" r="18" fill="#3D2319" />
          <circle cx="60" cy="78" r="16" fill="#3D2319" />
          <circle cx="140" cy="78" r="16" fill="#3D2319" />
          {renderBaseBodyAndHead('#EAB308')}
        </svg>
      );

    // 3. Male: Lucas (Side Part & Collar)
    case 'clay_m_sidepart':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#E2E8F0" />
          {renderBaseBodyAndHead('#64748B', true)}
          <path d="M 58 84 C 58 56, 90 52, 110 58 C 130 52, 142 68, 142 84 C 135 72, 110 68, 95 72 C 80 68, 62 76, 58 84 Z" fill="#2D1F1B" />
        </svg>
      );

    // 4. Male: Ethan (Curtains & Hoodie)
    case 'clay_m_curtains':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#FCE7F3" />
          {renderBaseBodyAndHead('#374151')}
          <path d="M 56 86 C 56 50, 100 50, 100 78 C 100 50, 144 50, 144 86 C 130 68, 106 72, 100 84 C 94 72, 70 68, 56 86 Z" fill="#1E1917" />
        </svg>
      );

    // 5. Male: Noah (Baseball Cap)
    case 'clay_m_cap':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#D1FAE5" />
          {renderBaseBodyAndHead('#10B981')}
          <path d="M 56 84 C 56 52, 144 52, 144 84 Z" fill="#047857" />
          <path d="M 50 82 C 80 72, 120 72, 150 82 Z" fill="#065F46" />
        </svg>
      );

    // 6. Male: Marcus (Locs & Teal)
    case 'clay_m_dreads':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#FEF3C7" />
          <rect x="52" y="60" width="10" height="40" rx="5" fill="#241B18" />
          <rect x="64" y="52" width="10" height="45" rx="5" fill="#241B18" />
          <rect x="126" y="52" width="10" height="45" rx="5" fill="#241B18" />
          <rect x="138" y="60" width="10" height="40" rx="5" fill="#241B18" />
          <rect x="76" y="48" width="10" height="30" rx="5" fill="#241B18" />
          <rect x="114" y="48" width="10" height="30" rx="5" fill="#241B18" />
          {renderBaseBodyAndHead('#0D9488')}
        </svg>
      );

    // 7. Male: Liam (Smart Glasses & Short Fade)
    case 'clay_m_glasses':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#EDE9FE" />
          {renderBaseBodyAndHead('#6D28D9')}
          <path d="M 58 80 C 58 56, 142 56, 142 80 C 130 68, 70 68, 58 80 Z" fill="#2A1B18" />
          <rect x="66" y="88" width="26" height="18" rx="6" stroke="#1E293B" strokeWidth="2.5" fill="none" />
          <rect x="108" y="88" width="26" height="18" rx="6" stroke="#1E293B" strokeWidth="2.5" fill="none" />
          <line x1="92" y1="97" x2="108" y2="97" stroke="#1E293B" strokeWidth="2.5" />
        </svg>
      );

    // 8. Male: Kai (Studio Headphones)
    case 'clay_m_headphones':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#FFE4E6" />
          <circle cx="70" cy="62" r="16" fill="#36221D" />
          <circle cx="130" cy="62" r="16" fill="#36221D" />
          {renderBaseBodyAndHead('#F43F5E')}
          {/* Headphones Band & Cups */}
          <path d="M 44 104 C 44 45, 156 45, 156 104" stroke="#1E293B" strokeWidth="6" strokeLinecap="round" fill="none" />
          <rect x="38" y="92" width="16" height="26" rx="8" fill="#3B82F6" />
          <rect x="146" y="92" width="16" height="26" rx="8" fill="#3B82F6" />
        </svg>
      );

    // 9. Male: Daniel (Buzz Cut & Denim)
    case 'clay_m_buzz':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#E0F2FE" />
          {renderBaseBodyAndHead('#0284C7', true, '#DDA185')}
          <path d="M 60 78 C 60 58, 140 58, 140 78 C 130 68, 70 68, 60 78 Z" fill="#3A2823" opacity="0.9" />
        </svg>
      );

    // 10. Male: Mateo (Wavy Flow & Turtleneck)
    case 'clay_m_wavy':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#E6F4EA" />
          {renderBaseBodyAndHead('#059669')}
          <path d="M 54 84 C 54 50, 146 50, 146 84 C 130 66, 110 68, 100 80 C 90 68, 70 66, 54 84 Z" fill="#281A16" />
        </svg>
      );

    // 11. Male: Ryan (Messy Fringe & Cobalt Hoodie)
    case 'clay_m_hoodie':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#FEF9C3" />
          {renderBaseBodyAndHead('#2563EB')}
          <path d="M 56 86 C 56 52, 144 52, 144 86 C 120 70, 80 66, 56 86 Z" fill="#D97706" />
        </svg>
      );

    // 12. Male: Julian (Mustache & Slicked Hair)
    case 'clay_m_mustache':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#F3E8FF" />
          {renderBaseBodyAndHead('#881337', true)}
          <path d="M 58 80 C 58 54, 142 54, 142 80 C 130 66, 70 66, 58 80 Z" fill="#1C1514" />
          {/* Mustache */}
          <path d="M 88 116 Q 100 110 112 116 Q 100 120 88 116 Z" fill="#1C1514" />
        </svg>
      );

    // --- Female Avatars ---

    // 13. Female: Maya (Bob Cut & Red Glasses)
    case 'clay_f_bob':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#FFFBEB" />
          <path d="M 52 80 C 52 50, 148 50, 148 80 L 148 120 C 148 128, 138 128, 138 120 L 138 80 C 138 60, 62 60, 62 80 L 62 120 C 62 128, 52 128, 52 120 Z" fill="#2A1B18" />
          {renderBaseBodyAndHead('#F97316')}
          <path d="M 60 76 C 80 68, 120 68, 140 76 C 130 64, 70 64, 60 76 Z" fill="#2A1B18" />
          <circle cx="78" cy="96" r="12" stroke="#EF4444" strokeWidth="2.5" fill="none" />
          <circle cx="122" cy="96" r="12" stroke="#EF4444" strokeWidth="2.5" fill="none" />
          <line x1="90" y1="96" x2="110" y2="96" stroke="#EF4444" strokeWidth="2.5" />
        </svg>
      );

    // 14. Female: Chloe (Long Wavy Hair)
    case 'clay_f_wavy':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#FCE7F3" />
          <path d="M 50 80 C 40 110, 56 140, 52 165 C 64 165, 66 120, 62 80 Z" fill="#36221D" />
          <path d="M 150 80 C 160 110, 144 140, 148 165 C 136 165, 134 120, 138 80 Z" fill="#36221D" />
          {renderBaseBodyAndHead('#A855F7')}
          <path d="M 58 84 C 58 52, 142 52, 142 84 Z" fill="#EC4899" />
          <rect x="54" y="78" width="92" height="12" rx="6" fill="#DB2777" />
        </svg>
      );

    // 15. Female: Sophia (High Bun & Gold Hoops)
    case 'clay_f_bun':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#D1FAE5" />
          <circle cx="100" cy="44" r="22" fill="#1C1514" />
          {renderBaseBodyAndHead('#059669')}
          <path d="M 58 80 C 80 66, 120 66, 142 80 C 130 64, 70 64, 58 80 Z" fill="#1C1514" />
          <circle cx="48" cy="116" r="6" stroke="#F59E0B" strokeWidth="2" fill="none" />
          <circle cx="152" cy="116" r="6" stroke="#F59E0B" strokeWidth="2" fill="none" />
        </svg>
      );

    // 16. Female: Zoe (Side Braids & Cap)
    case 'clay_f_braids':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#E0F2FE" />
          <rect x="52" y="90" width="10" height="60" rx="5" fill="#2B1E1B" />
          <rect x="138" y="90" width="10" height="60" rx="5" fill="#2B1E1B" />
          {renderBaseBodyAndHead('#2563EB')}
          <path d="M 56 84 C 56 52, 144 52, 144 84 Z" fill="#0284C7" />
          <path d="M 50 82 C 80 72, 120 72, 150 82 Z" fill="#0369A1" />
        </svg>
      );

    // 17. Female: Amara (Afro Puff & Hoops)
    case 'clay_f_afro':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#FFEDD5" />
          <circle cx="100" cy="72" r="46" fill="#211816" />
          {renderBaseBodyAndHead('#E11D48')}
          <circle cx="46" cy="116" r="7" stroke="#F59E0B" strokeWidth="2.2" fill="none" />
          <circle cx="154" cy="116" r="7" stroke="#F59E0B" strokeWidth="2.2" fill="none" />
        </svg>
      );

    // 18. Female: Emma (Pixie & Glasses)
    case 'clay_f_pixie':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#EDE9FE" />
          {renderBaseBodyAndHead('#7C3AED')}
          <path d="M 58 84 C 58 52, 142 52, 142 80 C 130 68, 80 66, 58 84 Z" fill="#2E2421" />
          <circle cx="78" cy="96" r="12" stroke="#4C1D95" strokeWidth="2.5" fill="none" />
          <circle cx="122" cy="96" r="12" stroke="#4C1D95" strokeWidth="2.5" fill="none" />
          <line x1="90" y1="96" x2="110" y2="96" stroke="#4C1D95" strokeWidth="2.5" />
        </svg>
      );

    // 19. Female: Aria (Long Straight & Headband)
    case 'clay_f_straight':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#FEF3C7" />
          <path d="M 48 80 L 48 160 L 64 160 L 64 80 Z" fill="#261C19" />
          <path d="M 136 80 L 136 160 L 152 160 L 152 80 Z" fill="#261C19" />
          {renderBaseBodyAndHead('#F43F5E')}
          <path d="M 54 82 Q 100 70 146 82 Q 100 66 54 82 Z" fill="#3B82F6" />
        </svg>
      );

    // 20. Female: Layla (Silk Hijab & Pearls)
    case 'clay_f_hijab':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#FCE7F3" />
          {renderBaseBodyAndHead('#EC4899')}
          {/* Silk Hijab Envelope */}
          <path d="M 52 88 C 52 46, 148 46, 148 88 L 152 152 C 152 175, 48 175, 48 152 Z" fill="#DB2777" />
          {/* Inner Face Frame Oval */}
          <ellipse cx="100" cy="100" rx="36" ry="40" fill={skinTone} />
          {/* Facial Features */}
          <ellipse cx="82" cy="98" rx="4" ry="6" fill="#1A1817" />
          <ellipse cx="118" cy="98" rx="4" ry="6" fill="#1A1817" />
          <path d="M 92 122 Q 100 126 108 122" stroke="#A85748" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );

    // 21. Female: Isla (Bouncy Curly Bob)
    case 'clay_f_curly_bob':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#E6F4EA" />
          <circle cx="56" cy="76" r="16" fill="#3B231B" />
          <circle cx="144" cy="76" r="16" fill="#3B231B" />
          <circle cx="50" cy="98" r="18" fill="#3B231B" />
          <circle cx="150" cy="98" r="18" fill="#3B231B" />
          {renderBaseBodyAndHead('#10B981')}
          {/* Cute Hair Bow */}
          <path d="M 90 56 L 110 56 L 100 66 Z" fill="#F59E0B" />
        </svg>
      );

    // 22. Female: Nina (High Ponytail & Glasses)
    case 'clay_f_ponytail':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#F3E8FF" />
          <path d="M 125 42 C 145 35, 170 55, 160 85 C 140 75, 130 55, 125 42 Z" fill="#211816" />
          {renderBaseBodyAndHead('#8B5CF6')}
          <path d="M 58 82 C 80 68, 120 68, 142 82 C 130 66, 70 66, 58 82 Z" fill="#211816" />
          <circle cx="78" cy="96" r="12" stroke="#D946EF" strokeWidth="2.5" fill="none" />
          <circle cx="122" cy="96" r="12" stroke="#D946EF" strokeWidth="2.5" fill="none" />
          <line x1="90" y1="96" x2="110" y2="96" stroke="#D946EF" strokeWidth="2.5" />
        </svg>
      );

    // 23. Female: Hannah (French Beret & Bangs)
    case 'clay_f_beret':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#FFE4E6" />
          {renderBaseBodyAndHead('#E11D48', true)}
          <path d="M 54 84 C 54 52, 146 52, 146 84 Z" fill="#241B18" />
          {/* Chic French Beret */}
          <path d="M 42 72 C 40 40, 150 35, 162 65 C 130 68, 60 75, 42 72 Z" fill="#1C1917" />
          <circle cx="105" cy="38" r="4" fill="#1C1917" />
        </svg>
      );

    // 24. Female: Priya (Double Space Buns)
    case 'clay_f_spacebuns':
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#E0F2FE" />
          <circle cx="65" cy="48" r="20" fill="#231715" />
          <circle cx="135" cy="48" r="20" fill="#231715" />
          {renderBaseBodyAndHead('#06B6D4')}
          <path d="M 58 80 C 80 68, 120 68, 142 80 C 130 66, 70 66, 58 80 Z" fill="#231715" />
        </svg>
      );

    // --- Groups (25-30) ---
    case 'clay_g_squad':
    case 'clay_g_work':
    case 'clay_g_code':
    case 'clay_g_gaming':
    case 'clay_g_creative':
    case 'clay_g_lounge':
    default:
      return (
        <svg viewBox="0 0 200 200" className={className}>
          <rect width="200" height="200" rx="48" fill="#E0F2FE" />
          <circle cx="75" cy="105" r="28" fill="#3B82F6" opacity="0.85" />
          <circle cx="125" cy="105" r="28" fill="#8B5CF6" opacity="0.85" />
          <circle cx="100" cy="85" r="32" fill="#06B6D4" />
          <circle cx="100" cy="85" r="14" fill="#FFFFFF" opacity="0.9" />
        </svg>
      );
  }
};
