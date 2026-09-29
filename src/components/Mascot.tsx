"use client";

interface MascotProps {
  size?: number;
  mood?: "happy" | "cheering" | "thinking" | "fire";
  className?: string;
}

export default function Mascot({ size = 80, mood = "happy", className = "" }: MascotProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Feet */}
        <ellipse cx="38" cy="88" rx="9" ry="5" fill="#e58700" />
        <ellipse cx="38" cy="87" rx="8" ry="4" fill="#ff9600" />
        <ellipse cx="62" cy="88" rx="9" ry="5" fill="#e58700" />
        <ellipse cx="62" cy="87" rx="8" ry="4" fill="#ff9600" />

        {/* Body (Duolingo Owl Shape) */}
        <ellipse cx="50" cy="53" rx="36" ry="34" fill="#46a302" />
        <ellipse cx="50" cy="51" rx="35" ry="33" fill="#58cc02" />

        {/* Belly highlight */}
        <ellipse cx="50" cy="62" rx="20" ry="16" fill="#79d81d" />

        {/* Feather details on belly */}
        <path
          d="M44 56 Q50 62 56 56"
          stroke="#46a302"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M42 64 Q50 70 58 64"
          stroke="#46a302"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Wings */}
        {mood === "cheering" ? (
          <>
            {/* Left wing raised */}
            <path
              d="M16 48 C10 32 18 20 25 30 C27 34 26 46 22 52 Z"
              fill="#46a302"
            />
            <path
              d="M18 47 C13 33 20 22 26 31 C28 35 27 45 23 51 Z"
              fill="#58cc02"
            />
            {/* Right wing raised */}
            <path
              d="M84 48 C90 32 82 20 75 30 C73 34 74 46 78 52 Z"
              fill="#46a302"
            />
            <path
              d="M82 47 C87 33 80 22 74 31 C72 35 73 45 77 51 Z"
              fill="#58cc02"
            />
          </>
        ) : (
          <>
            {/* Normal folded wings */}
            <ellipse cx="18" cy="56" rx="6" ry="14" fill="#46a302" transform="rotate(12 18 56)" />
            <ellipse cx="19" cy="55" rx="5.5" ry="13" fill="#58cc02" transform="rotate(12 19 55)" />
            <ellipse cx="82" cy="56" rx="6" ry="14" fill="#46a302" transform="rotate(-12 82 56)" />
            <ellipse cx="81" cy="55" rx="5.5" ry="13" fill="#58cc02" transform="rotate(-12 81 55)" />
          </>
        )}

        {/* Eye Glasses / Rings (Duolingo style) */}
        <circle cx="37" cy="40" r="14" fill="#46a302" />
        <circle cx="37" cy="39" r="13" fill="#ffffff" />
        <circle cx="63" cy="40" r="14" fill="#46a302" />
        <circle cx="63" cy="39" r="13" fill="#ffffff" />

        {/* Pupils */}
        {mood === "cheering" ? (
          <>
            {/* Happy arch eyes ^^ */}
            <path
              d="M30 40 Q37 32 44 40"
              stroke="#2e3842"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M56 40 Q63 32 70 40"
              stroke="#2e3842"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          </>
        ) : (
          <>
            {/* Big cute round pupils with catchlight */}
            <circle cx="40" cy="39" r="7.5" fill="#2e3842" />
            <circle cx="42" cy="37" r="2.5" fill="#ffffff" />
            <circle cx="60" cy="39" r="7.5" fill="#2e3842" />
            <circle cx="62" cy="37" r="2.5" fill="#ffffff" />
          </>
        )}

        {/* Beak */}
        <polygon points="50,43 43,49 57,49" fill="#e58700" />
        <polygon points="50,44 44,49 56,49" fill="#ff9600" />
        <polygon points="50,56 43,49 57,49" fill="#ffc800" />

        {/* Cheeks blush */}
        <ellipse cx="23" cy="46" rx="4" ry="2.5" fill="#ff7da7" opacity="0.6" />
        <ellipse cx="77" cy="46" rx="4" ry="2.5" fill="#ff7da7" opacity="0.6" />

        {/* Optional Fire Crown for streak */}
        {mood === "fire" && (
          <g transform="translate(38, 2) scale(0.65)">
            <path
              d="M18 2 C18 10 24 16 26 22 C30 18 30 12 30 8 C34 14 36 22 34 28 C40 24 42 16 40 10 C46 16 48 26 44 32 C48 30 50 26 50 22 C52 30 48 38 42 42 C34 48 22 48 14 42 C6 36 8 24 12 18 C14 24 16 26 18 24 Z"
              fill="#e58700"
            />
            <path
              d="M18 3 C18 11 24 17 26 23 C30 19 30 13 30 9 C34 15 36 23 34 29 C40 25 42 17 40 11 C46 17 48 27 44 33 C48 31 50 27 50 23 C52 31 48 39 42 43 C34 49 22 49 14 43 C6 37 8 25 12 19 C14 25 16 27 18 25 Z"
              fill="#ff9600"
            />
            <circle cx="28" cy="34" r="8" fill="#ffc800" />
          </g>
        )}
      </svg>
    </div>
  );
}
