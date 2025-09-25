"use client"

import { useState } from 'react';
import Image from 'next/image';
import { NFTData } from '@/hooks/useNFTData';
import BuyNowButton from './BuyNowButton';

interface NFTBoxProps {
    nft: NFTData;
    isOpen: boolean;
    onClose: () => void;
}

// NFT属性组件
function NFTAttributes({ attributes }: { attributes?: Array<{ trait_type: string; value: string | number }> }) {
    if (!attributes || attributes.length === 0) {
        return (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-xl">⭐</span> Attributes
                </h3>
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🏷️</div>
                    <p className="text-sm">No attributes available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-xl">⭐</span> Attributes
            </h3>
            <div className="grid grid-cols-2 gap-3">
                {attributes.map((attribute, index) => (
                    <div
                        key={index}
                        className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:scale-105"
                    >
                        <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                            {attribute.trait_type}
                        </div>
                        <div className="text-sm font-bold text-gray-800 break-words">
                            {attribute.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* 属性统计 */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Total Attributes</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                        {attributes.length}
                    </span>
                </div>
            </div>
        </div>
    );
}

// 默认NFT图片组件（详情面板版本）
function DefaultNFTImagePanel({ tokenId, name }: { tokenId: string, name?: string }) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-100 animate-pulse-light">
            <div className="text-center p-8">
                <div className="text-5xl mb-3 text-gray-400">🖼️</div>
                <div className="text-lg font-semibold text-gray-600 mb-1">{name || `NFT #${tokenId}`}</div>
                <div className="text-sm text-gray-400">Image not available</div>
            </div>
        </div>
    );
}

// NFT图片组件（详情面板版本）
function NFTImagePanel({ nft }: { nft: NFTData }) {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    // 如果没有图片URL或者图片加载失败，显示默认图片
    if (!nft?.image || imageError) {
        return <DefaultNFTImagePanel tokenId={nft?.tokenId || 'Unknown'} name={nft?.name} />;
    }

    return (
        <div className="relative w-full h-full">
            {/* 加载状态 */}
            {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-2xl animate-pulse-light z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-500 mx-auto mb-3"></div>
                        <div className="text-sm text-gray-500">Loading image...</div>
                    </div>
                </div>
            )}

            {/* 实际图片 */}
            <Image
                src={nft.image}
                alt={nft?.name || `NFT ${nft?.tokenId || 'Unknown'}`}
                width={500}
                height={500}
                className={`w-full h-full object-cover rounded-2xl transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                }}
                priority={true}
                quality={85}
            />
        </div>
    );
}

// 格式化USDC价格函数，确保两位小数
function formatUSDCPrice(price: string): string {
    try {
        const priceNumber = parseFloat(price);
        if (isNaN(priceNumber)) {
            return 'N/A';
        }
        // USDC有6位小数，所以除以10^6来获取实际价格
        const actualPrice = priceNumber / 1000000;

        // 格式化为两位小数
        return actualPrice.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6
        }).replace(/(\.\d*?[1-9])0+$/, '$1');
    } catch (error) {
        console.error("Error formatting USDC price:", error);
        return 'N/A';
    }
}

// 安全获取NFT名称
const getNFTName = (nft: NFTData): string => {
    return nft?.name || `NFT #${nft?.tokenId || 'Unknown'}`;
};

// 安全获取NFT描述
const getNFTDescription = (nft: NFTData): string => {
    return nft?.description || 'No description available';
};

export default function NFTBox({ nft, isOpen, onClose }: NFTBoxProps) {
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // 安全检查 nft 对象
    if (!nft) {
        return null;
    }

    const handlePurchaseSuccess = () => {
        setNotification({ type: 'success', message: 'NFT purchased successfully! 🎉' });
        setTimeout(() => {
            onClose();
            setNotification(null);
        }, 2000);
    };

    const handlePurchaseError = (error: string) => {
        setNotification({ type: 'error', message: error });
        setTimeout(() => setNotification(null), 5000);
    };

    return (
        <>
            {/* 背景遮罩 */}
            <div
                className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${isOpen ? 'opacity-30' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* 通知消息 */}
            {notification && (
                <div className={`fixed top-4 right-4 z-[60] p-4 rounded-lg shadow-lg ${notification.type === 'success'
                        ? 'bg-green-100 border-green-500 text-green-800'
                        : 'bg-red-100 border-red-500 text-red-800'
                    } border-l-4 max-w-sm`}>
                    <p className="text-sm font-medium">{notification.message}</p>
                </div>
            )}

            {/* 右侧滑出面板 */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-xl bg-white/90 backdrop-blur-xl shadow-2xl rounded-l-3xl transform transition-transform duration-500 ease-out z-50 overflow-hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                style={{ willChange: 'transform' }}
            >
                <div className="h-full flex flex-col">
                    {/* 顶部头部 */}
                    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 shadow-md">
                        <div className="flex justify-between items-center">
                            <div className="flex-1 pr-4">
                                <h2 className="text-2xl font-extrabold mb-1 break-words leading-tight">
                                    {getNFTName(nft)}
                                </h2>
                                <div className="flex items-center gap-2 text-blue-100/80">
                                    <span className="text-sm">Token ID:</span>
                                    <span className="bg-white bg-opacity-20 px-2.5 py-0.5 rounded-full text-xs font-mono tracking-wide">
                                        #{nft?.tokenId || 'Unknown'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white hover:text-white/80 text-3xl font-light w-10 h-10 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200"
                                aria-label="Close NFT details"
                            >
                                &times;
                            </button>
                        </div>
                    </div>

                    {/* 可滚动内容区域 */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-6 space-y-6">
                            {/* NFT 图片 */}
                            <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                                <NFTImagePanel nft={nft} />
                            </div>

                            {/* 价格卡片 - 添加安全检查 */}
                            {nft?.price && (
                                <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 rounded-2xl p-6 shadow-md">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-600 mb-1">Current Price</h3>
                                            <div className="text-4xl font-extrabold text-emerald-700">
                                                {formatUSDCPrice(nft.price)} USDC
                                            </div>
                                        </div>
                                        <div className="text-emerald-400 text-5xl">💎</div>
                                    </div>
                                </div>
                            )}

                            {/* 描述 */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="text-xl">📝</span> Description
                                </h3>
                                <p className="text-gray-700 leading-relaxed text-sm">
                                    {getNFTDescription(nft)}
                                </p>
                            </div>

                            {/* NFT 属性 - 新增部分 */}
                            <NFTAttributes attributes={nft.attributes} />

                            {/* 基本信息 */}
                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="text-xl">ℹ️</span> Basic Information
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                        <span className="text-gray-600 font-medium">Chain</span>
                                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                                            {nft?.chain || 'Unknown'}
                                        </span>
                                    </div>

                                    {nft?.contractName && (
                                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                            <span className="text-gray-600 font-medium">Collection</span>
                                            <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                                                {nft.contractName}
                                            </span>
                                        </div>
                                    )}

                                    {nft?.seller && (
                                        <div className="flex justify-between items-start py-2 border-b border-gray-50">
                                            <span className="text-gray-600 font-medium">Seller</span>
                                            <div className="text-right max-w-[60%]">
                                                <span className="font-mono text-xs bg-gray-50 text-gray-700 px-3 py-2 rounded-lg break-all inline-block hover:bg-gray-100 transition-colors duration-200">
                                                    {nft.seller}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 区块链详情 */}
                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="text-xl">🔗</span> Blockchain Details
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-gray-600 font-medium text-sm block mb-2">Contract Address</span>
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
                                            <span className="font-mono text-xs text-gray-700 break-all">
                                                {nft?.nftAddress || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 底部操作按钮 */}
                    <div className="border-t border-gray-100 p-6 bg-white shadow-lg">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => window.open(`https://testnet.snowtrace.io/address/${nft.nftAddress}`, "_blank")}
                                className="flex-1 bg-gray-100 text-gray-700 py-3.5 px-4 rounded-xl hover:bg-gray-200 transition-colors font-semibold text-base flex items-center justify-center gap-2"
                                aria-label="View on Explorer"
                            >
                                <span className="text-lg">🔍</span> View on Explorer
                            </button>

                            {nft?.price && (
                                <div className="flex-1">
                                    <BuyNowButton
                                        nft={nft}
                                        onSuccess={handlePurchaseSuccess}
                                        onError={handlePurchaseError}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom styles for scrollbar */}
            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f0f4f8;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        @keyframes pulse-light {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-light {
          animation: pulse-light 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
        </>
    );
}