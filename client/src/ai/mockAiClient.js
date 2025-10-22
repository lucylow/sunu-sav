// frontend/src/ai/mockAiClient.js
// Pluggable mock AI client. Replace by real client later (same API surface).
// All functions return Promises to mirror async REST/gRPC calls.

const RNG = (seed = 42) => {
  // deterministic PRNG (mulberry32)
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ t >>> 15, 1 | t);
    r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
};

const rand = RNG(1234);

// helpers
const satToXOF = (sats) => Math.round(sats * 0.00000001 * 100000 / 1); // stub conversion (replace)
const nowISO = () => new Date().toISOString();

export const aiClient = {
  // 1. Credit score
  async predictCreditScore({ userId, features }) {
    await delay(250);
    // deterministic pseudo-score
    const base = 0.5 + (features.punctualityRate || 0.8) * 0.3 + (features.tontine_contributions || 10) * 0.02;
    const noise = (rand() - 0.5) * 0.08;
    const score = Math.max(0, Math.min(1, +(base + noise).toFixed(3)));
    return {
      userId,
      score,
      recommendedLoanXOF: score > 0.75 ? Math.round((0.5 + score) * 50000) : 0,
      explanation: ['punctuality', 'contributions', 'community_trust'].map((k) => ({ feature: k, impact: +(rand().toFixed(2)) }))
    };
  },

  // 2. Chat assistant (mock)
  async chat({ userId, message, language = 'fr' }) {
    await delay(250);
    const replies = {
      fr: `Bonjour — vous devez ${message.includes('payer') ? 'payer 10000 sats' : 'vérifier votre compte'}`,
      wo: `Naka def — sa tontine am na ${message.includes('payer') ? '10,000 sats' : 'benn status'}`,
      en: `Hi — ${message.includes('owe') ? 'you owe 10000 sats' : 'check your balance'}`
    };
    return { text: replies[language] || replies.fr, language, timestamp: nowISO() };
  },

  // 3. Fraud detection (stream or batch)
  async detectFraud({ batch = [] }) {
    await delay(120);
    // return flagged items
    const flagged = batch.filter((tx, i) => (tx.amountSats && tx.amountSats > 200000) || (i % 11 === 0 && rand() > 0.6));
    return flagged.map(tx => ({ ...tx, reason: tx.amountSats > 200000 ? 'large_amount' : 'anomalous_timing', score: +(0.6 + rand() * 0.4).toFixed(2) }));
  },

  // 4. Routing optimizer (mock stats + suggestion)
  async suggestRouting({ groupId }) {
    await delay(100);
    return {
      groupId,
      recommendedNode: '03ab12...nodepub',
      expectedFeeSats: Math.round(1 + rand() * 10),
      confidence: +(0.6 + rand()*0.4).toFixed(2)
    };
  },

  // 5. Inflation insights
  async forecastInflation({ horizonDays = 180 }) {
    await delay(120);
    const points = [];
    for (let i = 0; i < Math.min(90, horizonDays); i++) {
      points.push({ date: new Date(Date.now() + i * 86400000).toISOString().slice(0,10), btcCfa: +(50000 + Math.sin(i/7)*3000 + rand()*2000).toFixed(0) });
    }
    return { horizonDays, timeseries: points, confidence: 0.82 };
  },

  // 6. AI payout fairness (mock explanation)
  async evaluatePayout({ groupId, candidates }) {
    await delay(150);
    const winnerIndex = Math.floor(rand() * candidates.length);
    return {
      winner: candidates[winnerIndex],
      scores: candidates.map(c => ({ id: c.id, score: +(0.4 + rand()*0.6).toFixed(3) })),
      explanation: `Selected via explainable proxy: top metric = punctuality`
    };
  },

  // 7. Predictive analytics
  async predictGroupCompletion({ groupId }) {
    await delay(180);
    const completionProb = +(0.6 + rand()*0.3).toFixed(2);
    return { groupId, completion_prob: completionProb, eta_days: Math.round( (1-completionProb) * 10 ) };
  },

  // 8. Reminder schedule suggestion
  async nextRemindTime({ userId, history }) {
    await delay(40);
    const hour = 18 + Math.floor(rand()*6);
    return { userId, nextReminderAt: nextAt(hour), reason: 'user_pattern' };
  },

  // 9. Agent recommendation
  async recommendAgent({ location, agents }) {
    await delay(120);
    // return nearest agent by mock distance
    const pick = agents[Math.floor(rand()*agents.length)];
    return { agent: pick, eta_minutes: Math.round(rand()*30) };
  },

  // 10. Microtask reward simulation
  async rewardMicrotask({ userId, taskId }) {
    await delay(70);
    const sats = Math.round(5 + rand()*50);
    return { userId, taskId, sats, txProof: `mockproof-${Math.floor(rand()*1e6)}` };
  }
};

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }
function nextAt(hour) {
  const d = new Date();
  d.setHours(hour, 45, 0, 0);
  if (d < new Date()) d.setDate(d.getDate()+1);
  return d.toISOString();
}
export default aiClient;
