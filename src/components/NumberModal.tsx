import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { hapticSelect } from '../lib/haptics';

type Props = {
  visible: boolean;
  title: string;
  placeholder?: string;
  suffix?: string;
  initial?: string;
  decimal?: boolean;
  onSubmit: (value: number) => void;
  onClose: () => void;
};

// Bottom-sheet numeric input that lifts above the keyboard. iOS + Android.
export function NumberModal({
  visible,
  title,
  placeholder,
  suffix,
  initial = '',
  decimal,
  onSubmit,
  onClose,
}: Props) {
  const [val, setVal] = useState(initial);

  // Normalize comma decimal separators (comma-locale keyboards) before parsing.
  const num = parseFloat(val.replace(',', '.'));
  const valid = !Number.isNaN(num) && num >= 0;

  function save() {
    if (!valid) return;
    hapticSelect();
    onSubmit(num);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onShow={() => setVal(initial)}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable className="flex-1 justify-end bg-black/60" onPress={onClose}>
          <Pressable
            style={{ borderCurve: 'continuous' }}
            className="gap-4 rounded-t-3xl bg-bg-elevated p-6 pb-10"
            onPress={() => {}}
          >
            <Text className="font-semibold text-lg text-fg">{title}</Text>
            <View
              style={{ borderCurve: 'continuous' }}
              className="flex-row items-center rounded-2xl border border-border bg-bg-subtle px-4"
            >
              <TextInput
                value={val}
                onChangeText={setVal}
                placeholder={placeholder}
                placeholderTextColor="#8C7B6C"
                keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={save}
                className="flex-1 py-4 text-base text-fg"
                style={{ fontVariant: ['tabular-nums'] }}
              />
              {suffix ? <Text className="ml-2 text-base text-fg-faint">{suffix}</Text> : null}
            </View>
            <Pressable
              disabled={!valid}
              onPress={save}
              style={{ borderCurve: 'continuous' }}
              className="items-center rounded-2xl bg-accent py-4 active:opacity-90 disabled:opacity-40"
            >
              <Text className="font-semibold text-base text-bg">Save</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
