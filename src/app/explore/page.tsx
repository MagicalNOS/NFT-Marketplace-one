'use client';

import { useState } from 'react';
import { useNFTData, NFTData } from '@/hooks/useNFTData';
import NFTBox from '../components/NFTBox';

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
      </div>
      
      {/* NFT信息 */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 truncate">
          {nft.name || `Unnamed NFT #${nft.tokenId}`}
        </h3>
        
        {nft.price && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Price</span>
            <span className="font-bold text-green-600">
              {formatUSDCPrice(nft.price)} USDC
            </span>
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          Token ID: #{nft.tokenId}
        </div>
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

export default function ExplorePage() {
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);
  const { data: nfts, isLoading, isError, error } = useNFTData();

  // 处理加载状态
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Explore NFTs</h1>
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
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'Failed to load NFTs'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
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
        <h1 className="text-3xl font-bold mb-8">Explore NFTs</h1>
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
      <h1 className="text-3xl font-bold mb-8">Explore NFTs ({nfts.length})</h1>
      
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