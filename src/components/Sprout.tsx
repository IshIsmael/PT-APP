import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

const SAGE = '#9CA87E';
const SAGE_DEEP = '#7E8C63';
const SOIL = '#5A4636';
const POT = '#C8624A';
const HONEY = '#E6B84C';
const TERRA = '#E07A5F';

// Tola's signature: a plant that grows with your streak.
// 0 = a seed in soil · grows a stem + leaf pairs every few days · flowers at 30.
export function Sprout({ streak, size = 120 }: { streak: number; size?: number }) {
  const growth = Math.min(Math.max(streak, 0) / 30, 1);
  const soilY = 94;
  const stemTopY = streak <= 0 ? soilY : 90 - growth * 58;
  const pairs = streak <= 0 ? 0 : Math.min(Math.floor(streak / 3) + 1, 4);
  const flowering = streak >= 30;

  const leafYs: number[] = [];
  for (let i = 0; i < pairs; i++) {
    const t = (i + 1) / (pairs + 1);
    leafYs.push(soilY - (soilY - stemTopY) * t);
  }

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 110">
        {/* Pot + soil */}
        <Path d="M30 94 L70 94 L66 108 L34 108 Z" fill={POT} />
        <Ellipse cx={50} cy={94} rx={20} ry={4} fill={SOIL} />

        {streak <= 0 ? (
          <Circle cx={50} cy={90} r={4} fill={SAGE_DEEP} />
        ) : (
          <G>
            <Path
              d={`M50 ${soilY} L50 ${stemTopY}`}
              stroke={SAGE_DEEP}
              strokeWidth={3}
              strokeLinecap="round"
            />
            {leafYs.map((y, i) => (
              <G key={i}>
                <Ellipse
                  cx={42}
                  cy={y}
                  rx={9}
                  ry={5}
                  fill={SAGE}
                  transform={`rotate(-35 42 ${y})`}
                />
                <Ellipse
                  cx={58}
                  cy={y}
                  rx={9}
                  ry={5}
                  fill={SAGE}
                  transform={`rotate(35 58 ${y})`}
                />
              </G>
            ))}
            {flowering ? (
              <G>
                {[0, 72, 144, 216, 288].map((a) => (
                  <Ellipse
                    key={a}
                    cx={50}
                    cy={stemTopY}
                    rx={4}
                    ry={8}
                    fill={TERRA}
                    transform={`rotate(${a} 50 ${stemTopY})`}
                  />
                ))}
                <Circle cx={50} cy={stemTopY} r={4} fill={HONEY} />
              </G>
            ) : (
              <Circle cx={50} cy={stemTopY} r={3.5} fill={SAGE} />
            )}
          </G>
        )}
      </Svg>
    </View>
  );
}
