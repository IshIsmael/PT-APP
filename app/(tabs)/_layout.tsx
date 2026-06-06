import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Dark-first tab bar. Colors mirror tailwind.config.js tokens (finalized in Phase 8).
const ACTIVE = '#6EE7B7';
const INACTIVE = '#6B6B76';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName) {
  const Icon = ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  );
  Icon.displayName = `TabIcon(${name})`;
  return Icon;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: '#16161D',
          borderTopColor: '#26262F',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="plan" options={{ title: 'Plan', tabBarIcon: tabIcon('barbell') }} />
      <Tabs.Screen
        name="nutrition"
        options={{ title: 'Nutrition', tabBarIcon: tabIcon('restaurant') }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progress', tabBarIcon: tabIcon('stats-chart') }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: tabIcon('person') }} />
    </Tabs>
  );
}
