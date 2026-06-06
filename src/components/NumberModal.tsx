import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

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

// Bottom-sheet numeric input. Works on iOS + Android (no Alert.prompt).
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

  const num = parseFloat(val);
  const valid = !Number.isNaN(num) && num >= 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onShow={() => setVal(initial)}
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 justify-end bg-black/60" onPress={onClose}>
        <Pressable className="gap-4 rounded-t-3xl bg-bg-elevated p-6" onPress={() => {}}>
          <Text className="text-lg font-semibold text-fg">{title}</Text>
          <View className="flex-row items-center rounded-2xl border border-border bg-bg-subtle px-4">
            <TextInput
              value={val}
              onChangeText={setVal}
              placeholder={placeholder}
              placeholderTextColor="#6B6B76"
              keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
              autoFocus
              className="flex-1 py-4 text-base text-fg"
            />
            {suffix ? <Text className="ml-2 text-base text-fg-faint">{suffix}</Text> : null}
          </View>
          <Pressable
            disabled={!valid}
            onPress={() => {
              onSubmit(num);
              onClose();
            }}
            className="items-center rounded-2xl bg-accent py-4 active:opacity-80 disabled:opacity-40"
          >
            <Text className="text-base font-semibold text-bg">Save</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
