import React, { useMemo } from 'react';
import { useBeacons } from '../hooks/useBeacons';
import { beaconDisplayName, gatewayDisplayName } from '../utils/beaconDisplay';

const chartMinTemp = 10;
const chartMaxTemp = 45;

const GATEWAY_COLORS = [
  '#00b8d4', '#7c4dff', '#ff6d00', '#00c853', '#d500f9',
  '#2962ff', '#c62828', '#00897b', '#f9a825', '#5e35b1',
];

const SEGMENT_COLORS = [
  '#00b8d4', '#7c4dff', '#ff6d00', '#00c853', '#d500f9',
  '#2962ff', '#c62828', '#00897b', '#f9a825', '#5e35b1',
];

function truncateLabel(text, max = 14) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function tempToPlotY(t, topPad, plotHeight) {
  const clamped = Math.max(chartMinTemp, Math.min(chartMaxTemp, t));
  return topPad + plotHeight - ((clamped - chartMinTemp) / (chartMaxTemp - chartMinTemp)) * plotHeight;
}

/** X = Beacon 名稱，Y = 溫度 (°C) */
function TemperatureBarChart({ data }) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted">
        尚未有可用溫度資料
      </div>
    );
  }

  const width = Math.max(760, 120 + data.length * 72);
  const height = 360;
  const leftPad = 52;
  const rightPad = 24;
  const topPad = 16;
  const bottomPad = 88;
  const plotWidth = width - leftPad - rightPad;
  const plotHeight = height - topPad - bottomPad;
  const baseline = height - bottomPad;
  const slotWidth = plotWidth / data.length;
  const barWidth = Math.min(48, slotWidth * 0.65);
  const gridTemps = [10, 15, 20, 25, 30, 35, 40, 45];

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[360px]" style={{ minWidth: `${Math.min(width, 1200)}px` }}>
        {gridTemps.map((t) => {
          const y = tempToPlotY(t, topPad, plotHeight);
          return (
            <g key={t}>
              <line x1={leftPad} y1={y} x2={width - rightPad} y2={y} stroke="currentColor" strokeOpacity="0.12" />
              <text x={leftPad - 8} y={y + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.7">{t}°C</text>
            </g>
          );
        })}

        <line x1={leftPad} y1={topPad} x2={leftPad} y2={baseline} stroke="currentColor" strokeOpacity="0.2" />
        <line x1={leftPad} y1={baseline} x2={width - rightPad} y2={baseline} stroke="currentColor" strokeOpacity="0.2" />

        {data.map((d, i) => {
          const cx = leftPad + i * slotWidth + slotWidth / 2;
          const barX = cx - barWidth / 2;
          const barTop = tempToPlotY(d.temp, topPad, plotHeight);
          const barH = baseline - barTop;
          return (
            <g key={d.mac}>
              <rect
                x={barX}
                y={barTop}
                width={barWidth}
                height={Math.max(barH, 2)}
                rx="3"
                fill="#00b8d4"
                opacity="0.9"
              />
              <text x={cx} y={barTop - 6} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.85">
                {d.temp}°C
              </text>
              <text
                x={cx}
                y={baseline + 36}
                textAnchor="end"
                fontSize="10"
                fill="currentColor"
                opacity="0.85"
                transform={`rotate(-35, ${cx}, ${baseline + 36})`}
              >
                {truncateLabel(d.beaconName, 18)}
              </text>
              <title>{`${d.beaconName}: ${d.temp}°C`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Donut segment; handles full 360° rings (single gateway). */
function describeDonutSegment(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const sweep = endAngle - startAngle;
  if (sweep >= 359.999) {
    return [
      `M ${cx - rOuter} ${cy}`,
      `A ${rOuter} ${rOuter} 0 1 1 ${cx + rOuter} ${cy}`,
      `A ${rOuter} ${rOuter} 0 1 1 ${cx - rOuter} ${cy}`,
      `M ${cx - rInner} ${cy}`,
      `A ${rInner} ${rInner} 0 1 0 ${cx + rInner} ${cy}`,
      `A ${rInner} ${rInner} 0 1 0 ${cx - rInner} ${cy}`,
      'Z',
    ].join(' ');
  }

  const startOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const endOuter = polarToCartesian(cx, cy, rOuter, endAngle);
  const startInner = polarToCartesian(cx, cy, rInner, endAngle);
  const endInner = polarToCartesian(cx, cy, rInner, startAngle);
  const largeArc = sweep > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ');
}

function beaconShade(baseHex, index, total) {
  if (total <= 1) return baseHex;
  const t = 0.45 + (index / Math.max(total - 1, 1)) * 0.45;
  const r = parseInt(baseHex.slice(1, 3), 16);
  const g = parseInt(baseHex.slice(3, 5), 16);
  const b = parseInt(baseHex.slice(5, 7), 16);
  const mix = (c) => Math.round(c * t + 255 * (1 - t));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/**
 * 雙層圓餅：內圈 = Gateway，外圈 = 該 Gateway 內的 Beacon
 */
function GatewayBeaconPieChart({ groups }) {
  const total = groups.reduce((sum, g) => sum + g.beacons.length, 0);

  if (total === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted text-sm">
        尚無 Beacon 資料
      </div>
    );
  }

  const cx = 130;
  const cy = 130;
  const rOuter = 108;
  const rMid = 78;
  const rInner = 48;
  let angle = 0;

  const gatewayArcs = [];
  const beaconArcs = [];

  groups.forEach((group, gi) => {
    const gatewayColor = GATEWAY_COLORS[gi % GATEWAY_COLORS.length];
    const gatewaySweep = (group.beacons.length / total) * 360;
    const gwStart = angle;
    const gwEnd = angle + gatewaySweep;

    gatewayArcs.push({
      key: group.location,
      path: describeDonutSegment(cx, cy, rMid, rInner, gwStart, gwEnd),
      color: gatewayColor,
      location: group.location,
      count: group.beacons.length,
    });

    const beaconSweep = group.beacons.length > 0 ? gatewaySweep / group.beacons.length : 0;
    group.beacons.forEach((beacon, bi) => {
      const bStart = angle + bi * beaconSweep;
      const bEnd = bStart + beaconSweep;
      beaconArcs.push({
        key: beacon.mac,
        path: describeDonutSegment(cx, cy, rOuter, rMid + 2, bStart, bEnd),
        color: beaconShade(gatewayColor, bi, group.beacons.length),
        name: beacon.name,
        location: group.location,
      });
    });

    angle = gwEnd;
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 h-full">
      <svg viewBox="0 0 260 260" className="w-[220px] h-[220px] shrink-0" role="img" aria-label="Gateway and beacon pie chart">
        <circle cx={cx} cy={cy} r={rOuter + 4} fill="none" stroke="currentColor" strokeOpacity="0.08" />
        {beaconArcs.map((a) => (
          <path key={a.key} d={a.path} fill={a.color} stroke="#fff" strokeWidth="0.6" opacity="0.95">
            <title>{`${a.name} · ${a.location}`}</title>
          </path>
        ))}
        {gatewayArcs.map((a) => (
          <path key={`gw-${a.key}`} d={a.path} fill={a.color} opacity="0.88" stroke="#fff" strokeWidth="0.8">
            <title>{`${a.location}: ${a.count} beacons`}</title>
          </path>
        ))}
        <circle cx={cx} cy={cy} r={rInner - 2} style={{ fill: 'var(--color-card)' }} stroke="currentColor" strokeOpacity="0.1" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="20" fontWeight="700" fill="currentColor">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.65">Beacons</text>
      </svg>
      <ul className="flex-1 space-y-3 text-sm min-w-0 max-h-[280px] overflow-y-auto">
        {groups.map((g, gi) => (
          <li key={g.location}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: GATEWAY_COLORS[gi % GATEWAY_COLORS.length] }} />
              <span className="truncate font-medium" title={g.location}>{g.location}</span>
              <span className="text-muted shrink-0">{g.beacons.length}</span>
            </div>
            <p className="text-xs text-muted pl-5 truncate" title={g.beacons.map((b) => b.name).join(', ')}>
              {g.beacons.map((b) => b.name).join(', ')}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LocationBeaconStripChart({ groups }) {
  if (groups.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted">
        尚無 Location 資料
      </div>
    );
  }

  const rowHeight = 44;
  const labelWidth = 140;
  const width = 900;
  const height = 24 + groups.length * rowHeight;
  const barLeft = labelWidth + 12;
  const barWidth = width - barLeft - 16;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: '640px', height: `${height}px` }}>
        {groups.map((group, rowIndex) => {
          const y = 20 + rowIndex * rowHeight;
          const n = group.beacons.length;
          const segW = n > 0 ? barWidth / n : barWidth;
          return (
            <g key={group.location}>
              <text
                x={labelWidth - 8}
                y={y + 16}
                textAnchor="end"
                fontSize="12"
                fill="currentColor"
                fontWeight="600"
              >
                {truncateLabel(group.location, 16)}
              </text>
              <text x={labelWidth - 8} y={y + 30} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.55">
                {n} beacon{n !== 1 ? 's' : ''}
              </text>
              <rect x={barLeft} y={y} width={barWidth} height={28} rx="6" fill="currentColor" fillOpacity="0.06" />
              {group.beacons.map((beacon, i) => {
                const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
                return (
                  <g key={beacon.mac}>
                    <rect
                      x={barLeft + i * segW + 1}
                      y={y + 1}
                      width={Math.max(segW - 2, 4)}
                      height={26}
                      rx="5"
                      fill={color}
                      opacity="0.88"
                    />
                    <text
                      x={barLeft + i * segW + segW / 2}
                      y={y + 18}
                      textAnchor="middle"
                      fontSize={segW > 56 ? 10 : 9}
                      fill="#fff"
                      fontWeight="500"
                    >
                      {truncateLabel(beacon.name, segW > 72 ? 12 : 6)}
                    </text>
                    <title>{`${beacon.name} @ ${group.location}${beacon.temp != null ? ` · ${beacon.temp}°C` : ''}`}</title>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function groupBeaconsByLocation(beaconList) {
  const map = new Map();
  beaconList.forEach((b) => {
    const location = gatewayDisplayName(b) || 'Unknown Location';
    if (!map.has(location)) map.set(location, []);
    map.get(location).push({
      mac: b.mac_addr,
      name: beaconDisplayName(b),
      temp: b.temp != null ? Number(b.temp) : null,
      status: b.status,
    });
  });

  return [...map.entries()]
    .map(([location, beacons]) => ({
      location,
      beacons: beacons.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true })),
      count: beacons.length,
    }))
    .sort((a, b) => a.location.localeCompare(b.location, undefined, { sensitivity: 'base', numeric: true }));
}

export const Dashboard = () => {
  const { beaconList, isConnected } = useBeacons();

  const chartData = useMemo(() => (
    beaconList
      .filter((b) => b.temp != null)
      .map((b) => ({
        mac: b.mac_addr,
        beaconName: beaconDisplayName(b),
        temp: Number(b.temp),
      }))
  ), [beaconList]);

  const locationGroups = useMemo(() => groupBeaconsByLocation(beaconList), [beaconList]);

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display">Dashboard</h2>
        <div className="text-sm text-muted">
          {beaconList.length} beacons · {isConnected ? 'Socket Connected' : 'Socket Disconnected'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 lg:col-span-2">
          <h3 className="text-lg font-bold mb-4">Dashboard 1: Temperature Bar Chart</h3>
          <div className="h-[380px]">
            <TemperatureBarChart data={chartData} />
          </div>
        </div>

        <div className="glass-panel p-6 min-h-[380px]">
          <h3 className="text-lg font-bold mb-4">Dashboard 2: Gateway &amp; Beacon Pie Chart</h3>
          <div className="h-[320px]">
            <GatewayBeaconPieChart groups={locationGroups} />
          </div>
        </div>

        <div className="glass-panel p-6 lg:col-span-3">
          <h3 className="text-lg font-bold mb-4">Dashboard 3: Beacon Assignment by Location</h3>
          <div className="min-h-[200px] py-2">
            <LocationBeaconStripChart groups={locationGroups} />
          </div>
        </div>
      </div>
    </div>
  );
};
