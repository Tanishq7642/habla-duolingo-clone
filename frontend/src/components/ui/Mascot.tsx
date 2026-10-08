import clsx from "clsx";

export type MascotMood = "happy" | "cheer" | "sad" | "think";

interface Props {
  mood?: MascotMood;
  size?: number;
  className?: string;
  float?: boolean;
}

/**
 * "Pip" – Habla's original mascot: a round sprout with two leaves.
 * Pure SVG, no external assets.
 */
export function Mascot({ mood = "happy", size = 96, className, float }: Props) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={`Pip the sprout looks ${mood === "think" ? "thoughtful" : mood}`}
      className={clsx(float && "animate-float", className)}
    >
      {/* shadow */}
      <ellipse cx="60" cy="112" rx="30" ry="5" fill="#000" opacity=".08" />
      {/* stem + leaves */}
      <path d="M60 30 C60 22 60 18 61 12" stroke="#58A700" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M61 16 C48 4 32 8 30 16 C40 22 52 22 61 16Z" fill="#89E219" stroke="#58A700" strokeWidth="3" strokeLinejoin="round" />
      <path d="M61 16 C72 2 90 6 92 14 C82 22 70 22 61 16Z" fill="#58CC02" stroke="#58A700" strokeWidth="3" strokeLinejoin="round" />
      {/* body */}
      <path
        d="M60 28 C88 28 104 50 104 72 C104 96 84 108 60 108 C36 108 16 96 16 72 C16 50 32 28 60 28Z"
        fill="#58CC02"
        stroke="#58A700"
        strokeWidth="4"
      />
      {/* belly */}
      <ellipse cx="60" cy="84" rx="28" ry="20" fill="#D7FFB8" />
      {/* cheeks */}
      <ellipse cx="34" cy="74" rx="7" ry="4.5" fill="#FF7B7F" opacity=".55" />
      <ellipse cx="86" cy="74" rx="7" ry="4.5" fill="#FF7B7F" opacity=".55" />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {mood === "cheer" && (
        <>
          <path d="M14 58 L4 46" stroke="#58A700" strokeWidth="5" strokeLinecap="round" />
          <path d="M106 58 L116 46" stroke="#58A700" strokeWidth="5" strokeLinecap="round" />
        </>
      )}
      {mood === "sad" && <path d="M92 44 q4 8 0 12 q-4 -4 0 -12z" fill="#4DB8F5" />}
    </svg>
  );
}

function Eyes({ mood }: { mood: MascotMood }) {
  if (mood === "cheer") {
    return (
      <g stroke="#1F2A37" strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M38 60 q8 -9 16 0" />
        <path d="M66 60 q8 -9 16 0" />
      </g>
    );
  }
  const lookUp = mood === "think" ? -3 : 0;
  return (
    <g>
      <ellipse cx="46" cy="60" rx="10" ry="12" fill="#fff" stroke="#58A700" strokeWidth="2" />
      <ellipse cx="74" cy="60" rx="10" ry="12" fill="#fff" stroke="#58A700" strokeWidth="2" />
      <circle cx={mood === "think" ? 49 : 47} cy={62 + lookUp} r="5.5" fill="#1F2A37" />
      <circle cx={mood === "think" ? 77 : 73} cy={62 + lookUp} r="5.5" fill="#1F2A37" />
      <circle cx={mood === "think" ? 51 : 49} cy={59 + lookUp} r="2" fill="#fff" />
      <circle cx={mood === "think" ? 79 : 75} cy={59 + lookUp} r="2" fill="#fff" />
      {mood === "sad" && (
        <g stroke="#58A700" strokeWidth="3" strokeLinecap="round">
          <path d="M36 46 L52 50" />
          <path d="M84 46 L68 50" />
        </g>
      )}
    </g>
  );
}

function Mouth({ mood }: { mood: MascotMood }) {
  switch (mood) {
    case "sad":
      return <path d="M50 86 q10 -7 20 0" stroke="#1F2A37" strokeWidth="4" strokeLinecap="round" fill="none" />;
    case "think":
      return <path d="M54 84 h12" stroke="#1F2A37" strokeWidth="4" strokeLinecap="round" />;
    case "cheer":
      return <path d="M46 78 q14 18 28 0 z" fill="#B8262F" stroke="#1F2A37" strokeWidth="3" strokeLinejoin="round" />;
    default:
      return <path d="M49 80 q11 10 22 0" stroke="#1F2A37" strokeWidth="4" strokeLinecap="round" fill="none" />;
  }
}
