/**
 * Unified Hardware Permission Manager
 * Merges GPS Geolocation, Motion/Gyroscope (Orientation & Accelerometer),
 * and Screen WakeLock into a single unified authorization workflow.
 * 
 * Interfacing with Native Android OS via Capacitor Geolocation Bridge
 * and HTML5 Geolocation with automatic WebView authorization.
 */

import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface HardwarePermissionStatus {
  geolocation: 'granted' | 'denied' | 'prompt' | 'unsupported';
  orientation: 'granted' | 'denied' | 'prompt' | 'unsupported';
  motion: 'granted' | 'denied' | 'prompt' | 'unsupported';
  wakeLock: 'granted' | 'denied' | 'unsupported';
  isNative: boolean;
  isIframe: boolean;
  reason?: string;
}

/**
 * Detect whether the app is currently constrained inside an iframe sandbox
 */
export function isIframeSandbox(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Check initial state of hardware permissions without triggering disruptive prompts
 */
export async function checkHardwarePermissions(): Promise<HardwarePermissionStatus> {
  const isNative = Capacitor.isNativePlatform();
  const isIframe = isIframeSandbox();

  const status: HardwarePermissionStatus = {
    geolocation: 'prompt',
    orientation: 'prompt',
    motion: 'prompt',
    wakeLock: 'unsupported',
    isNative,
    isIframe,
  };

  // 1. Geolocation check (Capacitor Bridge + Web Permissions API)
  try {
    const perm = await Geolocation.checkPermissions();
    if (perm.location === 'granted' || perm.coarseLocation === 'granted') {
      status.geolocation = 'granted';
    } else if (perm.location === 'denied') {
      status.geolocation = 'denied';
    } else {
      status.geolocation = 'prompt';
    }
  } catch {
    // Web permissions fallback
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      try {
        const geoPerm = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        status.geolocation = geoPerm.state as 'granted' | 'denied' | 'prompt';
      } catch {
        status.geolocation = 'prompt';
      }
    } else if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      status.geolocation = 'prompt';
    } else {
      status.geolocation = 'unsupported';
    }
  }

  // 2. Orientation & Motion check
  if (typeof window === 'undefined' || !window.DeviceOrientationEvent) {
    status.orientation = 'unsupported';
  } else if (
    typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
      .requestPermission === 'function'
  ) {
    status.orientation = 'prompt';
  } else {
    status.orientation = 'granted';
  }

  if (typeof window === 'undefined' || !window.DeviceMotionEvent) {
    status.motion = 'unsupported';
  } else if (
    typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> })
      .requestPermission === 'function'
  ) {
    status.motion = 'prompt';
  } else {
    status.motion = 'granted';
  }

  // 3. Screen WakeLock check
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    status.wakeLock = 'granted';
  } else {
    status.wakeLock = 'unsupported';
  }

  return status;
}

/**
 * Unified single-click hardware permission requester
 * Requests Geolocation directly from Android OS native layer (in APK) or browser,
 * plus Orientation, Motion, and Screen WakeLock.
 */
export async function requestAllHardwarePermissions(): Promise<{
  status: HardwarePermissionStatus;
  allGranted: boolean;
  isSandboxBlocked: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  const isNative = Capacitor.isNativePlatform();
  const isIframe = isIframeSandbox();
  let isSandboxBlocked = false;

  const status: HardwarePermissionStatus = {
    geolocation: 'prompt',
    orientation: 'prompt',
    motion: 'prompt',
    wakeLock: 'unsupported',
    isNative,
    isIframe,
  };

  // 1. Geolocation: First try Capacitor Native Bridge, then HTML5
  let geoGranted = false;

  try {
    const capPerm = await Geolocation.requestPermissions({
      permissions: ['location', 'coarseLocation'],
    });
    if (capPerm.location === 'granted' || capPerm.coarseLocation === 'granted') {
      geoGranted = true;
      status.geolocation = 'granted';
    }
  } catch (capErr) {
    console.log('Capacitor requestPermissions fallback to web:', capErr);
  }

  if (!geoGranted) {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              geoGranted = true;
              status.geolocation = 'granted';
              resolve();
            },
            (err) => {
              // Code 1: PERMISSION_DENIED (actually blocked)
              // Code 2: POSITION_UNAVAILABLE (indoor, searching satellites, but permission granted!)
              // Code 3: TIMEOUT (satellite search timed out, but permission granted!)
              if (err.code === 1) {
                status.geolocation = 'denied';
                if (isIframe) {
                  isSandboxBlocked = true;
                }
                reject(err);
              } else {
                // Code 2 or 3 means permission was granted by user/system!
                geoGranted = true;
                status.geolocation = 'granted';
                resolve();
              }
            },
            // Use short timeout and allow cached position so indoor tests don't falsely fail
            { enableHighAccuracy: true, timeout: 6000, maximumAge: 300000 }
          );
        });
      } catch (err: unknown) {
        status.geolocation = 'denied';
        if (isSandboxBlocked) {
          errors.push('当前运行在 Iframe 预览沙盒中，已被浏览器跨域沙盒拦截。请点击【独立窗口打开】直通硬件');
        } else {
          errors.push('系统或应用定位权限被拦截，请检查平板下拉栏的【位置信息/GPS开关】是否开启，并在系统设置中允许应用定位权限');
        }
      }
    } else {
      status.geolocation = 'unsupported';
      errors.push('当前运行环境不支持定位服务');
    }
  }

  // 2. Device Orientation (Gyroscope / Pitch / Roll / Compass)
  if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
    const reqPerm = (
      DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
    ).requestPermission;
    if (typeof reqPerm === 'function') {
      try {
        const res = await reqPerm();
        status.orientation = res === 'granted' ? 'granted' : 'denied';
        if (res !== 'granted') errors.push('陀螺仪/倾角体感权限被拦截');
      } catch {
        status.orientation = 'denied';
        errors.push('陀螺仪体感传感器申请失败');
      }
    } else {
      status.orientation = 'granted';
    }
  } else {
    status.orientation = 'unsupported';
  }

  // 3. Device Motion (Accelerometer / G-Force)
  if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
    const reqPerm = (
      DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }
    ).requestPermission;
    if (typeof reqPerm === 'function') {
      try {
        const res = await reqPerm();
        status.motion = res === 'granted' ? 'granted' : 'denied';
        if (res !== 'granted') errors.push('加速度计重力感应权限被拦截');
      } catch {
        status.motion = 'denied';
        errors.push('加速度传感器申请失败');
      }
    } else {
      status.motion = 'granted';
    }
  } else {
    status.motion = 'unsupported';
  }

  // 4. Screen Wake Lock (Keep tablet screen on)
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
    try {
      await (
        navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } }
      ).wakeLock.request('screen');
      status.wakeLock = 'granted';
    } catch {
      status.wakeLock = 'denied';
    }
  } else {
    status.wakeLock = 'unsupported';
  }

  const allGranted =
    status.geolocation === 'granted' &&
    (status.orientation === 'granted' || status.orientation === 'unsupported');

  return { status, allGranted, isSandboxBlocked, errors };
}
