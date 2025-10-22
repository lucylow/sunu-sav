// scripts/demo-happy-path.js
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const API_BASE = 'http://localhost:3000/api';

class HappyPathDemo {
  constructor() {
    this.users = [];
    this.groups = [];
    this.invoices = [];
  }

  async run() {
    console.log('🎯 Starting Tontine Bitcoin Happy Path Demo\n');
    
    try {
      // Step 1: Create test users
      await this.createUsers();
      
      // Step 2: Create a tontine group
      await this.createTontineGroup();
      
      // Step 3: Add members to group
      await this.addMembersToGroup();
      
      // Step 4: Create contribution invoices
      await this.createContributionInvoices();
      
      // Step 5: Simulate payments
      await this.simulatePayments();
      
      // Step 6: Check group status
      await this.checkGroupStatus();
      
      console.log('\n✅ Demo completed successfully!');
      this.printSummary();
      
    } catch (error) {
      console.error('\n❌ Demo failed:', error.message);
      process.exit(1);
    }
  }

  async createUsers() {
    console.log('1. Creating test users...');
    
    const userData = [
      { phoneNumber: '+221701234567', language: 'fr' },
      { phoneNumber: '+221701234568', language: 'fr' },
      { phoneNumber: '+221701234569', language: 'fr' }
    ];

    for (const user of userData) {
      const response = await axios.post(`${API_BASE}/users`, user);
      this.users.push(response.data);
      console.log(`   ✅ Created user: ${user.phoneNumber}`);
    }
  }

  async createTontineGroup() {
    console.log('\n2. Creating tontine group...');
    
    const groupData = {
      name: "Tontine Familiale Dakar",
      description: "Épargne familiale pour les projets communs",
      contributionAmountSats: 10000,
      cycleDays: 7,
      maxMembers: 3,
      createdBy: this.users[0].id
    };

    const response = await axios.post(`${API_BASE}/tontine/groups`, groupData);
    this.groups.push(response.data);
    console.log(`   ✅ Created group: ${response.data.name}`);
  }

  async addMembersToGroup() {
    console.log('\n3. Adding members to group...');
    const groupId = this.groups[0].id;

    for (let i = 1; i < this.users.length; i++) {
      const response = await axios.post(
        `${API_BASE}/tontine/groups/${groupId}/members`,
        {
          userId: this.users[i].id,
          inviterId: this.users[0].id
        }
      );
      console.log(`   ✅ Added member: ${this.users[i].phoneNumber}`);
    }
  }

  async createContributionInvoices() {
    console.log('\n4. Creating contribution invoices...');
    const groupId = this.groups[0].id;

    for (const user of this.users) {
      const response = await axios.get(
        `${API_BASE}/tontine/groups/${groupId}/invoice`,
        {
          headers: { 'X-User-ID': user.id }
        }
      );
      
      this.invoices.push({
        userId: user.id,
        invoice: response.data,
        paid: false
      });
      
      console.log(`   ✅ Invoice created for ${user.phoneNumber}: ${response.data.payment_request.substring(0, 50)}...`);
    }
  }

  async simulatePayments() {
    console.log('\n5. Simulating Lightning payments...');
    const groupId = this.groups[0].id;

    for (const invoiceData of this.invoices) {
      // Simulate payment by calling webhook
      await axios.post(`${API_BASE}/webhook/lightning`, {
        payment_hash: invoiceData.invoice.payment_hash,
        status: 'settled',
        amount: invoiceData.invoice.amount_sats,
        settled_at: new Date().toISOString()
      });

      invoiceData.paid = true;
      console.log(`   ✅ Payment simulated for user`);
      
      // Add small delay for realism
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async checkGroupStatus() {
    console.log('\n6. Checking final group status...');
    const groupId = this.groups[0].id;

    const response = await axios.get(
      `${API_BASE}/tontine/groups/${groupId}/status`
    );

    const status = response.data;
    console.log('   📊 Group Status:');
    console.log(`      - Current Cycle: ${status.currentCycle}`);
    console.log(`      - Total Contributions: ${status.totalContributions} sats`);
    console.log(`      - Paid Members: ${status.paidMembersCount}/${status.totalMembers}`);
    console.log(`      - Group Balance: ${status.groupBalance} sats`);
  }

  printSummary() {
    console.log('\n📈 DEMO SUMMARY');
    console.log('================');
    console.log(`👥 Users Created: ${this.users.length}`);
    console.log(`🏠 Tontine Groups: ${this.groups.length}`);
    console.log(`💰 Invoices Generated: ${this.invoices.length}`);
    console.log(`💸 Payments Completed: ${this.invoices.filter(i => i.paid).length}`);
    console.log('\n🎉 Ready for hackathon demo!');
  }
}

// Run demo if script is executed directly
if (require.main === module) {
  const demo = new HappyPathDemo();
  demo.run().catch(console.error);
}

module.exports = HappyPathDemo;
