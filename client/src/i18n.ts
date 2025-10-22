// Simple i18n implementation
const translations = {
  en: {
    // Common
    'app.title': 'SunuSàv',
    'app.ok': 'OK',
    'app.cancel': 'Cancel',
    'app.save': 'Save',
    'app.delete': 'Delete',
    'app.edit': 'Edit',
    'app.create': 'Create',
    'app.loading': 'Loading...',
    'app.error': 'Error',
    'app.success': 'Success',
    
    // Groups
    'groups.title': 'Groups',
    'groups.create': 'Create Group',
    'groups.join': 'Join Group',
    'groups.leave': 'Leave Group',
    'groups.members': 'Members',
    'groups.contribution': 'Contribution',
    'groups.frequency': 'Frequency',
    'groups.status': 'Status',
    'groups.active': 'Active',
    'groups.completed': 'Completed',
    'groups.pending': 'Pending',
    
    // Payments
    'payment.title': 'Payment',
    'payment.amount': 'Amount',
    'payment.invoice': 'Invoice',
    'payment.status': 'Status',
    'payment.pending': 'Pending',
    'payment.completed': 'Completed',
    'payment.failed': 'Failed',
    
    // Wallet
    'wallet.balance': 'Balance',
    'wallet.send': 'Send',
    'wallet.receive': 'Receive',
    'wallet.history': 'History',
  },
  fr: {
    // Common
    'app.title': 'SunuSàv',
    'app.ok': 'OK',
    'app.cancel': 'Annuler',
    'app.save': 'Enregistrer',
    'app.delete': 'Supprimer',
    'app.edit': 'Modifier',
    'app.create': 'Créer',
    'app.loading': 'Chargement...',
    'app.error': 'Erreur',
    'app.success': 'Succès',
    
    // Groups
    'groups.title': 'Groupes',
    'groups.create': 'Créer un Groupe',
    'groups.join': 'Rejoindre le Groupe',
    'groups.leave': 'Quitter le Groupe',
    'groups.members': 'Membres',
    'groups.contribution': 'Contribution',
    'groups.frequency': 'Fréquence',
    'groups.status': 'Statut',
    'groups.active': 'Actif',
    'groups.completed': 'Terminé',
    'groups.pending': 'En attente',
    
    // Payments
    'payment.title': 'Paiement',
    'payment.amount': 'Montant',
    'payment.invoice': 'Facture',
    'payment.status': 'Statut',
    'payment.pending': 'En attente',
    'payment.completed': 'Terminé',
    'payment.failed': 'Échoué',
    
    // Wallet
    'wallet.balance': 'Solde',
    'wallet.send': 'Envoyer',
    'wallet.receive': 'Recevoir',
    'wallet.history': 'Historique',
  }
};

let currentLanguage = 'fr';

export function initI18n() {
  return Promise.resolve();
}

export function setAppLanguage(lang: string) {
  currentLanguage = lang;
  return Promise.resolve();
}

export function getAppLanguage() {
  return currentLanguage;
}

export function t(key: string, options?: Record<string, any>) {
  const translation = translations[currentLanguage as keyof typeof translations]?.[key as keyof typeof translations[typeof currentLanguage]];
  if (!translation) {
    console.warn(`Translation missing for key: ${key}`);
    return key;
  }
  
  if (options) {
    return translation.replace(/\{\{(\w+)\}\}/g, (match, key) => options[key] || match);
  }
  
  return translation;
}

export function formatNumber(number: number, locale?: string) {
  return new Intl.NumberFormat(locale || currentLanguage).format(number);
}

export function formatDate(date: Date, locale?: string) {
  return new Intl.DateTimeFormat(locale || currentLanguage).format(date);
}
