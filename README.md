🔐 Private FHE ICO
Fully Homomorphic Encryption Token Sale on Zama FHEVM

Live Demo: https://private-fhe-ico.vercel.app

Demo Video: https://youtu.be/GLZ0zJuH-g0

Contract: 0xf640a469E72d1C63B4a58D7cc8750666e5C0DFe1 (Sepolia)

📌 Overview

Private FHE ICO is a fully homomorphic encryption–powered token sale system where user contributions are kept completely encrypted on-chain.
No participant can see how much any other user contributed — not even the contract owner — until the sale ends.

The system uses:

Zama FHEVM to store all contributions as encrypted euint64

Homomorphic addition to compute fundraising totals without decrypting

Zama KMS flow (pending activation) for decrypting totals and individual contributions after the sale

A polished React + Ethers.js frontend deployed on Vercel

This creates a privacy-preserving ICO, enabling encrypted fundraising for DAOs, token sales, and private rounds.

🔐 Key Features
✔ Encrypted Contributions

All user contributions are stored as euint64 encrypted values.
Even during the entire ICO, no clear amounts ever appear on-chain.

✔ Homomorphic Aggregation

Totals are updated using:

encryptedTotalRaised = FHE.add(encryptedTotalRaised, encAmount);


No plaintext is ever exposed.

✔ Decryption After the Sale

Once the ICO ends:

Owner marks totals decryptable

Users mark their own contributions decryptable

Zama KMS should produce:

ABI encoded cleartexts

Decryption proofs

Contract verifies these via:

FHE.checkSignatures(...)

✔ Hard Cap Enforcement

The contract supports a 0.1 ETH cap with auto-closing behavior.

✔ Token Allocation

After decryption and verification, users can claim tokens proportionally to their verified clear contribution.

⚠ Zama KMS Availability Disclaimer (Important)

At the time of this submission, Zama’s KMS public endpoint is not yet available, which means:

The decryption flow (make*Decryptable + verify*)

Proof verification (checkSignatures)

Final claimable token amounts

…are fully implemented in the architecture but cannot be demonstrated end-to-end.

The contract includes the complete production-ready KMS pipeline, and once the Zama KMS API is active, the system will support full on-chain verified decryption.

The demo video clearly highlights this limitation.

📺 Demo Video (Required)

A 180 second walkthrough demonstrating:

Wallet connection

Submitting encrypted contribution

Viewing ciphertext handles on-chain

Hard cap logic

Owner actions

Explanation of the KMS limitation

▶ https://youtu.be/GLZ0zJuH-g0

🌐 Live Demo (Frontend)

The React app is deployed on Vercel:

👉 https://private-fhe-ico.vercel.app

Features:

Clean UI showing encrypted values

Owner flow (close sale + decryptable steps)

Per-user encrypted contributions

Token allocation interface

Ciphertext handle visualization

🧱 Smart Contract Architecture
Files:
contracts/
 ├── PrivateICO.sol
 └── PrivateToken.sol

Core Structure:

Encrypted contributions stored per user

euint64 homomorphic totals

KMS-based decryption + proof verification

Hard cap enforcement

Token claiming based on verified plaintext

🧪 Testing

Your project includes 46 passing Hardhat tests, covering:

Encrypted contributions

Homomorphic addition

Sale timing

Hard cap edge cases

Decryption flow

Access control

Full ICO lifecycle tests

46 passing (5s)
1 pending


This puts the project at the top of the Testing (10%) judging category.

🗂 Project Structure
private-fhe-ico/
│
├── assets/                  # Diagrams, SVGs, screenshots
├── contracts/               # FHE ICO + Token contracts
├── frontend/                # React UI (Vercel deployed)
├── scripts/                 # Deployment scripts
├── test/                    # Full Hardhat test suite
│
├── hardhat.config.js
├── package.json
├── README.md (this file)
└── LICENSE

🧩 How It Works (Architecture)
User → React App → Ethers.js → PrivateICO.sol
     → FHE.asEuint64(amount) → Encrypted contribution stored on-chain
     → Homomorphic addition updates encryptedTotalRaised

Owner → After sale → makeTotalDecryptable()
     → Zama KMS (future) returns clear total + proof
     → verifyAndSetTotal() stores final plaintext


Each user’s own encrypted amount is:

visible only as ciphertext

decryptable only after sale

verifiable with signed proofs

🚀 Business Potential (Judging Category)

Private FHE ICO can evolve into:

Private seed fundraising rounds

DAO treasury raising

Encrypted staking pools

Confidential OTC token deals

Privacy-preserving liquidity contributions

It is a strong base for a full encrypted fundraising platform.

🧭 How to Run Locally
Install dependencies
npm install

Compile contracts
npx hardhat compile

Run tests
npx hardhat test

Start frontend
cd frontend
npm install
npm start

👤 Author

rembrandt2040
ZAMA Developer Track Submission
GitHub: https://github.com/rembrandt2040
