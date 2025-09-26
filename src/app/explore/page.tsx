'use client';

import { useState, useEffect } from 'react';
import { fetchSubgraphData, getAvailableNFTs } from '@/utils/subgraph';
import { getCompleteNFTInfo } from '@/utils/contract';
import NFTBox from '../components/NFTBox';
import toast, { Toaster } from 'react-hot-toast';

// NFT数据接口
export interface NFTData {
  id: string;
  tokenId: string;
  nftAddress: string;
  price: string;
  seller: string;
  chain: string; // 添加缺失的chain属性
  // 元数据信息
  name?: string;
  description?: string;
  image?: string;
  contractName?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

// 转圈动画组件
const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// 格式化USDC价格
function formatUSDCPrice(price: string): string {
  try {
    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber)) return 'N/A';
    const actualPrice = priceNumber / 1000000;
    return actualPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  } catch (error) {
    console.error("Error formatting USDC price:", error);
    return 'N/A';
  }
}

// NFT卡片组件
function NFTCard({ nft, onClick }: { nft: NFTData; onClick: () => void }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div 
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* NFT图片 */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {nft.image && !imageError ? (
          <img
            src={nft.image}
            alt={nft.name || `NFT #${nft.tokenId}`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-center">
              <div className="text-4xl mb-2 text-gray-400">🖼️</div>
              <div className="text-sm text-gray-500">{nft.name || `NFT #${nft.tokenId}`}</div>
            </div>
          </div>
        )}
        
        {/* 价格标签 */}
        {nft.price && (
          <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
            {formatUSDCPrice(nft.price)} USDC
          </div>
        )}
      </div>
      
      {/* NFT信息 */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 truncate">
          {nft.name || `${nft.contractName || 'NFT'} #${nft.tokenId}`}
        </h3>
        
        <p className="text-sm text-gray-600 mb-2">
          {nft.contractName || 'Unknown Collection'}
        </p>
        
        {nft.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {nft.description}
          </p>
        )}
        
        <div className="text-xs text-gray-500">
          Token ID: #{nft.tokenId} • {nft.chain}
        </div>
        
        {/* 属性预览 */}
        {nft.attributes && nft.attributes.length > 0 && (
          <div className="mt-2">
            <div className="flex flex-wrap gap-1">
              {nft.attributes.slice(0, 2).map((attr, index) => (
                <span 
                  key={index}
                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                >
                  {attr.trait_type}: {attr.value}
                </span>
              ))}
              {nft.attributes.length > 2 && (
                <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                  +{nft.attributes.length - 2} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 加载骨架屏组件
function NFTCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200"></div>
      <div className="p-4">
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 获取所有可用的NFT
  const fetchAllNFTs = async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    
    try {
      // 1. 从subgraph获取数据
      const subgraphData = await fetchSubgraphData();
      const availableNFTs = getAvailableNFTs(subgraphData);
      
      console.log(`Found ${availableNFTs.length} available NFTs in marketplace`);

      // 2. 获取每个NFT的完整信息
      const enrichedNFTs: NFTData[] = [];
      
      for (const nft of availableNFTs) {
        try {
          const completeInfo = await getCompleteNFTInfo(nft.nftAddress, nft.tokenId);
          
          enrichedNFTs.push({
            id: nft.id,
            tokenId: nft.tokenId,
            nftAddress: nft.nftAddress,
            price: nft.price || '0',
            seller: nft.seller || '',
            chain: 'Avalanche Fuji', // 添加链名称
            name: completeInfo.metadata?.name,
            description: completeInfo.metadata?.description,
            image: completeInfo.metadata?.image,
            contractName: completeInfo.contractName ?? undefined,
            attributes: completeInfo.metadata?.attributes,
          });
        } catch (error) {
          console.error(`Error fetching info for NFT ${nft.nftAddress}:${nft.tokenId}`, error);
          
          // 即使获取元数据失败，也添加基本信息
          enrichedNFTs.push({
            id: nft.id,
            tokenId: nft.tokenId,
            nftAddress: nft.nftAddress,
            price: nft.price || '0',
            seller: nft.seller || '',
            chain: 'Avalanche Fuji', // 添加链名称
            name: `NFT #${nft.tokenId}`,
            description: 'Failed to load metadata',
            image: '',
            contractName: 'Unknown Contract',
            attributes: [],
          });
        }

        // 添加延迟避免过快请求
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setNfts(enrichedNFTs);
      if (enrichedNFTs.length > 0) {
        toast.success(`已加载 ${enrichedNFTs.length} 个NFT`);
      }

    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setIsError(true);
      setError(error instanceof Error ? error : new Error('Failed to load NFTs'));
      toast.error('获取NFT数据失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchAllNFTs();
  }, []);

  // 处理加载状态
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Toaster 
          position="top-center" 
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">探索NFT</h1>
          <div className="flex items-center text-blue-600">
            <Spinner />
            <span className="ml-2">正在加载...</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }, (_, i) => (
            <NFTCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // 处理错误状态
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Toaster 
          position="top-center" 
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            {error?.message || 'Failed to load NFTs'}
          </p>
          <button 
            onClick={fetchAllNFTs}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center mx-auto"
          >
            <Spinner />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // 处理空数据状态
  if (!nfts || nfts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Toaster 
          position="top-center" 
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">探索NFT</h1>
          <button
            onClick={fetchAllNFTs}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            刷新列表
          </button>
        </div>
        
        <div className="text-center">
          <div className="text-6xl mb-4">🎨</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No NFTs Available</h2>
          <p className="text-gray-600">
            There are currently no NFTs available in the marketplace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster 
        position="top-center" 
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">探索NFT</h1>
          <p className="text-gray-600">
            从各种收藏中探索和购买NFT
          </p>
        </div>
        <button
          onClick={fetchAllNFTs}
          disabled={isLoading}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {isLoading && <Spinner />}
          {isLoading ? '刷新中...' : '刷新列表'}
        </button>
      </div>

      {/* 统计信息 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-8 border border-blue-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{nfts.length}</div>
            <div className="text-sm text-blue-800">可购买的NFT</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {nfts.reduce((sum, nft) => sum + parseFloat(formatUSDCPrice(nft.price)), 0).toFixed(2)}
            </div>
            <div className="text-sm text-green-800">总市值 (USDC)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {new Set(nfts.map(nft => nft.nftAddress)).size}
            </div>
            <div className="text-sm text-purple-800">不同合约数</div>
          </div>
        </div>
      </div>
      
      {/* NFT网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {nfts.map((nft) => (
          <NFTCard
            key={`${nft.nftAddress}-${nft.tokenId}`}
            nft={nft}
            onClick={() => setSelectedNFT(nft)}
          />
        ))}
      </div>

      {/* NFT详情弹窗 */}
      {selectedNFT && (
        <NFTBox
          nft={selectedNFT}
          isOpen={!!selectedNFT}
          onClose={() => setSelectedNFT(null)}
        />
      )}
    </div>
  );
}