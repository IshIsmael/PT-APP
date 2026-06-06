import { Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

type Props = {
  consumedKcal: number;
  targetKcal: number;
  protein: number;
  carbs: number;
  fat: number;
  size?: number;
};

// Calorie ring filled by protein/carbs/fat segments (by kcal share of target).
export function MacroRing({ consumedKcal, targetKcal, protein, carbs, fat, size = 210 }: Props) {
  const stroke = 18;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;
  const target = Math.max(targetKcal, 1);

  const rawSegs = [
    { frac: (protein * 4) / target, color: '#60A5FA' },
    { frac: (carbs * 4) / target, color: '#FBBF24' },
    { frac: (fat * 9) / target, color: '#F472B6' },
  ];

  let cum = 0;
  const arcs = rawSegs.map((s) => {
    const f = Math.max(Math.min(s.frac, 1 - cum), 0);
    const startFrac = cum;
    cum += f;
    return { color: s.color, f, startFrac };
  });

  const remaining = Math.round(targetKcal - consumedKcal);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${cx}, ${cy}`}>
          <Circle cx={cx} cy={cy} r={r} stroke="#1F1F29" strokeWidth={stroke} fill="none" />
          {arcs.map((a, i) =>
            a.f > 0 ? (
              <Circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                stroke={a.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${a.f * C} ${C}`}
                strokeDashoffset={-a.startFrac * C}
                strokeLinecap="butt"
              />
            ) : null,
          )}
        </G>
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text className="text-4xl font-bold text-fg">{Math.round(consumedKcal)}</Text>
        <Text className="text-xs text-fg-faint">/ {Math.round(targetKcal)} kcal</Text>
        <Text className="mt-1 text-xs text-fg-muted">
          {remaining > 0 ? `${remaining} left` : 'target hit'}
        </Text>
      </View>
    </View>
  );
}
