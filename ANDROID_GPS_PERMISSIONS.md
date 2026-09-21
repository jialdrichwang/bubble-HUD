# Bubble HUD - Android 底层硬件 GPS 与权限配置指南

本项目已深度集成 `@capacitor/geolocation` 与 `@capacitor/core` 原生驱动桥接。

## 为什么会提示“沙盒阻挡”？
1. **浏览器 Iframe 预览沙盒限制**：
   在 AI Studio 网页在线预览中，页面运行在被隔离的 `<iframe>` 沙盒中。根据现代浏览器的安全策略（Permissions-Policy），默认禁止向嵌入式沙盒页面授予高精度 GPS 定位权限。
   - **立即解除方法**：点击界面顶部的 **【解除沙盒 / 独立窗口打开】** 按钮，在浏览器独立标签页打开，即可直接授权并调用真实 GPS。

2. **Android APK 打包（推荐方案）**：
   通过 Capacitor 打包为车载平板 Android APK 后，应用不再受任何网页沙盒限制，而是直接通过 Android 操作系统底层原生 **FusedLocationProviderClient** 与 GPS 芯片通信，获取最精准、零延迟的定位与速度数据。

---

## Android APK 构建步骤

### 1. 安装依赖并打包前端静态资源
```bash
npm install --legacy-peer-deps
npm run build
```

### 2. 初始化并添加 Android 原生工程（如已添加可跳过）
```bash
npx cap add android
npx cap copy
```

### 3. 配置 Android 底层权限声明
在生成的 `android/app/src/main/AndroidManifest.xml` 文件中的 `<manifest>` 节点下，确认包含以下硬件权限：

```xml
    <!-- 高精度 GPS 卫星定位与基站定位 -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-feature android:name="android.hardware.location.gps" android:required="true" />

    <!-- 高频体感传感器（陀螺仪仰角/滚转角、重力加速度计） -->
    <uses-permission android:name="android.permission.HIGH_SAMPLING_RATE_SENSORS" />

    <!-- 屏幕常亮守护（行车过程中防止平板息屏休眠） -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
```

### 4. 同步并打开 Android Studio 生成 APK
```bash
npx cap sync
npx cap open android
```
在打开的 Android Studio 中，点击菜单栏：
**Build -> Build Bundle(s) / APK(s) -> Build APK(s)**
即可直接生成用于平板安装的 Release / Debug APK 安装包！
