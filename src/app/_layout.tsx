import { Stack } from 'expo-router';

/** Versión provisional (semana 9): solo navegación. En la semana 10 se protege con la sesión. */
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Catálogo' }} />
      <Stack.Screen name="book/[id]" options={{ title: 'Detalle del libro' }} />
    </Stack>
  );
}
