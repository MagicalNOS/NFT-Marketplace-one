import { createWalletClient, custom, parseUnits, formatUnits, getAddress } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { createPublicClient, http } from 'viem';
import { erc20Abi, nftMarketplaceAbi } from '../constants';

// 创建客户端
const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http('https://api.avax-test.network/ext/bc/C/rpc')
});

// USDC和市场合约地址
const FUJI_CONTRACTS = {
  usdc: '0x784a6c8dd4d60e384d2ceafba8d4b01749d23665',
  nftMarketplace: '0x3213EB712A2A97E06E9F13a1349ad49FA4331443'
};

/**
 * 确保钱包连接的辅助函数
 */
const ensureWalletConnection = async (): Promise<string[]> => {
  if (!window.ethereum) {
    throw new Error('No wallet detected');
  }

  try {
    // 首先检查是否已有连接的账户
    let accounts = await window.ethereum.request({ method: 'eth_accounts' });
    console.log('Current connected accounts:', accounts);
    
    if (accounts.length === 0) {
      console.log('No accounts connected, requesting connection...');
      // 如果没有连接，请求连接
      accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Accounts after request:', accounts);
    }
    
    if (accounts.length === 0) {
      throw new Error('No wallet connected');
    }
    
    return accounts;
  } catch (error) {
    console.error('Error ensuring wallet connection:', error);
    throw error;
  }
};

/**
 * 检查USDC授权额度
 */
export const getUSDCAllowance = async (
  walletAddress: string,
  spenderAddress: string = FUJI_CONTRACTS.nftMarketplace
): Promise<bigint> => {
  try {
    const allowance = await publicClient.readContract({
      address: FUJI_CONTRACTS.usdc as `0x${string}`,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [walletAddress as `0x${string}`, spenderAddress as `0x${string}`]
    });
    
    return allowance as bigint;
  } catch (error) {
    console.error('Error getting USDC allowance:', error);
    return BigInt(0);
  }
};

/**
 * 检查USDC余额
 */
export const getUSDCBalance = async (walletAddress: string): Promise<bigint> => {
  try {
    const balance = await publicClient.readContract({
      address: FUJI_CONTRACTS.usdc as `0x${string}`,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`]
    });
    
    return balance as bigint;
  } catch (error) {
    console.error('Error getting USDC balance:', error);
    return BigInt(0);
  }
};

/**
 * 授权USDC给NFT市场合约
 */
export const approveUSDC = async (amount: string): Promise<`0x${string}` | null> => {
  try {
    console.log('Starting USDC approval process...');
    
    // 确保钱包连接
    const accounts = await ensureWalletConnection();
    const account = accounts[0] as `0x${string}`;
    console.log('Using account for approval:', account);

    const walletClient = createWalletClient({
      chain: avalancheFuji,
      transport: custom(window.ethereum)
    });

    // 双重检查：使用 walletClient.getAddresses() 验证
    const walletAddresses = await walletClient.getAddresses();
    console.log('Wallet client addresses:', walletAddresses);
    
    if (walletAddresses.length === 0) {
      console.warn('walletClient.getAddresses() returned empty array, but window.ethereum has accounts');
      // 使用从 window.ethereum 获取的账户继续
    }

    // 使用有效的账户地址
    const finalAccount = walletAddresses.length > 0 ? walletAddresses[0] : account;
    console.log('Final account for transaction:', finalAccount);

    // 转换价格为USDC单位（6位小数）
    const amountInUSDC = parseUnits(amount, 6);
    console.log('Amount in USDC units:', amountInUSDC);

    const hash = await walletClient.writeContract({
      address: FUJI_CONTRACTS.usdc as `0x${string}`,
      abi: erc20Abi,
      functionName: 'approve',
      args: [FUJI_CONTRACTS.nftMarketplace as `0x${string}`, amountInUSDC],
      account: finalAccount
    });

    console.log('USDC approval transaction hash:', hash);
    return hash;
  } catch (error) {
    console.error('Error approving USDC:', error);
    return null;
  }
};

/**
 * 购买NFT
 */
export const buyNFT = async (
  nftAddress: string,
  tokenId: string
): Promise<`0x${string}` | null> => {
  try {
    console.log('Starting NFT purchase process...');
    
    // 确保钱包连接
    const accounts = await ensureWalletConnection();
    const account = accounts[0] as `0x${string}`;
    console.log('Using account for NFT purchase:', account);

    const walletClient = createWalletClient({
      chain: avalancheFuji,
      transport: custom(window.ethereum)
    });

    // 双重检查：使用 walletClient.getAddresses() 验证
    const walletAddresses = await walletClient.getAddresses();
    console.log('Wallet client addresses:', walletAddresses);
    
    if (walletAddresses.length === 0) {
      console.warn('walletClient.getAddresses() returned empty array, but window.ethereum has accounts');
      // 使用从 window.ethereum 获取的账户继续
    }

    // 使用有效的账户地址
    const finalAccount = walletAddresses.length > 0 ? walletAddresses[0] : account;
    console.log('Final account for NFT transaction:', finalAccount);

    const hash = await walletClient.writeContract({
      address: FUJI_CONTRACTS.nftMarketplace as `0x${string}`,
      abi: nftMarketplaceAbi,
      functionName: 'buyMany',
      args: [
        nftAddress as `0x${string}`,
        [BigInt(tokenId)]
      ],
      account: finalAccount
    });

    console.log('NFT purchase transaction hash:', hash);
    return hash;
  } catch (error) {
    console.error('Error buying NFT:', error);
    return null;
  }
};

/**
 * 等待交易确认
 */
export const waitForTransaction = async (hash: `0x${string}`): Promise<boolean> => {
  try {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1
    });
    
    return receipt.status === 'success';
  } catch (error) {
    console.error('Error waiting for transaction:', error);
    return false;
  }
};

/**
 * 格式化USDC价格（从wei转换为可读格式）
 */
export const formatUSDCPrice = (price: string): string => {
  try {
    const priceInUSDC = formatUnits(BigInt(price), 6);
    return parseFloat(priceInUSDC).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  } catch (error) {
    console.error('Error formatting USDC price:', error);
    return 'N/A';
  }
};

/**
 * 检查用户是否是NFT的卖家
 */
export const isNFTSeller = (nft: { seller?: string }, userAddress?: string): boolean => {
  if (!nft.seller || !userAddress) return false;
  
  try {
    return getAddress(nft.seller) === getAddress(userAddress);
  } catch (error) {
    return nft.seller.toLowerCase() === userAddress.toLowerCase();
  }
};