import * as React from 'react';
import { Image, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

function initialsFrom(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}

function Avatar({ name, imageUrl, size = 36, className }: AvatarProps) {
  const dimensionStyle = { width: size, height: size };

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={dimensionStyle}
        className={cn('rounded-full bg-muted', className)}
        accessibilityLabel={name}
      />
    );
  }

  return (
    <View
      style={dimensionStyle}
      className={cn('items-center justify-center rounded-full bg-muted', className)}
    >
      <Text className="text-sm font-medium text-muted-foreground">{initialsFrom(name)}</Text>
    </View>
  );
}

export { Avatar };
