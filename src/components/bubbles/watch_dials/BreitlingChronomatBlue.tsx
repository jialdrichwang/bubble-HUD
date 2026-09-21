import React from 'react';

interface WatchDialProps {
  now: Date;
  size?: number;
}

export const BreitlingChronomatBlue: React.FC<WatchDialProps> = ({ now }) => {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const ms = now.getMilliseconds();

  const secondDeg = (seconds + ms / 1000) * 6;
  const minuteDeg = (minutes + seconds / 60) * 6;
  const hourDeg = ((hours % 12) + minutes / 60) * 30;

  const monthFormatted = (now.getMonth() + 1).toString().padStart(2, '0');
  const dayFormatted = now.getDate().toString().padStart(2, '0');
  const dateFormatted = `${monthFormatted}.${dayFormatted}`;

  return (
    <div className="relative w-44 h-44 rounded-full flex items-center justify-center pointer-events-none select-none">
      <svg className="w-full h-full" viewBox="0 0 200 200">
        <defs>
          <radialGradient id="chronomatBlueRadial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="45%" stopColor="#1d4ed8" />
            <stop offset="80%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
          <filter id="blueDialShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0.5" dy="1.5" stdDeviation="1" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Circular Dial Surface (No Bezel) */}
        <circle cx="100" cy="100" r="98" fill="url(#chronomatBlueRadial)" stroke="#38bdf8" strokeWidth="0.8" />

        {/* Subtle Horizontal Dial Texture */}
        {Array.from({ length: 24 }).map((_, i) => (
          <line
            key={`groove-${i}`}
            x1="20"
            y1={25 + i * 6.2}
            x2="180"
            y2={25 + i * 6.2}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="0.8"
          />
        ))}

        {/* Precision 60-Second Micro-Tick Chapter Ring on Outermost Edge Touching Metal Frame (用户需求：秒针刻度在钟面边缘最外边缘，贴外面钟面金属框) */}
        <circle cx="100" cy="100" r="97.5" fill="none" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="0.6" />
        <circle cx="100" cy="100" r="92.5" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="0.5" />
        {Array.from({ length: 240 }).map((_, i) => {
          const deg = i * 1.5;
          const isSecond = i % 4 === 0;
          const isFive = i % 20 === 0;
          return (
            <line
              key={`blue-sec-${i}`}
              x1="100"
              y1={isFive ? '8.5' : isSecond ? '6.5' : '4.5'}
              x2="100"
              y2="2.5"
              stroke={isFive ? '#38bdf8' : isSecond ? '#ffffff' : 'rgba(255,255,255,0.3)'}
              strokeWidth={isFive ? '1.2' : isSecond ? '0.7' : '0.35'}
              transform={`rotate(${deg} 100 100)`}
            />
          );
        })}

        {/* User Request: "外边一点60，5，10，15，20，25......55" (Outermost minute/second numerals) */}
        {[60, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((sec, i) => {
          const deg = i * 30;
          const rad = (deg - 90) * (Math.PI / 180);
          const x = 100 + 88.5 * Math.cos(rad);
          const y = 100 + 88.5 * Math.sin(rad) + 1.4;
          return (
            <text
              key={`sec-num-${sec}`}
              x={x}
              y={y}
              fill={sec === 60 ? '#ef4444' : '#7dd3fc'}
              fontSize="3.8"
              fontWeight="600"
              textAnchor="middle"
              fontFamily="monospace, sans-serif"
            >
              {sec.toString()}
            </text>
          );
        })}

        {/* Delicate Separator Circle between outer 60-min ring and inner 12-hour ring */}
        <circle cx="100" cy="100" r="84.5" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" />
        <circle cx="100" cy="100" r="73.5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />

        {/* User Request: "外圈的数字不是24，02，04，而是12，1，2，3，4，5......11" (12-Hour Numerals Ring) */}
        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hr, i) => {
          if (hr === 6) return null; // Keep 6 open for the date window complication
          const deg = i * 30;
          const rad = (deg - 90) * (Math.PI / 180);
          const x = 100 + 78.5 * Math.cos(rad);
          const y = 100 + 78.5 * Math.sin(rad) + 2.0;
          return (
            <text
              key={`hr-num-${hr}`}
              x={x}
              y={y}
              fill={hr === 12 ? '#ffffff' : '#f1f5f9'}
              fontSize="5.6"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              {hr.toString()}
            </text>
          );
        })}

        {/* Breitling Chronomat Text */}
        <g transform="translate(100, 58)">
          <path d="M -12 -3 C -6 -6, 0 0, 0 0 C 0 0, 6 -6, 12 -3 C 8 2, 0 4, 0 4 C 0 4, -8 2, -12 -3 Z" fill="#f59e0b" />
          <text x="0" y="8" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="serif" letterSpacing="1">
            BREITLING
          </text>
          <text x="0" y="14" fill="#93c5fd" fontSize="4" textAnchor="middle" fontFamily="sans-serif" letterSpacing="0.8">
            CHRONOMAT AUTOMATIC
          </text>
        </g>

        {/* Date Window at 6 o'clock position (框长延长以完整显示两位数月份) */}
        <g transform="translate(100, 142)">
          <rect x="-14" y="-6" width="28" height="12" rx="1.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.8" />
          <text x="0" y="2.8" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
            {dateFormatted}
          </text>
        </g>

        {/* Faceted Silver Baton Hour Indices with Luminous Inserts positioned inside the 12-hour ring */}
        {Array.from({ length: 12 }).map((_, i) => {
          if (i === 6) return null; // Date aperture at 6
          const deg = i * 30;
          return (
            <g key={`baton-blue-${i}`} transform={`rotate(${deg} 100 100)`}>
              <rect x="98.5" y="30" width="3" height="11" fill="#e2e8f0" stroke="#0f172a" strokeWidth="0.5" rx="0.5" />
              <rect x="99.2" y="32" width="1.6" height="5" fill="#38bdf8" opacity="0.9" />
            </g>
          );
        })}

        {/* Main Hour Hand */}
        <g transform={`rotate(${hourDeg} 100 100)`} filter="url(#blueDialShadow)">
          <path d="M 98 100 L 98.4 52 L 100 44 L 101.6 52 L 102 100 Z" fill="#f8fafc" stroke="#1e293b" strokeWidth="0.6" />
          <rect x="99" y="55" width="2" height="30" fill="#38bdf8" />
        </g>

        {/* Main Minute Hand */}
        <g transform={`rotate(${minuteDeg} 100 100)`} filter="url(#blueDialShadow)">
          <path d="M 98.2 100 L 98.8 32 L 100 24 L 101.2 32 L 101.8 100 Z" fill="#f8fafc" stroke="#1e293b" strokeWidth="0.6" />
          <rect x="99.1" y="36" width="1.8" height="48" fill="#38bdf8" />
        </g>

        {/* Center Seconds Needle (Reaching outermost ticks) */}
        <g transform={`rotate(${secondDeg} 100 100)`}>
          <line x1="100" y1="120" x2="100" y2="4" stroke="#38bdf8" strokeWidth="0.8" />
          <circle cx="100" cy="22" r="2.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.5" />
          <circle cx="100" cy="116" r="3" fill="#38bdf8" />
        </g>

        {/* Center Cap */}
        <circle cx="100" cy="100" r="3.5" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
        <circle cx="100" cy="100" r="1.5" fill="#ffffff" />
      </svg>
    </div>
  );
};
