import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { colors } from '@/theme/tokens';

export type ChartPoint = { value: number; date: string; flag?: string };

/**
 * Minimal brand line chart: emerald line with soft gradient fill,
 * dots colored by flag, first and last date labels.
 */
export function LineChart({
  points,
  width,
  height = 160,
}: {
  points: ChartPoint[];
  width: number;
  height?: number;
}) {
  if (points.length === 0 || width <= 0) return null;

  const pad = { top: 16, bottom: 26, left: 12, right: 12 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const x = (i: number) => pad.left + (points.length === 1 ? w / 2 : (i / (points.length - 1)) * w);
  const y = (v: number) => pad.top + h - ((v - min) / span) * h;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.value)}`).join(' ');
  const areaPath = `${linePath} L ${x(points.length - 1)} ${pad.top + h} L ${x(0)} ${pad.top + h} Z`;

  function dotColor(flag?: string) {
    const f = (flag ?? 'normal').toLowerCase();
    if (f.includes('critical')) return colors.statusCritical;
    if (f.includes('elevated') || f.includes('high') || f.includes('low') || f.includes('abnormal'))
      return colors.statusElevated;
    return colors.emerald;
  }

  function shortDate(d: string) {
    const date = new Date(d);
    return `${date.getDate()}.${date.getMonth() + 1}.${String(date.getFullYear()).slice(2)}`;
  }

  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.emerald} stopOpacity="0.25" />
            <Stop offset="1" stopColor={colors.emerald} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {points.length > 1 && <Path d={areaPath} fill="url(#fill)" />}
        <Path d={linePath} stroke={colors.emerald} strokeWidth={2} fill="none" strokeLinejoin="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={x(i)} cy={y(p.value)} r={4} fill={dotColor(p.flag)} />
        ))}
        <SvgText x={pad.left} y={height - 8} fill="rgba(11,31,23,0.45)" fontSize="10">
          {shortDate(points[0].date)}
        </SvgText>
        <SvgText x={width - pad.right} y={height - 8} fill="rgba(11,31,23,0.45)" fontSize="10" textAnchor="end">
          {shortDate(points[points.length - 1].date)}
        </SvgText>
        <SvgText x={pad.left} y={12} fill="rgba(11,31,23,0.45)" fontSize="10">
          {String(max)}
        </SvgText>
      </Svg>
    </View>
  );
}
