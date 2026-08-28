import * as React from 'react';
import { Modal, Pressable, View } from 'react-native';

import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

function Sheet({ open, onOpenChange, children, className }: SheetProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={() => onOpenChange(false)}
    >
      <Pressable
        className="flex-1 justify-end bg-black/50"
        onPress={() => onOpenChange(false)}
      >
        <Pressable
          className={cn('rounded-t-2xl bg-background p-6', className)}
          onPress={(e) => e.stopPropagation()}
        >
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn('mb-4 gap-1', className)} {...props} />;
}

export { Sheet, SheetHeader };
