import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

// Line chart for a numeric series (e.g. body weight). Width is measured so the
// stroke isn't distorted by viewBox scaling.
export function TrendLine({
  data,
  height = 130,
  color = '#6EE7B7',
}: {
  data: { day: string; value: number }[];
  height?: number;
  color?: string;
}) {
  const [width, setWidth] = useState(0);
  const pad = 10;

  if (data.length < 2) {
    return (
      <View style={{ height }} className="items-center justify-center rounded-2xl bg-bg-subtle">
        <Text className="text-sm text-fg-faint">Not enough data yet</Text>
      </View>
    );
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const x = (i: number) => pad + (i / (data.length - 1)) * (width - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / range) * (height - pad * 2);
  const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Polyline points={points} fill="none" stroke={color} strokeWidth={2.5} />
          <Circle cx={x(data.length - 1)} cy={y(values[values.length - 1])} r={4} fill={color} />
        </Svg>
      )}
    </View>
  );
}

// Simple bar chart (0..1 fractions), e.g. daily adherence. View-based.
export function Bars({
  data,
  height = 90,
  color = '#6EE7B7',
}: {
  data: { label: string; frac: number }[];
  height?: number;
  color?: string;
}) {
  if (data.length === 0) {
    return (
      <View style={{ height }} className="items-center justify-center rounded-2xl bg-bg-subtle">
        <Text className="text-sm text-fg-faint">No data yet</Text>
      </View>
    );
  }
  return (
    <View style={{ height }} className="flex-row items-end gap-1">
      {data.map((d, i) => (
        <View key={i} className="flex-1 justify-end">
          <View
            style={{
              height: `${Math.max(Math.min(d.frac, 1), 0.02) * 100}%`,
              backgroundColor: color,
            }}
            className="rounded-t-sm"
          />
        </View>
      ))}
    </View>
  );
}
