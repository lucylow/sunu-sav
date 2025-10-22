class USSDService {
  constructor() {
    this.sessionTimeout = 300000; // 5 minutes
    this.sessions = new Map(); // In production, use Redis
  }

  /**
   * Handle USSD session for feature phone users
   * Menu structure adapted for low-literacy users
   */
  async handleUSSDRequest(phoneNumber, userInput, sessionId) {
    try {
      const menuState = await this.getMenuState(sessionId);
      let response = '';

      // Clean input
      const cleanInput = userInput.trim();

      if (cleanInput === '' || menuState === 'main') {
        // Main menu in French (most widely understood)
        response = this.createMainMenu();
        await this.setMenuState(sessionId, 'main');
      } else if (menuState === 'main') {
        response = await this.handleMainMenuSelection(phoneNumber, cleanInput, sessionId);
      } else if (menuState === 'contribution') {
        response = await this.handleContributionFlow(phoneNumber, cleanInput, sessionId);
      } else if (menuState === 'balance') {
        response = await this.handleBalanceCheck(phoneNumber, sessionId);
      } else if (menuState === 'history') {
        response = await this.handleHistoryFlow(phoneNumber, cleanInput, sessionId);
      } else if (menuState === 'payout') {
        response = await this.handlePayoutFlow(phoneNumber, cleanInput, sessionId);
      }

      return this.formatUSSDResponse(response);
    } catch (error) {
      console.error('USSD request failed:', error);
      return this.formatUSSDResponse('Erreur système. Veuillez réessayer plus tard.');
    }
  }

  createMainMenu() {
    return `SunuSàv Tontine Bitcoin
1. Cotisation actuelle
2. Mon solde
3. Historique
4. Prochain paiement
5. Aide
0. Quitter`;
  }

  async handleMainMenuSelection(phoneNumber, input, sessionId) {
    switch (input) {
      case '1':
        await this.setMenuState(sessionId, 'contribution');
        const contribution = await this.getCurrentContribution(phoneNumber);
        return `Cotisation tontine:
Montant: ${contribution.amount} sats
(~${contribution.xof} XOF)
1. Payer maintenant
2. Rappeler plus tard
0. Retour`;
      
      case '2':
        await this.setMenuState(sessionId, 'balance');
        const balance = await this.getUserBalance(phoneNumber);
        return `Votre solde: ${balance.sats} sats
(~${balance.xof} XOF)
0. Retour`;
      
      case '3':
        await this.setMenuState(sessionId, 'history');
        const history = await this.getUserHistory(phoneNumber);
        return `Dernier paiement: ${history.lastPayment}
Cycle: ${history.currentCycle}/12
Pot actuel: ${history.currentPot} XOF
0. Retour`;
      
      case '4':
        await this.setMenuState(sessionId, 'payout');
        const nextPayout = await this.getNextPayout(phoneNumber);
        return `Prochain paiement: ${nextPayout.date}
Pot: ${nextPayout.amount} XOF
Gagnant: ${nextPayout.winner ? 'Vous!' : 'À déterminer'}
0. Retour`;
      
      case '5':
        return `Aide SunuSàv:
- Tontine Bitcoin sécurisée
- Paiements via Wave
- Support: +221 33 123 45 67
0. Retour`;
      
      case '0':
        return 'Merci d\'utiliser SunuSàv!';
      
      default:
        return `Choix invalide. Veuillez réessayer:
${this.createMainMenu()}`;
    }
  }

  async handleContributionFlow(phoneNumber, input, sessionId) {
    if (input === '1') {
      // Process payment via linked mobile money
      const result = await this.processContribution(phoneNumber);
      
      if (result.success) {
        await this.setMenuState(sessionId, 'main');
        return `Paiement réussi!
${result.amount} sats payés
Solde: ${result.newBalance} sats
Merci pour votre cotisation!
0. Retour`;
      } else {
        return `Échec paiement: ${result.error}
1. Réessayer
0. Retour`;
      }
    } else if (input === '2') {
      // Set reminder
      await this.setPaymentReminder(phoneNumber);
      await this.setMenuState(sessionId, 'main');
      return `Rappel programmé pour demain.
Merci!
0. Retour`;
    }
    
    await this.setMenuState(sessionId, 'main');
    return this.createMainMenu();
  }

  async handleBalanceCheck(phoneNumber, sessionId) {
    const balance = await this.getUserBalance(phoneNumber);
    await this.setMenuState(sessionId, 'main');
    
    return `Solde Lightning: ${balance.sats} sats
Solde Wave: ${balance.wave} XOF
Total estimé: ${balance.total} XOF
0. Retour`;
  }

  async handleHistoryFlow(phoneNumber, input, sessionId) {
    if (input === '0') {
      await this.setMenuState(sessionId, 'main');
      return this.createMainMenu();
    }
    
    const history = await this.getUserHistory(phoneNumber);
    return `Historique complet:
Paiements: ${history.totalPayments}
Reçus: ${history.totalReceived} XOF
Cycles: ${history.completedCycles}/12
0. Retour`;
  }

  async handlePayoutFlow(phoneNumber, input, sessionId) {
    if (input === '0') {
      await this.setMenuState(sessionId, 'main');
      return this.createMainMenu();
    }
    
    const payout = await this.getNextPayout(phoneNumber);
    return `Détails paiement:
Date: ${payout.date}
Montant: ${payout.amount} XOF
Méthode: ${payout.method}
Statut: ${payout.status}
0. Retour`;
  }

  async processContribution(phoneNumber) {
    try {
      // Get user's current contribution amount
      const contribution = await this.getCurrentContribution(phoneNumber);
      
      // Process payment through Wave integration
      const waveService = require('./WaveMobileMoneyService');
      const wave = new waveService();
      
      // Convert sats to XOF
      const amountXof = await wave.convertSatsToXof(contribution.amount);
      
      // Process Wave payment
      const result = await wave.cashOutToWave(
        phoneNumber,
        amountXof,
        `Tontine_Contribution_${Date.now()}`
      );
      
      if (result.success) {
        // Update user's contribution status
        await this.updateContributionStatus(phoneNumber, contribution.amount);
        
        return {
          success: true,
          amount: contribution.amount,
          newBalance: await this.getUserBalance(phoneNumber),
          waveTransactionId: result.wave_transaction_id
        };
      } else {
        throw new Error('Wave payment failed');
      }
      
    } catch (error) {
      console.error('Contribution processing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUserBalance(phoneNumber) {
    try {
      // Get Lightning balance from monetization service
      const monetizationUrl = process.env.MONETIZATION_API_URL || 'http://localhost:8001';
      const response = await fetch(`${monetizationUrl}/monetization/convert/sats-to-xof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sats: 10000 }) // Mock balance
      });
      
      const balanceData = await response.json();
      
      return {
        sats: 10000, // Mock - would get from Lightning node
        xof: balanceData.xof,
        wave: 0, // Mock - would get from Wave API
        total: balanceData.xof
      };
      
    } catch (error) {
      console.error('Failed to get user balance:', error);
      return {
        sats: 0,
        xof: 0,
        wave: 0,
        total: 0
      };
    }
  }

  async getCurrentContribution(phoneNumber) {
    // Mock data - would get from database
    return {
      amount: 5000,
      xof: 1000,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  }

  async getUserHistory(phoneNumber) {
    // Mock data - would get from database
    return {
      lastPayment: '2025-01-15',
      currentCycle: 3,
      currentPot: 30000,
      totalPayments: 3,
      totalReceived: 0,
      completedCycles: 0
    };
  }

  async getNextPayout(phoneNumber) {
    // Mock data - would get from database
    return {
      date: '2025-01-22',
      amount: 30000,
      winner: false,
      method: 'Wave',
      status: 'En attente'
    };
  }

  async setPaymentReminder(phoneNumber) {
    // Mock implementation - would schedule SMS reminder
    console.log(`Payment reminder set for ${phoneNumber}`);
  }

  async updateContributionStatus(phoneNumber, amount) {
    // Mock implementation - would update database
    console.log(`Contribution updated for ${phoneNumber}: ${amount} sats`);
  }

  formatUSSDResponse(message) {
    // USSD responses have limited character capacity
    const maxLength = 160;
    return message.length > maxLength ? message.substring(0, maxLength - 3) + '...' : message;
  }

  async getMenuState(sessionId) {
    const session = this.sessions.get(sessionId);
    return session ? session.state : 'main';
  }

  async setMenuState(sessionId, state) {
    const session = this.sessions.get(sessionId) || {};
    session.state = state;
    session.lastActivity = Date.now();
    this.sessions.set(sessionId, session);
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.sessionTimeout) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Get USSD service statistics
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      sessionTimeout: this.sessionTimeout,
      supportedFeatures: [
        'Contribution payment',
        'Balance check',
        'History view',
        'Payout status',
        'Help information'
      ]
    };
  }
}

module.exports = USSDService;
