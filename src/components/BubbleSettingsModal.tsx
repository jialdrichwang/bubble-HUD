import React from 'react';
import { X, Sliders, Check, RotateCcw, EyeOff, BrainCircuit } from 'lucide-react';
import { BubbleId, BubbleSettings, Language } from '../types';

interface BubbleSettingsModalProps {
  activeBubbleId: BubbleId | null;
  settings: BubbleSettings;
  bubbleColor: string;
  lang: Language;
  onUpdateSettings: (newSettings: BubbleSettings) => void;
  onUpdateColor: (color: string) => void;
  onClose: () => void;
  onHideBubble?: (id: BubbleId) => void;
  onOpenCalibration?: () => void;
}

const PRESET_COLORS = [
  { name: 'Sky Blue', hex: '#0ea5e9' },
  { name: 'Red Rose', hex: '#ef4444' },
  { name: 'Fighter Purple', hex: '#a855f7' },
  { name: 'Cockpit Green', hex: '#10b981' },
  { name: 'Amber Gold', hex: '#d97706' },
  { name: 'Cyber Cyan', hex: '#06b6d4' },
  { name: 'Lime Grass', hex: '#84cc16' },
  { name: 'Deep Steel Blue', hex: '#3b82f6' },
  { name: 'Neon Pink', hex: '#ec4899' },
  { name: 'Warning Orange', hex: '#f97316' },
  { name: 'Stealth Slate', hex: '#64748b' },
];

export const BubbleSettingsModal: React.FC<BubbleSettingsModalProps> = ({
  activeBubbleId,
  settings,
  bubbleColor,
  lang,
  onUpdateSettings,
  onUpdateColor,
  onClose,
  onHideBubble,
  onOpenCalibration,
}) => {
  if (!activeBubbleId) return null;

  const isEn = lang === 'en';

  const getTitle = () => {
    switch (activeBubbleId) {
      case 'speed':
        return isEn ? 'Speedometer Settings' : '速度表参数设置';
      case 'clock':
        return isEn ? 'Clock Face Settings' : '钟表面板款式设置';
      case 'spirit_level':
        return isEn ? 'Spirit Level Calibration' : '水平仪与倾斜安装角校准';
      case 'tilt_meter':
        return isEn ? 'Tilt Inclinometer Settings' : '侧倾仪报警与校准设置';
      case 'coords':
        return isEn ? 'Coordinates & GNSS Settings' : '经纬度与卫星格式设置';
      case 'driving_data':
        return isEn ? 'Driving Data Settings' : '行驶数据单位设置';
      case 'compass':
        return isEn ? '3D Compass Settings' : '3D透视指南针设置';
      case 'weather':
        return isEn ? 'Weather Source & Station Settings' : '气候气象源与城市设置';
      case 'timer':
        return isEn ? 'Stopwatch & Countdown Settings' : '秒表与倒计时模式设置';
      case 'speed_graph':
        return isEn ? 'Speed Graph Window' : '速度曲线窗口参数';
      case 'accel_graph':
        return isEn ? 'Acceleration Graph Window' : '加速度曲线窗口参数';
      default:
        return 'Settings';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-sm text-slate-100">{getTitle()}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-200">
          {/* Bubble Ring Color Picker */}
          <div>
            <label className="block font-semibold mb-2 text-slate-300">
              {isEn ? 'Bubble Ring Glow Color' : '泡泡光环边缘颜色'}
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => onUpdateColor(c.hex)}
                  title={c.name}
                  className={`w-7 h-7 rounded-full transition-transform active:scale-90 flex items-center justify-center border-2 ${
                    bubbleColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {bubbleColor === c.hex && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* Close Bubble Option (用户需求：关闭泡泡功能放入设置菜单内) */}
          {onHideBubble && (
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between">
              <div className="pr-2">
                <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>{isEn ? 'Close / Hide Bubble' : '关闭此泡泡功能'}</span>
                </div>
                <div className="text-[10.5px] text-rose-300/70 mt-0.5">
                  {isEn ? 'Hide to reduce bubble count (Restore via "Reset Layout" on top bar)' : '从屏幕关闭此泡泡，随时可在顶部菜单「初始化排列」一键恢复'}
                </div>
              </div>
              <button
                onClick={() => {
                  onHideBubble(activeBubbleId);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 active:scale-95 transition-all shadow"
              >
                {isEn ? 'Close' : '关闭泡泡'}
              </button>
            </div>
          )}

          <div className="border-t border-slate-800 pt-3" />

          {/* Speedometer Settings */}
          {activeBubbleId === 'speed' && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  {isEn ? 'Speedometer Style' : '速度表盘样式'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'gauge', label: isEn ? 'Analog Needle Gauge' : '经典机械指针表' },
                    { id: 'digital', label: isEn ? 'Digital HUD' : '数字大弧形盘' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          speed: { ...settings.speed, style: item.id as any },
                        })
                      }
                      className={`p-2 rounded-lg text-left text-xs border ${
                        settings.speed.style === item.id
                          ? 'bg-sky-950 border-sky-500 text-sky-100 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  {isEn ? 'Speed Unit' : '速度显示单位'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['km/h', 'mph', 'm/s'] as const).map((unit) => (
                    <button
                      key={unit}
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          speed: { ...settings.speed, unit },
                        })
                      }
                      className={`py-1.5 px-3 rounded-lg font-mono font-bold text-xs border ${
                        settings.speed.unit === unit
                          ? 'bg-sky-600 border-sky-400 text-white shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  {isEn ? 'Overspeed Alert Threshold (km/h)' : '超速预警阈值 (km/h)'}:{' '}
                  <span className="text-sky-400 font-mono">{settings.speed.overspeedAlert} km/h</span>
                </label>
                <input
                  type="range"
                  min="40"
                  max="240"
                  step="5"
                  value={settings.speed.overspeedAlert}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      speed: {
                        ...settings.speed,
                        overspeedAlert: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-sky-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <span>{isEn ? 'Show Secondary m/s Readout' : '显示次级 m/s 读数 (如草图)'}</span>
                <input
                  type="checkbox"
                  checked={settings.speed.showMpsSubtext}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      speed: { ...settings.speed, showMpsSubtext: e.target.checked },
                    })
                  }
                  className="w-4 h-4 accent-sky-500 rounded"
                />
              </div>
            </div>
          )}

          {/* Clock Settings */}
          {activeBubbleId === 'clock' && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  {isEn ? 'Clock Style' : '钟表款式 (多种可选)'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'breitling_navitimer_white', label: isEn ? 'Breitling Navitimer White' : '百年灵航空白盘' },
                    { id: 'breitling_navitimer_green', label: isEn ? 'Breitling Mint Green' : '百年灵薄荷绿盘' },
                    { id: 'breitling_chronomat_blue', label: isEn ? 'Breitling Chronomat Blue' : '百年灵机械深蓝盘' },
                    { id: 'iwc_portugieser', label: isEn ? 'IWC Portugieser Chrono' : '万国葡萄牙蓝针' },
                    { id: 'roman', label: isEn ? 'Roman Classic Clock' : '罗马钟表 (Roman)' },
                    { id: 'aviator', label: isEn ? 'Aviator Chrono' : '经典航空仪表盘' },
                    { id: 'minimal', label: isEn ? 'Minimal Bauhaus' : '包豪斯极简指针' },
                    { id: 'cyber', label: isEn ? 'Cyber HUD' : '赛博HUD圆环' },
                    { id: 'digital', label: isEn ? 'Digital Chrono' : '高对比度数字钟' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          clock: { ...settings.clock, style: item.id as any },
                        })
                      }
                      className={`p-2 rounded-lg text-left text-xs border ${
                        settings.clock.style === item.id
                          ? 'bg-red-950 border-red-500 text-red-100 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      <div>{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>{isEn ? 'Show Date (Month & Day)' : '显示月日窗口 (月/日/周)'}</span>
                <input
                  type="checkbox"
                  checked={settings.clock.showDate}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      clock: { ...settings.clock, showDate: e.target.checked },
                    })
                  }
                  className="w-4 h-4 accent-red-500 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <span>{isEn ? 'Show Seconds Hand' : '显示秒针 / 秒跳动'}</span>
                <input
                  type="checkbox"
                  checked={settings.clock.showSeconds}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      clock: { ...settings.clock, showSeconds: e.target.checked },
                    })
                  }
                  className="w-4 h-4 accent-red-500 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <span>{isEn ? '24-Hour Format' : '24小时制'}</span>
                <input
                  type="checkbox"
                  checked={settings.clock.is24Hour}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      clock: { ...settings.clock, is24Hour: e.target.checked },
                    })
                  }
                  className="w-4 h-4 accent-red-500 rounded"
                />
              </div>

              {/* GPS UTC Timezone Configuration (用户明确提出：UTC时间下发后需不需要增加时区信息以转换到相应时区时间) */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block font-semibold text-slate-200 text-xs">
                      {isEn ? 'Timezone Conversion' : 'GPS与时钟时区转换'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isEn
                        ? 'GPS broadcasts UTC standard time. Convert to local or driver-specified timezone.'
                        : 'GPS卫星下发UTC标准时间，可自动转换本地或指定特定国际时区'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        clock: {
                          ...settings.clock,
                          timezoneMode: 'auto',
                          timezoneOffsetHours: -new Date().getTimezoneOffset() / 60,
                          timezoneName: isEn ? 'Local Device Timezone' : '跟随设备本地时区',
                        },
                      })
                    }
                    className={`p-2 rounded-lg text-left text-xs border ${
                      settings.clock.timezoneMode !== 'custom'
                        ? 'bg-red-950 border-red-500 text-red-100 font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>{isEn ? 'Automatic (Local)' : '自动 (跟随设备)'}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      UTC{-new Date().getTimezoneOffset() / 60 >= 0 ? '+' : ''}{-new Date().getTimezoneOffset() / 60}
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        clock: {
                          ...settings.clock,
                          timezoneMode: 'custom',
                          timezoneOffsetHours: settings.clock.timezoneOffsetHours ?? 8,
                          timezoneName: settings.clock.timezoneName || (isEn ? 'UTC+8 (Beijing/Singapore)' : 'UTC+8 (北京/新加坡)'),
                        },
                      })
                    }
                    className={`p-2 rounded-lg text-left text-xs border ${
                      settings.clock.timezoneMode === 'custom'
                        ? 'bg-red-950 border-red-500 text-red-100 font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>{isEn ? 'Custom Timezone' : '自定义指定时区'}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      {settings.clock.timezoneName || `UTC+${settings.clock.timezoneOffsetHours ?? 8}`}
                    </div>
                  </button>
                </div>

                {settings.clock.timezoneMode === 'custom' && (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2 text-xs">
                    {/* Strict GPS Lock Status Banner */}
                    <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-[11px] text-emerald-300 flex items-start gap-1.5">
                      <span className="text-sm shrink-0">🛰️</span>
                      <div>
                        <div className="font-bold text-emerald-200">
                          {isEn ? 'Strict GPS Satellite Time Lock Active' : '严格锁定 GPS 卫星原子时间'}
                        </div>
                        <div className="text-emerald-300/80 text-[10px] leading-relaxed mt-0.5">
                          {isEn
                            ? 'Custom timezone is directly offset from GPS UTC atomic time, completely immune to local device clock drift.'
                            : '自定义时区严格基于 GPS 卫星下发的 UTC 绝对原子时基进行换算，免除车机或手机本地系统时间漂移误差。'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        {isEn ? 'Select Common International Timezone' : '选择常用国际时区'}
                      </label>
                      <select
                        value={settings.clock.timezoneOffsetHours ?? 8}
                        onChange={(e) => {
                          const offset = parseFloat(e.target.value);
                          const matched = [
                            { offset: -8, name: isEn ? 'UTC-8 (Pacific / LA)' : 'UTC-8 (太平洋 / 洛杉矶)' },
                            { offset: -5, name: isEn ? 'UTC-5 (Eastern / NY)' : 'UTC-5 (美东 / 纽约)' },
                            { offset: 0, name: isEn ? 'UTC+0 (London / GMT)' : 'UTC+0 (伦敦 / 格林威治)' },
                            { offset: 1, name: isEn ? 'UTC+1 (Central Europe / Berlin)' : 'UTC+1 (欧洲中部 / 柏林)' },
                            { offset: 2, name: isEn ? 'UTC+2 (Cairo / Athens)' : 'UTC+2 (开罗 / 雅典)' },
                            { offset: 3, name: isEn ? 'UTC+3 (Moscow / Riyadh)' : 'UTC+3 (莫斯科 / 利雅得)' },
                            { offset: 5.5, name: isEn ? 'UTC+5.5 (India / Delhi)' : 'UTC+5.5 (印度 / 新德里)' },
                            { offset: 7, name: isEn ? 'UTC+7 (Bangkok / Jakarta)' : 'UTC+7 (曼谷 / 雅加达)' },
                            { offset: 8, name: isEn ? 'UTC+8 (Beijing / Singapore / Taipei)' : 'UTC+8 (北京 / 新加坡 / 台北)' },
                            { offset: 9, name: isEn ? 'UTC+9 (Tokyo / Seoul)' : 'UTC+9 (东京 / 首尔)' },
                            { offset: 9.5, name: isEn ? 'UTC+9.5 (Adelaide / Darwin)' : 'UTC+9.5 (阿德莱德)' },
                            { offset: 10, name: isEn ? 'UTC+10 (Sydney / Melbourne)' : 'UTC+10 (悉尼 / 墨尔本)' },
                            { offset: 12, name: isEn ? 'UTC+12 (Auckland / Fiji)' : 'UTC+12 (奥克兰 / 斐济)' },
                          ].find((item) => item.offset === offset);

                          onUpdateSettings({
                            ...settings,
                            clock: {
                              ...settings.clock,
                              timezoneOffsetHours: offset,
                              timezoneName: matched?.name || `UTC${offset >= 0 ? '+' : ''}${offset}`,
                            },
                          });
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono text-xs focus:outline-none focus:border-red-500"
                      >
                        <option value="-8">UTC-8 (洛杉矶 / 旧金山 / 温哥华)</option>
                        <option value="-5">UTC-5 (纽约 / 多伦多 / 美东)</option>
                        <option value="0">UTC+0 (伦敦 / 格林威治 / GMT)</option>
                        <option value="1">UTC+1 (巴黎 / 柏林 / 罗马)</option>
                        <option value="2">UTC+2 (开罗 / 雅典 / 赫尔辛基)</option>
                        <option value="3">UTC+3 (莫斯科 / 利雅得)</option>
                        <option value="5.5">UTC+5.5 (新德里 / 孟买)</option>
                        <option value="7">UTC+7 (曼谷 / 雅加达 / 河内)</option>
                        <option value="8">UTC+8 (北京 / 新加坡 / 台北 / 香港)</option>
                        <option value="9">UTC+9 (东京 / 首尔)</option>
                        <option value="9.5">UTC+9.5 (阿德莱德 / 达尔文)</option>
                        <option value="10">UTC+10 (悉尼 / 墨尔本 / 关岛)</option>
                        <option value="12">UTC+12 (奥克兰 / 惠灵顿)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-400">
                        {isEn ? 'Manual Hour Offset:' : '手动偏移 (小时):'}
                      </span>
                      <div className="flex items-center gap-1 font-mono text-amber-300">
                        <span>UTC{settings.clock.timezoneOffsetHours !== undefined && settings.clock.timezoneOffsetHours >= 0 ? '+' : ''}{settings.clock.timezoneOffsetHours ?? 8}</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-12"
                      max="14"
                      step="0.5"
                      value={settings.clock.timezoneOffsetHours ?? 8}
                      onChange={(e) => {
                        const offset = parseFloat(e.target.value);
                        onUpdateSettings({
                          ...settings,
                          clock: {
                            ...settings.clock,
                            timezoneOffsetHours: offset,
                            timezoneName: `UTC${offset >= 0 ? '+' : ''}${offset}`,
                          },
                        });
                      }}
                      className="w-full accent-red-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Spirit Level Calibration (Crucial user request: "水平仪要设初始参数，因为平板是斜放的，要减去本身斜放了多少度") */}
          {activeBubbleId === 'spirit_level' && (
            <div className="space-y-3">
              {/* Learning / Calibration Gateway */}
              <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-500/40 text-amber-200 flex items-center justify-between">
                <div>
                  <div className="font-bold flex items-center gap-1.5 text-xs text-amber-300">
                    <BrainCircuit className="w-4 h-4 text-amber-400" />
                    <span>{isEn ? 'Sensor Learning & Calibration' : '水平仪与侧倾仪学习入口'}</span>
                  </div>
                  <div className="text-[11px] text-amber-300/80 mt-0.5">
                    {isEn ? 'Calibrate orientation, level zero, and angle learning' : '人工变换角度并输入已知数值让仪表学习，支持横竖屏自适应'}
                  </div>
                </div>
                {onOpenCalibration && (
                  <button
                    onClick={onOpenCalibration}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow shrink-0 active:scale-95 transition-all"
                  >
                    {isEn ? 'Open Calibration' : '进入学习'}
                  </button>
                )}
              </div>

              {/* Style Selector */}
              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  {isEn ? 'Inclinometer Display Style' : '水平仪/侧倾仪样式'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'spherical_gyro', label: isEn ? 'Off-road Gyro Ball' : '越野飞行姿态球' },
                    { id: 'fighter_hud', label: isEn ? 'Fighter Jet HUD' : '战机阶梯式平视盘' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          spirit_level: { ...settings.spirit_level, style: item.id as any },
                        })
                      }
                      className={`p-2 rounded-lg text-left text-xs border ${
                        settings.spirit_level.style === item.id
                          ? 'bg-purple-950 border-purple-500 text-purple-100 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      <div>{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-500/30 text-purple-200">
                <div className="font-bold mb-1">
                  {isEn ? 'Tablet Mount Slant Calibration' : '平板斜放安装角补偿'}
                </div>
                <div className="text-[11px] text-purple-300/90 leading-relaxed">
                  {isEn
                    ? 'Tablets are typically mounted tilted on car dashboards. Adjust the offset below so the horizon line aligns with true zero when your vehicle is parked on level ground.'
                    : '平板在车内支架上通常倾斜放置。在此设置安装仰角偏移量（或使用泡泡上的“归零校准”按钮），即可自动减去自身斜放度数。'}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-300">
                    {isEn ? 'Pitch Offset (Slant Angle)' : '安装俯仰角偏移 (斜放度数)'}
                  </span>
                  <span className="font-mono text-purple-300 font-bold text-sm">
                    {settings.spirit_level.pitchOffset > 0 ? `+${settings.spirit_level.pitchOffset}°` : `${settings.spirit_level.pitchOffset}°`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  step="1"
                  value={settings.spirit_level.pitchOffset}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      spirit_level: {
                        ...settings.spirit_level,
                        pitchOffset: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-300">
                    {isEn ? 'Roll Offset (Horizontal Slant)' : '安装横向水平偏移'}
                  </span>
                  <span className="font-mono text-purple-300 font-bold text-sm">
                    {settings.spirit_level.rollOffset > 0 ? `+${settings.spirit_level.rollOffset}°` : `${settings.spirit_level.rollOffset}°`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="0.5"
                  value={settings.spirit_level.rollOffset}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      spirit_level: {
                        ...settings.spirit_level,
                        rollOffset: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-300">
                    {isEn ? 'HUD Ladder Sensitivity' : '战斗机阶梯标尺灵敏度'}
                  </span>
                  <span className="font-mono text-purple-300 font-bold">
                    {settings.spirit_level.sensitivity.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={settings.spirit_level.sensitivity}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      spirit_level: {
                        ...settings.spirit_level,
                        sensitivity: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-purple-500"
                />
              </div>
            </div>
          )}

          {/* Tilt Meter Settings */}
          {activeBubbleId === 'tilt_meter' && (
            <div className="space-y-3">
              {/* Learning & Calibration Entry Banner for Tilt Meter ("侧倾仪也增加学习功能") */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-rose-950/60 to-amber-950/60 border border-rose-500/40 flex items-center justify-between">
                <div>
                  <div className="font-bold flex items-center gap-1.5 text-xs text-rose-300">
                    <BrainCircuit className="w-4 h-4 text-rose-400" />
                    <span>{isEn ? 'Tilt Meter Learning & Calibration' : '侧倾仪姿态学习与校准入口'}</span>
                  </div>
                  <div className="text-[11px] text-rose-300/80 mt-0.5">
                    {isEn
                      ? 'Learn horizontal zero baseline, roll gain factor, and orientation alignment'
                      : '人工变换侧倾角度输入标定 · 平板斜放偏置消除 · 横竖屏对齐'}
                  </div>
                </div>
                {onOpenCalibration && (
                  <button
                    onClick={onOpenCalibration}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow shrink-0 active:scale-95 transition-all"
                  >
                    {isEn ? 'Open Learning' : '进入学习'}
                  </button>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-300">
                    {isEn ? 'Caution Roll Threshold' : '侧倾警戒角度 (黄色警示)'}
                  </span>
                  <span className="font-mono text-amber-400 font-bold">
                    {settings.tilt_meter.warningThreshold}°
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  step="1"
                  value={settings.tilt_meter.warningThreshold}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      tilt_meter: {
                        ...settings.tilt_meter,
                        warningThreshold: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-300">
                    {isEn ? 'Danger Roll Threshold' : '极限侧倾角度 (红色危险)'}
                  </span>
                  <span className="font-mono text-red-400 font-bold">
                    {settings.tilt_meter.dangerThreshold}°
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="55"
                  step="1"
                  value={settings.tilt_meter.dangerThreshold}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      tilt_meter: {
                        ...settings.tilt_meter,
                        dangerThreshold: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-red-500"
                />
              </div>
            </div>
          )}

          {/* Weather Settings (User note: "比如说天气服务器，天气指那的天气") */}
          {activeBubbleId === 'weather' && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  {isEn ? 'Weather Source Location' : '天气数据源与位置'}
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        weather: { ...settings.weather, source: 'gps_auto' },
                      })
                    }
                    className={`p-2 rounded-lg text-xs font-bold border ${
                      settings.weather.source === 'gps_auto'
                        ? 'bg-lime-950 border-lime-500 text-lime-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {isEn ? '🛰️ Auto GPS Location' : '🛰️ 卫星当前自动定位'}
                  </button>
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        weather: { ...settings.weather, source: 'custom_city' },
                      })
                    }
                    className={`p-2 rounded-lg text-xs font-bold border ${
                      settings.weather.source === 'custom_city'
                        ? 'bg-lime-950 border-lime-500 text-lime-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {isEn ? '🏙️ Specific City' : '🏙️ 指定城市 / 目的地'}
                  </button>
                </div>

                {settings.weather.source === 'custom_city' && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {isEn ? 'City / Region Name' : '城市名称 (如：北京 / Shanghai / Tokyo)'}
                    </label>
                    <input
                      type="text"
                      value={settings.weather.city}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          weather: { ...settings.weather, city: e.target.value },
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  {isEn ? 'Temperature Units' : '温度单位显示'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'both', label: '°C & °F (草图)' },
                    { id: 'C', label: '仅摄氏度 °C' },
                    { id: 'F', label: '仅华氏度 °F' },
                  ].map((unit) => (
                    <button
                      key={unit.id}
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          weather: { ...settings.weather, tempUnit: unit.id as any },
                        })
                      }
                      className={`p-1.5 rounded-lg text-xs border ${
                        settings.weather.tempUnit === unit.id
                          ? 'bg-lime-950 border-lime-500 text-lime-200 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {unit.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Timer Settings (User note: "秒表可以倒计时......") */}
          {activeBubbleId === 'timer' && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  {isEn ? 'Timer Mode' : '计时器模式'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        timer: { ...settings.timer, mode: 'stopwatch' },
                      })
                    }
                    className={`p-2 rounded-lg text-xs font-bold border ${
                      settings.timer.mode === 'stopwatch'
                        ? 'bg-blue-950 border-blue-500 text-blue-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    ⏱️ {isEn ? 'Stopwatch (Count Up)' : '正计时秒表'}
                  </button>
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        timer: { ...settings.timer, mode: 'countdown' },
                      })
                    }
                    className={`p-2 rounded-lg text-xs font-bold border ${
                      settings.timer.mode === 'countdown'
                        ? 'bg-blue-950 border-blue-500 text-blue-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    ⏳ {isEn ? 'Countdown Timer' : '倒计时模式'}
                  </button>
                </div>
              </div>

              {settings.timer.mode === 'countdown' && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-300">
                      {isEn ? 'Custom Countdown Duration' : '自定义倒计时时长'}
                    </label>
                    <span className="text-blue-400 font-mono font-bold text-xs bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30">
                      {Math.floor(settings.timer.countdownSeconds / 60)} {isEn ? 'min' : '分'}{' '}
                      {settings.timer.countdownSeconds % 60} {isEn ? 'sec' : '秒'}
                    </span>
                  </div>

                  {/* Direct Minutes & Seconds Number Inputs */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-blue-500/20">
                    <div>
                      <span className="block text-[10px] text-slate-400 mb-1">
                        {isEn ? 'Minutes (0-360)' : '分钟 (0-360分)'}
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="360"
                          value={Math.floor(settings.timer.countdownSeconds / 60)}
                          onChange={(e) => {
                            const newMins = Math.max(0, Math.min(360, parseInt(e.target.value) || 0));
                            const currSecs = settings.timer.countdownSeconds % 60;
                            const total = Math.max(1, newMins * 60 + currSecs);
                            onUpdateSettings({
                              ...settings,
                              timer: { ...settings.timer, countdownSeconds: total },
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-sm font-bold text-white focus:border-blue-500 outline-none"
                        />
                        <span className="text-xs text-slate-400 font-medium">分</span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] text-slate-400 mb-1">
                        {isEn ? 'Seconds (0-59)' : '秒钟 (0-59秒)'}
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={settings.timer.countdownSeconds % 60}
                          onChange={(e) => {
                            const newSecs = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                            const currMins = Math.floor(settings.timer.countdownSeconds / 60);
                            const total = Math.max(1, currMins * 60 + newSecs);
                            onUpdateSettings({
                              ...settings,
                              timer: { ...settings.timer, countdownSeconds: total },
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-sm font-bold text-white focus:border-blue-500 outline-none"
                        />
                        <span className="text-xs text-slate-400 font-medium">秒</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stepper Adjusters */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {isEn ? 'Quick Stepper:' : '微调增减:'}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { delta: -60, label: '-1分' },
                        { delta: 60, label: '+1分' },
                        { delta: 300, label: '+5分' },
                        { delta: 600, label: '+10分' },
                      ].map((btn) => (
                        <button
                          key={btn.label}
                          type="button"
                          onClick={() => {
                            const newTotal = Math.max(10, settings.timer.countdownSeconds + btn.delta);
                            onUpdateSettings({
                              ...settings,
                              timer: { ...settings.timer, countdownSeconds: newTotal },
                            });
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 text-[11px] font-mono font-semibold text-slate-300 transition-all"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fast Preset Duration Pills */}
                  <div>
                    <span className="block text-[10px] text-slate-400 mb-1">
                      {isEn ? 'Common Presets' : '常用预设时长'}
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { secs: 30, label: '30秒' },
                        { secs: 60, label: '1分钟' },
                        { secs: 180, label: '3分钟' },
                        { secs: 300, label: '5分钟' },
                        { secs: 600, label: '10分' },
                        { secs: 900, label: '15分' },
                        { secs: 1200, label: '20分' },
                        { secs: 1800, label: '30分' },
                        { secs: 2700, label: '45分' },
                        { secs: 3600, label: '1小时' },
                      ].map((item) => (
                        <button
                          key={item.secs}
                          type="button"
                          onClick={() =>
                            onUpdateSettings({
                              ...settings,
                              timer: { ...settings.timer, countdownSeconds: item.secs },
                            })
                          }
                          className={`py-1 px-1 rounded text-center text-[10px] font-mono border transition-all ${
                            settings.timer.countdownSeconds === item.secs
                              ? 'bg-blue-600 text-white font-bold border-blue-400 shadow-sm'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Compass Settings */}
          {activeBubbleId === 'compass' && (
            <div className="space-y-3">
              {/* GPS Information Weighted Estimation Mode (用户核心需求: "指南针请增加一个GPS信息加权推算模式，谢谢") */}
              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  {isEn ? 'Heading Calculation & GPS Weighted Estimation' : '航向解算与GPS信息加权推算模式'}
                </label>
                <div className="text-[11px] text-slate-400 mb-2">
                  {isEn
                    ? 'In-cabin vehicle metal & electronics cause magnetic distortion. GPS provides accurate trajectory at speed.'
                    : '车厢内钢板与电磁环境会干扰地磁罗盘，GPS运动航迹可在行车中自动加权平准校正。'}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: 'auto_fusion',
                      label: isEn ? 'Smart Fusion' : '智能加权推算',
                      desc: isEn ? 'GPS + Mag dynamic' : '行车自动加权(推荐)',
                    },
                    {
                      id: 'gps_only',
                      label: isEn ? 'GPS Course' : '纯GPS航向',
                      desc: isEn ? 'Movement track' : '仅卫星运动航迹',
                    },
                    {
                      id: 'mag_only',
                      label: isEn ? 'Magnetic' : '纯地磁罗盘',
                      desc: isEn ? 'Sensor only' : '仅内置磁传感器',
                    },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          compass: { ...settings.compass, fusionMode: mode.id as any },
                        })
                      }
                      className={`p-2 rounded-lg text-left border transition-all ${
                        (settings.compass.fusionMode || 'auto_fusion') === mode.id
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-100 font-bold shadow-xs'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      <div className="text-xs">{mode.label}</div>
                      <div className="text-[10px] opacity-75 font-normal mt-0.5">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {(settings.compass.fusionMode || 'auto_fusion') === 'auto_fusion' && (
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-300 font-medium">
                        {isEn ? 'GPS Engagement Speed Threshold' : 'GPS加权介入起算车速'}
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {settings.compass.minSpeedKmh ?? 5} km/h
                      </span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="20"
                      step="1"
                      value={settings.compass.minSpeedKmh ?? 5}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          compass: {
                            ...settings.compass,
                            minSpeedKmh: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-emerald-500"
                    />
                    <div className="text-[10px] text-slate-400">
                      {isEn
                        ? 'Below this speed, compass maintains stable magnetic baseline at red lights & parking.'
                        : '低于此时速（如等红灯或停车），自动回退为地磁罗盘或锁定当前航向。'}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-300 font-medium">
                        {isEn ? 'Max GPS Track Weight at High Speed' : '高速巡航GPS最大加权比重'}
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {Math.round((settings.compass.gpsWeightMax ?? 0.90) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      value={settings.compass.gpsWeightMax ?? 0.90}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          compass: {
                            ...settings.compass,
                            gpsWeightMax: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-emerald-500"
                    />
                    <div className="text-[10px] text-slate-400">
                      {isEn
                        ? 'Higher weight strongly eliminates cabin electromagnetic distortion during highway travel.'
                        : '建议90%以上，可彻底消除车内音响、空调电机及钢结构对指南针的偏移干扰。'}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-300">
                    {isEn ? '3D Sphere Perspective Depth' : '3D立体透视球深度感'}
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {settings.compass.spherePerspective}px
                  </span>
                </div>
                <input
                  type="range"
                  min="300"
                  max="1000"
                  step="50"
                  value={settings.compass.spherePerspective}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      compass: {
                        ...settings.compass,
                        spherePerspective: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Coordinates Settings */}
          {activeBubbleId === 'coords' && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  {isEn ? 'Format' : '坐标格式'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        coords: { ...settings.coords, format: 'dms' },
                      })
                    }
                    className={`p-2 rounded-lg text-xs font-bold border ${
                      settings.coords.format === 'dms'
                        ? 'bg-amber-950 border-amber-500 text-amber-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    度分秒 (DMS 如草图)
                  </button>
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        coords: { ...settings.coords, format: 'decimal' },
                      })
                    }
                    className={`p-2 rounded-lg text-xs font-bold border ${
                      settings.coords.format === 'decimal'
                        ? 'bg-amber-950 border-amber-500 text-amber-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    十进制经纬度 (DD)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span>{isEn ? 'Show Altitude' : '显示卫星海拔高度'}</span>
                <input
                  type="checkbox"
                  checked={settings.coords.showAltitude}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      coords: { ...settings.coords, showAltitude: e.target.checked },
                    })
                  }
                  className="w-4 h-4 accent-amber-500 rounded"
                />
              </div>
            </div>
          )}

          {/* Driving Data Settings */}
          {activeBubbleId === 'driving_data' && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">
                  {isEn ? 'Distance Unit' : '距离单位'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        driving_data: { ...settings.driving_data, distanceUnit: 'km', speedUnit: 'km/h' },
                      })
                    }
                    className={`p-2 rounded-lg text-xs font-bold border ${
                      settings.driving_data.distanceUnit === 'km'
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    公里 (KM / km/h)
                  </button>
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        driving_data: { ...settings.driving_data, distanceUnit: 'mi', speedUnit: 'mph' },
                      })
                    }
                    className={`p-2 rounded-lg text-xs font-bold border ${
                      settings.driving_data.distanceUnit === 'mi'
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    英里 (Miles / mph)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Curves Graph Settings */}
          {(activeBubbleId === 'speed_graph' || activeBubbleId === 'accel_graph') && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-300">
                    {isEn ? 'Time Window' : '时间记录窗口 (秒)'}
                  </span>
                  <span className="font-mono text-pink-400 font-bold">
                    {activeBubbleId === 'speed_graph'
                      ? settings.speed_graph.timeWindowSec
                      : settings.accel_graph.timeWindowSec}
                    s
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 120].map((w) => (
                    <button
                      key={w}
                      onClick={() =>
                        activeBubbleId === 'speed_graph'
                          ? onUpdateSettings({
                              ...settings,
                              speed_graph: { ...settings.speed_graph, timeWindowSec: w },
                            })
                          : onUpdateSettings({
                              ...settings,
                              accel_graph: { ...settings.accel_graph, timeWindowSec: w },
                            })
                      }
                      className="py-1.5 px-3 rounded-lg font-mono text-xs bg-slate-800 hover:bg-slate-750 border border-slate-700"
                    >
                      {w}秒 / s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          {onHideBubble ? (
            <button
              onClick={() => {
                onHideBubble(activeBubbleId);
                onClose();
              }}
              title="在屏幕上隐藏此泡泡以减少总泡数（可在顶栏“初始化排列”一键全部恢复）"
              className="px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>{isEn ? 'Close Bubble (Hide)' : '关闭此泡泡 (减少总泡数)'}</span>
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow"
          >
            {isEn ? 'Done' : '完成保存'}
          </button>
        </div>
      </div>
    </div>
  );
};
