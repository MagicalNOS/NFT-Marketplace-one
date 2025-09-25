forge script script/Deploy.s.sol --rpc-url $AVALANCH_FUJI_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY --verifier-url https://api.routescan.io/v2/network/testnet/evm/43113/etherscan --via-ir

anvil --dump-state ./final-state.json

forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast 

# MOCK USDC: 0x5FbDB2315678afecb367f032d93F642f64180aa3
NFTMarketplace: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

# Interact the NFTMarketplace contract in anvil
forge script script/InteractNFTMarketplace.s.sol --rpc-url http://127.0.0.1:8545  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast

# Deploy Mock NFT
forge script script/DeployMockNFT.s.sol --rpc-url $AVALANCH_FUJI_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY --verifier-url https://api.routescan.io/v2/network/testnet/evm/43113/etherscan --via-ir

# Verify the contract in explorer
forge verify-contract \
  --rpc-url $AVALANCH_FUJI_RPC_URL \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --verifier-url https://api.routescan.io/v2/network/testnet/evm/43113/etherscan \
  --constructor-args $(cast abi-encode "constructor(string,string)" "TokenName" "SYMBOL") \
  0xc84133c9E85F09aac39b6dCAA2d43415801F1c5f \
  src/MockNFT.sol:MockNFT

  # MintAndListAaNFT
  forge script script/FujiInteract.s.sol --rpc-url $AVALANCH_FUJI_RPC_URL --private-key $PRIVATE_KEY --broadcast