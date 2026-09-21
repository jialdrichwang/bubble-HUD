import React from 'react';

interface SphericalGyroInclinometerProps {
  pitchDeg: number;
  rollDeg: number;
  isCalibrated?: boolean;
}

export const SphericalGyroInclinometer: React.FC<SphericalGyroInclinometerProps> = ({
  pitchDeg,
  rollDeg,
}) => {
  // Clamped values for realistic physical gimbal limits
  const clampedPitch = Math.max(-45, Math.min(45, pitchDeg));
  const clampedRoll = Math.max(-50, Math.min(50, rollDeg));

  // Pitch moves horizon vertically: 1 degree approx 1.1px in a 130px diameter sphere
  const pitchPixelOffset = clampedPitch * 1.15;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center pointer-events-none select-none">
      <svg className="w-full h-full" viewBox="0 0 160 160">
        <defs>
          {/* Sphere Clip Path */}
          <clipPath id="gyroSphereClip">
            <circle cx="80" cy="80" r="54" />
          </clipPath>

          {/* Sky Gradient */}
          <linearGradient id="gyroSkyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          {/* Earth/Ground Gradient */}
          <linearGradient id="gyroEarthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#854d0e" />
            <stop offset="100%" stopColor="#3f1f06" />
          </linearGradient>

          {/* 3D Glass Spherical Convex Shadow & Glare */}
          <radialGradient id="sphereGlare" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="85%" stopColor="rgba(0,0,0,0.3)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.7)" />
          </radialGradient>

          <filter id="aircraftGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* Outer Dial Instrument Bezel Surface */}
        <circle cx="80" cy="80" r="76" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />
        <circle cx="80" cy="80" r="58" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />

        {/* Outer Roll Degree Scale Ticks (-45° to +45°) */}
        {[-45, -30, -20, -10, 0, 10, 20, 30, 45].map((deg) => {
          const isZero = deg === 0;
          const isMajor = deg % 10 === 0;
          return (
            <g key={`roll-tick-${deg}`} transform={`rotate(${deg} 80 80)`}>
              <line
                x1="80"
                y1={isZero ? '60' : isMajor ? '62' : '64'}
                x2="80"
                y2="71"
                stroke={isZero ? '#ef4444' : isMajor ? '#ffffff' : '#94a3b8'}
                strokeWidth={isZero ? '2' : isMajor ? '1.2' : '0.8'}
              />
            </g>
          );
        })}

        {/* Outer Roll Degree Labels */}
        {[-30, -20, -10, 10, 20, 30].map((deg) => {
          const rad = (deg - 90) * (Math.PI / 180);
          const x = 80 + 64 * Math.cos(rad);
          const y = 80 + 64 * Math.sin(rad) + 2.5;
          return (
            <text
              key={`roll-num-${deg}`}
              x={x}
              y={y}
              fill="#cbd5e1"
              fontSize="5"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              {Math.abs(deg)}
            </text>
          );
        })}

        {/* Top Roll Indicator Pointer Triangle at 0° */}
        <polygon points="80,59 76,55 84,55" fill="#ef4444" />

        {/* Central Moving Spherical Gyroscope Attitude Ball */}
        <g clipPath="url(#gyroSphereClip)">
          {/* Inner Rotating & Pitching Horizon Sphere */}
          <g
            transform={`rotate(${-clampedRoll} 80 80) translate(0, ${pitchPixelOffset})`}
            style={{ transition: 'transform 0.08s ease-out' }}
          >
            {/* Upper Sky Hemisphere */}
            <rect x="0" y="-80" width="160" height="160" fill="url(#gyroSkyGrad)" />

            {/* Lower Ground/Earth Hemisphere */}
            <rect x="0" y="80" width="160" height="160" fill="url(#gyroEarthGrad)" />

            {/* Central White Horizon Line */}
            <line x1="10" y1="80" x2="150" y2="80" stroke="#ffffff" strokeWidth="1.6" />

            {/* Sky Pitch Ladder (+10°, +20°, +30°, +40°) */}
            {[10, 20, 30, 40].map((deg) => {
              const y = 80 - deg * 1.15;
              const w = deg % 20 === 0 ? 32 : 18;
              return (
                <g key={`sky-ladder-${deg}`}>
                  <line x1={80 - w / 2} y1={y} x2={80 + w / 2} y2={y} stroke="#ffffff" strokeWidth="1" />
                  <text x={80 - w / 2 - 3} y={y + 2} fill="#ffffff" fontSize="4.5" fontWeight="bold" textAnchor="end">
                    {deg}
                  </text>
                  <text x={80 + w / 2 + 3} y={y + 2} fill="#ffffff" fontSize="4.5" fontWeight="bold" textAnchor="start">
                    {deg}
                  </text>
                </g>
              );
            })}

            {/* Ground Pitch Ladder (-10°, -20°, -30°, -40°) with dashed lines */}
            {[-10, -20, -30, -40].map((deg) => {
              const y = 80 - deg * 1.15;
              const w = Math.abs(deg) % 20 === 0 ? 32 : 18;
              return (
                <g key={`earth-ladder-${deg}`}>
                  <line
                    x1={80 - w / 2}
                    y1={y}
                    x2={80 + w / 2}
                    y2={y}
                    stroke="#fed7aa"
                    strokeWidth="1"
                    strokeDasharray="2 1.5"
                  />
                  <text x={80 - w / 2 - 3} y={y + 2} fill="#fed7aa" fontSize="4.5" fontWeight="bold" textAnchor="end">
                    {Math.abs(deg)}
                  </text>
                  <text x={80 + w / 2 + 3} y={y + 2} fill="#fed7aa" fontSize="4.5" fontWeight="bold" textAnchor="start">
                    {Math.abs(deg)}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Convex Lens 3D Reflection Over Horizon */}
          <circle cx="80" cy="80" r="54" fill="url(#sphereGlare)" pointerEvents="none" />
        </g>

        {/* Center Stationary Aircraft Reference Symbol (Bright Red Wings with Alignment Gap) */}
        <g transform="translate(80, 80)" filter="url(#aircraftGlow)">
          {/* Left Wing */}
          <path d="M -36 -2 L -12 -2 L -12 2 L -28 2 L -28 6 L -36 6 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="0.5" />
          {/* Right Wing */}
          <path d="M 36 -2 L 12 -2 L 12 2 L 28 2 L 28 6 L 36 6 Z" fill="#ef4444" stroke="#991b1b" strokeWidth="0.5" />
          {/* Center Reference Pip Dot */}
          <circle cx="0" cy="0" r="2.5" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
        </g>

        {/* Outer Bezel Rim Ring Highlight */}
        <circle cx="80" cy="80" r="54" fill="none" stroke="#475569" strokeWidth="1.2" />
      </svg>
    </div>
  );
};
