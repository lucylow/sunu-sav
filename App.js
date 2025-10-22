import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import 'react-native-gesture-handler';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import TontineDetailScreen from './src/screens/TontineDetailScreen';
import CreateTontineScreen from './src/screens/CreateTontineScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import WalletScreen from './src/screens/WalletScreen';
import QrScannerScreen from './src/screens/QrScannerScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#000000',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Tontine Bitcoin' }}
        />
        <Stack.Screen 
          name="TontineDetail" 
          component={TontineDetailScreen}
          options={{ title: 'Détails Tontine' }}
        />
        <Stack.Screen 
          name="CreateTontine" 
          component={CreateTontineScreen}
          options={{ title: 'Créer une Tontine' }}
        />
        <Stack.Screen 
          name="Payment" 
          component={PaymentScreen}
          options={{ title: 'Paiement' }}
        />
        <Stack.Screen 
          name="Wallet" 
          component={WalletScreen}
          options={{ title: 'Portefeuille' }}
        />
        <Stack.Screen 
          name="QrScanner" 
          component={QrScannerScreen}
          options={{ title: 'Scanner QR' }}
        />
      </Stack.Navigator>
      <FlashMessage position="top" />
    </NavigationContainer>
  );
}
