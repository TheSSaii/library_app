import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { availabilityLabel, BookCover } from '@/components/book-views';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { EmptyView, LoadingView } from '@/components/state-views';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useBook, useMyLoanForBook } from '@/hooks/use-library-data';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/providers/auth-provider';
import { useData } from '@/providers/data-provider';
import { describeError } from '@/services/api/client';
import { LoanRuleError } from '@/services/loans/loan-service';

export default function BookDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { online, requestLoan } = useData();
  const { book, loaded } = useBook(id);
  const myLoan = useMyLoanForBook(id);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);

  if (!loaded) return <LoadingView />;
  if (!book)
    return <EmptyView title="Libro no encontrado" message="Puede que ya no esté en el catálogo." />;

  const librarian = user?.role === 'librarian';
  const hasActive =
    myLoan &&
    myLoan.syncState !== 'conflict' &&
    (myLoan.status === 'requested' || myLoan.status === 'approved');

  async function onRequest() {
    if (!book) return;
    setBusy(true);
    setFeedback(null);
    try {
      await requestLoan(book);
      setFeedback({
        error: false,
        text: online
          ? 'Solicitud registrada. Se está enviando al servidor.'
          : 'Sin conexión: tu solicitud quedó guardada y se enviará automáticamente cuando vuelva internet.',
      });
    } catch (err) {
      setFeedback({
        error: true,
        text: err instanceof LoanRuleError ? err.message : describeError(err),
      });
    } finally {
      setBusy(false);
    }
  }

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
        {!librarian ? (
          <View style={styles.actions}>
            {myLoan && myLoan.syncState === 'pending' ? (
              <ThemedText type="smallBold" style={{ color: theme.warning }}>
                Solicitud guardada · pendiente de envío
              </ThemedText>
            ) : null}
            {myLoan && myLoan.syncState === 'conflict' ? (
              <ThemedText
                type="smallBold"
                style={{ color: theme.danger }}
                accessibilityRole="alert">
                Tu última solicitud no se pudo procesar: {myLoan.syncError}
              </ThemedText>
            ) : null}
            {myLoan?.syncState === 'synced' && myLoan.status === 'requested' ? (
              <ThemedText type="smallBold" style={{ color: theme.primary }}>
                Solicitud enviada · esperando al bibliotecario
              </ThemedText>
            ) : null}
            {myLoan?.syncState === 'synced' && myLoan.status === 'approved' ? (
              <ThemedText type="smallBold" style={{ color: theme.success }}>
                Tienes este libro prestado
              </ThemedText>
            ) : null}
            <Button
              title={book.availableCopies > 0 ? 'Solicitar préstamo' : 'Sin ejemplares disponibles'}
              disabled={book.availableCopies <= 0 || !!hasActive}
              loading={busy}
              onPress={onRequest}
              accessibilityHint="Envía una solicitud de préstamo al bibliotecario"
            />
          </View>
        ) : null}
        {feedback ? (
          <ThemedText
            accessibilityLiveRegion="polite"
            accessibilityRole={feedback.error ? 'alert' : undefined}
            style={{ color: feedback.error ? theme.danger : theme.success }}>
            {feedback.text}
          </ThemedText>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.two, paddingVertical: Spacing.three },
  cover: { alignItems: 'center', paddingBottom: Spacing.two },
  description: { marginTop: Spacing.two, lineHeight: 24 },
  actions: { gap: Spacing.two, marginTop: Spacing.three },
});
