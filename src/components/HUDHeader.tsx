import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  FlipHorizontal,
  Globe,
  Maximize,
  Minimize,
  Eye,
  Radio,
  SlidersHorizontal,
  Compass,
  Zap,
  Target,
  Sparkles,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { HUDTheme, Language } from '../types';
import { isIframeSandbox } from '../utils/hardwarePermissions';

interface HUDHeaderProps {
  lang: Language;
  onToggleLang: () => void;
  isMirrorMode: boolean;
  onToggleMirror: () => void;
  isScreensaverMode: boolean;
  onToggleScreensaver: () => void;
  isSimulated: boolean;
  onToggleSimulated: () => void;
  simTargetSpeed: number;
  onChangeSimSpeed: (speed: number) => void;
  onResetArrangement: () => void;
  currentTheme: HUDTheme;
  onChangeTheme: (theme: HUDTheme) => void;
  onQuickZeroAll: () => void;
  onOpenPermissionsModal: () => void;
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  lang,
  onToggleLang,
  isMirrorMode,
  onToggleMirror,
  isScreensaverMode,
  onToggleScreensaver,
  isSimulated,
  onToggleSimulated,
  simTargetSpeed,
  onChangeSimSpeed,
  onResetArrangement,
  currentTheme,
  onChangeTheme,
  onQuickZeroAll,
  onOpenPermissionsModal,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [showSimControls, setShowSimControls] = useState(false);

  // Fullscreen tracking
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  // Screen Wake Lock API for tablet driving use
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          setWakeLockActive(true);
        }
      } catch (err) {
        console.warn('Wake Lock not granted:', err);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, []);

  return (
    <header className="absolute top-0 left-0 right-0 z-40 h-13 bg-slate-950/85 backdrop-blur-md border-b border-white/10 flex items-center text-xs select-none shadow-lg overflow-x-auto no-scrollbar overscroll-x-contain touch-pan-x">
      {/* Scrollable Container (小平板不够宽时可横向左右自由滑动，内容不折行) */}
      <div className="flex items-center justify-between w-full min-w-max px-3 sm:px-4 gap-3">
        {/* Left: App Title & Initialization Button (matching user sketch!) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* App Title badge with balloon app icon */}
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-sky-950/60 border border-sky-500/30 text-sky-200">
            <img
              src="/icon.png"
              alt="Bubble HUD"
              className="w-5 h-5 rounded-md object-cover border border-sky-400/40 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <span className="font-bold tracking-wider font-mono">BUBBLE HUD</span>
          </div>

          {/* User Sketch Explicit Feature: "初始化排列 initial arrangement" (可全部恢复隐藏/调整的气泡) */}
          <button
            id="btn-initial-arrangement"
            onClick={onResetArrangement}
            title="一键初始化排列 (恢复所有气泡显示、默认位置与尺寸) / Reset All Bubbles Layout"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold border border-sky-300/30 shadow-md active:scale-95 transition-all text-xs"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-sky-100" />
            <span>{lang === 'en' ? 'Reset Layout' : '初始化排列'}</span>
          </button>

          {/* Windows Bouncing Bubble Screensaver Mode Toggle (像Windows泡泡一样弹来弹去屏保) */}
          <button
            id="btn-screensaver-toggle"
            onClick={onToggleScreensaver}
            title={
              isScreensaverMode
                ? '关闭屏保漫游模式 / Exit Screensaver'
                : '开启Windows泡泡碰撞屏保模式 / Windows Bubble Screensaver Mode'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all active:scale-95 ${
              isScreensaverMode
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-pink-300 shadow-[0_0_16px_rgba(236,72,153,0.6)] animate-pulse'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-pink-300 hover:border-pink-500/40'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isScreensaverMode ? 'text-yellow-300 animate-spin-slow' : 'text-pink-400'}`} />
            <span>{lang === 'en' ? (isScreensaverMode ? 'Screensaver ON' : 'Screensaver') : (isScreensaverMode ? '屏保漫游中' : '泡泡屏保')}</span>
          </button>

          {/* Quick Slant Zero Calibration */}
          <button
            onClick={onQuickZeroAll}
            title="水平仪校准当前斜放角度 / Quick Zero Slant Calibration"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-500/30 active:scale-95 transition-all"
          >
            <Target className="w-3.5 h-3.5 text-purple-300" />
            <span>{lang === 'en' ? 'Zero Slant' : '一键校准斜角'}</span>
          </button>
        </div>

        {/* Middle: Sensor Mode & Simulation Speed (Merged only into simulation mode) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Real GPS vs Simulation Mode */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
            <button
              onClick={() => {
                if (isSimulated) onToggleSimulated();
              }}
              title="连接真实硬件 GPS 卫星测速与定位（不启用巡航目标）"
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 text-[11px] font-bold transition-all ${
                !isSimulated
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3 h-3" />
              <span>{lang === 'en' ? 'Real GPS' : '真实卫星'}</span>
            </button>
            <button
              onClick={() => {
                if (!isSimulated) onToggleSimulated();
              }}
              title="模拟行车模式（包含巡航目标速度设置）"
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 text-[11px] font-bold transition-all ${
                isSimulated
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>{lang === 'en' ? 'Sim Drive' : '模拟行车'}</span>
            </button>
          </div>

          {/* Merged Simulation Cruise Target: only visible in simulation mode! */}
          {isSimulated && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-indigo-500/40 px-2.5 py-1 rounded-lg">
              <span className="text-[11px] text-indigo-300 font-medium">巡航目标:</span>
              <input
                type="range"
                min="0"
                max="160"
                step="5"
                value={simTargetSpeed}
                onChange={(e) => onChangeSimSpeed(Number(e.target.value))}
                className="w-18 sm:w-24 accent-indigo-500 h-1.5"
              />
              <span className="font-mono text-[11px] text-indigo-200 font-bold w-12 text-right">
                {simTargetSpeed} km/h
              </span>
            </div>
          )}

          {/* Unified Hardware Permissions Button */}
          <button
            onClick={onOpenPermissionsModal}
            title="合并硬件权限申请 (GPS、陀螺仪、重力感应、屏幕常亮) / Unified Hardware Permissions"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-950/70 hover:bg-sky-900 border border-sky-500/30 text-sky-300 hover:text-white transition-all text-xs active:scale-95 shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>{lang === 'en' ? 'Sensors' : '硬件权限'}</span>
          </button>

          {/* Sandbox Bypass Quick Link */}
          {isIframeSandbox() && (
            <a
              href={typeof window !== 'undefined' ? window.location.href : '#'}
              target="_blank"
              rel="noopener noreferrer"
              title="在新窗口独立打开 (解除浏览器 iframe 沙盒拦截，直通真实 GPS)"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-300 hover:text-white transition-all text-xs active:scale-95 shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'en' ? 'Pop Out' : '独立窗口'}</span>
            </a>
          )}
        </div>

        {/* Right Controls: HUD Mirror, Language, Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* HUD Windshield Mirroring Toggle (Flips screen for reflection on windshield) */}
          <button
            id="btn-hud-mirror"
            onClick={onToggleMirror}
            title={
              isMirrorMode
                ? '退出镜像模式 / Normal Mode'
                : 'HUD挡风玻璃倒影镜像模式 / Windshield HUD Mirroring'
            }
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold transition-all active:scale-95 ${
              isMirrorMode
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_#f59e0b]'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span>{isMirrorMode ? '镜像中' : 'HUD镜像'}</span>
          </button>

          {/* Bilingual Language Switcher */}
          <button
            onClick={onToggleLang}
            title="切换语言 / Toggle Language"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white active:scale-95"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-bold text-[11px]">
              {lang === 'zh' ? '中' : lang === 'en' ? 'EN' : '中/EN'}
            </span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title="全屏显示 / Toggle Fullscreen"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white active:scale-95"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
