import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import I18n from '../i18n';
import { useStore } from '../store/useStore';
import FeatureItem from '../components/FeatureItem';

export default function LoginScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setUser = useStore((state) => state.setUser);

  const handleLogin = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      Alert.alert(
        I18n.t('error'),
        I18n.t('invalid_phone')
      );
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call - in real app, verify with SMS OTP
      const userData = {
        id: '1',
        phoneNumber: phoneNumber,
        language: I18n.locale
      };
      
      setUser(userData);
      navigation.replace('Home');
      
    } catch (error) {
      Alert.alert(
        I18n.t('error'),
        I18n.t('login_failed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Logo/Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>₿</Text>
          </View>
          <Text style={styles.title}>Tontine Bitcoin</Text>
          <Text style={styles.subtitle}>
            {I18n.t('welcome')} - Épargnez ensemble avec Bitcoin
          </Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Text style={styles.label}>{I18n.t('phone_number')}</Text>
          <View style={styles.phoneInputContainer}>
            <Text style={styles.countryCode}>+221</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="77 123 45 67"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={9}
            />
          </View>

          <TouchableOpacity 
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? I18n.t('loading') : I18n.t('continue')}
            </Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            {I18n.t('disclaimer')}
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <FeatureItem 
            icon="⚡"
            title={I18n.t('instant_payments')}
            description={I18n.t('with_lightning')}
          />
          <FeatureItem 
            icon="🔒"
            title={I18n.t('secure')}
            description={I18n.t('private_keys')}
          />
          <FeatureItem 
            icon="👥"
            title={I18n.t('community')}
            description={I18n.t('traditional_tontines')}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F7931A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333333',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#F8F8F8',
  },
  countryCode: {
    padding: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    borderRightWidth: 1,
    borderRightColor: '#DDDDDD',
  },
  phoneInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#000000',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonDisabled: {
    backgroundColor: '#666666',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666666',
  },
  featuresContainer: {
    marginTop: 20,
  },
});
