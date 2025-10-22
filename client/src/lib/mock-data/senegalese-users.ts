// client/src/lib/mock-data/senegalese-users.ts
export const senegaleseUsers = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    phone_number: '+221701234567',
    public_key: 'npub1fatou1234567890abcdefghijklmnopqrstuvwxyz1234567890abc',
    language: 'fr',
    created_at: new Date('2024-01-15'),
    profile: {
      name: 'Fatou Diop',
      age: 35,
      occupation: 'Fabric Vendor',
      market: 'Sandaga Market, Dakar',
      weekly_income: 75000, // XOF
      business_type: 'Textiles and Clothing',
      location: 'Medina, Dakar',
      education_level: 'Secondary',
      tontine_experience: 8, // years
      preferred_payment: 'Wave',
      device_type: 'Smartphone'
    }
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    phone_number: '+221771234568',
    public_key: 'npub1aminata1234567890abcdefghijklmnopqrstuvwxyz123456789',
    language: 'wo',
    created_at: new Date('2024-01-16'),
    profile: {
      name: 'Aminata Sow',
      age: 42,
      occupation: 'Vegetable Seller',
      market: 'HLM Market, Dakar',
      weekly_income: 45000, // XOF
      business_type: 'Fresh Produce',
      location: 'HLM, Dakar',
      education_level: 'Primary',
      tontine_experience: 12, // years
      preferred_payment: 'Orange Money',
      device_type: 'Feature Phone'
    }
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    phone_number: '+221761234569',
    public_key: 'npub1mariama1234567890abcdefghijklmnopqrstuvwxyz1234567890',
    language: 'fr',
    created_at: new Date('2024-01-17'),
    profile: {
      name: 'Mariama Ndiaye',
      age: 28,
      occupation: 'Fish Seller',
      market: 'Tilene Market, Dakar',
      weekly_income: 60000, // XOF
      business_type: 'Seafood',
      location: 'Pikine, Dakar',
      education_level: 'Secondary',
      tontine_experience: 5, // years
      preferred_payment: 'Wave',
      device_type: 'Smartphone'
    }
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    phone_number: '+221701234570',
    public_key: 'npub1khadija1234567890abcdefghijklmnopqrstuvwxyz123456789',
    language: 'fr',
    created_at: new Date('2024-01-18'),
    profile: {
      name: 'Khadija Diallo',
      age: 39,
      occupation: 'Spices Merchant',
      market: 'Sandaga Market, Dakar',
      weekly_income: 55000, // XOF
      business_type: 'Herbs and Spices',
      location: 'Gueule Tapée, Dakar',
      education_level: 'None',
      tontine_experience: 15, // years
      preferred_payment: 'Wave',
      device_type: 'Feature Phone'
    }
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    phone_number: '+221771234571',
    public_key: 'npub1astou1234567890abcdefghijklmnopqrstuvwxyz12345678901',
    language: 'wo',
    created_at: new Date('2024-01-19'),
    profile: {
      name: 'Astou Fall',
      age: 31,
      occupation: 'Tailor',
      market: 'HLM Market, Dakar',
      weekly_income: 50000, // XOF
      business_type: 'Clothing Alterations',
      location: 'Fass, Dakar',
      education_level: 'Vocational',
      tontine_experience: 6, // years
      preferred_payment: 'Orange Money',
      device_type: 'Smartphone'
    }
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    phone_number: '+221761234572',
    public_key: 'npub1ndeye1234567890abcdefghijklmnopqrstuvwxyz123456789012',
    language: 'fr',
    created_at: new Date('2024-01-20'),
    profile: {
      name: 'Ndeye Sarr',
      age: 45,
      occupation: 'Beans and Grains Seller',
      market: 'Tilene Market, Dakar',
      weekly_income: 40000, // XOF
      business_type: 'Dry Goods',
      location: 'Grand Dakar',
      education_level: 'Primary',
      tontine_experience: 20, // years
      preferred_payment: 'Wave',
      device_type: 'Feature Phone'
    }
  }
];

export const senegaleseTontineGroups = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Tontine des Commerçantes de Sandaga',
    description: 'Groupe des femmes commerçantes du marché Sandaga pour les frais scolaires',
    contributionAmount: 10000, // ~2000 XOF
    cycleDays: 7,
    maxMembers: 6,
    currentMembers: 2,
    currentCycle: 3,
    status: 'active',
    createdBy: '11111111-1111-1111-1111-111111111111', // Fatou
    nextPayoutDate: new Date('2024-02-15'),
    createdAt: new Date('2024-01-20'),
    frequency: 'weekly',
    rules: {
      meetingDay: 'Thursday',
      meetingTime: '18:00',
      location: 'Sandaga Market, Stall A12',
      purpose: 'School fees and business capital',
      penaltyLate: 500, // sats
      emergencyLoan: true,
      socialFund: true
    }
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Tontine HLM pour les Projets',
    description: 'Épargne collective pour les projets familiaux et médicaux',
    contributionAmount: 5000, // ~1000 XOF
    cycleDays: 14,
    maxMembers: 8,
    currentMembers: 2,
    currentCycle: 2,
    status: 'active',
    createdBy: '22222222-2222-2222-2222-222222222222', // Aminata
    nextPayoutDate: new Date('2024-02-22'),
    createdAt: new Date('2024-01-25'),
    frequency: 'biweekly',
    rules: {
      meetingDay: 'Sunday',
      meetingTime: '16:00',
      location: 'HLM Market, Near Mosque',
      purpose: 'Medical emergencies and family projects',
      penaltyLate: 200, // sats
      emergencyLoan: true,
      socialFund: false
    }
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    name: 'Solidarité des Poissonnières de Tilene',
    description: 'Groupe des vendeuses de poisson pour les investissements commerciaux',
    contributionAmount: 15000, // ~3000 XOF
    cycleDays: 7,
    maxMembers: 5,
    currentMembers: 2,
    currentCycle: 4,
    status: 'active',
    createdBy: '33333333-3333-3333-3333-333333333333', // Mariama
    nextPayoutDate: new Date('2024-02-16'),
    createdAt: new Date('2024-01-18'),
    frequency: 'weekly',
    rules: {
      meetingDay: 'Friday',
      meetingTime: '17:30',
      location: 'Tilene Market, Fish Section',
      purpose: 'Business inventory and equipment',
      penaltyLate: 1000, // sats
      emergencyLoan: false,
      socialFund: true
    }
  }
];

export const groupMemberships = [
  // Sandaga Market Group Members
  {
    id: 'm1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    groupId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    userId: '11111111-1111-1111-1111-111111111111', // Fatou - Admin
    role: 'admin',
    joinedAt: new Date('2024-01-20'),
    isActive: true
  },
  {
    id: 'm2aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    groupId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    userId: '44444444-4444-4444-4444-444444444444', // Khadija
    role: 'member',
    joinedAt: new Date('2024-01-21'),
    isActive: true
  },
  // HLM Market Group Members
  {
    id: 'm1bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    groupId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    userId: '22222222-2222-2222-2222-222222222222', // Aminata - Admin
    role: 'admin',
    joinedAt: new Date('2024-01-25'),
    isActive: true
  },
  {
    id: 'm2bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    groupId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    userId: '55555555-5555-5555-5555-555555555555', // Astou
    role: 'member',
    joinedAt: new Date('2024-01-26'),
    isActive: true
  },
  // Tilene Market Group Members
  {
    id: 'm1ccccccccccccccccccccccccccccccc',
    groupId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    userId: '33333333-3333-3333-3333-333333333333', // Mariama - Admin
    role: 'admin',
    joinedAt: new Date('2024-01-18'),
    isActive: true
  },
  {
    id: 'm2ccccccccccccccccccccccccccccccc',
    groupId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    userId: '66666666-6666-6666-6666-666666666666', // Ndeye
    role: 'member',
    joinedAt: new Date('2024-01-19'),
    isActive: true
  }
];

export const contributionHistory = [
  // Sandaga Group - Cycle 1 (Completed)
  {
    id: 'c1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    groupId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    userId: '11111111-1111-1111-1111-111111111111', // Fatou
    cycleNumber: 1,
    amountSats: 10000,
    paymentRequest: 'lnbc100n1pjsample1...',
    paymentHash: 'hash1111111111111111111111111111111111111111111111111111',
    status: 'paid',
    paidAt: new Date('2024-01-25T10:30:00Z'),
    createdAt: new Date('2024-01-23T08:00:00Z')
  },
  {
    id: 'c2aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    groupId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    userId: '44444444-4444-4444-4444-444444444444', // Khadija
    cycleNumber: 1,
    amountSats: 10000,
    paymentRequest: 'lnbc100n1pjsample2...',
    paymentHash: 'hash2222222222222222222222222222222222222222222222222222',
    status: 'paid',
    paidAt: new Date('2024-01-25T14:15:00Z'),
    createdAt: new Date('2024-01-23T08:00:00Z')
  },

  // Sandaga Group - Cycle 2 (Completed)
  {
    id: 'c3aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    groupId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    userId: '11111111-1111-1111-1111-111111111111', // Fatou
    cycleNumber: 2,
    amountSats: 10000,
    paymentRequest: 'lnbc100n1pjsample3...',
    paymentHash: 'hash3333333333333333333333333333333333333333333333333333',
    status: 'paid',
    paidAt: new Date('2024-02-01T09:45:00Z'),
    createdAt: new Date('2024-01-30T08:00:00Z')
  },
  {
    id: 'c4aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    groupId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    userId: '44444444-4444-4444-4444-444444444444', // Khadija
    cycleNumber: 2,
    amountSats: 10000,
    paymentRequest: 'lnbc100n1pjsample4...',
    paymentHash: 'hash4444444444444444444444444444444444444444444444444444',
    status: 'paid',
    paidAt: new Date('2024-02-01T16:20:00Z'), // Paid late
    createdAt: new Date('2024-01-30T08:00:00Z')
  },

  // Sandaga Group - Cycle 3 (Current - Mixed Status)
  {
    id: 'c5aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    groupId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    userId: '11111111-1111-1111-1111-111111111111', // Fatou
    cycleNumber: 3,
    amountSats: 10000,
    paymentRequest: 'lnbc100n1pjsample5...',
    paymentHash: 'hash5555555555555555555555555555555555555555555555555555',
    status: 'paid',
    paidAt: new Date('2024-02-08T11:00:00Z'),
    createdAt: new Date('2024-02-06T08:00:00Z')
  },
  {
    id: 'c6aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    groupId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    userId: '44444444-4444-4444-4444-444444444444', // Khadija
    cycleNumber: 3,
    amountSats: 10000,
    paymentRequest: 'lnbc100n1pjsample6...',
    paymentHash: 'hash6666666666666666666666666666666666666666666666666666',
    status: 'pending',
    paidAt: null,
    createdAt: new Date('2024-02-06T08:00:00Z')
  },

  // HLM Group - Cycle 1 (Completed)
  {
    id: 'c1bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    groupId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    userId: '22222222-2222-2222-2222-222222222222', // Aminata
    cycleNumber: 1,
    amountSats: 5000,
    paymentRequest: 'lnbc50n1pjsample7...',
    paymentHash: 'hash7777777777777777777777777777777777777777777777777777',
    status: 'paid',
    paidAt: new Date('2024-02-04T10:00:00Z'),
    createdAt: new Date('2024-01-28T08:00:00Z')
  },
  {
    id: 'c2bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    groupId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    userId: '55555555-5555-5555-5555-555555555555', // Astou
    cycleNumber: 1,
    amountSats: 5000,
    paymentRequest: 'lnbc50n1pjsample8...',
    paymentHash: 'hash8888888888888888888888888888888888888888888888888888',
    status: 'paid',
    paidAt: new Date('2024-02-05T15:30:00Z'),
    createdAt: new Date('2024-01-28T08:00:00Z')
  }
];

export const payoutHistory = [
  // Sandaga Group Payouts
  {
    id: 'p1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    groupId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    cycleNumber: 1,
    winnerUserId: '44444444-4444-4444-4444-444444444444', // Khadija won cycle 1
    amountSats: 20000, // 2 members × 10,000 sats
    paymentRequest: 'lnbc200n1pjsamplewinner1...',
    paymentHash: 'whash111111111111111111111111111111111111111111111111111',
    status: 'paid',
    paidAt: new Date('2024-01-26T18:00:00Z'),
    createdAt: new Date('2024-01-25T18:00:00Z'),
    waveTransactionId: 'WAVE_TX_00123456',
    localCurrencyAmount: 4000, // XOF
    exchangeRateUsed: 0.2
  },
  {
    id: 'p2aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    groupId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    cycleNumber: 2,
    winnerUserId: '11111111-1111-1111-1111-111111111111', // Fatou won cycle 2
    amountSats: 20000,
    paymentRequest: 'lnbc200n1pjsamplewinner2...',
    paymentHash: 'whash222222222222222222222222222222222222222222222222222',
    status: 'paid',
    paidAt: new Date('2024-02-02T18:00:00Z'),
    createdAt: new Date('2024-02-01T18:00:00Z'),
    waveTransactionId: 'WAVE_TX_00123457',
    localCurrencyAmount: 4000,
    exchangeRateUsed: 0.2
  },

  // HLM Group Payouts
  {
    id: 'p1bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    groupId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    cycleNumber: 1,
    winnerUserId: '22222222-2222-2222-2222-222222222222', // Aminata won cycle 1
    amountSats: 10000, // 2 members × 5,000 sats
    paymentRequest: 'lnbc100n1pjsamplewinner3...',
    paymentHash: 'whash333333333333333333333333333333333333333333333333333',
    status: 'paid',
    paidAt: new Date('2024-02-08T16:00:00Z'),
    createdAt: new Date('2024-02-07T16:00:00Z'),
    waveTransactionId: 'WAVE_TX_00123458',
    localCurrencyAmount: 2000, // XOF
    exchangeRateUsed: 0.2
  }
];

export const senegalMarketData = {
  exchangeRates: {
    satoshiToXof: 0.2, // 1 sat = ~0.2 XOF
    bitcoinToXof: 20000000, // 1 BTC = ~20,000,000 XOF
    usdToXof: 600 // 1 USD = ~600 XOF
  },
  
  mobileMoneyPenetration: {
    wave: {
      marketShare: 0.65,
      transactionFee: 0.01, // 1%
      dailyLimit: 500000, // XOF
      userBase: 8000000
    },
    orangeMoney: {
      marketShare: 0.25,
      transactionFee: 0.015, // 1.5%
      dailyLimit: 300000, // XOF
      userBase: 3000000
    },
    freeMoney: {
      marketShare: 0.10,
      transactionFee: 0.012, // 1.2%
      dailyLimit: 400000, // XOF
      userBase: 1200000
    }
  },

  dakarMarkets: {
    sandaga: {
      name: 'Marché Sandaga',
      vendorsCount: 2500,
      femaleVendorsRatio: 0.58,
      dailyCustomers: 15000,
      mainProducts: ['Textiles', 'Electronics', 'Household Goods']
    },
    hlm: {
      name: 'Marché HLM',
      vendorsCount: 1800,
      femaleVendorsRatio: 0.63,
      dailyCustomers: 12000,
      mainProducts: ['Fresh Produce', 'Food', 'Clothing']
    },
    tilene: {
      name: 'Marché Tilène',
      vendorsCount: 1200,
      femaleVendorsRatio: 0.72,
      dailyCustomers: 8000,
      mainProducts: ['Fish', 'Seafood', 'Agricultural Products']
    }
  },

  tontineStatistics: {
    averageContribution: 7500, // XOF per week
    averageGroupSize: 8,
    meetingFrequency: 'weekly',
    commonPurposes: [
      'School Fees',
      'Medical Expenses', 
      'Business Inventory',
      'Family Ceremonies',
      'Emergency Funds'
    ],
    annualMarketSize: 200000000, // 200 million XOF in Senegal
    participationRate: {
      women: 0.83,
      marketVendors: 0.67,
      urbanPopulation: 0.45
    }
  }
};

export const userNotifications = [
  {
    id: 'n1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    userId: '11111111-1111-1111-1111-111111111111', // Fatou
    type: 'PAYMENT_REMINDER',
    title: 'Rappel de Cotisation',
    message: 'Votre cotisation de 10,000 sats pour Tontine Sandaga est due aujourd\'hui',
    data: {
      groupId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      amountSats: 10000,
      dueDate: '2024-02-15'
    },
    isRead: false,
    createdAt: new Date('2024-02-15T08:00:00Z')
  },
  {
    id: 'n2aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    userId: '11111111-1111-1111-1111-111111111111', // Fatou
    type: 'PAYOUT_RECEIVED',
    title: 'Félicitations! Vous avez gagné',
    message: 'Vous avez reçu 20,000 sats (4,000 XOF) de la tontine Sandaga - Cycle 2',
    data: {
      groupId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      amountSats: 20000,
      amountXof: 4000,
      cycleNumber: 2
    },
    isRead: true,
    createdAt: new Date('2024-02-02T18:30:00Z')
  },
  {
    id: 'n3aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    userId: '44444444-4444-4444-4444-444444444444', // Khadija
    type: 'PAYMENT_RECEIVED',
    title: 'Paiement Reçu',
    message: 'Votre cotisation de 10,000 sats a été reçue pour le cycle 1',
    data: {
      groupId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      amountSats: 10000,
      cycleNumber: 1
    },
    isRead: true,
    createdAt: new Date('2024-01-25T14:16:00Z')
  },
  {
    id: 'n4bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    userId: '22222222-2222-2222-2222-222222222222', // Aminata
    type: 'CYCLE_COMPLETED',
    title: 'Cycle Terminé',
    message: 'Tous les membres ont payé. Le gagnant sera sélectionné ce soir à 18:00',
    data: {
      groupId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      cycleNumber: 2,
      totalAmount: 10000
    },
    isRead: false,
    createdAt: new Date('2024-02-15T12:00:00Z')
  }
];

export const hackathonDemoScenarios = {
  scenario1: {
    name: "Fatou's Weekly Tontine Contribution",
    description: "Market vendor pays her weekly contribution from her market stall",
    steps: [
      {
        step: 1,
        action: "Fatou receives SMS reminder while working at Sandaga Market",
        time: "Thursday 10:00 AM",
        location: "Sandaga Market, Stall A12"
      },
      {
        step: 2,
        action: "Opens Tontine Bitcoin app during slow period",
        time: "Thursday 2:30 PM",
        uiAction: "Tap 'Pay Now' button"
      },
      {
        step: 3,
        action: "Selects payment method: Wave mobile money",
        time: "Thursday 2:31 PM",
        amount: "10,000 sats ≈ 2,000 XOF"
      },
      {
        step: 4,
        action: "Confirms payment via Wave PIN",
        time: "Thursday 2:32 PM",
        result: "Payment successful"
      },
      {
        step: 5,
        action: "Receives confirmation and continues working",
        time: "Thursday 2:33 PM",
        timeSaved: "3.5 hours vs traditional meeting"
      }
    ],
    metrics: {
      timeSaved: "3.5 hours",
      costSaved: "1,000 XOF transport",
      securityImproved: "No cash handling risk"
    }
  },

  scenario2: {
    name: "Khadija Wins Tontine Payout",
    description: "Automatic payout distribution and Wave cash-out",
    steps: [
      {
        step: 1,
        action: "All group members complete payments for cycle",
        time: "Thursday 6:00 PM",
        trigger: "Smart contract executes"
      },
      {
        step: 2,
        action: "Random winner selection: Khadija",
        time: "Thursday 6:01 PM",
        amount: "20,000 sats ≈ 4,000 XOF"
      },
      {
        step: 3,
        action: "Automatic cash-out to Khadija's Wave account",
        time: "Thursday 6:02 PM",
        waveTx: "WAVE_TX_00123456"
      },
      {
        step: 4,
        action: "Khadija receives SMS confirmation",
        time: "Thursday 6:03 PM",
        message: "Vous avez reçu 4,000 XOF de Tontine Sandaga"
      },
      {
        step: 5,
        action: "Khadija can spend immediately via Wave",
        time: "Thursday 6:04 PM",
        useCase: "Buy school supplies for children"
      }
    ],
    metrics: {
      payoutSpeed: "3 minutes",
      transparency: "Full audit trail",
      accessibility: "Instant mobile money access"
    }
  }
};

export const demoSummary = {
  totalUsers: 6,
  activeGroups: 3,
  totalContributions: 8,
  totalPayouts: 3,
  totalVolumeSats: 90000, // ~18,000 XOF
  activeCycles: [
    {
      group: "Sandaga Market Tontine",
      cycle: 3,
      progress: "1/2 members paid",
      amount: "10,000 sats remaining"
    },
    {
      group: "HLM Market Tontine", 
      cycle: 2,
      progress: "0/2 members paid",
      amount: "10,000 sats remaining"
    }
  ],
  recentActivity: [
    "Fatou paid 10,000 sats - Sandaga Cycle 3",
    "Khadija received 4,000 XOF payout - Sandaga Cycle 2", 
    "Aminata created new group - HLM Market",
    "Mariama joined Tilene Fish Sellers group"
  ]
};
