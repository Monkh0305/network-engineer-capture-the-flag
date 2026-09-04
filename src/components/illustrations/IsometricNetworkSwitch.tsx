import React, { useId } from 'react';

interface IsometricNetworkSwitchProps {
  className?: string;
  showTitle?: boolean;
}

export const IsometricNetworkSwitch: React.FC<IsometricNetworkSwitchProps> = ({
  className = '',
  showTitle = true,
}) => {
  const uid = useId().replace(/:/g, '');
  const gridId = `switch-grid-${uid}`;
  const glowId = `switch-glow-${uid}`;
  const cyanGlowId = `switch-cyan-glow-${uid}`;
  const violetGlowId = `switch-violet-glow-${uid}`;

  return (
    <svg
      viewBox="0 0 560 300"
      className={`network-switch-illustration ${className}`}
      role="img"
      aria-labelledby={`${uid}-title ${uid}-description`}
    >
      <title id={`${uid}-title`}>Network Troubleshooting Switch</title>
      <desc id={`${uid}-description`}>
        ภาพ Network Switch แบบ isometric พร้อมพอร์ตและจุดเชื่อมต่อเครือข่าย
      </desc>

      <defs>
        <pattern id={gridId} width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.15" fill="#64748B" opacity="0.2" />
        </pattern>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.2" />
          <stop offset="55%" stopColor="#3B82F6" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </radialGradient>
        <filter id={cyanGlowId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={violetGlowId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <linearGradient id={`top-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#243247" />
        </linearGradient>
      </defs>

      <rect x="1" y="1" width="558" height="298" rx="24" fill="#0B1220" />
      <rect x="1" y="1" width="558" height="298" rx="24" fill={`url(#${gridId})`} />
      <rect x="1" y="1" width="558" height="298" rx="24" fill="none" stroke="#334155" strokeOpacity="0.55" />

      <ellipse cx="328" cy="179" rx="198" ry="116" fill={`url(#${glowId})`} />
      <ellipse cx="338" cy="202" rx="112" ry="34" fill="#8B5CF6" opacity="0.07" filter={`url(#${violetGlowId})`} />

      {showTitle && (
        <g aria-hidden="true">
          <circle cx="34" cy="42" r="4" fill="#22D3EE" filter={`url(#${cyanGlowId})`} />
          <path d="M45 42H69" stroke="#22D3EE" strokeWidth="1.5" strokeDasharray="4 5" opacity="0.65" />
          <text x="82" y="47" fill="#22D3EE" fontFamily="'Space Grotesk', 'IBM Plex Mono', monospace" fontSize="14" fontWeight="700" letterSpacing="3">
            NETWORK TROUBLESHOOTING
          </text>
        </g>
      )}

      <g aria-hidden="true">
        <path className="network-signal-flow" d="M404 108 C436 65 463 62 487 77" fill="none" stroke="#22D3EE" strokeWidth="1.8" strokeDasharray="6 7" strokeLinecap="round" opacity="0.65" />
        <line x1="487" y1="77" x2="524" y2="98" stroke="#10B981" strokeWidth="1.8" opacity="0.7" />
        <circle cx="487" cy="77" r="11" fill="#22D3EE" opacity="0.08" />
        <circle className="network-node-pulse" cx="487" cy="77" r="5" fill="#22D3EE" filter={`url(#${cyanGlowId})`} />
        <circle cx="524" cy="98" r="9" fill="#10B981" opacity="0.08" />
        <circle className="network-node-pulse network-node-pulse--delay" cx="524" cy="98" r="4" fill="#10B981" />
      </g>

      <g aria-hidden="true">
        <polygon points="278,92 458,157 300,221 120,157" fill={`url(#top-${uid})`} stroke="#22D3EE" strokeWidth="1.7" strokeLinejoin="round" filter={`url(#${cyanGlowId})`} />
        <polygon points="278,92 458,157 300,221 120,157" fill={`url(#top-${uid})`} stroke="#67E8F9" strokeWidth="1.05" strokeLinejoin="round" />
        <path d="M152 157L278 111L426 164" fill="none" stroke="#64748B" strokeWidth="0.8" opacity="0.35" />
        <path d="M185 169L309 124" fill="none" stroke="#64748B" strokeWidth="0.8" opacity="0.26" />
        <path d="M232 188L356 142" fill="none" stroke="#64748B" strokeWidth="0.8" opacity="0.26" />
        <path d="M278 204L402 159" fill="none" stroke="#64748B" strokeWidth="0.8" opacity="0.26" />

        <polygon points="120,157 300,221 300,267 120,203" fill="#1E293B" stroke="#475569" strokeWidth="1.1" />
        <polygon points="300,221 458,157 458,203 300,267" fill="#172033" stroke="#334155" strokeWidth="1.1" />
        <path d="M123 160L297 222" stroke="#38BDF8" strokeWidth="1" opacity="0.38" />
        <path d="M303 222L455 160" stroke="#3B82F6" strokeWidth="1" opacity="0.28" />

        <g>
          <polygon points="145,178 165,185 165,199 145,192" fill="#08101D" stroke="#22D3EE" strokeWidth="1.5" />
          <path d="M150 184L160 188V193L150 189Z" fill="#164E63" />
          <polygon points="174,188 194,195 194,209 174,202" fill="#08101D" stroke="#3B82F6" strokeWidth="1.5" />
          <path d="M179 194L189 198V203L179 199Z" fill="#1E3A8A" />
          <polygon points="203,198 223,205 223,219 203,212" fill="#08101D" stroke="#22D3EE" strokeWidth="1.5" />
          <path d="M208 204L218 208V213L208 209Z" fill="#164E63" />
          <polygon points="232,209 252,216 252,230 232,223" fill="#08101D" stroke="#3B82F6" strokeWidth="1.5" />
          <path d="M237 215L247 219V224L237 220Z" fill="#1E3A8A" />
          <polygon points="261,219 281,226 281,240 261,233" fill="#220E18" stroke="#F43F5E" strokeWidth="1.7" />
          <path d="M266 225L276 229V234L266 230Z" fill="#7F1D1D" />
        </g>

        <circle cx="151" cy="207" r="2.4" fill="#10B981" />
        <circle cx="181" cy="218" r="2.4" fill="#22D3EE" filter={`url(#${cyanGlowId})`} />
        <circle cx="211" cy="228" r="2.4" fill="#10B981" />
        <circle cx="240" cy="239" r="2.4" fill="#38BDF8" />
        <circle className="network-error-led" cx="270" cy="249" r="2.8" fill="#F43F5E" />

        <path d="M329 235L379 215" stroke="#64748B" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
        <circle cx="404" cy="205" r="2.5" fill="#22D3EE" opacity="0.85" />
        <circle cx="417" cy="200" r="2.5" fill="#10B981" opacity="0.85" />
      </g>
    </svg>
  );
};
