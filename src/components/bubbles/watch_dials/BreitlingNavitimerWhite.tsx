import React from 'react';

interface WatchDialProps {
  now: Date;
  size?: number;
}

export const BreitlingNavitimerWhite: React.FC<WatchDialProps> = ({ now }) => {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ms = now.getMilliseconds();

  const secondDeg = (seconds + ms / 1000) * 6;
  const minuteDeg = (minutes + seconds / 60) * 6;
  const hourDeg = ((hours % 12) + minutes / 60) * 30;

  // Sub-dial calculations
  // 1. 3 o'clock: 12-Month sub-dial (月份盘), whole-month jump (整月跳格)
  const monthNum = now.getMonth() + 1; // 1 to 12
  const subMonthDeg = (monthNum % 12) * 30; // Integer month snap

  // 2. 6 o'clock: 31-Day Date sub-dial (日期盘), whole-day jump (整日跳格)
  const dayOfMonth = now.getDate(); // 1 to 31
  const subDateDeg = (dayOfMonth % 31) * (360 / 31); // Integer day snap to 31 graduations

  // 3. 9 o'clock: Running small seconds
  const subSecondsDeg = (seconds + ms / 1000) * 6;

  return (
    <div className="relative w-44 h-44 rounded-full flex items-center justify-center pointer-events-none select-none">
      <svg className="w-full h-full" viewBox="0 0 200 200">
        <defs>
          <radialGradient id="navitimerWhiteSunburst" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </radialGradient>
          <filter id="navitimerShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0.5" dy="1" stdDeviation="1" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Dial Face Plate (Pure Circular Surface) */}
        <circle cx="100" cy="100" r="98" fill="url(#navitimerWhiteSunburst)" stroke="#cbd5e1" strokeWidth="1" />

        {/* Outer Circular Slide Rule Scale (60-90-10) with red 60 marker */}
        <circle cx="100" cy="100" r="95" fill="none" stroke="#64748b" strokeWidth="0.6" strokeDasharray="1.5 1.5" />
        <circle cx="100" cy="100" r="88" fill="none" stroke="#94a3b8" strokeWidth="0.8" />
        <circle cx="100" cy="100" r="80" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />

        {/* Slide Rule Graduations */}
        {Array.from({ length: 60 }).map((_, i) => {
          const deg = i * 6;
          const isMajor = i % 5 === 0;
          return (
            <line
              key={`slide-${i}`}
              x1="100"
              y1={isMajor ? '88' : '91'}
              x2="100"
              y2="95"
              stroke={i === 0 ? '#ef4444' : isMajor ? '#1e293b' : '#64748b'}
              strokeWidth={i === 0 ? '1.6' : isMajor ? '1.2' : '0.6'}
              transform={`rotate(${deg} 100 100)`}
            />
          );
        })}

        {/* Precision 60-second micro-tick chapter ring (1/5 second aviation subdivisions) */}
        <circle cx="100" cy="100" r="79" fill="none" stroke="#94a3b8" strokeWidth="0.4" />
        <circle cx="100" cy="100" r="74" fill="none" stroke="#cbd5e1" strokeWidth="0.4" />
        {Array.from({ length: 240 }).map((_, i) => {
          const deg = i * 1.5; // 4 ticks per second (1/4s)
          const isSecond = i % 4 === 0;
          const isFiveSec = i % 20 === 0;
          return (
            <line
              key={`sec-sub-${i}`}
              x1="100"
              y1={isFiveSec ? '74' : isSecond ? '75.5' : '77'}
              x2="100"
              y2="79"
              stroke={isFiveSec ? '#ef4444' : isSecond ? '#1e293b' : '#94a3b8'}
              strokeWidth={isFiveSec ? '1' : isSecond ? '0.7' : '0.35'}
              transform={`rotate(${deg} 100 100)`}
            />
          );
        })}

        {/* Red 60 at 12 o'clock & key slide rule numerals */}
        <text x="100" y="86" fill="#ef4444" fontSize="5.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
          60
        </text>
        <text x="160" y="102" fill="#1e293b" fontSize="5" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">
          15
        </text>
        <text x="100" y="163" fill="#1e293b" fontSize="5" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">
          30
        </text>
        <text x="40" y="102" fill="#1e293b" fontSize="5" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">
          45
        </text>

        {/* Breitling Winged Logo and Brand Name */}
        <g transform="translate(100, 58) scale(0.65)">
          <path
            d="M -16 -4 C -8 -8, -4 -2, 0 0 C 4 -2, 8 -8, 16 -4 C 10 2, 4 4, 0 8 C -4 4, -10 2, -16 -4 Z"
            fill="#d97706"
          />
          <circle cx="0" cy="2" r="3" fill="#f59e0b" />
          <text x="0" y="12" fill="#0f172a" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="serif" letterSpacing="1">
            BREITLING
          </text>
          <text x="0" y="18" fill="#64748b" fontSize="4" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.8">
            CHRONOMETER
          </text>
        </g>

        {/* 3 Chronograph Sub-Dials */}
        {/* 1. Sub-dial at 3 o'clock (月份盘: 12个月份的小格刻度，最大数12，整月跳格) */}
        <g transform="translate(142, 100)">
          <circle cx="0" cy="0" r="19" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.8" />
          {/* 12 months subdivision ticks */}
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={`subMonth-${i}`}
              x1="0"
              y1="-19"
              x2="0"
              y2={i % 3 === 0 ? '-14' : '-16'}
              stroke="#334155"
              strokeWidth={i % 3 === 0 ? '1' : '0.5'}
              transform={`rotate(${i * 30})`}
            />
          ))}
          <text x="0" y="-8.5" fill="#1e293b" fontSize="4.5" fontWeight="bold" textAnchor="middle">12</text>
          <text x="9" y="1.5" fill="#475569" fontSize="4" textAnchor="middle">3</text>
          <text x="0" y="11" fill="#475569" fontSize="4" textAnchor="middle">6</text>
          <text x="-9" y="1.5" fill="#475569" fontSize="4" textAnchor="middle">9</text>
          {/* Snapped Month Pointer */}
          <line x1="0" y1="4" x2="0" y2="-15" stroke="#ef4444" strokeWidth="0.9" transform={`rotate(${subMonthDeg})`} />
          <circle cx="0" cy="0" r="1.5" fill="#ef4444" />
        </g>

        {/* 2. Sub-dial at 6 o'clock (日期盘: 31天细分小格，标注 10、20、31，整日跳格) */}
        <g transform="translate(100, 140)">
          <circle cx="0" cy="0" r="19" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.8" />
          {/* 31 days precision subdivision ticks */}
          {Array.from({ length: 31 }).map((_, i) => {
            const deg = i * (360 / 31);
            const isLabeled = i === 0 || i === 10 || i === 20;
            return (
              <line
                key={`subDate-${i}`}
                x1="0"
                y1="-19"
                x2="0"
                y2={isLabeled ? '-13.5' : i % 5 === 0 ? '-14.5' : '-16'}
                stroke={isLabeled ? '#ef4444' : '#334155'}
                strokeWidth={isLabeled ? '0.9' : '0.45'}
                transform={`rotate(${deg})`}
              />
            );
          })}
          {/* Labeled 31 (at top 0°), 10 (at 116.1°), 20 (at 232.3°) */}
          <text x="0" y="-8.5" fill="#ef4444" fontSize="4.5" fontWeight="bold" textAnchor="middle">31</text>
          <text
            x={10 * Math.sin((10 * 360 / 31) * Math.PI / 180)}
            y={-10 * Math.cos((10 * 360 / 31) * Math.PI / 180) + 1.5}
            fill="#1e293b"
            fontSize="4"
            fontWeight="600"
            textAnchor="middle"
          >
            10
          </text>
          <text
            x={10 * Math.sin((20 * 360 / 31) * Math.PI / 180)}
            y={-10 * Math.cos((20 * 360 / 31) * Math.PI / 180) + 1.5}
            fill="#1e293b"
            fontSize="4"
            fontWeight="600"
            textAnchor="middle"
          >
            20
          </text>
          {/* Snapped Day Pointer */}
          <line x1="0" y1="4" x2="0" y2="-15" stroke="#ef4444" strokeWidth="0.9" transform={`rotate(${subDateDeg})`} />
          <circle cx="0" cy="0" r="1.5" fill="#ef4444" />
        </g>

        {/* 3. Sub-dial at 9 o'clock (Running Seconds) */}
        <g transform="translate(58, 100)">
          <circle cx="0" cy="0" r="19" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.8" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={`sub9-${i}`}
              x1="0"
              y1="-19"
              x2="0"
              y2={i % 3 === 0 ? '-14' : '-16'}
              stroke="#334155"
              strokeWidth={i % 3 === 0 ? '1' : '0.5'}
              transform={`rotate(${i * 30})`}
            />
          ))}
          <text x="0" y="-8" fill="#1e293b" fontSize="4.5" fontWeight="bold" textAnchor="middle">60</text>
          <text x="10" y="2" fill="#475569" fontSize="4" textAnchor="middle">20</text>
          <text x="-10" y="2" fill="#475569" fontSize="4" textAnchor="middle">40</text>
          <line x1="0" y1="4" x2="0" y2="-15" stroke="#334155" strokeWidth="0.9" transform={`rotate(${subSecondsDeg})`} />
          <circle cx="0" cy="0" r="1.5" fill="#334155" />
        </g>

        {/* Date Window at 4:30 position */}
        <g transform="translate(133, 133)">
          <rect x="-8" y="-5" width="16" height="10" rx="1" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
          <text x="0" y="2.5" fill="#0f172a" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
            {dayOfMonth}
          </text>
        </g>

        {/* Faceted Hour Baton Indices (12 hours) */}
        {Array.from({ length: 12 }).map((_, i) => {
          // Skip if covered by 12 o'clock logo or sub-dials
          if (i === 0 || i === 3 || i === 6 || i === 9) return null;
          const deg = i * 30;
          return (
            <g key={`baton-${i}`} transform={`rotate(${deg} 100 100)`}>
              <rect x="98.5" y="26" width="3" height="12" fill="#cbd5e1" stroke="#475569" strokeWidth="0.5" rx="0.5" />
              <rect x="99.2" y="27" width="1.6" height="4" fill="#22c55e" opacity="0.8" />
            </g>
          );
        })}

        {/* Main Watch Hands */}
        {/* Hour Hand */}
        <g transform={`rotate(${hourDeg} 100 100)`} filter="url(#navitimerShadow)">
          <path d="M 98 100 L 98.5 50 L 100 44 L 101.5 50 L 102 100 Z" fill="#334155" stroke="#1e293b" strokeWidth="0.5" />
          <rect x="99" y="55" width="2" height="32" fill="#86efac" />
        </g>

        {/* Minute Hand */}
        <g transform={`rotate(${minuteDeg} 100 100)`} filter="url(#navitimerShadow)">
          <path d="M 98.2 100 L 98.8 32 L 100 24 L 101.2 32 L 101.8 100 Z" fill="#334155" stroke="#1e293b" strokeWidth="0.5" />
          <rect x="99.1" y="38" width="1.8" height="48" fill="#86efac" />
        </g>

        {/* Chronograph Red Needle Seconds Hand with Breitling Anchor / B counterbalance */}
        <g transform={`rotate(${secondDeg} 100 100)`}>
          <line x1="100" y1="120" x2="100" y2="20" stroke="#ef4444" strokeWidth="1" />
          <circle cx="100" cy="116" r="3.5" fill="#ef4444" />
          <polygon points="100,18 97,25 103,25" fill="#ef4444" />
        </g>

        {/* Center Cap */}
        <circle cx="100" cy="100" r="3.5" fill="#1e293b" stroke="#ef4444" strokeWidth="1" />
        <circle cx="100" cy="100" r="1.5" fill="#ffffff" />
      </svg>
    </div>
  );
};

