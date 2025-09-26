import { createPublicClient, http, formatUnits } from 'viem';
import { avalancheFuji } from 'viem/chains';

import { chainsToContracts, erc20Abi, erc721Abi, nftMarketplaceAbi } from '../constants';

// Fuji网络的合约地址配置 (请替换为您的实际合约地址)
export const FUJI_CONTRACTS = {
  usdc: '0x784a6c8dd4d60e384d2ceafba8d4b01749d23665', // Fuji USDC
  nftMarketplace: '0x3213EB712A2A97E06E9F13a1349ad49FA4331443'
};

// 创建Fuji网络的公共客户端
const client = createPublicClient({
  chain: avalancheFuji,
  transport: http('https://api.avax-test.network/ext/bc/C/rpc') // Fuji RPC
});

/**
 * NFT元数据接口
 */
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

// 在文件顶部添加 IPFS URL 转换函数
function convertIPFSUrl(url: string): string {
  if (!url) return '';
  
  // 如果是 IPFS URL，转换为 HTTP 网关
  if (url.startsWith('ipfs://')) {
    const hash = url.replace('ipfs://', '');
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }
  
  // 如果已经是 HTTP URL，直接返回
  return url;
}

/**
 * 获取NFT合约名称
 */
export const getNFTContractName = async (nftAddress: string): Promise<string | null> => {
  try {
    console.log(`Getting contract name for ${nftAddress}`);
    
    const name = await client.readContract({
      address: nftAddress as `0x${string}`,
      abi: erc721Abi,
      functionName: 'name'
    });

    console.log(`Contract name: ${name}`);
    return name as string;
  } catch (error) {
    console.error(`Error fetching contract name for ${nftAddress}:`, error);
    return null;
  }
};

/**
 * 获取NFT的tokenURI
 */
export const getTokenURI = async (contractAddress: string, tokenId: string): Promise<string | null> => {
  try {
    console.log(`Getting tokenURI for ${contractAddress}:${tokenId}`);
    
    const tokenURI = await client.readContract({
      address: contractAddress as `0x${string}`,
      abi: erc721Abi,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)]
    });

    console.log(`TokenURI: ${tokenURI}`);
    return tokenURI as string;
  } catch (error) {
    console.error(`Error getting tokenURI for ${contractAddress}:${tokenId}`, error);
    return null;
  }
};

/**
 * 获取NFT的所有者
 */
export const getNFTOwner = async (contractAddress: string, tokenId: string): Promise<string | null> => {
  try {
    const owner = await client.readContract({
      address: contractAddress as `0x${string}`,
      abi: erc721Abi,
      functionName: 'ownerOf',
      args: [BigInt(tokenId)]
    });

    return owner as string;
  } catch (error) {
    console.error(`Error getting owner for ${contractAddress}:${tokenId}`, error);
    return null;
  }
};

/**
 * 获取NFT合约信息
 */
export const getNFTContractInfo = async (contractAddress: string) => {
  try {
    const [name, symbol] = await Promise.all([
      client.readContract({
        address: contractAddress as `0x${string}`,
        abi: erc721Abi,
        functionName: 'name'
      }),
      client.readContract({
        address: contractAddress as `0x${string}`,
        abi: erc721Abi,
        functionName: 'symbol'
      })
    ]);

    return { name, symbol };
  } catch (error) {
    console.error(`Error getting contract info for ${contractAddress}`, error);
    return { name: 'Unknown', symbol: 'UNKNOWN' };
  }
};

/**
 * 获取市场列表信息 - 修复版本
 */
export const getMarketplaceListing = async (nftAddress: string, tokenId: string) => {
  try {
    if (!FUJI_CONTRACTS.nftMarketplace) {
      console.warn('NFT Marketplace contract address not configured');
      return null;
    }

    console.log(`Getting marketplace listing for ${nftAddress}:${tokenId}`);

    const listing = await client.readContract({
      address: FUJI_CONTRACTS.nftMarketplace as `0x${string}`,
      abi: nftMarketplaceAbi,
      functionName: 'getListing',
      args: [nftAddress as `0x${string}`, BigInt(tokenId)]
    });

    console.log('Raw listing data:', listing);

    // 检查 listing 是否存在且有效
    if (!listing) {
      console.log('No listing found');
      return null;
    }

    // 假设getListing返回的是一个对象或元组，通常为 [price, seller]
    let price: bigint | undefined;
    let seller: string | undefined;

    if (Array.isArray(listing)) {
      price = listing[0] as bigint;
      seller = listing[1] as string;
    } else if (typeof listing === 'object' && listing !== null) {
      price = (listing as any).price;
      seller = (listing as any).seller;
    } else {
      console.warn('Unexpected listing format:', listing);
      return null;
    }

    // 验证价格和卖家信息
    if (price === undefined || price === null) {
      console.log('Price is undefined or null');
      return null;
    }

    if (seller === undefined || seller === null) {
      console.log('Seller is undefined or null');
      return null;
    }

    // 检查是否是有效的上架（价格大于0，卖家不是零地址）
    const priceValue = BigInt(price);
    if (priceValue === BigInt(0)) {
      console.log('Item is not listed (price is 0)');
      return null;
    }

    if (seller === '0x0000000000000000000000000000000000000000') {
      console.log('Item is not listed (seller is zero address)');
      return null;
    }

    console.log(`Found listing: price=${priceValue.toString()}, seller=${seller}`);

    return {
      price: formatUnits(priceValue, 6), // USDC使用6位小数
      seller: seller
    };

  } catch (error) {
    console.error(`Error getting marketplace listing for ${nftAddress}:${tokenId}`, error);
    
    // 如果是因为NFT未上架导致的错误，返回null而不是抛出错误
    if (error instanceof Error) {
      if (error.message.includes('execution reverted') || 
          error.message.includes('call revert exception') ||
          error.message.includes('Item not listed')) {
        console.log('Item is not listed on the marketplace');
        return null;
      }
    }
    
    return null;
  }
};

/**
 * 处理元数据
 */
const processMetadata = (metadata: any): NFTMetadata => {
  return {
    name: metadata.name || metadata.title || 'Unnamed NFT',
    description: metadata.description || 'No description available',
    image: metadata.image || '',
    external_url: metadata.external_url,
    attributes: metadata.attributes || metadata.traits || []
  };
};

/**
 * 创建后备元数据
 */
const createFallbackMetadata = (): NFTMetadata => {
  return {
    name: 'Failed to Load',
    description: 'Could not fetch metadata',
    image: '',
    attributes: []
  };
};

/**
 * 处理不同类型的URI - 修复版本
 */
const resolveURI = (uri: string): string => {
  if (!uri) return '';
  
  // IPFS URLs - 实际转换为HTTP网关
  if (uri.startsWith('ipfs://')) {
    return convertIPFSUrl(uri);
  }
  
  // 其他协议
  if (uri.startsWith('ar://')) {
    return uri.replace('ar://', 'https://arweave.net/');
  }
  
  // HTTP/HTTPS URLs直接返回
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  
  // Base64 encoded JSON
  if (uri.startsWith('data:application/json;base64,')) {
    return uri;
  }
  
  return uri;
};

// 你现有的 fetchNFTMetadata 函数保持不变，现在应该可以正常工作了
export const fetchNFTMetadata = async (tokenUri: string): Promise<NFTMetadata | null> => {
  if (!tokenUri) {
    console.warn('No tokenURI provided');
    return null;
  }

  try {
    console.log(`Fetching metadata from: ${tokenUri}`);
    
    // 处理Base64编码的JSON数据
    if (tokenUri.startsWith('data:application/json;base64,')) {
      try {
        const base64Data = tokenUri.replace('data:application/json;base64,', '');
        const jsonData = atob(base64Data);
        const metadata = JSON.parse(jsonData);
        
        // 处理图片URL
        if (metadata.image) {
          metadata.image = convertIPFSUrl(metadata.image);
        }
        
        return processMetadata(metadata);
      } catch (error) {
        console.error('Error parsing base64 metadata:', error);
        return createFallbackMetadata();
      }
    }
    
    // 解析URI - 关键修复点
    const metadataUrl = resolveURI(tokenUri);
    console.log(`Resolved metadata URL: ${metadataUrl}`);
    
    // 获取元数据
    const response = await fetch(metadataUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const metadata = await response.json();
    console.log('Fetched metadata:', metadata);
    
    // 处理图片URL
    if (metadata.image) {
      metadata.image = convertIPFSUrl(metadata.image);
    }
    
    return processMetadata(metadata);
    
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return createFallbackMetadata();
  }
};

/**
 * 获取完整的NFT信息（包含元数据）- 修改版本
 */
export const getCompleteNFTInfo = async (contractAddress: string, tokenId: string) => {
  try {
    console.log(`Getting complete NFT info for ${contractAddress}:${tokenId}`);
    
    // 并行获取基本信息，包括合约名称
    const [tokenURI, owner, contractInfo, contractName] = await Promise.all([
      getTokenURI(contractAddress, tokenId),
      getNFTOwner(contractAddress, tokenId),
      getNFTContractInfo(contractAddress),
      getNFTContractName(contractAddress) // 新增获取合约名称
    ]);
    
    // 获取市场列表信息（可能为null）
    let marketplaceListing = null;
    try {
      marketplaceListing = await getMarketplaceListing(contractAddress, tokenId);
    } catch (error) {
      console.log('Failed to get marketplace listing, item may not be listed:', error);
    }
    
    // 获取元数据
    let metadata: NFTMetadata | null = null;
    if (tokenURI) {
      metadata = await fetchNFTMetadata(tokenURI);
    }
    
    // 如果没有元数据名称，使用合约名称 + token ID
    let displayName = metadata?.name;
    if (!displayName || displayName === 'Unnamed NFT' || displayName === 'Failed to Load') {
      displayName = contractName ? `${contractName} #${tokenId}` : `NFT #${tokenId}`;
    }
    
    return {
      tokenId,
      contractAddress,
      tokenURI,
      owner,
      contractInfo,
      contractName, // 新增字段
      marketplaceListing, // 可能为null
      metadata: metadata ? {
        ...metadata,
        name: displayName // 使用优化后的显示名称
      } : null,
      chain: 'Avalanche Fuji'
    };
    
  } catch (error) {
    console.error(`Error getting complete NFT info for ${contractAddress}:${tokenId}`, error);
    throw error;
  }
};

/**
 * 批量获取NFT信息
 */
export const getBatchNFTInfo = async (nfts: Array<{ contractAddress: string; tokenId: string }>) => {
  const batchSize = 5; // 限制并发请求数量
  const results: Array<any> = [];
  
  for (let i = 0; i < nfts.length; i += batchSize) {
    const batch = nfts.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(nft => getCompleteNFTInfo(nft.contractAddress, nft.tokenId))
    );
    
    results.push(...batchResults);
    
    // 添加延迟以避免过快请求
    if (i + batchSize < nfts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
};