🔐 Private FHE ICO — Fully Homomorphic Encrypted Token Sale

A privacy-enhanced ICO built on Zama’s FHEVM, demonstrating encrypted on-chain computation, homomorphic updates, and a full ICO lifecycle using encrypted values.

KMS Disclaimer:
Zama’s KMS is not currently available on Sepolia.
Therefore, the decryption flow in this project is demonstrated in simulation mode using placeholder cleartext and proof values.
All smart-contract logic for decryption, signature verification, and ciphertext handling is fully implemented and follows the FHEVM specification.
📌 Core Idea

This project shows how FHE can be used to build a privacy-aware ICO:

✔ Encrypted contribution amounts stored as euint64
✔ Homomorphic update of the encrypted total raised
✔ Users can later decrypt their own encrypted amount
✔ Owner can decrypt the total after sale ends
✔ Token distribution based on verified clear contributions

Even though ETH transfer values (msg.value) remain publicly visible on Ethereum, the ICO accounting layer is encrypted end-to-end using Zama’s FHEVM.

🔐 Why FHE?

Most ICOs expose:

Contribution behavior

Wallet patterns

Funding strategies

Whale influence

With FHEVM, this ICO demonstrates:

✔ Encrypted internal accounting
✔ Homomorphic computation
✔ No plaintext total during sale
✔ Selective, auditable decryption
✔ Proof-verified correctness

🧩 Architecture

See: assets/architecture.svg

This diagram includes:

Encrypted contributions

Homomorphic total

Decryptability toggles

KMS simulation step

Submission of placeholder proof + cleartext

Token claiming

✨ Features
🔹 Encrypted Contributions

Every contribution is encrypted as an FHE euint64 on-chain using:

FHE.asEuint64(amount);

🔹 Homomorphic Total Update

The ICO total is updated without decryption:

encryptedTotalRaised = FHE.add(encryptedTotalRaised, encAmount);

🔹 Encrypted State During Sale

Both the per-user contributions and the total remain encrypted throughout the sale.

🔹 Simulated Decryption Flow (Due to KMS Unavailability)

The contract exposes:

makeTotalDecryptable()

verifyAndSetTotal()

makeMyContributionDecryptable()

verifyMyContribution()

These functions implement the full FHEVM verification pipeline, but use placeholder values since KMS is offline.

🔹 Token Allocation

Tokens are distributed based on verified clear contributions and the final decrypted total.

🔑 Decryption Flow (Simulation Mode)

Important:
Because Zama’s KMS is not active on Sepolia, real ciphertext decryption and signature generation cannot be performed.

The implemented flow is:

1️⃣ Owner marks the encrypted total as decryptable
makeTotalDecryptable();

2️⃣ Normally, the ciphertext would go to Zama KMS

✓ But since KMS is unavailable, the frontend accepts placeholder cleartext and proof values.

3️⃣ Owner submits simulated proof
verifyAndSetTotal(abiEncodedClearTotal, fakeProof);

4️⃣ Contributors do the same for their own encrypted amount
verifyMyContribution(abiEncodedClearAmount, fakeProof);


This still demonstrates the full architecture, and once KMS activates, the contract will accept real proofs without modification.

🧪 Testing

All tests are located in:

/test/WorkingPrivateICO.test.js


Coverage includes:

✔ Encrypted contributions
✔ Homomorphic total updates
✔ Sale timings
✔ Hard cap enforcement
✔ Access control
✔ Full lifecycle (manual + auto-close)
✔ Edge cases

test-results.txt contains full passing output.

🎨 Frontend (React + Ethers.js)

The UI supports:

Wallet connection

Contributing ETH

Viewing encrypted contribution handles

Viewing encrypted total

Triggering decryptability

Simulating KMS verification

Token claiming

Deployment target: Vercel

📡 Deployment

Network: Sepolia

ICO addresses:0x6807468c64eF76aC9bB1cBEcD21f6bA490f9732C
Token addresses:0x780861dfC2C1FD29FB2765911839307cfD2a72c3


Frontend URL:
https://privateico.vercel.app/

📽 Demo Video

A short 180 second walkthrough:
https://youtu.be/GLZ0zJuH-g0

Architecture overview

Encrypted contribution

Encrypted total

Decryption with proofs

Token claiming



📂 Project Structure
private-fhe-ico/
│
├── assets/
│   └── architecture.svg
├── contracts/
│   ├── PrivateICO.sol
├── frontend/
│   ├── public/
│   ├── src/
├── scripts/
├── test/
│   └── WorkingPrivateICO.test.js
├── README.md
├── hardhat.config.js
├── package.json
└── test-results.txt

🧾 License

BSD-3-Clause-Clear (recommended by Zama for FHE projects)

🎉 Summary

This project demonstrates:

✔ Correct use of Zama’s FHE euint64
✔ Encrypted on-chain computation
✔ Homomorphic totals
✔ Full ICO logic
✔ Simulated KMS decryption flow
✔ Ready for real KMS integration
✔ Working UI + deployment + testing