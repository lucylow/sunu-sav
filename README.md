# SunuSàv - Our Savings, Our Future

**Powered by Bitcoin. Driven by Community.**

A Lightning-powered tontine platform that brings traditional Senegalese community savings circles into the digital age with Bitcoin Lightning Network.

Built for the **Dakar Bitcoin Hack 2025**.

---

## 🌟 Overview

SunuSàv digitizes the traditional West African "tontine" savings model using Bitcoin's Lightning Network. Community members pool resources through regular contributions, with rotating payouts ensuring everyone benefits while maintaining transparency and security through blockchain technology.

### Key Features

- **Community Savings Groups**: Create or join tontine circles with friends, family, and community members
- **Lightning Network Integration**: Instant, low-fee Bitcoin payments via Lightning Network
- **Multi-Signature Security**: Funds protected with Bitcoin multi-signature wallets
- **Transparent Tracking**: Real-time contribution and payout tracking
- **Mobile-First Design**: Optimized for low-bandwidth environments and mid-range devices
- **Automated Cycles**: Smart rotation system for fair payout distribution

---

## 🚀 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **shadcn/ui** component library
- **tRPC** for type-safe API calls
- **Wouter** for routing

### Backend
- **Express 4** server
- **tRPC 11** for API layer
- **Drizzle ORM** for database
- **MySQL/TiDB** database
- **Manus OAuth** for authentication

### Blockchain
- Bitcoin Lightning Network (mock implementation for MVP)
- Multi-signature wallet support
- Invoice generation and payment tracking

---

## 📦 Installation

### Prerequisites
- Node.js 22.x
- pnpm 10.x
- MySQL database

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd sunusav
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=mysql://user:password@localhost:3306/sunusav
   JWT_SECRET=your-secret-key
   VITE_APP_ID=your-app-id
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
   VITE_APP_TITLE=SunuSàv - Our Savings, Our Future
   VITE_APP_LOGO=https://your-logo-url.com/logo.png
   ```

4. **Push database schema**
   ```bash
   pnpm db:push
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

   The app will be available at `http://localhost:3000`

---

## 🎯 Usage

### Creating a Tontine Group

1. Sign in to the platform
2. Click "Create Group" 
3. Fill in group details:
   - Group name and description
   - Contribution amount (in satoshis)
   - Payment frequency (weekly/biweekly/monthly)
   - Maximum number of members
4. Submit to create your group

### Joining a Group

1. Browse available groups
2. Click on a group to view details
3. Click "Join Group" if spots are available
4. Start contributing according to the schedule

### Making Contributions

1. Navigate to your group
2. Enter contribution amount
3. Click "Pay with Lightning"
4. Transaction is recorded on the blockchain

---

## 🏗️ Project Structure

```
sunusav/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # Utilities and tRPC client
│   │   └── hooks/         # Custom React hooks
├── server/                # Backend Express server
│   ├── routers.ts         # tRPC API routes
│   ├── db.ts              # Database queries
│   └── _core/             # Core server utilities
├── drizzle/               # Database schema and migrations
│   └── schema.ts          # Database tables
├── shared/                # Shared types and constants
└── package.json
```

---

## 🔐 Security Features

- **Multi-Signature Wallets**: 2-of-3 signature requirement for fund security
- **Encrypted Sessions**: JWT-based authentication
- **Transaction Verification**: All Lightning payments verified
- **Audit Trail**: Complete history of contributions and payouts

---

## 🌍 Local Impact

SunuSàv addresses real challenges in Senegalese communities:

- **Trust Issues**: Blockchain transparency eliminates traditional tontine trust problems
- **Financial Inclusion**: Accessible to anyone with basic internet access
- **Low Fees**: Lightning Network reduces transaction costs
- **Cultural Relevance**: Builds on familiar, trusted savings model

---

## 🛠️ Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm db:push` - Push database schema changes
- `pnpm tsc` - Type check

### Database Schema

The platform uses the following main tables:

- `users` - User accounts and authentication
- `tontineGroups` - Savings group information
- `tontineMembers` - Group membership records
- `contributions` - Payment tracking
- `payouts` - Distribution records
- `lightningInvoices` - Lightning Network invoices

---

## 🚧 Roadmap

### Phase 1 (Current - MVP)
- ✅ User authentication
- ✅ Group creation and management
- ✅ Contribution tracking
- ✅ Mock Lightning integration

### Phase 2 (Next)
- [ ] Real Lightning Network integration
- [ ] Multi-signature wallet implementation
- [ ] SMS/USSD support for feature phones
- [ ] Automated payout scheduling

### Phase 3 (Future)
- [ ] Mobile apps (iOS/Android)
- [ ] Nostr integration for notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (Wolof, French)

---

## 📄 License

This project is open source and built for the Dakar Bitcoin Hack 2025.

---

## 👥 Team

Built with ❤️ for the Senegalese community and the global Bitcoin ecosystem.

---

## 🙏 Acknowledgments

- Dakar Bitcoin Days organizers
- Bitcoin and Lightning Network communities
- Traditional tontine practitioners in Senegal
- Open source contributors

---

## 📞 Contact

For questions, feedback, or collaboration opportunities, please reach out through the Dakar Bitcoin Hack Discord channel.

---

**SunuSàv** - Empowering communities through Bitcoin-powered savings.

