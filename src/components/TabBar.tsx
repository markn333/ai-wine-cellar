import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const tabs = [
  {
    name: 'index',
    path: '/',
    label: 'ホーム',
    icon: 'home',
  },
  {
    name: 'wines',
    path: '/wines',
    label: 'ワイン',
    icon: 'bottle-wine',
  },
  {
    name: 'add',
    path: '/add',
    label: '追加',
    icon: 'plus-circle',
  },
  {
    name: 'chat',
    path: '/chat',
    label: 'チャット',
    icon: 'chat',
  },
  {
    name: 'cellar',
    path: '/cellar',
    label: 'セラー',
    icon: 'grid',
  },
  {
    name: 'settings',
    path: '/settings',
    label: '設定',
    icon: 'cog',
  },
];

export default function TabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = isActive(tab.path);
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => router.push(tab.path as any)}
          >
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={24}
              color={active ? '#7C3AED' : '#9CA3AF'}
            />
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    color: '#9CA3AF',
  },
  labelActive: {
    color: '#7C3AED',
    fontWeight: '600',
  },
});
