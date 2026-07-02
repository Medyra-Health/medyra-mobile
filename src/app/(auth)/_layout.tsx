import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (isLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
