import * as React from 'react';
import { TextInput } from 'react-native';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<TextInput, React.ComponentProps<typeof TextInput> & {
  placeholderClassName?: string;
}>(({ className, placeholderClassName, ...props }, ref) => {
  return (
    <TextInput
      ref={ref}
      className={cn(
        'h-11 rounded-md border border-input bg-background px-3 text-base text-foreground',
        props.editable === false && 'opacity-50',
        className
      )}
      placeholderClassName={cn('text-muted-foreground', placeholderClassName)}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
