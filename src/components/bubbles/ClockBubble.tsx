import React, { useState, useEffect, useRef } from 'react';
import { BubbleSettings, Language } from '../../types';
import { BreitlingNavitimerWhite } from './watch_dials/BreitlingNavitimerWhite';
import { BreitlingNavitimerGreen } from './watch_dials/BreitlingNavitimerGreen';
import { BreitlingChronomatBlue } from './watch_dials/BreitlingChronomatBlue';
import { IwcPortugieser } from './watch_dials/IwcPortugieser';

interface ClockBubbleProps {
  settings: BubbleSettings['clock'];
  lang: Language;
  bubbleSize: number;
  gpsTimestamp?: number;
}

const ROMAN_NUMERALS = [
  'XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'
];

export const ClockBubble: React.FC<ClockBubbleProps> = ({
  settings,
  lang,
  bubbleSize,
  gpsTimestamp,
}) => {
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const gpsAnchorRef = useRef<{ gpsTime: number; localPerf: number } | null>(null);

  // Synchronize strictly with GPS satellite atomic time ("时钟泡泡设置自定义时区时严格锁定GPS时间")
  useEffect(() => {
    if (gpsTimestamp) {
      gpsAnchorRef.current = {
        gpsTime: gpsTimestamp,
        localPerf: performance.now(),
      };
    }
  }, [gpsTimestamp]);

  useEffect(() => {
    const timer = setInterval(() => {
      let currentEpochMs: number;
      if (gpsAnchorRef.current) {
        const elapsed = performance.now() - gpsAnchorRef.current.localPerf;
        currentEpochMs = gpsAnchorRef.current.gpsTime + elapsed;
      } else {
        currentEpochMs = Date.now();
      }
      setNowMs(currentEpochMs);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Convert current UTC / GPS / system time according to configured timezone
  // "时钟泡泡设置自定义时区时严格锁定GPS时间"
  // GPS broadcasts UTC atomic standard time. When custom timezone is enabled (e.g. UTC+8),
  // we strictly anchor to the GPS UTC base timestamp and apply the exact offset hours.
  const displayNow = React.useMemo(() => {
    let baseGpsUtcMs = nowMs;
    if (gpsAnchorRef.current) {
      const elapsed = performance.now() - gpsAnchorRef.current.localPerf;
      baseGpsUtcMs = gpsAnchorRef.current.gpsTime + elapsed;
    }

    if (settings.timezoneMode === 'custom' && settings.timezoneOffsetHours !== undefined) {
      // Calculate target UTC epoch: baseGpsUtcMs + offset
      // Shift by local browser getTimezoneOffset so that standard getHours(), getMinutes(),
      // getDate(), getMonth(), getDay() render the exact target timezone:
      const localOffsetMs = new Date().getTimezoneOffset() * 60 * 1000;
      const customOffsetMs = settings.timezoneOffsetHours * 3600 * 1000;
      return new Date(baseGpsUtcMs + localOffsetMs + customOffsetMs);
    }
    return new Date(baseGpsUtcMs);
  }, [nowMs, settings.timezoneMode, settings.timezoneOffsetHours]);

  const timezoneBadge = React.useMemo(() => {
    if (settings.timezoneMode === 'custom' && settings.timezoneOffsetHours !== undefined) {
      const sign = settings.timezoneOffsetHours >= 0 ? '+' : '';
      return settings.timezoneName || `UTC${sign}${settings.timezoneOffsetHours}`;
    }
    const localOffset = -new Date().getTimezoneOffset() / 60;
    const sign = localOffset >= 0 ? '+' : '';
    return lang === 'en' ? `Local (UTC${sign}${localOffset})` : `本地 (UTC${sign}${localOffset})`;
  }, [settings.timezoneMode, settings.timezoneOffsetHours, settings.timezoneName, lang]);

  const hours = displayNow.getHours();
  const minutes = displayNow.getMinutes();
  const seconds = displayNow.getSeconds();
  const milliseconds = displayNow.getMilliseconds();

  // Angular degrees for smooth hands
  const secondDeg = (seconds + milliseconds / 1000) * 6;
  const minuteDeg = (minutes + seconds / 60) * 6;
  const hourDeg = ((hours % 12) + minutes / 60) * 30;

  const hoursDisplay = settings.is24Hour
    ? hours.toString().padStart(2, '0')
    : ((hours % 12) || 12).toString().padStart(2, '0');
  const minutesDisplay = minutes.toString().padStart(2, '0');
  const secondsDisplay = seconds.toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Formatted date string (月日显示 - 延长框长并支持两位数月份)
  const monthNum = displayNow.getMonth() + 1;
  const dayNum = displayNow.getDate();
  const monthStr = monthNum.toString().padStart(2, '0');
  const dayStr = dayNum.toString().padStart(2, '0');
  const weekDaysZh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDaysEn = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const weekStr = lang === 'en' ? weekDaysEn[displayNow.getDay()] : weekDaysZh[displayNow.getDay()];
  const dateStr = lang === 'en' ? `${monthStr}/${dayStr} ${weekStr}` : `${monthStr}月${dayStr}日 ${weekStr}`;

  // Content scale: proportionally scaled so it occupies ~80% of bubble diameter when enlarged
  // "泡泡放大后，里面内容最终放大约占泡泡80%左右"
  const scale = (bubbleSize * 0.80) / 176;

  const style = settings.style || 'roman';
  const showDate = settings.showDate !== false;

  const hasGpsFix = Boolean(gpsTimestamp || gpsAnchorRef.current);

  const renderTimezoneTag = () => {
    if (settings.timezoneMode === 'custom') {
      return (
        <div className="absolute bottom-1.5 px-2 py-0.5 rounded-full bg-black/90 border border-emerald-500/60 text-[7.5px] font-mono text-emerald-300 z-10 pointer-events-none shadow flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-emerald-300 font-bold">GPS锁定</span>
          <span className="text-white/40">·</span>
          <span>{timezoneBadge}</span>
        </div>
      );
    }
    if (hasGpsFix) {
      return (
        <div className="absolute bottom-1.5 px-2 py-0.5 rounded-full bg-black/90 border border-emerald-500/50 text-[7.5px] font-mono text-emerald-300 z-10 pointer-events-none shadow flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>GPS时间</span>
          <span className="text-white/40">·</span>
          <span>{timezoneBadge}</span>
        </div>
      );
    }
    return (
      <div className="absolute bottom-1.5 px-2 py-0.5 rounded-full bg-black/85 border border-slate-700 text-[7.5px] font-mono text-slate-400 z-10 pointer-events-none shadow">
        {timezoneBadge}
      </div>
    );
  };

  // UPLOADED DIAL 1: Breitling Navitimer White (15526423908069.jpg)
  if (style === 'breitling_navitimer_white') {
    return (
      <div
        className="w-full h-full relative flex flex-col items-center justify-center text-center select-none"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >
        <BreitlingNavitimerWhite now={displayNow} />
        {renderTimezoneTag()}
      </div>
    );
  }

  // UPLOADED DIAL 2: Breitling Navitimer Mint Green (16501376553089.jpg.jpg)
  if (style === 'breitling_navitimer_green') {
    return (
      <div
        className="w-full h-full relative flex flex-col items-center justify-center text-center select-none"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >
        <BreitlingNavitimerGreen now={displayNow} />
        {renderTimezoneTag()}
      </div>
    );
  }

  // UPLOADED DIAL 3: Breitling Chronomat GMT Deep Blue (10210817387396618.jpg)
  if (style === 'breitling_chronomat_blue') {
    return (
      <div
        className="w-full h-full relative flex flex-col items-center justify-center text-center select-none"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >
        <BreitlingChronomatBlue now={displayNow} />
        {renderTimezoneTag()}
      </div>
    );
  }

  // UPLOADED DIAL 4: IWC Portugieser Chronograph (9644b9b01e229559.jpg)
  if (style === 'iwc_portugieser') {
    return (
      <div
        className="w-full h-full relative flex flex-col items-center justify-center text-center select-none"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >
        <IwcPortugieser now={displayNow} />
        {renderTimezoneTag()}
      </div>
    );
  }

  // 1. ROMAN CLASSIC CLOCK (罗马钟表)
  if (style === 'roman') {
    return (
      <div
        className="w-full h-full relative flex flex-col items-center justify-center text-center select-none"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >
        {/* Roman Dial Face (180x180 reference box) */}
        <div className="relative w-44 h-44 rounded-full flex items-center justify-center pointer-events-none">
          {/* Railroad Minute Track & Chapter Ring on Outermost Edge Touching Metal Frame */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 180 180">
            {/* Outer and Inner Circle Rings on Outermost Edge */}
            <circle cx="90" cy="90" r="88" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
            <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" />
            <circle cx="90" cy="90" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />

            {/* 60 Minute Chapter Track Marks (用户需求：秒针刻度在钟面边缘最外边缘，贴外面钟面金属框) */}
            {Array.from({ length: 60 }).map((_, i) => {
              const deg = i * 6;
              const isHour = i % 5 === 0;
              return (
                <line
                  key={i}
                  x1="90"
                  y1={isHour ? '10' : '7'}
                  x2="90"
                  y2="2"
                  stroke={isHour ? '#f59e0b' : 'rgba(255,255,255,0.35)'}
                  strokeWidth={isHour ? '1.6' : '0.8'}
                  transform={`rotate(${deg} 90 90)`}
                />
              );
            })}
          </svg>

          {/* 12 Roman Numerals positioned radially */}
          {ROMAN_NUMERALS.map((roman, i) => {
            const angleDeg = i * 30;
            const rad = (angleDeg - 90) * (Math.PI / 180);
            // Radius for Roman numeral text: 64px from center (90, 90)
            const x = 90 + 64 * Math.cos(rad);
            const y = 90 + 64 * Math.sin(rad);

            return (
              <div
                key={roman}
                className="absolute font-serif font-bold text-amber-200/90 text-[10px] tracking-tighter"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {roman}
              </div>
            );
          })}

          {/* Luxury Date Window Complication (月日显示 at bottom - 框长延长以完整显示两位数月份) */}
          {showDate && (
            <div
              className="absolute bottom-9 flex items-center justify-center min-w-[76px] px-2.5 py-0.5 rounded bg-amber-950/70 border border-amber-500/40 shadow-sm z-10"
              style={{ backdropFilter: 'blur(4px)' }}
            >
              <span className="font-mono text-[9px] font-bold text-amber-300 tracking-tight whitespace-nowrap">
                {dateStr}
              </span>
            </div>
          )}

          {/* Brand/Model Subtext */}
          <div className="absolute top-10 flex flex-col items-center">
            <span className="text-[7.5px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
              CHRONOMETER
            </span>
          </div>

          {/* Clock Hands */}
          <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
            {/* Hour Hand (Classic Roman faceted hand) */}
            <div
              className="absolute w-1 bg-gradient-to-t from-amber-400 to-amber-100 rounded-full origin-bottom shadow-lg"
              style={{
                height: '42px',
                bottom: '90px',
                transform: `rotate(${hourDeg}deg)`,
                transition: 'transform 0.05s linear',
              }}
            />

            {/* Minute Hand (Sleek tapered hand) */}
            <div
              className="absolute w-0.5 bg-gradient-to-t from-slate-300 to-white rounded-full origin-bottom shadow-lg"
              style={{
                height: '62px',
                bottom: '90px',
                transform: `rotate(${minuteDeg}deg)`,
                transition: 'transform 0.05s linear',
              }}
            />

            {/* Second Hand (Fine Golden / Red sweep with Breguet balance) */}
            {settings.showSeconds && (
              <div
                className="absolute w-[1.5px] bg-red-500 origin-bottom shadow-md"
                style={{
                  height: '70px',
                  bottom: '90px',
                  transform: `rotate(${secondDeg}deg)`,
                }}
              >
                {/* Counterbalance tail */}
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 absolute -bottom-2 -left-[2px]" />
              </div>
            )}

            {/* Center Cap Pin */}
            <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-900 z-20 shadow" />
          </div>
        </div>
        {renderTimezoneTag()}
      </div>
    );
  }

  // 2. AVIATOR CHRONO (经典航空时钟)
  if (style === 'aviator') {
    const dayOfWeekShort = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][displayNow.getDay()];
    const aviatorDateStr = `${monthStr}.${dayStr} ${dayOfWeekShort}`;

    return (
      <div
        className="w-full h-full relative flex flex-col items-center justify-center text-center select-none"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >
        <div className="relative w-44 h-44 rounded-full flex items-center justify-center pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 200 200">
            <defs>
              {/* 3D Depth Shadow for Hands */}
              <filter id="aviatorHand3D" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="1" dy="2.5" stdDeviation="1.8" floodColor="#000000" floodOpacity="0.65" />
              </filter>
              {/* Luminous Green Glow Filter */}
              <filter id="greenNightGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#22c55e" floodOpacity="0.9" />
              </filter>
              {/* Red Tip Glow Filter */}
              <filter id="redTipGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#ef4444" floodOpacity="0.95" />
              </filter>
              {/* Metallic Red Linear Gradient */}
              <linearGradient id="metallicRed" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#b91c1c" />
                <stop offset="35%" stopColor="#ef4444" />
                <stop offset="55%" stopColor="#f87171" />
                <stop offset="70%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#991b1b" />
              </linearGradient>
              {/* Mirror Silver Facet Gradient */}
              <linearGradient id="mirrorSilverLeft" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="40%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
              <linearGradient id="mirrorSilverRight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
            </defs>

            {/* Dial Background Plate */}
            <circle cx="100" cy="100" r="98" fill="#090d16" stroke="#1e293b" strokeWidth="1" />
            <circle cx="100" cy="100" r="97.5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
            <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />

            {/* Outer 60-Minute Ticks on Outermost Edge Touching Metal Frame (用户需求：秒针刻度在钟面边缘最外边缘，贴外面钟面金属框) */}
            {Array.from({ length: 60 }).map((_, i) => {
              const deg = i * 6;
              const isMajor = i % 5 === 0;
              const isCardinal = i % 15 === 0;
              if (isCardinal) return null; // Replaced by luminous markers
              return (
                <line
                  key={`aviator-tick-${i}`}
                  x1="100"
                  y1={isMajor ? '10' : '6.5'}
                  x2="100"
                  y2="2.5"
                  stroke={isMajor ? '#f59e0b' : 'rgba(255,255,255,0.3)'}
                  strokeWidth={isMajor ? '1.5' : '0.8'}
                  transform={`rotate(${deg} 100 100)`}
                />
              );
            })}

            {/* Enhanced Luminous Green Night Markers at 12, 3, 6, 9 positions on Outermost Edge */}
            {/* 12 o'clock Aviation Dual Dot Triangle */}
            <g transform="translate(100, 11)" filter="url(#greenNightGlow)">
              <polygon points="0,-3 -4,4 4,4" fill="#4ade80" />
              <circle cx="-6" cy="1" r="1.3" fill="#4ade80" />
              <circle cx="6" cy="1" r="1.3" fill="#4ade80" />
            </g>
            {/* 3 o'clock Luminous Bar */}
            <rect x="188" y="98.5" width="8" height="3" rx="1" fill="#4ade80" filter="url(#greenNightGlow)" />
            {/* 6 o'clock Luminous Bar */}
            <rect x="98.5" y="188" width="3" height="8" rx="1" fill="#4ade80" filter="url(#greenNightGlow)" />
            {/* 9 o'clock Luminous Bar */}
            <rect x="4" y="98.5" width="8" height="3" rx="1" fill="#4ade80" filter="url(#greenNightGlow)" />

            {/* Prominent High-Contrast Numerals 12, 3, 6, 9 with Green Luminescent Tint */}
            <text x="100" y="32" fill="#f8fafc" fontSize="15" fontWeight="900" textAnchor="middle" fontFamily="monospace" filter="url(#greenNightGlow)">
              12
            </text>
            <text x="168" y="105" fill="#f8fafc" fontSize="14" fontWeight="900" textAnchor="middle" fontFamily="monospace" filter="url(#greenNightGlow)">
              3
            </text>
            <text x="100" y="174" fill="#f8fafc" fontSize="14" fontWeight="900" textAnchor="middle" fontFamily="monospace" filter="url(#greenNightGlow)">
              6
            </text>
            <text x="32" y="105" fill="#f8fafc" fontSize="14" fontWeight="900" textAnchor="middle" fontFamily="monospace" filter="url(#greenNightGlow)">
              9
            </text>

            {/* 全新动态日期显示: 3 点钟数字内侧加入小字号，绿色夜光滤镜，框长延长以完整显示两位数月份 (如 10.21 mon) */}
            {showDate && (
              <g transform="translate(133, 100)" filter="url(#greenNightGlow)">
                <rect x="-24" y="-7" width="48" height="14" rx="2.5" fill="#042f1a" stroke="#22c55e" strokeWidth="0.8" opacity="0.9" />
                <text
                  x="0"
                  y="3.2"
                  fill="#4ade80"
                  fontSize="6.8"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                  letterSpacing="0.4"
                >
                  {aviatorDateStr}
                </text>
              </g>
            )}

            {/* Instrument Brand / Type */}
            <text x="100" y="66" fill="#94a3b8" fontSize="4.8" fontWeight="600" textAnchor="middle" fontFamily="sans-serif" letterSpacing="1.5">
              MIL-SPEC CHRONO
            </text>

            {/* Digital Time Readout at 6 o'clock */}
            <g transform="translate(100, 138)">
              <rect x="-20" y="-7" width="40" height="13" rx="2" fill="#0f172a" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6" />
              <text x="0" y="2.5" fill="#94a3b8" fontSize="6.8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                {hoursDisplay}:{minutesDisplay}
              </text>
            </g>

            {/* 指针美化: 多段高光、镜面银光泽、金属漆红色、3D 厚度阴影 */}
            {/* 1. Hour Hand (Faceted 3D Sword Hand) */}
            <g transform={`rotate(${hourDeg} 100 100)`} filter="url(#aviatorHand3D)">
              {/* Left facet */}
              <polygon points="100,100 96.5,95 97.5,50 100,42" fill="url(#mirrorSilverLeft)" stroke="#334155" strokeWidth="0.4" />
              {/* Right facet */}
              <polygon points="100,100 103.5,95 102.5,50 100,42" fill="url(#mirrorSilverRight)" stroke="#334155" strokeWidth="0.4" />
              {/* Central Green Luminous Inlay */}
              <rect x="98.7" y="52" width="2.6" height="34" rx="1.2" fill="#4ade80" filter="url(#greenNightGlow)" />
            </g>

            {/* 2. Minute Hand (Extended 3D Sword Hand) */}
            <g transform={`rotate(${minuteDeg} 100 100)`} filter="url(#aviatorHand3D)">
              {/* Left facet */}
              <polygon points="100,100 97,95 98,32 100,22" fill="url(#mirrorSilverLeft)" stroke="#334155" strokeWidth="0.4" />
              {/* Right facet */}
              <polygon points="100,100 103,95 102,32 100,22" fill="url(#mirrorSilverRight)" stroke="#334155" strokeWidth="0.4" />
              {/* Central Green Luminous Inlay */}
              <rect x="98.7" y="32" width="2.6" height="52" rx="1.2" fill="#4ade80" filter="url(#greenNightGlow)" />
            </g>

            {/* 3. Second Hand (用户要求：针尖三角形为红色荧光保留高光白点；中间整根针杆与尾部配重设为清晰可见的绿色荧光) */}
            {settings.showSeconds && (
              <g transform={`rotate(${secondDeg} 100 100)`}>
                {/* 3D Depth Drop Shadow Layer */}
                <g opacity="0.45" transform="translate(1, 2)">
                  <line x1="100" y1="122" x2="100" y2="8.5" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx="100" cy="116" r="3.6" fill="#000000" />
                  <polygon points="100,1.8 96.2,8.5 103.8,8.5" fill="#000000" />
                </g>

                {/* Second Hand Stem Glow Layer (Green Fluorescent Halo / 绿色荧光外发光) */}
                <line
                  x1="100"
                  y1="122"
                  x2="100"
                  y2="8.5"
                  stroke="#22c55e"
                  strokeWidth="3.4"
                  strokeOpacity="0.5"
                  strokeLinecap="round"
                />

                {/* Second Hand Solid Main Stem (Clear Crisp Fluorescent Green / 绿色荧光主针杆，清晰显眼) */}
                <line
                  x1="100"
                  y1="122"
                  x2="100"
                  y2="8.5"
                  stroke="#4ade80"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                {/* Inner bright highlight core for maximum clarity and visibility */}
                <line
                  x1="100"
                  y1="118"
                  x2="100"
                  y2="10"
                  stroke="#bbf7d0"
                  strokeWidth="0.8"
                />

                {/* Tail Counterbalance in Green Fluorescent (尾部配重绿色荧光) */}
                <circle cx="100" cy="116" r="4.2" fill="#14532d" stroke="#4ade80" strokeWidth="1.4" />
                <circle cx="100" cy="116" r="2.2" fill="#4ade80" />
                <circle cx="100" cy="116" r="0.8" fill="#ffffff" />

                {/* Needle Tip Arrow Triangle: RED FLUORESCENT (用户需求: "这个三角形还是红色荧光，针尖三角形保留与高光白点") */}
                <polygon
                  points="100,1.8 96.2,8.5 103.8,8.5"
                  fill="#ef4444"
                  stroke="#fca5a5"
                  strokeWidth="0.8"
                />
                {/* Red luminous inner facet */}
                <polygon
                  points="100,3.2 97.6,7.8 102.4,7.8"
                  fill="#dc2626"
                />
                {/* High-visibility White Dot Indicator */}
                <circle cx="100" cy="6.8" r="1.2" fill="#ffffff" />
              </g>
            )}

            {/* Center Cap Hub (Faceted Multi-Ring) */}
            <circle cx="100" cy="100" r="4.5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.2" />
            <circle cx="100" cy="100" r="2.2" fill="#22c55e" />
            <circle cx="100" cy="100" r="1" fill="#ffffff" />
          </svg>
        </div>
        {renderTimezoneTag()}
      </div>
    );
  }

  // 3. CYBER HUD CHRONO
  if (style === 'cyber') {
    return (
      <div
        className="w-full h-full relative flex flex-col items-center justify-center text-center select-none"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >
        <div className="text-[9px] font-mono text-red-400 font-bold tracking-widest uppercase mb-1">
          CYBER CHRONO
        </div>

        {/* Circular Seconds Progress */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="rgba(239, 68, 68, 0.15)"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#ef4444"
              strokeWidth="4"
              strokeDasharray="276"
              strokeDashoffset={276 - (276 * (seconds + milliseconds / 1000)) / 60}
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center">
            <div className="font-mono font-black text-white text-2xl drop-shadow leading-none">
              {hoursDisplay}:{minutesDisplay}
            </div>
            <div className="text-xs font-mono text-red-400 font-bold mt-0.5">
              {secondsDisplay}s
            </div>
            {showDate && (
              <div className="mt-1 px-1.5 py-0.5 rounded bg-red-950/70 border border-red-500/40 text-[9px] font-mono text-red-200">
                {dateStr}
              </div>
            )}
          </div>
        </div>
        {renderTimezoneTag()}
      </div>
    );
  }

  // 4. DIGITAL CHRONO
  if (style === 'digital') {
    return (
      <div
        className="w-full h-full relative flex flex-col items-center justify-center text-center select-none"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
      >
        <div className="text-[10px] font-bold text-red-300 tracking-wider mb-1">
          {lang === 'en' ? 'TIME' : lang === 'zh' ? '数字时钟' : '时间 clock'}
        </div>
        <div className="flex flex-col items-center justify-center my-1">
          <div className="font-mono font-black text-white text-3xl tracking-tight drop-shadow-md leading-none">
            {hoursDisplay}:{minutesDisplay}
            {settings.showSeconds && (
              <span className="text-red-400 text-xl ml-1">:{secondsDisplay}</span>
            )}
          </div>
          {!settings.is24Hour && (
            <div className="text-xs font-mono font-semibold text-red-300 mt-1">
              {ampm}
            </div>
          )}
          {showDate && (
            <div className="mt-2 px-2 py-0.5 rounded-md bg-red-950/60 border border-red-500/30 text-[11px] font-mono font-semibold text-red-200">
              {dateStr}
            </div>
          )}
        </div>
        {renderTimezoneTag()}
      </div>
    );
  }

  // 5. MINIMAL BAUHAUS
  return (
    <div
      className="w-full h-full relative flex flex-col items-center justify-center text-center select-none"
      style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
    >
      <div className="relative w-44 h-44 rounded-full flex items-center justify-center pointer-events-none">
        {/* Clean Tick Marks on Outermost Edge Touching Metal Frame (用户需求：秒针刻度在钟面边缘最外边缘，贴外面钟面金属框) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
          {Array.from({ length: 12 }).map((_, i) => {
            const deg = i * 30;
            return (
              <line
                key={i}
                x1="50"
                y1={i % 3 === 0 ? '8' : '5.5'}
                x2="50"
                y2="2"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth={i % 3 === 0 ? '2' : '1'}
                transform={`rotate(${deg} 50 50)`}
              />
            );
          })}
        </svg>

        {showDate && (
          <div className="absolute bottom-8 px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-[9px] font-mono text-slate-200 z-10">
            {dateStr}
          </div>
        )}

        {/* Hands */}
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
          <div
            className="absolute w-1 bg-white rounded-full origin-bottom shadow-md"
            style={{ height: '36px', bottom: '88px', transform: `rotate(${hourDeg}deg)` }}
          />
          <div
            className="absolute w-0.5 bg-slate-300 rounded-full origin-bottom shadow-md"
            style={{ height: '54px', bottom: '88px', transform: `rotate(${minuteDeg}deg)` }}
          />
          {settings.showSeconds && (
            <div
              className="absolute w-0.5 bg-amber-400 rounded-full origin-bottom shadow-lg"
              style={{ height: '78px', bottom: '88px', transform: `rotate(${secondDeg}deg)` }}
            />
          )}
          <div className="w-2 h-2 rounded-full bg-white z-10" />
        </div>
      </div>
      {renderTimezoneTag()}
    </div>
  );
};
