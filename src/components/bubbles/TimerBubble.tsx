import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, Hourglass, Plus, Minus } from 'lucide-react';
import { BubbleSettings, Language } from '../../types';
import { formatTimerMs } from '../../utils/telemetry';

interface TimerBubbleProps {
  settings: BubbleSettings['timer'];
  lang: Language;
  bubbleSize: number;
  onUpdateCountdownSeconds?: (seconds: number) => void;
}

export const TimerBubble: React.FC<TimerBubbleProps> = ({
  settings,
  lang,
  bubbleSize,
  onUpdateCountdownSeconds,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [countdownRemainingMs, setCountdownRemainingMs] = useState(settings.countdownSeconds * 1000);
  const [isCountdownFinished, setIsCountdownFinished] = useState(false);

  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const isCountdown = settings.mode === 'countdown';

  useEffect(() => {
    if (!isRunning) {
      setCountdownRemainingMs(settings.countdownSeconds * 1000);
      setIsCountdownFinished(false);
    }
  }, [settings.countdownSeconds, settings.mode, isRunning]);

  useEffect(() => {
    if (!isRunning) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    startTimeRef.current = performance.now();
    const initialElapsed = elapsedMs;
    const initialCountdown = countdownRemainingMs;

    const tick = (now: number) => {
      const delta = now - startTimeRef.current;

      if (isCountdown) {
        const remaining = Math.max(0, initialCountdown - delta);
        setCountdownRemainingMs(remaining);
        if (remaining <= 0) {
          setIsRunning(false);
          setIsCountdownFinished(true);
          return;
        }
      } else {
        setElapsedMs(initialElapsed + delta);
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRunning, isCountdown]);

  const handleTogglePlay = () => {
    if (isCountdown && countdownRemainingMs <= 0) {
      setCountdownRemainingMs(settings.countdownSeconds * 1000);
      setIsCountdownFinished(false);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedMs(0);
    setCountdownRemainingMs(settings.countdownSeconds * 1000);
    setIsCountdownFinished(false);
  };

  // Quick adjust duration (in seconds)
  const handleAdjustDuration = (deltaSeconds: number) => {
    const nextSeconds = Math.max(10, settings.countdownSeconds + deltaSeconds);
    if (onUpdateCountdownSeconds) {
      onUpdateCountdownSeconds(nextSeconds);
    }
    if (!isRunning) {
      setCountdownRemainingMs(nextSeconds * 1000);
      setIsCountdownFinished(false);
    }
  };

  // Quick cycle presets
  const handleCyclePreset = () => {
    const presets = [60, 180, 300, 600, 900, 1800];
    const curr = settings.countdownSeconds;
    const next = presets.find((p) => p > curr) || presets[0];
    if (onUpdateCountdownSeconds) {
      onUpdateCountdownSeconds(next);
    }
    if (!isRunning) {
      setCountdownRemainingMs(next * 1000);
      setIsCountdownFinished(false);
    }
  };

  const currentMs = isCountdown ? countdownRemainingMs : elapsedMs;
  const timeString = formatTimerMs(currentMs);

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
        <div className="flex items-center gap-1">
          {isCountdown ? (
            <Hourglass className="w-3.5 h-3.5 text-blue-400" />
          ) : (
            <TimerIcon className="w-3.5 h-3.5 text-blue-400" />
          )}
          <span className="text-[10px] font-bold text-blue-300">
            {lang === 'en'
              ? isCountdown ? 'COUNTDOWN' : 'STOPWATCH'
              : lang === 'zh'
              ? isCountdown ? '倒计时' : '秒表'
              : isCountdown ? '倒计时 timer' : '秒表 Timer'}
          </span>
        </div>

        {/* Main Digits */}
        <div className="flex flex-col items-center my-0.5">
          <div
            className={`font-mono font-black tracking-tight px-2.5 py-0.5 rounded bg-blue-950/60 border text-base ${
              isCountdownFinished
                ? 'text-red-400 border-red-500 animate-bounce'
                : isRunning
                ? 'text-white border-blue-400/50 shadow-[0_0_12px_#3b82f644]'
                : 'text-blue-100 border-blue-500/30'
            }`}
          >
            {timeString}
          </div>

          {isCountdownFinished ? (
            <span className="text-[9px] font-bold text-red-400 animate-pulse mt-0.5">
              倒计时结束 / TIME UP!
            </span>
          ) : isCountdown && !isRunning ? (
            /* Quick Stepper Bar when paused: allow instant customization right on bubble */
            <div className="flex items-center gap-1 mt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdjustDuration(-60);
                }}
                title="-1 分钟 / -1 Min"
                className="no-drag text-[8.5px] font-mono px-1 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 text-blue-300 border border-blue-500/20 active:scale-95 flex items-center gap-0.5"
              >
                <Minus className="w-2 h-2" />1m
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCyclePreset();
                }}
                title="点击切换预设时长 / Cycle Preset"
                className="no-drag text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-blue-950/80 hover:bg-blue-900 text-blue-200 border border-blue-400/40 active:scale-95"
              >
                {Math.floor(settings.countdownSeconds / 60)}m{settings.countdownSeconds % 60 ? `${settings.countdownSeconds % 60}s` : ''}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdjustDuration(60);
                }}
                title="+1 分钟 / +1 Min"
                className="no-drag text-[8.5px] font-mono px-1 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 text-blue-300 border border-blue-500/20 active:scale-95 flex items-center gap-0.5"
              >
                <Plus className="w-2 h-2" />1m
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdjustDuration(300);
                }}
                title="+5 分钟 / +5 Min"
                className="no-drag text-[8.5px] font-mono px-1 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 text-blue-300 border border-blue-500/20 active:scale-95 flex items-center gap-0.5"
              >
                <Plus className="w-2 h-2" />5m
              </button>
            </div>
          ) : null}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-2 pt-1 border-t border-white/15 w-full">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTogglePlay();
            }}
            className={`no-drag px-3 py-1 rounded-full flex items-center gap-1 text-[11px] font-bold font-mono transition-all active:scale-95 shadow ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isRunning ? 'PAUSE' : 'START'}</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            title="复位 / Reset"
            className="no-drag p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 border border-white/10"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
