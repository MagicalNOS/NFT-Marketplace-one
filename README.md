# NFT Marketplace (Next.js + Subgraph + Solidity/Foundry)

A full-stack NFT marketplace deployed on Avalanche Fuji testnet. The stack includes:
- Frontend: React + Next.js
- Indexing/Queries: Subgraph (GraphQL)
- Smart Contracts: Solidity with Foundry

This marketplace supports:
- Minting/handling NFTs (CheemsNFT)
- Listing NFTs for sale
- Buying listed NFTs using an ERC-20 token (MockUSDC)
- Marketplace analytics via The Graph subgraph

---

## Deployed Contracts (Avalanche Fuji)

Chain: Avalanche Fuji (Testnet)  
Chain ID: 43113  
Explorer: https://testnet.snowtrace.io/

- MockUSDC (ERC-20)
  - Address: `0x784a6c8dd4d60e384d2ceafba8d4b01749d23665`
  - Snowtrace: https://testnet.snowtrace.io/address/0x784a6c8dd4d60e384d2ceafba8d4b01749d23665
- NFTMarketplace
  - Address: `0x3213EB712A2A97E06E9F13a1349ad49FA4331443`
  - Snowtrace: https://testnet.snowtrace.io/address/0x3213EB712A2A97E06E9F13a1349ad49FA4331443
- CheemsNFT (ERC-721)
  - Address: `0x8c85a0c0d19be8d163c492451779a2cecc81da9c`
  - Snowtrace: https://testnet.snowtrace.io/address/0x8c85a0c0d19be8d163c492451779a2cecc81da9c

---

## Features

- List ERC-721 NFTs for sale with a price in MockUSDC
- Purchase listed NFTs with MockUSDC
- Approvals handled via standard ERC-20 and ERC-721 flows
- Subgraph-powered UI for listings, sales, cancellations, and historical activity
- End-to-end local development with Foundry and Next.js

---

## Project Structure

- contracts/ — Solidity sources (Foundry)
- script/ — Foundry deployment scripts
- test/ — Foundry tests
- subgraph/ — Subgraph manifest, schema, mappings
- app/ or pages/ — Next.js application
- components/ — Reusable React components
- lib/ — Client utils (wallet, ABI, GraphQL, config)

Note: Exact directories may vary slightly; adjust commands accordingly.

---

## Prerequisites

- Node.js 18+ and pnpm/yarn/npm
- Foundry (forge, cast). Install with:
  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```
- A wallet (e.g., MetaMask) configured for Avalanche Fuji
  - Add Fuji via Chainlist: https://chainlist.org/chain/43113
- Fuji testnet AVAX for gas
- An RPC endpoint for Fuji (e.g., Ankr, Alchemy, or public RPC)

---

## Environment Variables

Create a `.env.local` in the web root for the frontend:

```bash
NEXT_PUBLIC_CHAIN_ID=43113
NEXT_PUBLIC_RPC_URL=<YOUR_FUJI_RPC_URL>

# Contract addresses
NEXT_PUBLIC_USDC_ADDRESS=0x784a6c8dd4d60e384d2ceafba8d4b01749d23665
NEXT_PUBLIC_NFT_MARKETPLACE_ADDRESS=0x3213EB712A2A97E06E9F13a1349ad49FA4331443
NEXT_PUBLIC_CHEEMS_NFT_ADDRESS=0x8c85a0c0d19be8d163c492451779a2cecc81da9c

# Subgraph
NEXT_PUBLIC_SUBGRAPH_URL=<YOUR_SUBGRAPH_HTTP_ENDPOINT>
```

If you plan to deploy contracts yourself (optional), add a `.env` for Foundry:
```bash
PRIVATE_KEY=0xYOUR_PRIVATE_KEY # test key
FUJI_RPC_URL=<YOUR_FUJI_RPC_URL>
```

---

## Quick Start

1) Install dependencies
```bash
# in the repo root
pnpm install
# or
yarn install
# or
npm install
```

2) Configure environment variables
- Create `.env.local` (frontend) and optionally `.env` (Foundry)
- Fill in RPC and addresses (see above)

3) Run the frontend
```bash
pnpm dev
# or
yarn dev
# or
npm run dev
```
Visit http://localhost:3000

---

## Using the Marketplace on Fuji

1) Get Fuji AVAX (for gas) and some MockUSDC (via mint function if exposed in UI or using `cast`).
2) Approve the marketplace to spend your MockUSDC:
   - ERC-20 approve: `MockUSDC.approve(NFTMarketplace, amount)`
3) List an NFT:
   - Make sure the marketplace is approved for your CheemsNFT token ID (ERC-721 approval).
   - Call marketplace `listItem(nftAddress, tokenId, price)`
4) Buy an NFT:
   - Ensure you have approved enough MockUSDC.
   - Call marketplace `buyItem(nftAddress, tokenId)`

The UI uses the subgraph to show:
- Item listings
- Purchases
- Cancellations
- Your listed and owned NFTs

---

## Subgraph

This project uses The Graph to index marketplace events. The current schema defines three immutable entities that mirror on-chain activity:

```graphql
type ItemBought @entity(immutable: true) {
  id: Bytes!
  buyer: Bytes! # address
  nftAddress: Bytes! # address
  tokenId: BigInt! # uint256
  price: BigInt! # uint256
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}

type ItemCanceled @entity(immutable: true) {
  id: Bytes!
  seller: Bytes! # address
  nftAddress: Bytes! # address
  tokenId: BigInt! # uint256
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}

type ItemListed @entity(immutable: true) {
  id: Bytes!
  seller: Bytes! # address
  nftAddress: Bytes! # address
  tokenId: BigInt! # uint256
  price: BigInt! # uint256
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}
```

Notes:
- Entities are immutable; each record corresponds to a single historical event.
- “Active listing” state is not stored directly in this schema. To determine if a listing is currently active, combine ItemListed with subsequent ItemCanceled and ItemBought for the same `(nftAddress, tokenId)` pair.

### Example Queries

- Recent listings:
```graphql
query RecentListings {
  itemListeds(first: 20, orderBy: blockTimestamp, orderDirection: desc) {
    id
    seller
    nftAddress
    tokenId
    price
    blockNumber
    blockTimestamp
    transactionHash
  }
}
```

- Recent purchases:
```graphql
query RecentBuys {
  itemBoughts(first: 20, orderBy: blockTimestamp, orderDirection: desc) {
    id
    buyer
    nftAddress
    tokenId
    price
    blockNumber
    blockTimestamp
    transactionHash
  }
}
```

- Recent cancellations:
```graphql
query RecentCancels {
  itemCanceleds(first: 20, orderBy: blockTimestamp, orderDirection: desc) {
    id
    seller
    nftAddress
    tokenId
    blockNumber
    blockTimestamp
    transactionHash
  }
}
```

- History for a specific token:
```graphql
query TokenHistory($nft: Bytes!, $tokenId: BigInt!) {
  listed: itemListeds(
    where: { nftAddress: $nft, tokenId: $tokenId }
    orderBy: blockTimestamp
    orderDirection: asc
  ) {
    id
    seller
    price
    blockTimestamp
    transactionHash
  }
  bought: itemBoughts(
    where: { nftAddress: $nft, tokenId: $tokenId }
    orderBy: blockTimestamp
    orderDirection: asc
  ) {
    id
    buyer
    price
    blockTimestamp
    transactionHash
  }
  canceled: itemCanceleds(
    where: { nftAddress: $nft, tokenId: $tokenId }
    orderBy: blockTimestamp
    orderDirection: asc
  ) {
    id
    seller
    blockTimestamp
    transactionHash
  }
}
```

### Computing “Active Listings” (Client-side)

Given the immutable event schema, you can compute active listings in the UI:
- A token is considered “actively listed” if it has at least one ItemListed event and has no later ItemBought or ItemCanceled for the same `(nftAddress, tokenId)`.
- Practical approach:
  1) Query recent ItemListeds.
  2) For each unique `(nftAddress, tokenId)`, check if any ItemBought or ItemCanceled exists with `blockNumber` (or `blockTimestamp`) greater than the listing’s.
  3) If none, treat it as active.

Alternatively, you can extend the subgraph with a mutable “Listing” entity updated in mappings to reflect current state.

---

## Local Development (Optional)

Spin up a local chain (anvil) and run everything locally:

1) Start local chain
```bash
anvil
```

2) Deploy contracts
```bash
forge build
forge script script/Deploy.s.sol:Deploy \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast -vvvv
```

3) Seed data (examples; replace addresses and IDs)
```bash
# Mint some CheemsNFT to your dev wallet (if the contract exposes mint)
cast send <CHEEMS_NFT_ADDRESS> "mint(address,uint256)" <YOUR_ADDR> 1 --rpc-url http://127.0.0.1:8545 --private-key $PRIVATE_KEY

# Approve marketplace for the NFT
cast send <CHEEMS_NFT_ADDRESS> "approve(address,uint256)" <MARKETPLACE_ADDRESS> 1 --rpc-url http://127.0.0.1:8545 --private-key $PRIVATE_KEY

# Approve MockUSDC for spending
cast send <USDC_ADDRESS> "approve(address,uint256)" <MARKETPLACE_ADDRESS> 1000000000000000000 \
  --rpc-url http://127.0.0.1:8545 --private-key $PRIVATE_KEY
```

4) Point your frontend to local RPC and (optionally) a local subgraph instance

---

## Testing

Run Foundry tests:
```bash
forge test -vvv
```

Static analysis (optional, if set up):
- Slither, Mythril, or Foundry invariant tests

---

## Deployment (Contracts)

Example (Fuji):
```bash
forge build

forge script script/Deploy.s.sol:Deploy \
  --rpc-url $FUJI_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast -vvvv
```

Verify (if configured):
```bash
forge verify-contract \
  --chain-id 43113 \
  --watch \
  <DEPLOYED_ADDRESS> <ContractName> \
  --constructor-args <ENCODED_ARGS> \
  --etherscan-api-key <SNOWTRACE_API_KEY>
```

---

## Configuration Tips

- Make sure your wallet network is Avalanche Fuji when interacting with the test deployment.
- Ensure ERC-20 and ERC-721 approvals are set before listing/buying.
- Subgraph indexing can take a few blocks; give it time if recent events are missing.
- For RPC rate limits, use a reliable provider or your own node.
- MockUSDC decimals may be 6 or 18 depending on the implementation; ensure UI formatting matches token decimals.

---

## Tech Stack

- Frontend: Next.js, React, TypeScript (if enabled), Wagmi/Viem/Ethers (depending on implementation)
- Contracts: Solidity (Foundry)
- Indexing: The Graph (Subgraph + Graph Node)
- Network: Avalanche Fuji testnet

---

## Troubleshooting

- Listing doesn’t appear:
  - Confirm transaction succeeded on Snowtrace.
  - Wait a bit for the subgraph to index or refresh the page.
- “Insufficient allowance” when buying:
  - Approve MockUSDC for the Marketplace again with a higher amount.
- Wrong network:
  - Switch wallet to Avalanche Fuji (Chain ID 43113).
- Price/decimals mismatch:
  - Confirm MockUSDC decimals and UI formatting.

---

## License

MIT (unless specified otherwise in the repository).

---

## Contacts

- Repo: [MagicalNOS/NFT-Marketplace-one](https://github.com/MagicalNOS/NFT-Marketplace-one)

If you have questions or want to report issues, please open a GitHub issue in the repository.
```
