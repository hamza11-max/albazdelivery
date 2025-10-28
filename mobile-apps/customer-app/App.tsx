import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { OfflineWrapper } from './components/OfflineWrapper';

export default function App() {
  return (
    <OfflineWrapper>
      <View style={styles.container}>
        {/* Your existing app content */}
        <StatusBar style="auto" />
      </View>
    </OfflineWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
