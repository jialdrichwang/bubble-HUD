import React from 'react';

interface WatchDialProps {
  now: Date;
  size?: number;
}

export const IwcPortugieser: React.FC<WatchDialProps> = ({ now }) => {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ms = now.getMilliseconds();

  const secondDeg = (seconds + ms / 1000) * 6;
  const minuteDeg = (minutes + seconds / 60) * 6;
  const hourDeg = ((hours % 12) + minutes / 60) * 30;

  // Sub-dial degrees
  // 1. 12 o'clock: 31-Day Date sub-dial (日期盘: 31天细分小格，标注 10、20、31，整日跳格对准整数)
  const dayOfMonth = now.getDate(); // 1 to 31
  const subDateDeg = (dayOfMonth % 31) * (360 / 31);

  // 2. 6 o'clock: Running small seconds
  const subSecondsDeg = (seconds + ms / 1000) * 6;

  const ARABIC_HOURS = [
    { num: 12, x: 100, y: 35 },
    { num: 1, x: 135, y: 44 },
    { num: 2, x: 160, y: 70 },
    { num: 4, x: 162, y: 132 },
    { num: 5, x: 136, y: 160 },
    { num: 6, x: 100, y: 170 },
    { num: 7, x: 64, y: 160 },
    { num: 8, x: 38, y: 132 },
    { num: 10, x: 40, y: 70 },
    { num: 11, x: 65, y: 44 },
  ];

  return (
    <div className="relative w-44 h-44 rounded-full flex items-center justify-center pointer-events-none select-none">
      <svg className="w-full h-full" viewBox="0 0 200 200">
        <defs>
          <radialGradient id="iwcSilverRadial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </radialGradient>
          <filter id="iwcLeafShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0.5" dy="1.2" stdDeviation="1" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Circular Dial Surface (Surface only, flush to outer metal frame) */}
        <circle cx="100" cy="100" r="98" fill="url(#iwcSilverRadial)" stroke="#cbd5e1" strokeWidth="0.8" />

        {/* Outer Railway Track Minute Chapter Ring on Outermost Edge Touching Metal Frame */}
        <circle cx="100" cy="100" r="97.5" fill="none" stroke="#64748b" strokeWidth="0.8" />
        <circle cx="100" cy="100" r="90" fill="none" stroke="#94a3b8" strokeWidth="0.5" />

        {/* 60-Second Precision Micro-Ticks (用户需求：秒针刻度在钟面边缘最外边缘，贴外面钟面金属框) */}
        {Array.from({ length: 240 }).map((_, i) => {
          const deg = i * 1.5;
          const isSecond = i % 4 === 0;
          const isFiveSec = i % 20 === 0;
          return (
            <line
              key={`iwc-micro-${i}`}
              x1="100"
              y1={isFiveSec ? '10' : isSecond ? '7.5' : '5.5'}
              x2="100"
              y2="2.5"
              stroke={isFiveSec ? '#1d4ed8' : isSecond ? '#475569' : '#94a3b8'}
              strokeWidth={isFiveSec ? '1.2' : isSecond ? '0.7' : '0.35'}
              transform={`rotate(${deg} 100 100)`}
            />
          );
        })}

        {/* 60 Minute Numeral Markers at 5-minute intervals (Just inside the outer edge ticks) */}
        {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map((m, idx) => {
          const deg = (idx + 1) * 30;
          const rad = (deg - 90) * (Math.PI / 180);
          const x = 100 + 84 * Math.cos(rad);
          const y = 100 + 84 * Math.sin(rad) + 2;
          return (
            <text
              key={`iwc-min-${m}`}
              x={x}
              y={y}
              fill="#64748b"
              fontSize="4.5"
              fontWeight="600"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              {m.toString().padStart(2, '0')}
            </text>
          );
        })}

        {/* Brand Inscription: IWC SCHAFFHAUSEN */}
        <g transform="translate(142, 100)">
          <text x="0" y="-3" fill="#1e293b" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="serif" letterSpacing="1">
            IWC
          </text>
          <text x="0" y="4" fill="#64748b" fontSize="3.8" textAnchor="middle" fontFamily="serif" letterSpacing="0.6">
            SCHAFFHAUSEN
          </text>
        </g>

        {/* Left Dial Inscription: CHRONOGRAPH AUTOMATIC */}
        <g transform="translate(58, 100)">
          <text x="0" y="-2" fill="#1e293b" fontSize="4.2" fontWeight="600" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.5">
            CHRONOGRAPH
          </text>
          <text x="0" y="4" fill="#64748b" fontSize="3.5" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.4">
            AUTOMATIC
          </text>
        </g>

        {/* Vertical Twin Sub-Dials */}
        {/* 1. Sub-dial at 12 o'clock (日期盘: 31天细分小格，标注 10、20、31，整日跳格对准整数) */}
        <g transform="translate(100, 60)">
          <circle cx="0" cy="0" r="19" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
          {/* Concentric Guilloché Circles */}
          <circle cx="0" cy="0" r="14" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="9" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
          {/* 31 daily graduation ticks */}
          {Array.from({ length: 31 }).map((_, i) => {
            const deg = i * (360 / 31);
            const isLabeled = i === 0 || i === 10 || i === 20;
            return (
              <line
                key={`iwc-subDate-${i}`}
                x1="0"
                y1="-19"
                x2="0"
                y2={isLabeled ? '-13' : i % 5 === 0 ? '-14.5' : '-16'}
                stroke={isLabeled ? '#1d4ed8' : '#64748b'}
                strokeWidth={isLabeled ? '1' : '0.5'}
                transform={`rotate(${deg})`}
              />
            );
          })}
          <text x="0" y="-8" fill="#1d4ed8" fontSize="4.5" fontWeight="bold" textAnchor="middle">31</text>
          <text
            x={10 * Math.sin((10 * 360 / 31) * Math.PI / 180)}
            y={-10 * Math.cos((10 * 360 / 31) * Math.PI / 180) + 1.5}
            fill="#1d4ed8"
            fontSize="4"
            fontWeight="bold"
            textAnchor="middle"
          >
            10
          </text>
          <text
            x={10 * Math.sin((20 * 360 / 31) * Math.PI / 180)}
            y={-10 * Math.cos((20 * 360 / 31) * Math.PI / 180) + 1.5}
            fill="#1d4ed8"
            fontSize="4"
            fontWeight="bold"
            textAnchor="middle"
          >
            20
          </text>
          {/* Snapped Date Pointer */}
          <line x1="0" y1="3" x2="0" y2="-15" stroke="#1d4ed8" strokeWidth="1" transform={`rotate(${subDateDeg})`} />
          <circle cx="0" cy="0" r="1.5" fill="#1d4ed8" />
        </g>

        {/* 2. Sub-dial at 6 o'clock (Small Seconds) */}
        <g transform="translate(100, 140)">
          <circle cx="0" cy="0" r="19" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
          {/* Concentric Guilloché Circles */}
          <circle cx="0" cy="0" r="14" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="9" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={`iwc-sub6-${i}`}
              x1="0"
              y1="-19"
              x2="0"
              y2={i % 3 === 0 ? '-13' : '-15'}
              stroke="#1d4ed8"
              strokeWidth={i % 3 === 0 ? '1' : '0.5'}
              transform={`rotate(${i * 30})`}
            />
          ))}
          <text x="0" y="-7.5" fill="#1d4ed8" fontSize="4.5" fontWeight="bold" textAnchor="middle">60</text>
          <text x="9.5" y="1.5" fill="#1d4ed8" fontSize="4" textAnchor="middle">20</text>
          <text x="-9.5" y="1.5" fill="#1d4ed8" fontSize="4" textAnchor="middle">40</text>
          <line x1="0" y1="3" x2="0" y2="-15" stroke="#1d4ed8" strokeWidth="1" transform={`rotate(${subSecondsDeg})`} />
          <circle cx="0" cy="0" r="1.5" fill="#1d4ed8" />
        </g>

        {/* Applied Blued Arabic Numerals */}
        {ARABIC_HOURS.map(({ num, x, y }) => (
          <text
            key={`iwc-num-${num}`}
            x={x}
            y={y}
            fill="#1d4ed8"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="serif"
          >
            {num}
          </text>
        ))}

        {/* Blued Feuille (Leaf) Hands */}
        {/* Hour Hand */}
        <g transform={`rotate(${hourDeg} 100 100)`} filter="url(#iwcLeafShadow)">
          <path
            d="M 100 100 C 97 80, 97 60, 100 48 C 103 60, 103 80, 100 100 Z"
            fill="#1d4ed8"
          />
        </g>

        {/* Minute Hand */}
        <g transform={`rotate(${minuteDeg} 100 100)`} filter="url(#iwcLeafShadow)">
          <path
            d="M 100 100 C 97.5 75, 97.5 40, 100 25 C 102.5 40, 102.5 75, 100 100 Z"
            fill="#1d4ed8"
          />
        </g>

        {/* Needle-Thin Blued Chronograph Seconds Hand (Reaching to the outermost tick marks) */}
        <g transform={`rotate(${secondDeg} 100 100)`}>
          <line x1="100" y1="120" x2="100" y2="4" stroke="#1e40af" strokeWidth="0.8" />
          <circle cx="100" cy="116" r="3" fill="#1e40af" />
        </g>

        {/* Center Polished Blue Hub */}
        <circle cx="100" cy="100" r="3.2" fill="#1e40af" stroke="#ffffff" strokeWidth="0.6" />
      </svg>
    </div>
  );
};

