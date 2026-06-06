import * as Haptics from 'expo-haptics';

// Fire-and-forget haptics. No-ops on web; safe on iOS + Android.
const safe = (p: Promise<void>) => {
  p.catch(() => {});
};

/** Light tick for selections / toggles. */
export const hapticSelect = () => safe(Haptics.selectionAsync());

/** A satisfying confirmation for a completed action (logged, finished). */
export const hapticSuccess = () =>
  safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));

/** A medium tap for a primary action. */
export const hapticImpact = (
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light,
) => safe(Haptics.impactAsync(style));

export { Haptics };
