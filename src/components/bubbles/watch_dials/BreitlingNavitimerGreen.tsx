import React from 'react';

interface WatchDialProps {
  now: Date;
  size?: number;
}

export const BreitlingNavitimerGreen: React.FC<WatchDialProps> = ({ now }) => {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ms = now.getMilliseconds();

  const secondDeg = (seconds + ms / 1000) * 6;
  const minuteDeg = (minutes + seconds / 60) * 6;
  const hourDeg = ((hours % 12) + minutes / 60) * 30;

  // Sub-dial degrees
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
          {/* Mint Green Sunburst Radial Gradient */}
          <radialGradient id="mintGreenSunburst" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="45%" stopColor="#10b981" />
            <stop offset="80%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </radialGradient>
          <filter id="greenDialShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0.5" dy="1.5" stdDeviation="1" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* Outer Bezel-less Surface: Slim Crisp White Slide Rule Chapter Ring */}
        <circle cx="100" cy="100" r="98" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />

        {/* Expanded Inner Sunburst Mint Green Plate (Maximized so green plate dominates the dial, reducing white edge) */}
        <circle cx="100" cy="100" r="88" fill="url(#mintGreenSunburst)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />

        {/* Outer White Slide Rule Numbers and Ticks (Touching outermost metal frame) */}
        <circle cx="100" cy="100" r="97.5" fill="none" stroke="#64748b" strokeWidth="0.5" />
        <circle cx="100" cy="100" r="90" fill="none" stroke="#94a3b8" strokeWidth="0.6" />

        {/* Slide Rule Graduations on outermost edge (用户需求：秒针刻度在钟面边缘最外边缘，贴外面钟面金属框) */}
        {Array.from({ length: 60 }).map((_, i) => {
          const deg = i * 6;
          const isMajor = i % 5 === 0;
          return (
            <line
              key={`slide-grn-${i}`}
              x1="100"
              y1={isMajor ? '10' : '7.5'}
              x2="100"
              y2="2.5"
              stroke={i === 0 ? '#ef4444' : isMajor ? '#1e293b' : '#64748b'}
              strokeWidth={i === 0 ? '1.4' : isMajor ? '1' : '0.5'}
              transform={`rotate(${deg} 100 100)`}
            />
          );
        })}

        {/* Precision 60-second micro-tick chapter ring on Green Dial surface */}
        <circle cx="100" cy="100" r="89.5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
        <circle cx="100" cy="100" r="82" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" />
        {Array.from({ length: 240 }).map((_, i) => {
          const deg = i * 1.5;
          const isSecond = i % 4 === 0;
          const isFiveSec = i % 20 === 0;
          return (
            <line
              key={`grn-micro-${i}`}
              x1="100"
              y1={isFiveSec ? '18' : isSecond ? '16' : '14'}
              x2="100"
              y2="10.5"
              stroke={isFiveSec ? '#fbbf24' : isSecond ? '#ffffff' : 'rgba(255,255,255,0.5)'}
              strokeWidth={isFiveSec ? '1.1' : isSecond ? '0.7' : '0.35'}
              transform={`rotate(${deg} 100 100)`}
            />
          );
        })}

        {/* Slide Rule Red 60 at 12 o'clock */}
        <text x="100" y="15" fill="#ef4444" fontSize="4.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
          60
        </text>

        {/* Breitling Golden Wings & Heritage Script */}
        <g transform="translate(100, 56) scale(0.65)">
          <path
            d="M -16 -4 C -8 -8, -4 -2, 0 0 C 4 -2, 8 -8, 16 -4 C 10 2, 4 4, 0 8 C -4 4, -10 2, -16 -4 Z"
            fill="#fbbf24"
          />
          <text x="0" y="11" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="serif" letterSpacing="1">
            BREITLING
          </text>
          <text x="0" y="17" fill="#d1fae5" fontSize="4.2" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.8">
            1884 NAVITIMER
          </text>
        </g>

        {/* 3 Silver Sub-Dials */}
        {/* 1. Sub-dial at 3 o'clock (月份盘: 12个月份的小格刻度，最大数12，整月跳格) */}
        <g transform="translate(138, 100)">
          <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
          {/* 12 months ticks */}
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={`grn-subMonth-${i}`}
              x1="0"
              y1="-18"
              x2="0"
              y2={i % 3 === 0 ? '-13' : '-15'}
              stroke="#0f172a"
              strokeWidth={i % 3 === 0 ? '1' : '0.5'}
              transform={`rotate(${i * 30})`}
            />
          ))}
          <text x="0" y="-7.5" fill="#0f172a" fontSize="4.5" fontWeight="bold" textAnchor="middle">12</text>
          <text x="9" y="1.5" fill="#475569" fontSize="4" textAnchor="middle">3</text>
          <text x="0" y="10.5" fill="#475569" fontSize="4" textAnchor="middle">6</text>
          <text x="-9" y="1.5" fill="#475569" fontSize="4" textAnchor="middle">9</text>
          {/* Snapped Month Pointer */}
          <line x1="0" y1="3" x2="0" y2="-14" stroke="#d97706" strokeWidth="0.9" transform={`rotate(${subMonthDeg})`} />
          <circle cx="0" cy="0" r="1.5" fill="#d97706" />
        </g>

        {/* 2. Sub-dial at 6 o'clock (日期盘: 31天细分小格，标注 10、20、31，整日跳格) */}
        <g transform="translate(100, 138)">
          <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
          {/* 31 days ticks */}
          {Array.from({ length: 31 }).map((_, i) => {
            const deg = i * (360 / 31);
            const isLabeled = i === 0 || i === 10 || i === 20;
            return (
              <line
                key={`grn-subDate-${i}`}
                x1="0"
                y1="-18"
                x2="0"
                y2={isLabeled ? '-12.5' : i % 5 === 0 ? '-14' : '-15.5'}
                stroke={isLabeled ? '#ef4444' : '#0f172a'}
                strokeWidth={isLabeled ? '0.9' : '0.45'}
                transform={`rotate(${deg})`}
              />
            );
          })}
          {/* Labeled 31, 10, 20 */}
          <text x="0" y="-7.5" fill="#ef4444" fontSize="4.5" fontWeight="bold" textAnchor="middle">31</text>
          <text
            x={9.5 * Math.sin((10 * 360 / 31) * Math.PI / 180)}
            y={-9.5 * Math.cos((10 * 360 / 31) * Math.PI / 180) + 1.5}
            fill="#0f172a"
            fontSize="4"
            fontWeight="600"
            textAnchor="middle"
          >
            10
          </text>
          <text
            x={9.5 * Math.sin((20 * 360 / 31) * Math.PI / 180)}
            y={-9.5 * Math.cos((20 * 360 / 31) * Math.PI / 180) + 1.5}
            fill="#0f172a"
            fontSize="4"
            fontWeight="600"
            textAnchor="middle"
          >
            20
          </text>
          {/* Snapped Day Pointer */}
          <line x1="0" y1="3" x2="0" y2="-14" stroke="#d97706" strokeWidth="0.9" transform={`rotate(${subDateDeg})`} />
          <circle cx="0" cy="0" r="1.5" fill="#d97706" />
        </g>

        {/* 3. Sub-dial at 9 o'clock (Running Seconds) */}
        <g transform="translate(62, 100)">
          <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={`grn-sub9-${i}`}
              x1="0"
              y1="-18"
              x2="0"
              y2={i % 3 === 0 ? '-13' : '-15'}
              stroke="#0f172a"
              strokeWidth={i % 3 === 0 ? '1' : '0.5'}
              transform={`rotate(${i * 30})`}
            />
          ))}
          <text x="0" y="-7.5" fill="#0f172a" fontSize="4.5" fontWeight="bold" textAnchor="middle">60</text>
          <text x="9" y="1.5" fill="#475569" fontSize="4" textAnchor="middle">20</text>
          <text x="-9" y="1.5" fill="#475569" fontSize="4" textAnchor="middle">40</text>
          <line x1="0" y1="3" x2="0" y2="-14" stroke="#d97706" strokeWidth="0.9" transform={`rotate(${subSecondsDeg})`} />
          <circle cx="0" cy="0" r="1.5" fill="#d97706" />
        </g>

        {/* Rose Gold Faceted Baton Hour Indices */}
        {Array.from({ length: 12 }).map((_, i) => {
          if (i === 0 || i === 3 || i === 6 || i === 9) return null;
          const deg = i * 30;
          return (
            <g key={`baton-grn-${i}`} transform={`rotate(${deg} 100 100)`}>
              <rect x="98.5" y="27" width="3" height="12" fill="#fbbf24" stroke="#b45309" strokeWidth="0.5" rx="0.5" />
              <rect x="99.2" y="28" width="1.6" height="4" fill="#ffffff" opacity="0.9" />
            </g>
          );
        })}

        {/* Rose Gold Hands */}
        {/* Hour Hand */}
        <g transform={`rotate(${hourDeg} 100 100)`} filter="url(#greenDialShadow)">
          <path d="M 98 100 L 98.5 52 L 100 46 L 101.5 52 L 102 100 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="0.5" />
          <rect x="99" y="56" width="2" height="30" fill="#ffffff" />
        </g>

        {/* Minute Hand */}
        <g transform={`rotate(${minuteDeg} 100 100)`} filter="url(#greenDialShadow)">
          <path d="M 98.2 100 L 98.8 33 L 100 26 L 101.2 33 L 101.8 100 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="0.5" />
          <rect x="99.1" y="38" width="1.8" height="46" fill="#ffffff" />
        </g>

        {/* Chronograph Red Seconds Needle (Reaching outermost ticks) */}
        <g transform={`rotate(${secondDeg} 100 100)`}>
          <line x1="100" y1="120" x2="100" y2="5" stroke="#ef4444" strokeWidth="1" />
          <circle cx="100" cy="116" r="3.5" fill="#ef4444" />
          <polygon points="100,4 97.5,10 102.5,10" fill="#ef4444" />
        </g>

        {/* Center Rose Gold Hub */}
        <circle cx="100" cy="100" r="3.5" fill="#b45309" stroke="#f59e0b" strokeWidth="1" />
        <circle cx="100" cy="100" r="1.5" fill="#ffffff" />
      </svg>
    </div>
  );
};

