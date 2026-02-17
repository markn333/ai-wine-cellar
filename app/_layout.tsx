import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import TabBar from '../src/components/TabBar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <View style={styles.content}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="wine" options={{ headerShown: false }} />
            <Stack.Screen name="cellar" options={{ headerShown: false }} />
          </Stack>
        </View>
        <TabBar />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
