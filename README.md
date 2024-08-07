### Minting DApp - README

---

**WARNING! This Dapp is configured to run on MainNet and Sepolia Dapp will check for contract on each network to ensure no errors:**

---

#### Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Testing](#testing)
5. [Deployment](#deployment)
6. [Important Notes](#important-notes)

---

### Introduction

This repository contains the Minting DApp for the Bets.io ETH custom contract. This DApp allows users to mint NFTs directly from the browser. Please follow the instructions carefully to set up, configure, test, and deploy the DApp.

---

### Installation

To get started, you need to install the necessary dependencies. Run the following command in your terminal:

```bash
yarn install
```

---

### Configuration

Before running the DApp, you need to update the configuration files with the actual deployed contract details.

1. **Update `config/contractConfig.ts`:**
   - Replace the placeholder with the actual deployed contract address.
   - Update the Token Name as needed.

2. **DO NOT EDIT `abi.json`:**
   - The `abi.json` file is pre-configured for the Bets.io ETH custom contract. Editing this file may cause issues with minting and deploying the DApp.

3. **UpdateWhiteList `config/whitelist.json` :**
   - To ensure the Merkle tree and leafs are sorted correctly to pass proof, you must update the config/whitelist.json with the same exact whitelist JSON file used when the contract was deployed. Failure to do so will result in incorrect Merkle proofs and failed transactions.

---

### Testing

To test the DApp in a local environment, use the following command:

```bash
yarn dev-server
```

This will start a local development server where you can interact with the DApp.

---

### Deployment

To deploy the DApp, configure the build settings as follows:

1. **Build Command (Custom):**

   ```bash
   yarn build-dapp
   ```

2. **Build Output Directory:**

   ```text
   minting-dapp/public
   ```

Make sure to double-check all configurations before deployment.

---

### Important Notes

- Ensure that all configurations in the `config/contractConfig.ts` are correctly updated to reflect the actual deployed contract details before deployment.
- Any modifications to `abi.json` may result in minting and deployment issues. Avoid editing this file unless absolutely necessary and contract is updated to reflect changes in abi as the DApp reads data directly from contract along with interacting with it.
- # IMPORTANT update whitelist.json with WL wallets directly from Contract Deploy !

---

By following these instructions, you can set up, test, and deploy the Minting DApp successfully. If you encounter any issues, please review the configuration steps or consult with the development team for further assistance.

### CONTRACT FOR THIS DAPP IS - https://github.com/Phuckyucrypto/bets (Private Repo)
```