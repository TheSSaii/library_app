import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { availabilityLabel, BookCover } from '@/components/book-views';
import { Screen } from '@/components/screen';
import { ErrorView, LoadingView } from '@/components/state-views';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/services/api';
import type { Book } from '@/types';

/** Detalle del libro (semana 9): solo lectura. El préstamo se agrega en la semana 11. */
export default function BookDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, retry } = useResource(
    `book:${id}`,
    () => api.get<{ book: Book }>(`/api/books/${id}`),
    () => false,
  );

  if (state.status === 'loading') return <LoadingView />;
  if (state.status === 'error') return <ErrorView message={state.message} onRetry={retry} />;
  if (state.status === 'empty') return null; // no ocurre: isEmpty siempre devuelve false

  const { book } = state.data;
  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.cover}>
          <BookCover book={book} width={160} height={220} />
        </View>
        <ThemedText type="subtitle" accessibilityRole="header">
          {book.title}
        </ThemedText>
        <ThemedText themeColor="textSecondary">{book.author}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {book.category} · {book.year}
        </ThemedText>
        <ThemedText
          type="smallBold"
          style={{ color: book.availableCopies > 0 ? theme.success : theme.danger }}>
          {availabilityLabel(book)}
        </ThemedText>
        <ThemedText style={styles.description}>{book.description}</ThemedText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.two, paddingVertical: Spacing.three },
  cover: { alignItems: 'center', paddingBottom: Spacing.two },
  description: { marginTop: Spacing.two, lineHeight: 24 },
});
