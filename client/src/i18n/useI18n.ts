// frontend/src/i18n/useI18n.ts
import { useState } from 'react';

export default function useI18n() {
  const [locale, setLocale] = useState('fr'); // default to French
  
  const t = (key: string, options?: Record<string, any>) => {
    // Simple translation stub - replace with react-i18next later
    const translations: Record<string, Record<string, string>> = {
      fr: {
        'aiAssistant': 'Assistant IA',
        'creditScore': 'Score de Crédit',
        'fraudDetection': 'Détection de Fraude',
        'marketInsights': 'Insights du Marché',
        'askMeAnything': 'Demandez-moi n\'importe quoi',
        'typeYourMessage': 'Tapez votre message...',
        'listening': 'Écoute',
        'excellent': 'Excellent',
        'good': 'Bon',
        'fair': 'Correct',
        'poor': 'Faible',
        'veryPoor': 'Très Faible',
        'low': 'Faible',
        'medium': 'Moyen',
        'high': 'Élevé',
        'veryHigh': 'Très Élevé',
        'outOf': 'sur',
        'reliabilityProbability': 'Probabilité de Fiabilité',
        'modelVersion': 'Version du Modèle',
        'scoreFactors': 'Facteurs de Score',
        'tontineContributions': 'Contributions Tontine',
        'punctualityRate': 'Taux de Ponctualité',
        'communityReputation': 'Réputation Communautaire',
        'lastUpdated': 'Dernière Mise à Jour',
        'retry': 'Réessayer',
        'failedToLoadCreditScore': 'Échec du chargement du score de crédit',
        'multilingual': 'Multilingue',
        'multilingualDescription': 'Support pour Wolof, Français et Anglais',
        'voiceSupport': 'Support Vocal',
        'voiceSupportDescription': 'Capacités de synthèse vocale et reconnaissance vocale',
        'contextual': 'Contextuel',
        'contextualDescription': 'Conseils financiers spécifiques aux tontines',
      },
      wo: {
        'aiAssistant': 'Assistant IA',
        'creditScore': 'Score de Crédit',
        'fraudDetection': 'Détection de Fraude',
        'marketInsights': 'Insights du Marché',
        'askMeAnything': 'Demande ma n\'importe quoi',
        'typeYourMessage': 'Tape sa message...',
        'listening': 'Dégg',
        'excellent': 'Excellent',
        'good': 'Bon',
        'fair': 'Correct',
        'poor': 'Faible',
        'veryPoor': 'Très Faible',
        'low': 'Faible',
        'medium': 'Moyen',
        'high': 'Élevé',
        'veryHigh': 'Très Élevé',
        'outOf': 'ci',
        'reliabilityProbability': 'Probabilité de Fiabilité',
        'modelVersion': 'Version du Modèle',
        'scoreFactors': 'Facteurs de Score',
        'tontineContributions': 'Contributions Tontine',
        'punctualityRate': 'Taux de Ponctualité',
        'communityReputation': 'Réputation Communautaire',
        'lastUpdated': 'Dernière Mise à Jour',
        'retry': 'Réessayer',
        'failedToLoadCreditScore': 'Échec du chargement du score de crédit',
        'multilingual': 'Multilingue',
        'multilingualDescription': 'Support pour Wolof, Français et Anglais',
        'voiceSupport': 'Support Vocal',
        'voiceSupportDescription': 'Capacités de synthèse vocale et reconnaissance vocale',
        'contextual': 'Contextuel',
        'contextualDescription': 'Conseils financiers spécifiques aux tontines',
      },
      en: {
        'aiAssistant': 'AI Assistant',
        'creditScore': 'Credit Score',
        'fraudDetection': 'Fraud Detection',
        'marketInsights': 'Market Insights',
        'askMeAnything': 'Ask me anything',
        'typeYourMessage': 'Type your message...',
        'listening': 'Listening',
        'excellent': 'Excellent',
        'good': 'Good',
        'fair': 'Fair',
        'poor': 'Poor',
        'veryPoor': 'Very Poor',
        'low': 'Low',
        'medium': 'Medium',
        'high': 'High',
        'veryHigh': 'Very High',
        'outOf': 'out of',
        'reliabilityProbability': 'Reliability Probability',
        'modelVersion': 'Model Version',
        'scoreFactors': 'Score Factors',
        'tontineContributions': 'Tontine Contributions',
        'punctualityRate': 'Punctuality Rate',
        'communityReputation': 'Community Reputation',
        'lastUpdated': 'Last Updated',
        'retry': 'Retry',
        'failedToLoadCreditScore': 'Failed to load credit score',
        'multilingual': 'Multilingual',
        'multilingualDescription': 'Support for Wolof, French and English',
        'voiceSupport': 'Voice Support',
        'voiceSupportDescription': 'Text-to-speech and speech recognition capabilities',
        'contextual': 'Contextual',
        'contextualDescription': 'Tontine-specific financial advice',
      }
    };
    
    const translation = translations[locale]?.[key] || key;
    
    if (options) {
      return translation.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => options[key] || match);
    }
    
    return translation;
  };
  
  return { locale, setLocale, t };
}
