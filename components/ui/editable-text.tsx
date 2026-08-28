import * as React from 'react';
import { Pressable, TextInput } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface EditableTextProps {
  value: string;
  editing: boolean;
  onStartEdit: () => void;
  onFinishEdit: (value: string) => void;
  textClassName?: string;
  inputClassName?: string;
  disabled?: boolean;
  numberOfLines?: number;
}

export function EditableText({
  value,
  editing,
  onStartEdit,
  onFinishEdit,
  textClassName,
  inputClassName,
  disabled,
  numberOfLines,
}: EditableTextProps) {
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    if (editing) setDraft(value);
  }, [editing, value]);

  if (editing) {
    return (
      <TextInput
        autoFocus
        selectTextOnFocus
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={() => onFinishEdit(draft)}
        onBlur={() => onFinishEdit(draft)}
        returnKeyType="done"
        className={cn('p-0 text-base text-foreground', inputClassName)}
      />
    );
  }

  return (
    <Pressable disabled={disabled} onPress={onStartEdit} hitSlop={4}>
      <Text className={textClassName} numberOfLines={numberOfLines}>
        {value}
      </Text>
    </Pressable>
  );
}
