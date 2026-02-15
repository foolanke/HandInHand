export interface AvatarConfig {
  skinColor: string;
  eyeStyle: number;
  eyeColor: string;
  mouthStyle: number;
  hairStyle: number;
  hairColor: string;
  accessory: number;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  skinColor: "#D2956C",
  eyeStyle: 0,
  eyeColor: "#3B2214",
  mouthStyle: 0,
  hairStyle: 0,
  hairColor: "#2C1810",
  accessory: 0,
};

// ---- SVG Part Renderers ----

function Head({ color }: { color: string }) {
  return (
    <>
      {/* Face */}
      <ellipse cx="60" cy="62" rx="38" ry="40" fill={color} />
      {/* Ears */}
      <ellipse cx="22" cy="60" rx="8" ry="10" fill={color} />
      <ellipse cx="98" cy="60" rx="8" ry="10" fill={color} />
      {/* Inner ears */}
      <ellipse cx="22" cy="60" rx="4" ry="6" fill={darken(color, 0.15)} />
      <ellipse cx="98" cy="60" rx="4" ry="6" fill={darken(color, 0.15)} />
      {/* Nose */}
      <ellipse cx="60" cy="68" rx="3.5" ry="2.5" fill={darken(color, 0.1)} />
      {/* Cheek blush */}
      <ellipse cx="40" cy="72" rx="7" ry="4" fill="#FF9999" opacity="0.25" />
      <ellipse cx="80" cy="72" rx="7" ry="4" fill="#FF9999" opacity="0.25" />
    </>
  );
}

const EYE_STYLES = [
  // 0: Round
  (color: string) => (
    <>
      <ellipse cx="45" cy="56" rx="6" ry="6.5" fill="white" />
      <ellipse cx="75" cy="56" rx="6" ry="6.5" fill="white" />
      <circle cx="46" cy="56" r="3.5" fill={color} />
      <circle cx="76" cy="56" r="3.5" fill={color} />
      <circle cx="47.5" cy="54.5" r="1.5" fill="white" />
      <circle cx="77.5" cy="54.5" r="1.5" fill="white" />
    </>
  ),
  // 1: Narrow/relaxed
  (color: string) => (
    <>
      <ellipse cx="45" cy="57" rx="7" ry="4.5" fill="white" />
      <ellipse cx="75" cy="57" rx="7" ry="4.5" fill="white" />
      <circle cx="45" cy="57" r="3" fill={color} />
      <circle cx="75" cy="57" r="3" fill={color} />
      <circle cx="46.5" cy="55.5" r="1.2" fill="white" />
      <circle cx="76.5" cy="55.5" r="1.2" fill="white" />
    </>
  ),
  // 2: Happy (curved line)
  (color: string) => (
    <>
      <path d="M38 56 Q45 50 52 56" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M68 56 Q75 50 82 56" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  // 3: Wink
  (color: string) => (
    <>
      <ellipse cx="45" cy="56" rx="6" ry="6.5" fill="white" />
      <circle cx="46" cy="56" r="3.5" fill={color} />
      <circle cx="47.5" cy="54.5" r="1.5" fill="white" />
      <path d="M68 57 Q75 52 82 57" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  // 4: Big sparkly
  (color: string) => (
    <>
      <ellipse cx="45" cy="55" rx="8" ry="8" fill="white" />
      <ellipse cx="75" cy="55" rx="8" ry="8" fill="white" />
      <circle cx="46" cy="55" r="5" fill={color} />
      <circle cx="76" cy="55" r="5" fill={color} />
      <circle cx="48" cy="53" r="2.5" fill="white" />
      <circle cx="78" cy="53" r="2.5" fill="white" />
      <circle cx="44" cy="57" r="1" fill="white" />
      <circle cx="74" cy="57" r="1" fill="white" />
    </>
  ),
];

const MOUTH_STYLES = [
  // 0: Smile
  () => (
    <path d="M50 76 Q60 84 70 76" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round" />
  ),
  // 1: Grin (with teeth)
  () => (
    <>
      <path d="M48 75 Q60 86 72 75" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M50 76 Q60 76 70 76" fill="white" stroke="none" />
    </>
  ),
  // 2: Neutral
  () => (
    <line x1="52" y1="77" x2="68" y2="77" stroke="#8B4513" strokeWidth="2" strokeLinecap="round" />
  ),
  // 3: Open/surprised
  () => (
    <ellipse cx="60" cy="78" rx="6" ry="5" fill="#8B4513" stroke="none" />
  ),
  // 4: Cat mouth
  () => (
    <>
      <path d="M50 76 Q55 80 60 76" stroke="#8B4513" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M60 76 Q65 80 70 76" stroke="#8B4513" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  ),
];

const HAIR_STYLES = [
  // 0: Short
  (color: string) => (
    <>
      <path d="M25 52 Q25 18 60 16 Q95 18 95 52" fill={color} />
      <path d="M28 48 Q28 22 60 20 Q92 22 92 48" fill={color} />
    </>
  ),
  // 1: Long
  (color: string) => (
    <>
      <path d="M25 52 Q25 18 60 16 Q95 18 95 52" fill={color} />
      <path d="M22 55 Q18 80 24 105" stroke={color} strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d="M98 55 Q102 80 96 105" stroke={color} strokeWidth="14" fill="none" strokeLinecap="round" />
    </>
  ),
  // 2: Curly
  (color: string) => (
    <>
      <path d="M25 52 Q25 18 60 16 Q95 18 95 52" fill={color} />
      <circle cx="24" cy="45" r="9" fill={color} />
      <circle cx="96" cy="45" r="9" fill={color} />
      <circle cx="20" cy="58" r="8" fill={color} />
      <circle cx="100" cy="58" r="8" fill={color} />
      <circle cx="22" cy="72" r="7" fill={color} />
      <circle cx="98" cy="72" r="7" fill={color} />
      <circle cx="35" cy="20" r="7" fill={color} />
      <circle cx="60" cy="14" r="8" fill={color} />
      <circle cx="85" cy="20" r="7" fill={color} />
    </>
  ),
  // 3: Spiky
  (color: string) => (
    <>
      <path d="M25 52 Q25 22 60 20 Q95 22 95 52" fill={color} />
      <polygon points="35,30 40,5 48,28" fill={color} />
      <polygon points="52,25 58,2 64,24" fill={color} />
      <polygon points="70,26 78,6 84,30" fill={color} />
      <polygon points="26,48 16,30 32,40" fill={color} />
      <polygon points="94,48 104,30 88,40" fill={color} />
    </>
  ),
  // 4: Bun
  (color: string) => (
    <>
      <path d="M25 52 Q25 18 60 16 Q95 18 95 52" fill={color} />
      <circle cx="60" cy="14" r="14" fill={color} />
    </>
  ),
  // 5: None (bald)
  () => null,
];

const ACCESSORY_STYLES = [
  // 0: None
  () => null,
  // 1: Round glasses
  () => (
    <>
      <circle cx="45" cy="56" r="11" stroke="#333" strokeWidth="2" fill="none" />
      <circle cx="75" cy="56" r="11" stroke="#333" strokeWidth="2" fill="none" />
      <line x1="56" y1="56" x2="64" y2="56" stroke="#333" strokeWidth="2" />
      <line x1="34" y1="54" x2="24" y2="52" stroke="#333" strokeWidth="1.5" />
      <line x1="86" y1="54" x2="96" y2="52" stroke="#333" strokeWidth="1.5" />
    </>
  ),
  // 2: Sunglasses
  () => (
    <>
      <rect x="32" y="48" width="22" height="16" rx="4" fill="#1a1a2e" stroke="#333" strokeWidth="1.5" />
      <rect x="66" y="48" width="22" height="16" rx="4" fill="#1a1a2e" stroke="#333" strokeWidth="1.5" />
      <line x1="54" y1="54" x2="66" y2="54" stroke="#333" strokeWidth="2" />
      <line x1="32" y1="52" x2="22" y2="50" stroke="#333" strokeWidth="1.5" />
      <line x1="88" y1="52" x2="98" y2="50" stroke="#333" strokeWidth="1.5" />
    </>
  ),
  // 3: Headband
  (hairColor: string) => (
    <rect x="22" y="38" width="76" height="6" rx="3" fill={hairColor || "#e74c3c"} opacity="0.9" />
  ),
  // 4: Beanie
  (hairColor: string) => (
    <>
      <path d="M24 46 Q24 20 60 18 Q96 20 96 46" fill={hairColor || "#3498db"} />
      <rect x="22" y="42" width="76" height="8" rx="3" fill={darken(hairColor || "#3498db", 0.15)} />
      <circle cx="60" cy="14" r="5" fill={hairColor || "#3498db"} />
    </>
  ),
];

// Darken a hex color
function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * amount));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}

// ---- Main Preview Component ----

interface AvatarPreviewProps {
  config: AvatarConfig;
  size?: number;
}

export function AvatarPreview({ config, size = 120 }: AvatarPreviewProps) {
  const eyeRenderer = EYE_STYLES[config.eyeStyle] || EYE_STYLES[0];
  const mouthRenderer = MOUTH_STYLES[config.mouthStyle] || MOUTH_STYLES[0];
  const hairRenderer = HAIR_STYLES[config.hairStyle] || HAIR_STYLES[0];
  const accessoryRenderer = ACCESSORY_STYLES[config.accessory] || ACCESSORY_STYLES[0];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hair behind head (long/curly styles) */}
      {config.hairStyle === 1 && hairRenderer(config.hairColor)}
      {config.hairStyle === 2 && hairRenderer(config.hairColor)}

      {/* Head + face */}
      <Head color={config.skinColor} />

      {/* Eyes */}
      {eyeRenderer(config.eyeColor)}

      {/* Mouth */}
      {mouthRenderer(config.hairColor)}

      {/* Hair on top */}
      {config.hairStyle !== 1 && config.hairStyle !== 2 && hairRenderer(config.hairColor)}
      {/* For long/curly, render front hair parts */}
      {(config.hairStyle === 1 || config.hairStyle === 2) && (
        <path d="M25 52 Q25 18 60 16 Q95 18 95 52" fill={config.hairColor} />
      )}

      {/* Accessories */}
      {accessoryRenderer(config.hairColor)}
    </svg>
  );
}

// Export part counts for the builder
export const PART_COUNTS = {
  eyeStyle: EYE_STYLES.length,
  mouthStyle: MOUTH_STYLES.length,
  hairStyle: HAIR_STYLES.length,
  accessory: ACCESSORY_STYLES.length,
};

export const PART_LABELS = {
  eyeStyle: ["Round", "Relaxed", "Happy", "Wink", "Sparkly"],
  mouthStyle: ["Smile", "Grin", "Neutral", "Surprised", "Cat"],
  hairStyle: ["Short", "Long", "Curly", "Spiky", "Bun", "None"],
  accessory: ["None", "Glasses", "Sunglasses", "Headband", "Beanie"],
};
