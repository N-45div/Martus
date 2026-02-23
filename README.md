# Martus

> **Collaborative Art Funding Protocol on Solana** — Where communities fund art, artists compete, and everyone votes.

![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=flat&logo=solana)
![Anchor](https://img.shields.io/badge/Anchor-0.30.0-blue?style=flat)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![Tapestry](https://img.shields.io/badge/Tapestry-Social-green?style=flat)

---

## 🎨 What is Martus?

**Martus** is a decentralized collaborative canvas platform where:

1. **Communities fund art regions** — Contributors pool SOL into grid regions they want to see painted
2. **Artists compete to create** — Artists submit bids with mockups and proposed artwork
3. **Contributors vote democratically** — Funding amount determines voting power
4. **Winners get paid, art gets minted** — Winning artists receive the pooled funds, final artwork becomes an NFT

Think of it as **Kickstarter meets Reddit Place meets NFT art** — fully on-chain, fully transparent, fully community-driven.

---

## 🏆 Hackathon Submission

**Built for the Solana Hackathon** with integrations:

| Sponsor | Integration |
|---------|-------------|
| **Tapestry Protocol** | Social features — comments, likes, follows, activity feeds |
| **Solana** | Core smart contract using Anchor framework |

### Why Martus?

- **Novel Funding Model**: Quadratic-style influence where contribution size matters but doesn't dominate
- **Artist Economy**: Creates a marketplace for digital artists with guaranteed payouts
- **Community Ownership**: The community literally shapes the canvas through funding decisions
- **Social Layer**: Tapestry integration enables rich social interactions around each art piece

---

## ✨ Features

### Core Mechanics
- **Season-based Canvas**: Each season has distinct funding → voting → painting phases
- **8×8 Grid System**: 64 unique regions, each fundable independently
- **Minimum Funding Threshold**: Regions only activate when minimum funding is reached
- **Artist Bidding**: Artists submit proposals with mockup URIs and bid amounts
- **Proportional Voting**: Your vote weight = your contribution amount

### Social Integration (Tapestry)
- **Profile System**: Create and link Tapestry profiles to wallets
- **Comments**: Discuss regions, bids, and artwork
- **Likes**: Show appreciation for submissions
- **Follow System**: Track favorite artists and contributors
- **Activity Feed**: Real-time updates on platform activity

### On-Chain Guarantees
- **Transparent Treasury**: All funds held in PDAs, fully auditable
- **Automatic Payouts**: Winners claim directly from region vaults
- **NFT Finalization**: Completed canvas minted as commemorative NFT

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Smart Contract** | Anchor 0.30.0 (Rust) |
| **Frontend** | React 18 + Vite + TypeScript |
| **Styling** | TailwindCSS |
| **Wallet** | Solana Wallet Adapter |
| **Social** | Tapestry Protocol REST API |
| **Icons** | Lucide React |

---

## 📦 Program ID (Devnet)

```
bk3AL2Qz3RAg1mRLJWu8E2iA8NNVf7a3hAoF1L5p7t2
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Rust & Cargo
- Solana CLI (`solana-install init 1.18.x`)
- Anchor CLI (`cargo install --git https://github.com/coral-xyz/anchor anchor-cli`)

### Installation

```bash
# Clone the repository
git clone https://github.com/N-45div/Martus.git
cd Martus

# Install Anchor dependencies
npm install

# Install frontend dependencies
cd app && npm install
```

### Build & Deploy

```bash
# Build the smart contract
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### Run Frontend

```bash
cd app
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Tests

```bash
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=~/.config/solana/id.json \
npx ts-mocha -t 120000 tests/collab-canvas-simple.ts
```

---

## 🔐 Environment Variables

Create `app/.env`:

```env
VITE_TAPESTRY_API_KEY=your_tapestry_api_key
```

Get your Tapestry API key at [app.usetapestry.dev](https://app.usetapestry.dev)

---

## 📁 Project Structure

```
martus/
├── programs/collab-canvas/     # Anchor smart contract
│   └── src/lib.rs              # Core program logic
├── app/                        # React frontend
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── hooks/              # React hooks (useProgram)
│   │   ├── lib/                # Utilities & Tapestry client
│   │   └── types/              # TypeScript types
│   └── public/idl/             # Program IDL
├── tests/                      # Integration tests
└── Anchor.toml                 # Anchor configuration
```

---

## 🎯 Roadmap

- [x] Core smart contract (Season, Region, Bid, Vote, Payout)
- [x] React frontend with wallet integration
- [x] Tapestry social integration
- [x] Devnet deployment
- [x] Integration tests
- [ ] Canvas visualization component
- [ ] NFT minting flow
- [ ] Mainnet deployment
- [ ] Mobile-responsive UI

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit PRs.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

**Built with ❤️ for the Solana ecosystem**
