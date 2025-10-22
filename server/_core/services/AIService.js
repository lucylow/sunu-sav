const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

class CreditAIService {
  constructor() {
    this.creditServiceUrl = process.env.AI_CREDIT_SERVICE_URL || 'http://ai-credit:8001';
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async getUserCreditScore(userId) {
    try {
      // Get user metrics from database
      const userMetrics = await this.getUserMetrics(userId);
      
      const response = await axios.post(`${this.creditServiceUrl}/predict`, {
        user_id: userId,
        tontine_contributions: userMetrics.tontine_contributions || 0,
        punctuality_rate: userMetrics.punctuality_rate || 0.5,
        community_reputation: userMetrics.community_reputation || 0.5,
        mobile_transactions: userMetrics.mobile_transactions || 0,
        payment_frequency: userMetrics.payment_frequency || 0,
        group_participation: userMetrics.group_participation || 0,
        social_connections: userMetrics.social_connections || 0,
        location_stability: userMetrics.location_stability || 0.5
      });

      return response.data;
    } catch (error) {
      console.error('Credit scoring error:', error);
      throw new Error(`Credit scoring failed: ${error.message}`);
    }
  }

  async getUserMetrics(userId) {
    try {
      // Get user's tontine contributions
      const { data: contributions } = await this.supabase
        .from('contributions')
        .select('*')
        .eq('user_id', userId);

      // Get user's group memberships
      const { data: memberships } = await this.supabase
        .from('tontine_members')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      // Calculate metrics
      const totalContributions = contributions?.length || 0;
      const onTimeContributions = contributions?.filter(c => 
        c.status === 'completed' && !c.late
      ).length || 0;
      
      const punctualityRate = totalContributions > 0 ? onTimeContributions / totalContributions : 0.5;
      
      // Calculate community reputation based on group participation
      const groupParticipation = memberships?.length || 0;
      const communityReputation = Math.min(1, groupParticipation / 5); // Max 5 groups = 1.0

      return {
        tontine_contributions: totalContributions,
        punctuality_rate: punctualityRate,
        community_reputation: communityReputation,
        mobile_transactions: 0, // Placeholder - would integrate with mobile money APIs
        payment_frequency: totalContributions / Math.max(1, groupParticipation),
        group_participation: groupParticipation,
        social_connections: groupParticipation, // Simplified
        location_stability: 0.8 // Placeholder - would use location data
      };
    } catch (error) {
      console.error('Error getting user metrics:', error);
      return {
        tontine_contributions: 0,
        punctuality_rate: 0.5,
        community_reputation: 0.5,
        mobile_transactions: 0,
        payment_frequency: 0,
        group_participation: 0,
        social_connections: 0,
        location_stability: 0.5
      };
    }
  }

  async updateCreditScoreForUser(userId, score) {
    try {
      await this.supabase
        .from('profiles')
        .update({ 
          credit_score: score,
          credit_score_updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating credit score:', error);
    }
  }

  async getBatchCreditScores(userIds) {
    try {
      const userMetrics = await Promise.all(
        userIds.map(userId => this.getUserMetrics(userId))
      );

      const users = userIds.map((userId, index) => ({
        user_id: userId,
        ...userMetrics[index]
      }));

      const response = await axios.post(`${this.creditServiceUrl}/predict/batch`, {
        users
      });

      return response.data;
    } catch (error) {
      console.error('Batch credit scoring error:', error);
      throw new Error(`Batch credit scoring failed: ${error.message}`);
    }
  }
}

class FraudDetectionService {
  constructor() {
    this.fraudServiceUrl = process.env.AI_FRAUD_SERVICE_URL || 'http://ai-fraud:8002';
  }

  async detectFraud(transactionData) {
    try {
      const response = await axios.post(`${this.fraudServiceUrl}/detect`, {
        transaction_id: transactionData.id,
        user_id: transactionData.user_id,
        amount: transactionData.amount,
        interval_time: transactionData.interval_time || 0,
        num_invoices: transactionData.num_invoices || 1,
        payment_frequency: transactionData.payment_frequency || 0,
        amount_variance: transactionData.amount_variance || 0,
        time_pattern_score: transactionData.time_pattern_score || 0.5,
        location_consistency: transactionData.location_consistency || 1.0,
        device_fingerprint_match: transactionData.device_fingerprint_match || 1.0,
        timestamp: new Date().toISOString()
      });

      return response.data;
    } catch (error) {
      console.error('Fraud detection error:', error);
      throw new Error(`Fraud detection failed: ${error.message}`);
    }
  }

  async detectBatchFraud(transactions) {
    try {
      const transactionData = transactions.map(t => ({
        transaction_id: t.id,
        user_id: t.user_id,
        amount: t.amount,
        interval_time: t.interval_time || 0,
        num_invoices: t.num_invoices || 1,
        payment_frequency: t.payment_frequency || 0,
        amount_variance: t.amount_variance || 0,
        time_pattern_score: t.time_pattern_score || 0.5,
        location_consistency: t.location_consistency || 1.0,
        device_fingerprint_match: t.device_fingerprint_match || 1.0,
        timestamp: new Date().toISOString()
      }));

      const response = await axios.post(`${this.fraudServiceUrl}/detect/batch`, {
        transactions: transactionData
      });

      return response.data;
    } catch (error) {
      console.error('Batch fraud detection error:', error);
      throw new Error(`Batch fraud detection failed: ${error.message}`);
    }
  }
}

class AIInsightsService {
  constructor() {
    this.insightsServiceUrl = process.env.AI_INSIGHTS_SERVICE_URL || 'http://ai-insights:8003';
  }

  async projectSavings(userId, weeklyAmountXOF, durationMonths, currentBtcPriceXOF = null) {
    try {
      const response = await axios.post(`${this.insightsServiceUrl}/project-savings`, {
        user_id: userId,
        weekly_amount_xof: weeklyAmountXOF,
        duration_months: durationMonths,
        current_btc_price_xof: currentBtcPriceXOF
      });

      return response.data;
    } catch (error) {
      console.error('Savings projection error:', error);
      throw new Error(`Savings projection failed: ${error.message}`);
    }
  }

  async getMarketInsights() {
    try {
      const response = await axios.get(`${this.insightsServiceUrl}/market-insights`);
      return response.data;
    } catch (error) {
      console.error('Market insights error:', error);
      throw new Error(`Market insights failed: ${error.message}`);
    }
  }

  async getInflationHistory(days = 30) {
    try {
      const response = await axios.get(`${this.insightsServiceUrl}/inflation-history?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Inflation history error:', error);
      throw new Error(`Inflation history failed: ${error.message}`);
    }
  }
}

class ChatAIService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.translationService = new TranslationService();
  }

  async processMessage(message, language = 'en', userId = null) {
    try {
      // Translate to English for processing
      const englishMessage = await this.translationService.toEnglish(message, language);
      
      // Process with OpenAI (or local model)
      const response = await this.callOpenAI(englishMessage, userId);
      
      // Translate back to user's language
      const localizedResponse = await this.translationService.toLanguage(response, language);
      
      return {
        message: localizedResponse,
        language: language,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Chat AI error:', error);
      throw new Error(`Chat processing failed: ${error.message}`);
    }
  }

  async callOpenAI(message, userId) {
    // Placeholder for OpenAI integration
    // In production, this would call OpenAI API or a local LLM
    
    const systemPrompt = `You are a helpful financial assistant for SunuSàv, a Bitcoin-powered tontine platform in Senegal. 
    Help users with questions about:
    - Tontine contributions and payments
    - Bitcoin savings and Lightning payments
    - Financial planning and budgeting
    - Community group management
    
    Be friendly, helpful, and culturally aware of Senegalese context.`;
    
    // For demo purposes, return a simple response
    return `Thank you for your message: "${message}". I'm here to help with your SunuSàv tontine and Bitcoin savings questions. How can I assist you today?`;
  }
}

class TranslationService {
  constructor() {
    // Simple translation mappings for demo
    this.translations = {
      'wolof': {
      'How much do I owe this week?': 'Ñaata laa joxe ci ayu-benn bi?',
      'You owe 10,000 sats to Market Women Dakar Group.': 'Dox nga 10,000 sats ci Market Women Dakar Group.',
      'Thank you': 'Jërëjëf',
      'Hello': 'Salaam aleekum'
    },
    'fr': {
      'How much do I owe this week?': 'Combien dois-je cette semaine?',
      'You owe 10,000 sats to Market Women Dakar Group.': 'Vous devez 10,000 sats au Groupe des Femmes du Marché de Dakar.',
      'Thank you': 'Merci',
      'Hello': 'Bonjour'
    }
  };
}

async toEnglish(message, language) {
  if (language === 'en') return message;
  
  // Simple reverse lookup for demo
  const langTranslations = this.translations[language];
  if (langTranslations) {
    for (const [en, translated] of Object.entries(langTranslations)) {
      if (translated === message) return en;
    }
  }
  
  return message; // Return original if no translation found
}

async toLanguage(message, language) {
  if (language === 'en') return message;
  
  const langTranslations = this.translations[language];
  if (langTranslations && langTranslations[message]) {
    return langTranslations[message];
  }
  
  return message; // Return original if no translation found
}

module.exports = {
  CreditAIService,
  FraudDetectionService,
  AIInsightsService,
  ChatAIService,
  TranslationService
};
