'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { fetchSubgraphData, getAvailableNFTs } from '@/utils/subgraph';
import { getCompleteNFTInfo } from '@/utils/contract';
import { nftMarketplaceAbi } from '@/constants';
import toast, { Toaster } from 'react-hot-toast';

// NFT数据接口
export interface UserNFTListing {
    id: string;
    tokenId: string;
    nftAddress: string;
    price: string;
    seller: string;
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

// NFT Marketplace 合约地址
const NFT_MARKETPLACE_ADDRESS = '0x3213EB712A2A97E06E9F13a1349ad49FA4331443';

// 格式化USDC价格显示
function formatUSDCDisplay(price: string): string {
    try {
        const priceInUSDC = parseFloat(price) / 1000000; // 从6位小数转换
        return priceInUSDC.toFixed(2);
    } catch {
        return '0.00';
    }
}

// 转圈动画组件
const Spinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// 默认NFT图片组件
function DefaultNFTImage({ tokenId, name }: { tokenId: string, name?: string }) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
            <div className="text-center p-4">
                <div className="text-3xl mb-2 text-gray-400">🖼️</div>
                <div className="text-sm font-semibold text-gray-600 mb-1">{name || `NFT #${tokenId}`}</div>
                <div className="text-xs text-gray-400">Image not available</div>
            </div>
        </div>
    );
}

// NFT卡片组件
function NFTCard({ 
    nft, 
    onCancel, 
    isCanceling 
}: { 
    nft: UserNFTListing; 
    onCancel: (nft: UserNFTListing) => void;
    isCanceling: boolean;
}) {
    const [imageError, setImageError] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            {/* NFT图片 */}
            <div className="aspect-square relative">
                {!nft.image || imageError ? (
                    <DefaultNFTImage tokenId={nft.tokenId} name={nft.name} />
                ) : (
                    <img
                        src={nft.image}
                        alt={nft.name || `NFT ${nft.tokenId}`}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                        loading="lazy"
                    />
                )}
                
                {/* 价格标签 */}
                <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
                    {formatUSDCDisplay(nft.price)} USDC
                </div>
            </div>

            {/* NFT信息 */}
            <div className="p-4">
                <div className="mb-3">
                    <h3 className="text-lg font-bold text-gray-800 truncate">
                        {nft.name || `${nft.contractName || 'NFT'} #${nft.tokenId}`}
                    </h3>
                    <p className="text-sm text-gray-600">
                        {nft.contractName || 'Unknown Collection'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Token ID: #{nft.tokenId}
                    </p>
                </div>

                {/* 描述预览 */}
                {nft.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {nft.description}
                    </p>
                )}

                {/* 属性预览 */}
                {nft.attributes && nft.attributes.length > 0 && (
                    <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">{nft.attributes.length} 个属性</p>
                        <div className="flex flex-wrap gap-1">
                            {nft.attributes.slice(0, 3).map((attr, index) => (
                                <span 
                                    key={index}
                                    className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                                >
                                    {attr.trait_type}: {attr.value}
                                </span>
                            ))}
                            {nft.attributes.length > 3 && (
                                <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                    +{nft.attributes.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                        {showDetails ? '收起详情' : '查看详情'}
                    </button>
                    <button
                        onClick={() => onCancel(nft)}
                        disabled={isCanceling}
                        className="flex-1 bg-red-500 text-white py-2 px-3 rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center"
                    >
                        {isCanceling ? (
                            <>
                                <Spinner />
                                取消中...
                            </>
                        ) : (
                            '取消上架'
                        )}
                    </button>
                </div>

                {/* 详细信息面板 */}
                {showDetails && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <h4 className="font-medium text-gray-700 mb-2 text-sm">合约信息</h4>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">合约地址:</span>
                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                        {nft.nftAddress.slice(0, 6)}...{nft.nftAddress.slice(-4)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">卖家:</span>
                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                        {nft.seller.slice(0, 6)}...{nft.seller.slice(-4)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">网络:</span>
                                    <span>Avalanche Fuji</span>
                                </div>
                            </div>
                        </div>

                        {/* 完整属性列表 */}
                        {nft.attributes && nft.attributes.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <h4 className="font-medium text-gray-700 mb-2 text-sm">所有属性</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {nft.attributes.map((attr, index) => (
                                        <div key={index} className="bg-white p-2 rounded border">
                                            <div className="text-xs text-blue-600 font-medium">
                                                {attr.trait_type}
                                            </div>
                                            <div className="text-sm font-semibold text-gray-800">
                                                {attr.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function UserListingsPage() {
    const { address: accountAddress, isConnected } = useAccount();
    const { writeContractAsync } = useWriteContract();

    const [userListings, setUserListings] = useState<UserNFTListing[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [cancelingNFT, setCancelingNFT] = useState<string | null>(null);

    // 获取用户的上架NFT
    const fetchUserListings = async () => {
        if (!accountAddress || !isConnected) {
            setUserListings([]);
            return;
        }

        setIsLoading(true);
        
        try {
            // 1. 从subgraph获取数据
            const subgraphData = await fetchSubgraphData();
            const availableNFTs = getAvailableNFTs(subgraphData);
            
            // 2. 过滤出当前用户的NFT
            const userNFTs = availableNFTs.filter(
                nft => nft.seller && nft.seller.toLowerCase() === accountAddress.toLowerCase()
            );

            console.log(`Found ${userNFTs.length} listings for user ${accountAddress}`);

            // 3. 获取每个NFT的完整信息
            const enrichedNFTs: UserNFTListing[] = [];
            
            for (const nft of userNFTs) {
                try {
                    const completeInfo = await getCompleteNFTInfo(nft.nftAddress, nft.tokenId);
                    
                    enrichedNFTs.push({
                        id: nft.id,
                        tokenId: nft.tokenId,
                        nftAddress: nft.nftAddress,
                        price: nft.price || '0',
                        seller: nft.seller || '',
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

            setUserListings(enrichedNFTs);
            toast.success(`已加载 ${enrichedNFTs.length} 个上架的NFT`);

        } catch (error) {
            console.error('Error fetching user listings:', error);
            toast.error('获取上架NFT失败，请重试');
        } finally {
            setIsLoading(false);
        }
    };

    // 取消上架NFT
    const handleCancelListing = async (nft: UserNFTListing) => {
        if (!accountAddress || !isConnected) {
            toast.error('请先连接钱包');
            return;
        }

        setCancelingNFT(`${nft.nftAddress}-${nft.tokenId}`);
        toast.loading('正在取消上架...', { id: 'cancel-toast' });

        try {
            const txHash = await writeContractAsync({
                abi: nftMarketplaceAbi,
                address: NFT_MARKETPLACE_ADDRESS as `0x${string}`,
                functionName: 'cancelListing',
                args: [nft.nftAddress as `0x${string}`, BigInt(nft.tokenId)],
            });

            toast.loading('等待交易确认...', { id: 'cancel-toast' });
            
            // 等待一段时间后刷新列表
            setTimeout(() => {
                fetchUserListings();
            }, 3000);

            toast.success(`已成功取消 ${nft.name || `NFT #${nft.tokenId}`} 的上架`, { id: 'cancel-toast' });

        } catch (error: any) {
            console.error('Cancel listing failed:', error);
            if (error?.message?.includes('User rejected')) {
                toast.error('交易被用户取消', { id: 'cancel-toast' });
            } else {
                toast.error('取消上架失败，请重试', { id: 'cancel-toast' });
            }
        } finally {
            setCancelingNFT(null);
        }
    };

    // 组件挂载时获取数据
    useEffect(() => {
        fetchUserListings();
    }, [accountAddress, isConnected]);

    return (
        <div className="container mx-auto p-8">
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
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">我的上架NFT</h1>
                    <p className="text-gray-600">
                        管理您在市场上正在销售的NFT
                    </p>
                </div>
                <button
                    onClick={fetchUserListings}
                    disabled={isLoading}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                    {isLoading && <Spinner />}
                    {isLoading ? '刷新中...' : '刷新列表'}
                </button>
            </div>

            {/* 连接状态检查 */}
            {!isConnected ? (
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">🔗</div>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">请连接钱包</h2>
                    <p className="text-gray-600">您需要连接钱包才能查看已上架的NFT</p>
                </div>
            ) : isLoading ? (
                <div className="text-center py-16">
                    <Spinner />
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4 mt-4">正在加载您的NFT...</h2>
                    <p className="text-gray-600">正在从区块链和IPFS获取数据，请稍候</p>
                </div>
            ) : userListings.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">📦</div>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">暂无上架的NFT</h2>
                    <p className="text-gray-600 mb-6">您还没有在市场上上架任何NFT</p>
                    <a
                        href="/create"
                        className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                        立即上架NFT
                    </a>
                </div>
            ) : (
                <>
                    {/* 统计信息 */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-8 border border-blue-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-blue-600">{userListings.length}</div>
                                <div className="text-sm text-blue-800">上架中的NFT</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-600">
                                    {userListings.reduce((sum, nft) => sum + parseFloat(formatUSDCDisplay(nft.price)), 0).toFixed(2)}
                                </div>
                                <div className="text-sm text-green-800">总价值 (USDC)</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-purple-600">
                                    {new Set(userListings.map(nft => nft.nftAddress)).size}
                                </div>
                                <div className="text-sm text-purple-800">涉及合约数</div>
                            </div>
                        </div>
                    </div>

                    {/* NFT网格 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {userListings.map((nft) => (
                            <NFTCard
                                key={`${nft.nftAddress}-${nft.tokenId}`}
                                nft={nft}
                                onCancel={handleCancelListing}
                                isCanceling={cancelingNFT === `${nft.nftAddress}-${nft.tokenId}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}