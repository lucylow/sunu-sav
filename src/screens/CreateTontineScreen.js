import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import I18n from '../i18n';
import { useStore } from '../store/useStore';

export default function CreateTontineScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic info
    name: '',
    contributionAmount: '',
    frequency: 'monthly',
    maxMembers: '',
    description: '',
    // Step 2: Members (will be populated)
    members: [],
    // Step 3: Review data
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const createTontine = useStore((state) => state.createTontine);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);

  const validateStep1 = useCallback(() => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = I18n.t('name_required');
    }
    
    if (!formData.contributionAmount || parseInt(formData.contributionAmount) <= 0) {
      newErrors.contributionAmount = I18n.t('amount_required');
    }
    
    if (!formData.maxMembers || parseInt(formData.maxMembers) < 2) {
      newErrors.maxMembers = I18n.t('min_members_required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const validateStep2 = useCallback(() => {
    if (formData.members.length < 2) {
      Alert.alert(I18n.t('error'), I18n.t('min_members_required'));
      return false;
    }
    return true;
  }, [formData.members]);

  const handleNext = useCallback(() => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    }
  }, [currentStep, validateStep1, validateStep2]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleCreateTontine = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const tontineData = {
        name: formData.name.trim(),
        contributionAmount: parseInt(formData.contributionAmount),
        frequency: formData.frequency,
        maxMembers: parseInt(formData.maxMembers),
        description: formData.description.trim(),
        members: formData.members
      };

      await createTontine(tontineData);
      
      Alert.alert(
        I18n.t('success'),
        I18n.t('tontine_created_successfully'),
        [
          {
            text: I18n.t('ok'),
            onPress: () => navigation.goBack()
          }
        ]
      );
      
    } catch (error) {
      Alert.alert(I18n.t('error'), I18n.t('failed_to_create_tontine'));
    } finally {
      setIsLoading(false);
    }
  }, [formData, createTontine, navigation]);

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.stepDot, currentStep >= 1 && styles.stepDotActive]} />
      <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />
      <View style={[styles.stepDot, currentStep >= 2 && styles.stepDotActive]} />
      <View style={[styles.stepLine, currentStep >= 3 && styles.stepLineActive]} />
      <View style={[styles.stepDot, currentStep >= 3 && styles.stepDotActive]} />
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{I18n.t('step_1_title')}</Text>
      <Text style={styles.stepSubtitle}>{I18n.t('step_1_subtitle')}</Text>
      
      {/* Tontine Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{I18n.t('tontine_name')} *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          placeholder={I18n.t('tontine_name_placeholder')}
          value={formData.name}
          onChangeText={(value) => handleInputChange('name', value)}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* Contribution Amount */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{I18n.t('contribution_amount')} *</Text>
        <TextInput
          style={[styles.input, errors.contributionAmount && styles.inputError]}
          placeholder={I18n.t('amount_placeholder')}
          keyboardType="numeric"
          value={formData.contributionAmount}
          onChangeText={(value) => handleInputChange('contributionAmount', value)}
        />
        {formData.contributionAmount && (
          <Text style={styles.helperText}>
            ≈ {Math.round(parseInt(formData.contributionAmount) * 0.0003)} FCFA
          </Text>
        )}
        {errors.contributionAmount && <Text style={styles.errorText}>{errors.contributionAmount}</Text>}
      </View>

      {/* Frequency */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{I18n.t('frequency')} *</Text>
        <View style={styles.frequencyButtons}>
          {['weekly', 'monthly', 'quarterly'].map((freq) => (
            <TouchableOpacity
              key={freq}
              style={[
                styles.frequencyButton,
                formData.frequency === freq && styles.frequencyButtonActive
              ]}
              onPress={() => handleInputChange('frequency', freq)}
            >
              <Text style={[
                styles.frequencyButtonText,
                formData.frequency === freq && styles.frequencyButtonTextActive
              ]}>
                {I18n.t(`frequency.${freq}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Max Members */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{I18n.t('max_members')} *</Text>
        <TextInput
          style={[styles.input, errors.maxMembers && styles.inputError]}
          placeholder={I18n.t('max_members_placeholder')}
          keyboardType="numeric"
          value={formData.maxMembers}
          onChangeText={(value) => handleInputChange('maxMembers', value)}
        />
        {errors.maxMembers && <Text style={styles.errorText}>{errors.maxMembers}</Text>}
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{I18n.t('description')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={I18n.t('description_placeholder')}
          multiline
          numberOfLines={3}
          value={formData.description}
          onChangeText={(value) => handleInputChange('description', value)}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{I18n.t('step_2_title')}</Text>
      <Text style={styles.stepSubtitle}>{I18n.t('step_2_subtitle')}</Text>
      
      <View style={styles.membersContainer}>
        <Text style={styles.membersCount}>
          {formData.members.length} {I18n.t('members_added')}
        </Text>
        
        {/* Simplified member addition for demo */}
        <TouchableOpacity style={styles.addMemberButton}>
          <Text style={styles.addMemberButtonText}>
            {I18n.t('add_members')}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.membersNote}>
          {I18n.t('members_note')}
        </Text>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{I18n.t('step_3_title')}</Text>
      <Text style={styles.stepSubtitle}>{I18n.t('step_3_subtitle')}</Text>
      
      <View style={styles.reviewContainer}>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>{I18n.t('tontine_name')}</Text>
          <Text style={styles.reviewValue}>{formData.name}</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>{I18n.t('contribution_amount')}</Text>
          <Text style={styles.reviewValue}>
            {formData.contributionAmount} sats ({Math.round(parseInt(formData.contributionAmount) * 0.0003)} FCFA)
          </Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>{I18n.t('frequency')}</Text>
          <Text style={styles.reviewValue}>{I18n.t(`frequency.${formData.frequency}`)}</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>{I18n.t('max_members')}</Text>
          <Text style={styles.reviewValue}>{formData.maxMembers}</Text>
        </View>
        
        {formData.description && (
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>{I18n.t('description')}</Text>
            <Text style={styles.reviewValue}>{formData.description}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{I18n.t('create_tontine')}</Text>
        <Text style={styles.stepCounter}>
          {I18n.t('step')} {currentStep}/3
        </Text>
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <View style={styles.navigationButtons}>
          {currentStep > 1 && (
            <TouchableOpacity 
              style={styles.previousButton}
              onPress={handlePrevious}
            >
              <Text style={styles.previousButtonText}>
                {I18n.t('previous')}
              </Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.spacer} />
          
          {currentStep < 3 ? (
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>
                {I18n.t('next')}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.createButton, isLoading && styles.createButtonDisabled]}
              onPress={handleCreateTontine}
              disabled={isLoading}
            >
              <Text style={styles.createButtonText}>
                {isLoading ? I18n.t('creating') : I18n.t('create_tontine')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  stepCounter: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  stepDotActive: {
    backgroundColor: '#34C759',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#34C759',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333333',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
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
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  frequencyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  frequencyButtonTextActive: {
    color: '#FFFFFF',
  },
  membersContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  membersCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 20,
  },
  addMemberButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  addMemberButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  membersNote: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  reviewContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 20,
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    color: '#666666',
  },
  navigationContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previousButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    backgroundColor: '#F8F8F8',
  },
  previousButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
