interface GuideHeroIllustrationProps {
  className?: string;
}

/** 이용안내 페이지 상단 배너용 장식 일러스트 (도시 실루엣 + 주차 표지판 + 주차된 차량) */
export function GuideHeroIllustration({ className = '' }: GuideHeroIllustrationProps) {
  return (
    <svg viewBox="0 0 400 180" fill="none" className={className} role="img" aria-label="주차장 일러스트">
      <rect x="0" y="120" width="400" height="4" fill="#BFDBFE" />

      <g opacity="0.55">
        <rect x="16" y="60" width="26" height="64" rx="2" fill="#93C5FD" />
        <rect x="48" y="40" width="30" height="84" rx="2" fill="#BFDBFE" />
        <rect x="330" y="50" width="28" height="74" rx="2" fill="#BFDBFE" />
        <rect x="362" y="70" width="24" height="54" rx="2" fill="#93C5FD" />
      </g>

      <g stroke="#60A5FA" strokeWidth="6" strokeLinecap="round">
        <path d="M96 124V96" />
        <circle cx="96" cy="86" r="12" fill="#93C5FD" stroke="none" />
      </g>
      <circle cx="96" cy="86" r="18" fill="#DBEAFE" />
      <path d="M88 86h16M96 78v16" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />

      <g stroke="#86EFAC" strokeWidth="5" strokeLinecap="round">
        <path d="M60 124v-20M340 124v-24" />
      </g>
      <circle cx="60" cy="98" r="12" fill="#BBF7D0" />
      <circle cx="340" cy="94" r="14" fill="#BBF7D0" />

      <rect x="178" y="62" width="10" height="62" rx="2" fill="#1D4ED8" />
      <rect x="160" y="34" width="46" height="34" rx="6" fill="#2563EB" />
      <text x="183" y="59" textAnchor="middle" fontSize="26" fontWeight="700" fill="white" fontFamily="sans-serif">
        P
      </text>

      <g transform="translate(120,132)">
        <rect x="0" y="6" width="70" height="22" rx="6" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />
        <rect x="8" y="-6" width="54" height="18" rx="6" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />
        <circle cx="14" cy="28" r="6" fill="#334155" />
        <circle cx="56" cy="28" r="6" fill="#334155" />
      </g>

      <g transform="translate(210,130)">
        <rect x="0" y="8" width="76" height="24" rx="6" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
        <rect x="10" y="-6" width="56" height="20" rx="6" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
        <circle cx="16" cy="32" r="6.5" fill="#334155" />
        <circle cx="60" cy="32" r="6.5" fill="#334155" />
      </g>

      <g transform="translate(300,134)">
        <rect x="0" y="6" width="66" height="20" rx="6" fill="#2563EB" />
        <rect x="8" y="-6" width="48" height="16" rx="6" fill="#2563EB" />
        <circle cx="13" cy="26" r="5.5" fill="#1E293B" />
        <circle cx="53" cy="26" r="5.5" fill="#1E293B" />
      </g>
    </svg>
  );
}
