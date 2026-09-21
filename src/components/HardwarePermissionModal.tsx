import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Navigation,
  Compass,
  Activity,
  Sun,
  CheckCircle2,
  AlertCircle,
  X,
  Smartphone,
  ExternalLink,
  Cpu,
  AlertTriangle,
} from 'lucide-react';
import { Language } from '../types';
import {
  checkHardwarePermissions,
  requestAllHardwarePermissions,
  HardwarePermissionStatus,
  isIframeSandbox,
} from '../utils/hardwarePermissions';

interface HardwarePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onPermissionsGranted?: () => void;
}

export const HardwarePermissionModal: React.FC<HardwarePermissionModalProps> = ({
  isOpen,
  onClose,
  lang,
  onPermissionsGranted,
}) => {
  const [status, setStatus] = useState<HardwarePermissionStatus>({
    geolocation: 'prompt',
    orientation: 'prompt',
    motion: 'prompt',
    wakeLock: 'unsupported',
    isNative: false,
    isIframe: false,
  });
  const [isRequesting, setIsRequesting] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [isSandboxBlocked, setIsSandboxBlocked] = useState(false);

  const isEn = lang === 'en';

  useEffect(() => {
    if (isOpen) {
      checkHardwarePermissions().then((st) => {
        setStatus(st);
        if (st.isIframe && st.geolocation !== 'granted') {
          setIsSandboxBlocked(true);
        }
      });
      setResultMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestAll = async () => {
    setIsRequesting(true);
    setResultMsg(null);
    setIsSandboxBlocked(false);
    try {
      const res = await requestAllHardwarePermissions();
      setStatus(res.status);
      if (res.isSandboxBlocked) {
        setIsSandboxBlocked(true);
      }
      if (res.allGranted) {
        setResultMsg(
          isEn
            ? 'All hardware sensors & GPS connected successfully!'
            : '底导层与硬件传感器权限已全部合并开启！'
        );
        if (onPermissionsGranted) onPermissionsGranted();
      } else if (res.errors.length > 0) {
        setResultMsg(res.errors.join('； '));
      }
    } catch (err: unknown) {
      setResultMsg(err instanceof Error ? err.message : '申请底层硬件权限异常');
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusBadge = (st: 'granted' | 'denied' | 'prompt' | 'unsupported') => {
    if (st === 'granted') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3" />
          {isEn ? 'Granted' : '已就绪'}
        </span>
      );
    }
    if (st === 'denied') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/70 border border-rose-500/40 px-2 py-0.5 rounded-full">
          <AlertCircle className="w-3 h-3" />
          {isEn ? 'Denied' : '被拦截'}
        </span>
      );
    }
    if (st === 'unsupported') {
      return (
        <span className="text-[11px] font-mono text-slate-500 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-full">
          {isEn ? 'Unsupported' : '不支持'}
        </span>
      );
    }
    return (
      <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">
        {isEn ? 'Pending' : '待授权'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-sky-500/30 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200 select-none max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-sky-950/90 via-slate-900 to-indigo-950/90 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>{isEn ? 'Hardware Sensor Permissions' : '车载底层硬件权限管理'}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.2 rounded border border-emerald-400/30">
                  {status.isNative ? 'ANDROID OS NATIVE' : 'HYBRID BRIDGE'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isEn
                  ? 'Native Android OS GPS Bridge & Hardware Sensors'
                  : '直通 Android 操作系统底层 GPS 与车载传感器'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 space-y-3 overflow-y-auto">
          {/* Iframe Sandbox Warning & Bypass Banner */}
          {(status.isIframe || isSandboxBlocked) && !status.isNative && (
            <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{isEn ? 'Preview Sandbox Detected' : '检测到当前处于预览沙盒环境'}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {isEn
                  ? 'Web browser security policies restrict high-precision GPS inside iframe previews. You can either open the app in a standalone tab or run the compiled Android APK to access real hardware GPS.'
                  : '浏览器的跨域沙盒机制会默认拦截嵌入式 Iframe 预览窗口的 GPS 与高频传感器权限。请选择以下任一方式直通真实硬件：'}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={typeof window !== 'undefined' ? window.location.href : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 hover:text-white font-bold text-xs transition-all shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Open in Standalone Window' : '在新窗口独立打开 (解除沙盒)'}</span>
                </a>
              </div>
            </div>
          )}

          {/* Under-the-hood channel indicator */}
          <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span className="text-slate-300 font-medium">
                {isEn ? 'Hardware Access Channel:' : '底层驱动通道状态:'}
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold text-sky-300">
              {status.isNative
                ? 'Capacitor Android Native Bridge (OS Direct)'
                : 'HTML5 HighAccuracy + Native Fallback'}
            </span>
          </div>

          {/* Geolocation */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                  <span>{isEn ? 'GPS Satellite Geolocation' : '高精度 GPS 卫星定位'}</span>
                  <span className="text-[10px] text-emerald-400/80 font-mono">
                    [FusedLocation]
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {isEn
                    ? 'Supplies real speed, coordinates, altitude, heading & trip distance'
                    : '直连底层定位芯片，获取车速、经纬度、海拔、方位角与行驶里程'}
                </div>
              </div>
            </div>
            <div>{getStatusBadge(status.geolocation)}</div>
          </div>

          {/* Orientation (Gyroscope) */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 mt-0.5">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-white">
                  {isEn ? 'Gyroscope & Orientation Sensor' : '车载陀螺仪与体感倾角'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {isEn
                    ? 'Drives the pitch/roll spirit level, tilt meter & 3D compass'
                    : '驱动水平仪前后仰角、侧倾仪左右倾斜度与 3D 指南针'}
                </div>
              </div>
            </div>
            <div>{getStatusBadge(status.orientation)}</div>
          </div>

          {/* Accelerometer (Motion) */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 mt-0.5">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-white">
                  {isEn ? 'Motion Accelerometer & G-Force' : '动态加速度计与重力 G 值'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {isEn
                    ? 'Records vehicle acceleration, braking force & dual graph curves'
                    : '感应车辆加减速推背力、制动重力与双层波形曲线'}
                </div>
              </div>
            </div>
            <div>{getStatusBadge(status.motion)}</div>
          </div>

          {/* Screen Wake Lock */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 mt-0.5">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-white">
                  {isEn ? 'Screen Wake Lock Guardian' : '车载屏幕常亮保持'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {isEn
                    ? 'Keeps the tablet display on continuously while driving'
                    : '行车途中自动阻止平板息屏或黑屏休眠'}
                </div>
              </div>
            </div>
            <div>{getStatusBadge(status.wakeLock)}</div>
          </div>

          {/* Tip for APK */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-sky-500/20 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-sky-400">
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isEn ? 'Android APK Hardware Integration:' : 'Android APK 原生权限集成：'}</span>
            </div>
            <p className="text-slate-400 leading-normal">
              {isEn
                ? 'The project includes @capacitor/geolocation. When compiled with `npx cap add android`, Android OS handles GPS requests natively without browser sandbox limits.'
                : '已集成 @capacitor/geolocation 原生桥接。在本地执行 `npx cap add android` 打包 APK 后，定位直接由 Android 原生系统驱动，无任何沙盒限制。'}
            </p>
          </div>

          {/* Feedback message */}
          {resultMsg && (
            <div className="p-3 rounded-xl bg-slate-800/90 text-xs border border-white/10 space-y-1.5">
              <div className="text-center font-bold text-amber-300">{resultMsg}</div>
              {status.geolocation === 'denied' && (
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-200 text-[11px] space-y-1 mt-2">
                  <div className="font-bold flex items-center gap-1 text-rose-300">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>排查指南（若提示权限被拦截）：</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-300">
                    <li>下拉平板通知栏，确认【位置信息/GPS】开关处于开启状态</li>
                    <li>前往系统【设置 - 应用管理 - Bubble HUD - 权限】，将【位置信息】设为“仅使用中允许”并开启“精确位置”</li>
                    <li>若在网页端测试，请点击上方【在新窗口独立打开】解除沙盒拦截</li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 active:scale-95 transition-all"
          >
            {isEn ? 'Close' : '关闭'}
          </button>

          <button
            onClick={handleRequestAll}
            disabled={isRequesting}
            className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 active:scale-95 transition-all disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isRequesting
                ? isEn ? 'Authorizing Native Hardware...' : '正在从底层请求硬件权限...'
                : isEn ? 'Authorize All Hardware Permissions' : '一键允许全部底层硬件权限'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
