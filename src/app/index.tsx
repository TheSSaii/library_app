import { useDeferredValue, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';

import { BookCard } from '@/components/book-views';
import { Screen } from '@/components/screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/state-views';
import { Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/services/api';
import type { Book } from '@/types';

/** Catálogo (semana 9): consume la API directamente y maneja los cuatro estados. */
export default function BooksScreen() {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const q = useDeferredValue(search);
  const { state, retry } = useResource(
    `books:${q}`,
    () => api.get<{ books: Book[] }>(`/api/books?q=${encodeURIComponent(q.trim())}`),
    (res) => res.books.length === 0,
  );

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por título o autor"
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Buscar libros por título o autor"
          returnKeyType="search"
          autoCorrect={false}
          style={[
            styles.search,
            {
              color: theme.text,
              borderColor: theme.border,
              backgroundColor: theme.backgroundElement,
            },
          ]}
        />
      </View>
      {state.status === 'loading' ? (
        <LoadingView message="Cargando catálogo…" />
      ) : state.status === 'error' ? (
        <ErrorView message={state.message} onRetry={retry} />
      ) : state.status === 'empty' ? (
        <EmptyView title="Sin resultados" message="Prueba con otro título o autor." />
      ) : (
        <FlatList
          data={state.data.books}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => <BookCard book={item} />}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingVertical: Spacing.two },
  search: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  list: { paddingBottom: Spacing.four },
});
