function Steam({ x }: { x: number }) {
  return (
    <path
      d={`M${x} 62 Q${x + 8} 44 ${x} 30 Q${x - 8} 16 ${x} 2`}
      stroke="#fdf6ec"
      strokeWidth="7"
      strokeLinecap="round"
      fill="none"
      opacity="0.85"
    />
  );
}

function CoffeeArt() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <ellipse cx="100" cy="178" rx="58" ry="10" fill="#431407" opacity="0.12" />
      <g transform="translate(78 4)">
        <Steam x={8} />
        <Steam x={28} />
        <Steam x={48} />
      </g>
      <path
        d="M52 76 H150 L140 158 Q137 178 116 178 H86 Q65 178 62 158 Z"
        fill="#efd9b4"
        stroke="#431407"
        strokeWidth="7"
      />
      <path d="M56 92 H146 L142 108 H60 Z" fill="#5b3a22" />
      <path
        d="M150 88 Q186 88 186 116 Q186 144 150 144"
        fill="none"
        stroke="#431407"
        strokeWidth="9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HotChocolateArt() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <ellipse cx="100" cy="178" rx="58" ry="10" fill="#431407" opacity="0.12" />
      <g transform="translate(78 4)">
        <Steam x={8} />
        <Steam x={28} />
        <Steam x={48} />
      </g>
      <path
        d="M52 84 H150 L140 158 Q137 178 116 178 H86 Q65 178 62 158 Z"
        fill="#fdf6ec"
        stroke="#431407"
        strokeWidth="7"
      />
      <path d="M58 96 H144 L141 110 H61 Z" fill="#5c3620" />
      <path
        d="M60 96 Q75 78 100 92 Q125 78 142 96"
        fill="#fdf6ec"
        stroke="#431407"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <circle cx="80" cy="88" r="7" fill="#fff" stroke="#431407" strokeWidth="3" />
      <circle cx="108" cy="82" r="7" fill="#fff" stroke="#431407" strokeWidth="3" />
      <path
        d="M150 92 Q186 92 186 118 Q186 144 150 144"
        fill="none"
        stroke="#431407"
        strokeWidth="9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TeaArt() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <ellipse cx="100" cy="182" rx="64" ry="9" fill="#431407" opacity="0.12" />
      <g transform="translate(82 8)">
        <Steam x={6} />
        <Steam x={26} />
      </g>
      <path d="M132 58 L156 66 Q170 71 166 84 L160 90" fill="none" stroke="#431407" strokeWidth="5" strokeLinecap="round" />
      <rect x="150" y="82" width="20" height="14" rx="3" fill="#e8b04b" stroke="#431407" strokeWidth="4" />
      <path
        d="M46 96 H154 L146 156 Q143 174 122 174 H78 Q57 174 54 156 Z"
        fill="#fdf6ec"
        stroke="#431407"
        strokeWidth="7"
      />
      <path d="M52 110 H148 L145 124 H55 Z" fill="#d8a24a" />
      <ellipse cx="100" cy="174" rx="70" ry="10" fill="none" stroke="#431407" strokeWidth="6" />
    </svg>
  );
}

function ItalianSodaArt() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <ellipse cx="100" cy="182" rx="52" ry="9" fill="#431407" opacity="0.12" />
      <path
        d="M66 54 H134 L126 168 Q124 180 111 180 H89 Q76 180 74 168 Z"
        fill="#fdf6ec"
        stroke="#431407"
        strokeWidth="7"
      />
      <path d="M70 96 L126 96 L120 168 Q118.5 174 111 174 H89 Q81.5 174 80 168 Z" fill="#e8547a" />
      <path d="M70 96 L126 96 L124 110 L72 110 Z" fill="#f27a97" />
      <circle cx="88" cy="126" r="4" fill="#fff" opacity="0.7" />
      <circle cx="108" cy="144" r="3" fill="#fff" opacity="0.6" />
      <circle cx="94" cy="156" r="3.5" fill="#fff" opacity="0.6" />
      <path d="M118 40 L98 150" stroke="#ea7317" strokeWidth="9" strokeLinecap="round" />
      <path d="M118 40 L98 150" stroke="#fdf6ec" strokeWidth="9" strokeLinecap="round" strokeDasharray="10 10" />
      <circle cx="112" cy="46" r="10" fill="#c81d4a" stroke="#431407" strokeWidth="4" />
      <path d="M112 36 Q118 24 128 24" stroke="#3f6b2d" strokeWidth="4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function GenericCupArt() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <ellipse cx="100" cy="178" rx="58" ry="10" fill="#431407" opacity="0.12" />
      <g transform="translate(78 4)">
        <Steam x={8} />
        <Steam x={28} />
        <Steam x={48} />
      </g>
      <path
        d="M52 76 H150 L140 158 Q137 178 116 178 H86 Q65 178 62 158 Z"
        fill="#fdf6ec"
        stroke="#431407"
        strokeWidth="7"
      />
      <path
        d="M150 88 Q186 88 186 116 Q186 144 150 144"
        fill="none"
        stroke="#431407"
        strokeWidth="9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DrinkIllustration({
  name,
  imageUrl,
  className = "",
}: {
  name: string;
  imageUrl?: string | null;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <div className={`overflow-hidden rounded-2xl ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded photos of arbitrary origin */}
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }

  const key = name.toLowerCase();
  let Art = GenericCupArt;
  let bg = "#f3d9ab";

  if (key.includes("chocolate")) {
    Art = HotChocolateArt;
    bg = "#e3a97a";
  } else if (key.includes("tea")) {
    Art = TeaArt;
    bg = "#f0c988";
  } else if (key.includes("soda") || key.includes("italian")) {
    Art = ItalianSodaArt;
    bg = "#f8d3dd";
  } else if (key.includes("coffee")) {
    Art = CoffeeArt;
    bg = "#e8bd85";
  }

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-2xl ${className}`}
      style={{ backgroundColor: bg }}
    >
      <Art />
    </div>
  );
}
