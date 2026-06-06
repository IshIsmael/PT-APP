import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/lib/auth';
import { computeTargets } from '../../src/lib/nutrition';
import { feetInchesToCm, lbToKg } from '../../src/lib/units';
import {
  Chip,
  ChoiceCard,
  Field,
  PrimaryButton,
  ProgressBar,
  StepHeader,
  StepShell,
} from '../../src/components/onboarding-ui';
import { Sprout } from '../../src/components/Sprout';

type Units = 'metric' | 'imperial';
type Sex = 'male' | 'female' | 'unspecified';
type Goal = 'lose_fat' | 'build_muscle' | 'maintain' | 'recomp';
type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type DietStyle = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian';
type Equipment = 'full_gym' | 'home' | 'bodyweight';

const TOTAL_STEPS = 11;
const CURRENT_YEAR = new Date().getFullYear();

const ALLERGENS = ['dairy', 'gluten', 'nuts', 'eggs', 'soy', 'shellfish'];

function localDay(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export default function Onboarding() {
  const { session, refreshOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Draft intake
  const [name, setName] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [birthYear, setBirthYear] = useState('');
  const [units, setUnits] = useState<Units>('metric');
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weight, setWeight] = useState(''); // in display units
  const [goal, setGoal] = useState<Goal | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [targetWeight, setTargetWeight] = useState(''); // display units
  const [weeklyRate, setWeeklyRate] = useState(0.5); // kg/week
  const [trainingDays, setTrainingDays] = useState<number | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [dietStyle, setDietStyle] = useState<DietStyle>('omnivore');
  const [extraTags, setExtraTags] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [mealsPerDay, setMealsPerDay] = useState<number | null>(null);
  const [planChoice, setPlanChoice] = useState<'smart' | 'own' | null>(null);

  // Canonical metric values
  const canonHeightCm = useMemo(() => {
    if (units === 'metric') return parseFloat(heightCm) || 0;
    return feetInchesToCm(parseInt(heightFt) || 0, parseInt(heightIn) || 0);
  }, [units, heightCm, heightFt, heightIn]);

  const canonWeightKg = useMemo(() => {
    const w = parseFloat(weight) || 0;
    return units === 'metric' ? w : lbToKg(w);
  }, [units, weight]);

  const canonTargetKg = useMemo(() => {
    const w = parseFloat(targetWeight) || 0;
    if (!w) return null;
    return units === 'metric' ? w : lbToKg(w);
  }, [units, targetWeight]);

  const weightSuffix = units === 'metric' ? 'kg' : 'lb';
  const needsTarget = goal === 'lose_fat' || goal === 'build_muscle' || goal === 'recomp';

  const canContinue = (): boolean => {
    switch (step) {
      case 0:
        return name.trim().length > 0;
      case 1: {
        const y = parseInt(birthYear);
        return !!sex && y >= 1920 && y <= CURRENT_YEAR - 13;
      }
      case 2:
        return true;
      case 3:
        return canonHeightCm > 50 && canonWeightKg > 20;
      case 4:
        return !!goal;
      case 5:
        return !!activity;
      case 6:
        return !needsTarget || (canonTargetKg ?? 0) > 20;
      case 7:
        return trainingDays !== null && !!equipment;
      case 8:
        return true; // dietStyle always has a default
      case 9:
        return mealsPerDay !== null;
      case 10:
        return !!planChoice;
      default:
        return false;
    }
  };

  async function finish() {
    if (!session) return;
    setSaving(true);
    try {
      const age = CURRENT_YEAR - (parseInt(birthYear) || CURRENT_YEAR);
      const targets = computeTargets({
        weightKg: canonWeightKg,
        heightCm: canonHeightCm,
        age,
        sex: sex ?? 'unspecified',
        activityLevel: activity ?? 'moderate',
        goalType: goal ?? 'maintain',
        weeklyRateKg: needsTarget ? weeklyRate : 0,
      });

      const dietTags = [...(dietStyle === 'omnivore' ? [] : [dietStyle]), ...extraTags];
      const equipmentArr =
        equipment === 'full_gym'
          ? ['full_gym']
          : equipment === 'home'
            ? ['dumbbells', 'bands']
            : ['bodyweight'];

      const userId = session.user.id;

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          display_name: name.trim(),
          sex: sex ?? 'unspecified',
          birth_date: `${birthYear}-01-01`,
          height_cm: Math.round(canonHeightCm * 10) / 10,
          unit_preference: units,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', userId);
      if (profileErr) throw profileErr;

      // Retire any previous active goal first, so re-running onboarding is clean.
      await supabase
        .from('user_goals')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      const { error: goalErr } = await supabase.from('user_goals').insert({
        user_id: userId,
        goal_type: goal ?? 'maintain',
        activity_level: activity ?? 'moderate',
        target_weight_kg: canonTargetKg,
        weekly_rate_kg: needsTarget ? weeklyRate : null,
        training_days_per_week: trainingDays ?? 3,
        meals_per_day: mealsPerDay ?? 3,
        diet_tags: dietTags,
        excluded_allergens: allergens,
        equipment: equipmentArr,
        ...targets,
        is_active: true,
      });
      if (goalErr) throw goalErr;

      // Baseline weight for analytics (upsert so re-onboarding the same day is safe).
      await supabase.from('weight_logs').upsert(
        {
          user_id: userId,
          weight_kg: Math.round(canonWeightKg * 100) / 100,
          source: 'manual',
          day: localDay(),
        },
        { onConflict: 'user_id,day,source' },
      );

      await refreshOnboarding();
      // Root navigator routes to (tabs) once onboardingComplete flips true.
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
      setSaving(false);
    }
  }

  function next() {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else finish();
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="gap-3 px-6 pb-4 pt-2">
          <View className="flex-row items-center justify-between">
            <View className="w-16">
              {step > 0 && (
                <Pressable onPress={() => setStep((s) => s - 1)} hitSlop={12}>
                  <Text className="text-base text-fg-muted">‹ Back</Text>
                </Pressable>
              )}
            </View>
            {/* The sprout grows as you move through setup — you're already growing. */}
            <Sprout streak={Math.round(((step + 1) / TOTAL_STEPS) * 30)} size={52} />
            <Text className="w-16 text-right text-xs text-fg-faint">
              {step + 1} / {TOTAL_STEPS}
            </Text>
          </View>
          <ProgressBar step={step} total={TOTAL_STEPS} />
        </View>

        <ScrollView
          contentContainerClassName="px-6 pb-6 flex-grow"
          keyboardShouldPersistTaps="handled"
        >
          <StepShell
            footer={
              <PrimaryButton
                label={step === TOTAL_STEPS - 1 ? 'Finish setup' : 'Continue'}
                onPress={next}
                disabled={!canContinue()}
                loading={saving}
              />
            }
          >
            {step === 0 && (
              <>
                <StepHeader title="Welcome to Tola" subtitle="What should we call you?" />
                <Field value={name} onChangeText={setName} placeholder="Your name" />
              </>
            )}

            {step === 1 && (
              <>
                <StepHeader title="About you" subtitle="Used to tailor your calorie targets." />
                <View className="gap-2">
                  {(['male', 'female', 'unspecified'] as Sex[]).map((s) => (
                    <ChoiceCard
                      key={s}
                      label={
                        s === 'unspecified' ? 'Prefer not to say' : s[0].toUpperCase() + s.slice(1)
                      }
                      selected={sex === s}
                      onPress={() => setSex(s)}
                    />
                  ))}
                </View>
                <Field
                  value={birthYear}
                  onChangeText={setBirthYear}
                  placeholder="Year of birth (e.g. 1998)"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </>
            )}

            {step === 2 && (
              <>
                <StepHeader title="Units" subtitle="You can change this later." />
                <View className="gap-2">
                  <ChoiceCard
                    label="Metric (kg, cm)"
                    selected={units === 'metric'}
                    onPress={() => setUnits('metric')}
                  />
                  <ChoiceCard
                    label="Imperial (lb, ft/in)"
                    selected={units === 'imperial'}
                    onPress={() => setUnits('imperial')}
                  />
                </View>
              </>
            )}

            {step === 3 && (
              <>
                <StepHeader title="Your measurements" subtitle="Height and current weight." />
                {units === 'metric' ? (
                  <Field
                    value={heightCm}
                    onChangeText={setHeightCm}
                    placeholder="Height"
                    keyboardType="numeric"
                    suffix="cm"
                  />
                ) : (
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Field
                        value={heightFt}
                        onChangeText={setHeightFt}
                        placeholder="Height"
                        keyboardType="number-pad"
                        suffix="ft"
                      />
                    </View>
                    <View className="flex-1">
                      <Field
                        value={heightIn}
                        onChangeText={setHeightIn}
                        placeholder=""
                        keyboardType="number-pad"
                        suffix="in"
                      />
                    </View>
                  </View>
                )}
                <Field
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Current weight"
                  keyboardType="numeric"
                  suffix={weightSuffix}
                />
              </>
            )}

            {step === 4 && (
              <>
                <StepHeader title="Your goal" subtitle="What are you here to do?" />
                <View className="gap-2">
                  <ChoiceCard
                    label="Lose fat"
                    description="Calorie deficit, keep your muscle."
                    selected={goal === 'lose_fat'}
                    onPress={() => setGoal('lose_fat')}
                  />
                  <ChoiceCard
                    label="Build muscle"
                    description="Slight surplus, progressive overload."
                    selected={goal === 'build_muscle'}
                    onPress={() => setGoal('build_muscle')}
                  />
                  <ChoiceCard
                    label="Maintain / get healthier"
                    description="Hold weight, build the habit."
                    selected={goal === 'maintain'}
                    onPress={() => setGoal('maintain')}
                  />
                  <ChoiceCard
                    label="Body recomposition"
                    description="Lose fat + build muscle together."
                    selected={goal === 'recomp'}
                    onPress={() => setGoal('recomp')}
                  />
                </View>
              </>
            )}

            {step === 5 && (
              <>
                <StepHeader title="Activity level" subtitle="Outside of your training." />
                <View className="gap-2">
                  <ChoiceCard
                    label="Sedentary"
                    description="Desk job, little movement."
                    selected={activity === 'sedentary'}
                    onPress={() => setActivity('sedentary')}
                  />
                  <ChoiceCard
                    label="Lightly active"
                    description="On your feet sometimes."
                    selected={activity === 'light'}
                    onPress={() => setActivity('light')}
                  />
                  <ChoiceCard
                    label="Moderately active"
                    description="Regular movement / steps."
                    selected={activity === 'moderate'}
                    onPress={() => setActivity('moderate')}
                  />
                  <ChoiceCard
                    label="Active"
                    description="Physical job or lots of steps."
                    selected={activity === 'active'}
                    onPress={() => setActivity('active')}
                  />
                  <ChoiceCard
                    label="Very active"
                    description="Hard physical work."
                    selected={activity === 'very_active'}
                    onPress={() => setActivity('very_active')}
                  />
                </View>
              </>
            )}

            {step === 6 && (
              <>
                <StepHeader
                  title="Target"
                  subtitle={
                    needsTarget
                      ? 'Where do you want to get to?'
                      : 'Maintaining — no target weight needed.'
                  }
                />
                {needsTarget ? (
                  <>
                    <Field
                      value={targetWeight}
                      onChangeText={setTargetWeight}
                      placeholder="Target weight"
                      keyboardType="numeric"
                      suffix={weightSuffix}
                    />
                    <Text className="text-sm text-fg-muted">Weekly pace</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {[0.25, 0.5, 0.75].map((r) => (
                        <Chip
                          key={r}
                          label={`${units === 'metric' ? r + ' kg' : (r * 2.2).toFixed(1) + ' lb'}/wk`}
                          selected={weeklyRate === r}
                          onPress={() => setWeeklyRate(r)}
                        />
                      ))}
                    </View>
                  </>
                ) : (
                  <Text className="text-sm text-fg-faint">
                    We’ll set you to maintenance calories.
                  </Text>
                )}
              </>
            )}

            {step === 7 && (
              <>
                <StepHeader title="Training" subtitle="Days per week and what you've got." />
                <Text className="text-sm text-fg-muted">Training days / week</Text>
                <View className="flex-row flex-wrap gap-2">
                  {[2, 3, 4, 5, 6].map((d) => (
                    <Chip
                      key={d}
                      label={`${d}`}
                      selected={trainingDays === d}
                      onPress={() => setTrainingDays(d)}
                    />
                  ))}
                </View>
                <View className="mt-2 gap-2">
                  <ChoiceCard
                    label="Full gym"
                    selected={equipment === 'full_gym'}
                    onPress={() => setEquipment('full_gym')}
                  />
                  <ChoiceCard
                    label="Home (dumbbells / bands)"
                    selected={equipment === 'home'}
                    onPress={() => setEquipment('home')}
                  />
                  <ChoiceCard
                    label="Bodyweight only"
                    selected={equipment === 'bodyweight'}
                    onPress={() => setEquipment('bodyweight')}
                  />
                </View>
              </>
            )}

            {step === 8 && (
              <>
                <StepHeader title="Diet" subtitle="Style, plus anything to avoid." />
                <View className="gap-2">
                  {(['omnivore', 'vegetarian', 'vegan', 'pescatarian'] as DietStyle[]).map((d) => (
                    <ChoiceCard
                      key={d}
                      label={d[0].toUpperCase() + d.slice(1)}
                      selected={dietStyle === d}
                      onPress={() => setDietStyle(d)}
                    />
                  ))}
                </View>
                <Text className="mt-2 text-sm text-fg-muted">Preferences</Text>
                <View className="flex-row flex-wrap gap-2">
                  {['high_protein', 'keto'].map((t) => (
                    <Chip
                      key={t}
                      label={t.replace('_', ' ')}
                      selected={extraTags.includes(t)}
                      onPress={() => setExtraTags((p) => toggle(p, t))}
                    />
                  ))}
                </View>
                <Text className="mt-2 text-sm text-fg-muted">Allergens to exclude</Text>
                <View className="flex-row flex-wrap gap-2">
                  {ALLERGENS.map((a) => (
                    <Chip
                      key={a}
                      label={a}
                      selected={allergens.includes(a)}
                      onPress={() => setAllergens((p) => toggle(p, a))}
                    />
                  ))}
                </View>
              </>
            )}

            {step === 9 && (
              <>
                <StepHeader
                  title="Meals per day"
                  subtitle="How you like to eat. Snacks are always quick-add."
                />
                <View className="flex-row flex-wrap gap-2">
                  {[2, 3, 4, 5, 6].map((m) => (
                    <Chip
                      key={m}
                      label={`${m} meals`}
                      selected={mealsPerDay === m}
                      onPress={() => setMealsPerDay(m)}
                    />
                  ))}
                </View>
              </>
            )}

            {step === 10 && (
              <>
                <StepHeader title="Your plan" subtitle="How would you like to start?" />
                <View className="gap-2">
                  <ChoiceCard
                    label="Generate a smart plan"
                    description="Science-based, tailored to everything above. (Generation lands in Phase 3 — your targets are saved now.)"
                    selected={planChoice === 'smart'}
                    onPress={() => setPlanChoice('smart')}
                  />
                  <ChoiceCard
                    label="Build my own"
                    description="Start from scratch and add your own workouts & meals."
                    selected={planChoice === 'own'}
                    onPress={() => setPlanChoice('own')}
                  />
                </View>
              </>
            )}
          </StepShell>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
