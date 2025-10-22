import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import I18n from '../i18n';
import { useStore } from '../store/useStore';

export default function CreateTontineScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    contributionAmount: '',
    totalCycles: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const createTontine = useStore((state) => state.createTontine);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateTontine = async () => {
    if (!formData.name || !formData.contributionAmount || !formData.totalCycles) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsLoading(true);
    
    try {
      const tontineData = {
        name: formData.name,
        contributionAmount: parseInt(formData.contributionAmount),
        totalCycles: parseInt(formData.totalCycles),
        description: formData.description,
        members: []
      };

      await createTontine(tontineData);
      
      Alert.alert(
        'Succès',
        'Tontine créée avec succès!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer la tontine');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Créer une nouvelle Tontine</Text>
        
        {/* Tontine Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom de la Tontine *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Tontine Familiale"
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
          />
        </View>

        {/* Contribution Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Montant de Contribution (sats) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 10000"
            keyboardType="numeric"
            value={formData.contributionAmount}
            onChangeText={(value) => handleInputChange('contributionAmount', value)}
          />
          <Text style={styles.helperText}>
            ≈ {formData.contributionAmount ? Math.round(formData.contributionAmount * 0.0003) : 0} FCFA
          </Text>
        </View>

        {/* Total Cycles */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre de Cycles *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 12"
            keyboardType="numeric"
            value={formData.totalCycles}
            onChangeText={(value) => handleInputChange('totalCycles', value)}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (optionnel)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description de votre tontine..."
            multiline
            numberOfLines={4}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
          />
        </View>

        {/* Create Button */}
        <TouchableOpacity 
          style={[
            styles.createButton,
            isLoading && styles.createButtonDisabled
          ]}
          onPress={handleCreateTontine}
          disabled={isLoading}
        >
          <Text style={styles.createButtonText}>
            {isLoading ? 'Création...' : 'Créer la Tontine'}
          </Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Comment ça marche?</Text>
          <Text style={styles.infoText}>
            • Chaque membre contribue le même montant à chaque cycle{'\n'}
            • Un membre différent reçoit le pot à chaque cycle{'\n'}
            • Les paiements se font via le réseau Lightning Bitcoin{'\n'}
            • Tout est sécurisé et transparent
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F8F8F8',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#000000',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  createButtonDisabled: {
    backgroundColor: '#666666',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#F8F8F8',
    padding: 20,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});
