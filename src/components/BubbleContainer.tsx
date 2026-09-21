import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Settings, Plus, Minus, Lock, EyeOff } from 'lucide-react';
import { BubbleConfig } from '../types';

interface BubbleContainerProps {
  config: BubbleConfig;
  viewportHeight: number;
  viewportWidth: number;
  isHardwareLocked?: boolean;
  onUpdateConfig: (updated: Partial<BubbleConfig>) => void;
  onOpenSettings: () => void;
  onBringToFront: () => void;
  children: React.ReactNode;
}

export const BubbleContainer: React.FC<BubbleContainerProps> = ({
  config,
  viewportHeight,
  viewportWidth,
  isHardwareLocked = false,
  onUpdateConfig,
  onOpenSettings,
  onBringToFront,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchActive, setIsTouchActive] = useState(false);
  const [isJellyBouncing, setIsJellyBouncing] = useState(false);

  // Auto-hide timer for center controls ("让泡泡弹出的设置按钮在没有操作时稍快点熄灭")
  const idleHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleHideTimerRef.current) clearTimeout(idleHideTimerRef.current);
    idleHideTimerRef.current = setTimeout(() => {
      setIsTouchActive(false);
      setIsHovered(false);
    }, 1600); // 1.6s snappy auto-extinguish
  }, []);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (idleHideTimerRef.current) clearTimeout(idleHideTimerRef.current);
    };
  }, []);

  // Velocity tracking for throw inertia
  const lastPosRef = useRef({ x: config.x, y: config.y, time: Date.now() });

  // Pinch zoom tracking
  const touchStartDistRef = useRef<number | null>(null);
  const initialSizeOnTouchRef = useRef<number>(config.size);

  const minSize = 130;
  const maxSize = Math.floor(viewportHeight * 0.85);

  // Trigger brief rubbery jelly bounce
  const triggerJelly = useCallback(() => {
    setIsJellyBouncing(true);
    setTimeout(() => {
      setIsJellyBouncing(false);
    }, 450);
  }, []);

  // Listen to external bouncing signal (e.g. from screensaver collision)
  useEffect(() => {
    if (config.isBouncing) {
      triggerJelly();
    }
  }, [config.isBouncing, triggerJelly]);

  // Clamped size helper
  const clampSize = useCallback(
    (newSize: number) => {
      return Math.max(minSize, Math.min(maxSize, Math.round(newSize)));
    },
    [minSize, maxSize]
  );

  // Elastic boundary damping calculation ("像橡皮糖，边界上弹力系数小一点")
  const applyElasticBoundary = useCallback(
    (rawX: number, rawY: number, size: number) => {
      const minX = 0;
      const maxX = viewportWidth - size;
      const minY = 52;
      const maxY = viewportHeight - size;

      const dampingCoeff = 0.22; // Small elasticity coefficient at borders

      let finalX = rawX;
      let finalY = rawY;

      if (rawX < minX) {
        finalX = minX + (rawX - minX) * dampingCoeff;
      } else if (rawX > maxX) {
        finalX = maxX + (rawX - maxX) * dampingCoeff;
      }

      if (rawY < minY) {
        finalY = minY + (rawY - minY) * dampingCoeff;
      } else if (rawY > maxY) {
        finalY = maxY + (rawY - maxY) * dampingCoeff;
      }

      return { x: finalX, y: finalY };
    },
    [viewportWidth, viewportHeight]
  );

  // Snap back to within bounds on release if overshot
  const snapBackToBounds = useCallback(
    (x: number, y: number, size: number) => {
      const minX = 0;
      const maxX = Math.max(0, viewportWidth - size);
      const minY = 52;
      const maxY = Math.max(52, viewportHeight - size);

      const clampedX = Math.max(minX, Math.min(maxX, x));
      const clampedY = Math.max(minY, Math.min(maxY, y));

      const wasOutOfBound = clampedX !== x || clampedY !== y;
      if (wasOutOfBound) {
        triggerJelly();
      }

      return { x: clampedX, y: clampedY, wasOutOfBound };
    },
    [viewportWidth, viewportHeight, triggerJelly]
  );

  // Mouse Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, .no-drag')) {
      return;
    }
    e.preventDefault();
    onBringToFront();
    setIsDragging(true);
    lastPosRef.current = { x: config.x, y: config.y, time: Date.now() };
    setDragOffset({
      x: e.clientX - config.x,
      y: e.clientY - config.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rawX = e.clientX - dragOffset.x;
      const rawY = e.clientY - dragOffset.y;
      const elastic = applyElasticBoundary(rawX, rawY, config.size);

      // Track velocity for throw inertia
      const now = Date.now();
      const dt = Math.max(16, now - lastPosRef.current.time);
      const vx = ((elastic.x - lastPosRef.current.x) / dt) * 12;
      const vy = ((elastic.y - lastPosRef.current.y) / dt) * 12;
      lastPosRef.current = { x: elastic.x, y: elastic.y, time: now };

      onUpdateConfig({ x: elastic.x, y: elastic.y, vx, vy });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      const { x, y } = snapBackToBounds(config.x, config.y, config.size);
      onUpdateConfig({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, config.x, config.y, config.size, applyElasticBoundary, snapBackToBounds, onUpdateConfig]);

  // Touch handlers: Drag (1 finger) & Pinch-to-zoom (2 fingers)
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, .no-drag')) {
      return;
    }
    onBringToFront();

    // Toggle center controls on tap for mobile/tablet and start fast idle extinction timer
    setIsTouchActive(true);
    resetIdleTimer();

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      lastPosRef.current = { x: config.x, y: config.y, time: Date.now() };
      setDragOffset({
        x: touch.clientX - config.x,
        y: touch.clientY - config.y,
      });
      touchStartDistRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      touchStartDistRef.current = dist;
      initialSizeOnTouchRef.current = config.size;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const scaleFactor = dist / touchStartDistRef.current;
      const targetSize = clampSize(initialSizeOnTouchRef.current * scaleFactor);
      
      const sizeDiff = targetSize - config.size;
      const rawX = config.x - sizeDiff / 2;
      const rawY = config.y - sizeDiff / 2;
      const elastic = applyElasticBoundary(rawX, rawY, targetSize);

      onUpdateConfig({ size: targetSize, x: elastic.x, y: elastic.y });
    } else if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      const rawX = touch.clientX - dragOffset.x;
      const rawY = touch.clientY - dragOffset.y;
      const elastic = applyElasticBoundary(rawX, rawY, config.size);

      const now = Date.now();
      const dt = Math.max(16, now - lastPosRef.current.time);
      const vx = ((elastic.x - lastPosRef.current.x) / dt) * 12;
      const vy = ((elastic.y - lastPosRef.current.y) / dt) * 12;
      lastPosRef.current = { x: elastic.x, y: elastic.y, time: now };

      onUpdateConfig({ x: elastic.x, y: elastic.y, vx, vy });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDistRef.current = null;
    const { x, y } = snapBackToBounds(config.x, config.y, config.size);
    onUpdateConfig({ x, y });
  };

  // Wheel zoom support
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.altKey || isHovered) {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 16 : -16;
      const targetSize = clampSize(config.size + zoomDelta);
      const sizeDiff = targetSize - config.size;
      const rawX = config.x - sizeDiff / 2;
      const rawY = config.y - sizeDiff / 2;
      const { x, y } = snapBackToBounds(rawX, rawY, targetSize);
      onUpdateConfig({ size: targetSize, x, y });
      triggerJelly();
    }
  };

  // Quick resize buttons
  const stepSize = (delta: number) => {
    const targetSize = clampSize(config.size + delta);
    const sizeDiff = targetSize - config.size;
    const rawX = config.x - sizeDiff / 2;
    const rawY = config.y - sizeDiff / 2;
    const { x, y } = snapBackToBounds(rawX, rawY, targetSize);
    onUpdateConfig({ size: targetSize, x, y });
    triggerJelly();
  };

  // Whether center controls are currently visible
  const showCenterControls = (isHovered || isTouchActive) && !isDragging;

  return (
    <div
      ref={containerRef}
      id={`bubble-${config.id}`}
      style={{
        transform: `translate3d(${config.x}px, ${config.y}px, 0)`,
        width: `${config.size}px`,
        height: `${config.size}px`,
        zIndex: config.zIndex,
        '--bubble-glow': config.color,
      } as React.CSSProperties}
      className={`absolute select-none cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? 'shadow-2xl ring-2 ring-white/30' : ''
      }`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onMouseEnter={() => {
        setIsHovered(true);
        resetIdleTimer();
      }}
      onMouseMove={() => {
        if (!isHovered) setIsHovered(true);
        resetIdleTimer();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsTouchActive(false);
      }}
    >
      {/* 3D Spherical Outer Bubble with Colored Border Ring & Rubbery Jelly Bounce */}
      <div
        className={`w-full h-full rounded-full relative overflow-hidden flex items-center justify-center p-3 bubble-3d-glass border-2 sm:border-[3px] shadow-2xl transition-colors duration-300 ${
          isJellyBouncing ? 'animate-jelly' : ''
        }`}
        style={{
          borderColor: config.color,
          boxShadow: `0 0 24px -2px ${config.color}55, inset 0 0 16px ${config.color}22`,
        }}
      >
        {/* Top-Left Specular Lens Flare for 3D depth */}
        <div className="absolute inset-0 rounded-full bubble-specular-glare pointer-events-none opacity-80" />

        {/* Bottom Ambient Lens Refraction */}
        <div className="absolute inset-0 rounded-full bubble-bottom-refraction pointer-events-none opacity-70" />

        {/* HARDWARE LOCK INDICATOR (用户需求：如果没有硬件支持，在泡泡中上部加一个黄色小小锁定图标，设置功能可用，就是无动作) */}
        {isHardwareLocked && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-950/90 border border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.6)] pointer-events-auto select-none"
            title="无硬件传感器支持（已锁定，功能保持静态可用）"
          >
            <Lock className="w-2.5 h-2.5 text-amber-400" />
            <span className="text-[7.5px] font-mono font-bold leading-none tracking-wider text-amber-200">LOCK</span>
          </div>
        )}

        {/* Inner Content Display (Completely centered, proportional ~80% safe zone inside bubble sphere) */}
        <div className="relative w-full h-full flex items-center justify-center z-10 text-slate-100 pointer-events-auto">
          <div
            className="w-full h-full flex flex-col items-center justify-center text-center relative"
            style={{
              width: `${Math.round(config.size * 0.82)}px`,
              height: `${Math.round(config.size * 0.82)}px`,
              maxWidth: `${Math.round(config.size * 0.85)}px`,
              maxHeight: `${Math.round(config.size * 0.85)}px`,
              aspectRatio: '1 / 1',
            }}
          >
            {children}
          </div>
        </div>

        {/* CENTER-POSITIONED SETTINGS & ZOOM CAPSULE (用户明确要求：设置缩放功能图标，尽量放在中心位置，避免边角信息被遮挡) */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-200 flex flex-col items-center gap-1 ${
            showCenterControls
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-90 pointer-events-none'
          }`}
        >
          {/* Frosted HUD Control Capsule */}
          <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-md px-2 py-1 rounded-full border border-amber-400/50 shadow-[0_0_20px_rgba(0,0,0,0.85)]">
            {/* Quick Zoom Out Button */}
            <button
              title="缩小气泡 / Zoom Out"
              onClick={(e) => {
                e.stopPropagation();
                stepSize(-25);
                resetIdleTimer();
              }}
              className="w-6 h-6 rounded-full bg-slate-800/90 hover:bg-slate-700 active:scale-90 text-sky-300 flex items-center justify-center transition-transform"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Central Settings Button '*' (Matching user sketch with asterisk gear) */}
            <button
              id={`btn-setting-${config.id}`}
              title="气泡设置 / Settings"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSettings();
              }}
              className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-600/40 to-yellow-600/40 hover:from-amber-600/60 hover:to-yellow-600/60 border border-amber-400/70 text-amber-200 active:scale-95 flex items-center gap-1 text-[11px] font-bold shadow transition-all"
            >
              <Settings className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
              <span className="font-mono">设置*</span>
            </button>

            {/* Quick Zoom In Button */}
            <button
              title="放大气泡 / Zoom In"
              onClick={(e) => {
                e.stopPropagation();
                stepSize(25);
                resetIdleTimer();
              }}
              className="w-6 h-6 rounded-full bg-slate-800/90 hover:bg-slate-700 active:scale-90 text-sky-300 flex items-center justify-center transition-transform"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {/* Close/Hide Bubble Button (在设置下增加关闭泡泡按钮，减少总泡数，在初始化排列可以全部恢复) */}
            <button
              title="关闭/隐藏此气泡 (减少总泡数，顶栏【初始化排列】可一键恢复)"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateConfig({ visible: false });
              }}
              className="w-6 h-6 rounded-full bg-rose-950/80 hover:bg-rose-900 active:scale-90 border border-rose-500/60 text-rose-300 flex items-center justify-center transition-transform"
            >
              <EyeOff className="w-3 h-3" />
            </button>
          </div>

          {/* Size readout pill */}
          <div className="px-2 py-0.5 rounded-full bg-black/85 border border-white/10 text-[9px] text-slate-300 font-mono tracking-wider shadow-sm pointer-events-none">
            {config.size}px ({Math.round((config.size / viewportHeight) * 100)}% H)
          </div>
        </div>
      </div>
    </div>
  );
};
