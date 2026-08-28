import * as React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

function Checkbox({ checked, onCheckedChange, disabled, className }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onCheckedChange(!checked)}
      hitSlop={8}
      className={cn(
        'h-6 w-6 items-center justify-center rounded-md border border-input',
        checked && 'border-primary bg-primary',
        disabled && 'opacity-50',
        className
      )}
    >
      {checked ? (
        <Text className="text-xs font-bold leading-none text-primary-foreground">✓</Text>
      ) : null}
    </Pressable>
  );
}

export { Checkbox };
