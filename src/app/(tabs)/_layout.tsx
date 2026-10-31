import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Icon, Label, NativeTabs, NativeTabTrigger, VectorIcon } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

export default function TabsLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { user } = useAuth();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabTrigger name="index">
        <Label>Libros</Label>
        <Icon
          sf="books.vertical"
          androidSrc={<VectorIcon family={MaterialIcons} name="menu-book" />}
        />
      </NativeTabTrigger>
      <NativeTabTrigger name="loans">
        <Label>{user?.role === 'librarian' ? 'Gestión' : 'Mis préstamos'}</Label>
        <Icon
          sf="list.bullet.clipboard"
          androidSrc={<VectorIcon family={MaterialIcons} name="assignment" />}
        />
      </NativeTabTrigger>
      <NativeTabTrigger name="profile">
        <Label>Perfil</Label>
        <Icon
          sf="person.crop.circle"
          androidSrc={<VectorIcon family={MaterialIcons} name="person" />}
        />
      </NativeTabTrigger>
    </NativeTabs>
  );
}
