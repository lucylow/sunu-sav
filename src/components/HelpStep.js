import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';

export default function HelpStep({ step, text }) {
  return (
    <View style={styles.helpStep}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{step}</Text>
      </View>
      <Text style={styles.helpText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  helpStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
});
