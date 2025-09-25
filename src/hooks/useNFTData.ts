'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchSubgraphData, getAvailableNFTs } from '@/utils/subgraph';
import { getTokenURI, fetchNFTMetadata, getNFTContractName } from '@/utils/contract';

export interface NFTData {
  id: string;
  tokenId: string;
  nftAddress: string;
  price?: string;
  seller?: string;
  image?: string;
  name?: string;
  description?: string;
  chain: string;
  contractName?: string;
  attributes?: Array<{  // 添加属性字段
    trait_type: string;
    value: string | number;
  }>;
}

export const useNFTData = () => {
  return useQuery({
    queryKey: ['nft-marketplace-data'],
    queryFn: async (): Promise<NFTData[]> => {
      console.log('Fetching subgraph data...');
      
      try {
        // 获取subgraph数据
        const subgraphData = await fetchSubgraphData();
        console.log('Subgraph data:', subgraphData);
        
        // 获取可用的NFT列表
        const availableNFTs = getAvailableNFTs(subgraphData);
        console.log('Available NFTs:', availableNFTs);
        
        if (!Array.isArray(availableNFTs)) {
          console.warn('availableNFTs is not an array:', availableNFTs);
          return [];
        }
        
        // 为每个NFT获取元数据
        const nftDataPromises = availableNFTs.map(async (item): Promise<NFTData> => {
          // 确保基础数据存在
          if (!item || !item.tokenId || !item.nftAddress) {
            console.warn('Invalid NFT item:', item);
            return {
              id: item?.id || '',
              tokenId: item?.tokenId || '',
              nftAddress: item?.nftAddress || '',
              price: item?.price,
              seller: item?.seller,
              chain: "Fuji",
              name: 'Invalid NFT Data',
              description: 'This NFT has incomplete data',
              image: ''
            };
          }

          const baseNFTData: NFTData = {
            id: item.id,
            tokenId: item.tokenId,
            nftAddress: item.nftAddress,
            price: item.price,
            seller: item.seller,
            chain: "Fuji",
            // 提供默认值
            name: `NFT #${item.tokenId}`,
            description: 'Loading description...',
            image: '',
            attributes: [] // 初始化空的属性数组
          };

          try {
            // 获取合约名称
            const contractName = await getNFTContractName(item.nftAddress);
            if (contractName) {
              baseNFTData.contractName = contractName;
              // 使用合约名称 + token ID 作为默认名称
              baseNFTData.name = `${contractName} #${item.tokenId}`;
            }

            // 尝试获取tokenURI和元数据
            const tokenURI = await getTokenURI(item.nftAddress, item.tokenId);
            console.log(`TokenURI for ${item.tokenId}:`, tokenURI);
            
            if (tokenURI) {
              const metadata = await fetchNFTMetadata(tokenURI);
              console.log(`Metadata for ${item.tokenId}:`, metadata);
              
              if (metadata) {
                // 优先使用元数据中的名称，如果没有则保持合约名称 + token ID
                if (metadata.name) {
                  baseNFTData.name = metadata.name;
                }
                if (metadata.description) {
                  baseNFTData.description = metadata.description;
                }
                if (metadata.image) {
                  baseNFTData.image = metadata.image;
                }
                // 添加属性处理
                if (metadata.attributes && Array.isArray(metadata.attributes)) {
                  baseNFTData.attributes = metadata.attributes.filter(attr => 
                    attr && 
                    typeof attr === 'object' && 
                    attr.trait_type && 
                    attr.value !== undefined
                  );
                  console.log(`Attributes for ${item.tokenId}:`, baseNFTData.attributes);
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching metadata for NFT ${item.tokenId}:`, error);
            // 保持默认值，不抛出错误
          }

          return baseNFTData;
        });

        const processedNFTs = await Promise.all(nftDataPromises);
        console.log('Processed NFTs:', processedNFTs);
        
        return processedNFTs.filter(nft => nft.tokenId && nft.nftAddress); // 过滤掉无效的NFT
      } catch (error) {
        console.error('Error in useNFTData queryFn:', error);
        return []; // 返回空数组而不是抛出错误
      }
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    refetchInterval: 30 * 1000, // 每30秒刷新一次
    retry: 3, // 失败时重试3次
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // 指数退避
  });
};