import React from 'react';
import { Cloud, Sun, Wind, Droplets } from 'lucide-react';
import { BubbleSettings, Language, TelemetryData } from '../../types';

interface WeatherBubbleProps {
  telemetry: TelemetryData;
  settings: BubbleSettings['weather'];
  lang: Language;
  bubbleSize: number;
}

export const WeatherBubble: React.FC<WeatherBubbleProps> = ({
  telemetry,
  settings,
  lang,
  bubbleSize,
}) => {
  const tempC = telemetry.temperatureC;
  const tempF = (tempC * 9) / 5 + 32;

  const tempDisplay =
    settings.tempUnit === 'C'
      ? `${tempC.toFixed(1)}°C`
      : settings.tempUnit === 'F'
      ? `${tempF.toFixed(1)}°F`
      : `${tempC.toFixed(0)}°C / ${tempF.toFixed(1)}°F`;

  // Proportional content scale: occupies ~80% of bubble diameter when enlarged
  // "泡泡放大后，里面内容最终放大约占泡泡80%左右"
  const scale = (bubbleSize * 0.80) / 170;

  return (
    <div
      className="w-full h-full relative flex flex-col items-center justify-center text-center select-none"
      style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
    >
      {/* Unified Centered Content Container */}
      <div className="flex flex-col items-center justify-center gap-1 w-full max-w-[170px]">
        {/* Header */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-lime-300">
            {lang === 'en' ? 'WEATHER' : lang === 'zh' ? '当地气候' : '当地气候 weather'}
          </span>
          <span className="text-[8.5px] text-slate-400 truncate max-w-[140px]">
            {settings.source === 'gps_auto' ? '卫星定位 / GPS' : settings.city}
          </span>
        </div>

        {/* Main Weather Visual & Temperature */}
        <div className="flex flex-col items-center gap-0.5 my-0.5">
          <div className="relative">
            <Cloud className="w-9 h-9 text-lime-300 drop-shadow-[0_0_8px_#a3e635]" />
            <Sun className="w-4 h-4 text-amber-400 absolute -top-1 -right-1 animate-spin-slow" />
          </div>

          <div className="font-mono font-black text-white tracking-tight text-sm drop-shadow">
            {tempDisplay}
          </div>

          <div className="text-[10px] font-semibold text-lime-200">
            {lang === 'en'
              ? telemetry.weatherConditionEn
              : lang === 'zh'
              ? telemetry.weatherConditionZh
              : `${telemetry.weatherConditionZh} ${telemetry.weatherConditionEn}`}
          </div>
        </div>

        {/* Secondary Barometric & Humidity Stats */}
        <div className="w-full flex items-center justify-between px-2 pt-0.5 border-t border-white/15 text-[9px] font-mono text-slate-300">
          <div className="flex items-center gap-1">
            <Droplets className="w-3 h-3 text-cyan-400" />
            <span>{telemetry.humidity}%</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Wind className="w-3 h-3 text-slate-400" />
            <span>{telemetry.pressureHpa.toFixed(0)} hPa</span>
          </div>
        </div>
      </div>
    </div>
  );
};
