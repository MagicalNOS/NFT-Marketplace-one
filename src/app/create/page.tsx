'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { erc721Abi, nftMarketplaceAbi } from '@/constants';
import { getTokenURI, fetchNFTMetadata, getNFTContractName } from '@/utils/contract';
import toast, { Toaster } from 'react-hot-toast';

// NFT元数据接口
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
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
}

// NFT Marketplace 合约地址 (请替换为您的真实地址)
const NFT_MARKETPLACE_ADDRESS = '0x3213EB712A2A97E06E9F13a1349ad49FA4331443';

// 格式化USDC价格（从6位小数精度转换）
function formatUSDCInput(value: string): string {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
}

// 将用户输入的USDC金额转换为合约需要的6位小数格式
function parseUSDC(amount: string): bigint {
    try {
        const cleanAmount = formatUSDCInput(amount);
        const num = parseFloat(cleanAmount);
        if (isNaN(num)) return BigInt(0);
        return BigInt(Math.floor(num * 1000000));
    } catch {
        return BigInt(0);
    }
}

// 格式化显示USDC价格
function formatUSDCDisplay(value: string): string {
    const cleaned = formatUSDCInput(value);
    if (!cleaned || cleaned === '0') return '0.00';
    
    const num = parseFloat(cleaned);
    if (isNaN(num)) return '0.00';
    
    return num.toFixed(2);
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
            <div className="text-center p-6">
                <div className="text-5xl mb-3 text-gray-400">🖼️</div>
                <div className="text-lg font-semibold text-gray-600 mb-1">{name || `NFT #${tokenId}`}</div>
                <div className="text-sm text-gray-400">Image not available</div>
            </div>
        </div>
    );
}

// 优化的NFT详情面板组件
function NFTDetailPanel({ 
    nft, 
    price, 
    isOwner, 
    isApproved, 
    isApproving, 
    isListing, 
    onApprove, 
    onList 
}: {
    nft: NFTData | null;
    price: string;
    isOwner: boolean;
    isApproved: boolean;
    isApproving: boolean;
    isListing: boolean;
    onApprove: () => void;
    onList: () => void;
}) {
    const [currentTab, setCurrentTab] = useState<'overview' | 'details' | 'attributes'>('overview');
    const [imageError, setImageError] = useState(false);

    if (!nft) return null;

    const tabs = [
        { id: 'overview', label: '概览', icon: '👀' },
        { id: 'details', label: '详情', icon: '📋' },
        { id: 'attributes', label: '属性', icon: '🏷️' }
    ];

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col">
            {/* Tab 导航 */}
            <div className="flex border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setCurrentTab(tab.id as any)}
                        className={`flex-1 px-3 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            currentTab === tab.id
                                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto">
                {currentTab === 'overview' && (
                    <div className="p-5 space-y-5">
                        {/* 图片预览 - 调整为更紧凑的尺寸 */}
                        <div className="aspect-square w-full max-w-xs mx-auto">
                            {!nft.image || imageError ? (
                                <DefaultNFTImage tokenId={nft.tokenId} name={nft.name} />
                            ) : (
                                <img
                                    src={nft.image}
                                    alt={nft.name || `NFT ${nft.tokenId}`}
                                    className="w-full h-full object-cover rounded-lg shadow-md"
                                    onError={() => setImageError(true)}
                                    loading="lazy"
                                />
                            )}
                        </div>

                        {/* 基本信息 */}
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-bold text-gray-800">{nft.name}</h2>
                            <p className="text-base text-gray-600">{nft.contractName}</p>
                            <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                                Token ID: #{nft.tokenId}
                            </div>
                        </div>

                        {/* 价格显示 */}
                        {price && (
                            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200 text-center">
                                <p className="text-sm text-emerald-700 mb-1">挂售价格</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                    {formatUSDCDisplay(price)} USDC
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {currentTab === 'details' && (
                    <div className="p-5 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">NFT 详细信息</h3>
                        
                        <div className="space-y-3">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <h4 className="font-medium text-gray-700 mb-2 text-sm">合约信息</h4>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">合约地址:</span>
                                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                                            {nft.nftAddress.slice(0, 6)}...{nft.nftAddress.slice(-4)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">网络:</span>
                                        <span>{nft.chain}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">标准:</span>
                                        <span>ERC-721</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                                <h4 className="font-medium text-gray-700 mb-2 text-sm">描述</h4>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    {nft.description || '暂无描述信息'}
                                </p>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                                <h4 className="font-medium text-gray-700 mb-2 text-sm">所有权状态</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${isOwner ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className="text-xs">{isOwner ? '您拥有此 NFT' : '未验证所有权'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${isApproved ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                        <span className="text-xs">{isApproved ? '已授权市场合约' : '需要授权'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentTab === 'attributes' && (
                    <div className="p-5">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">属性特征</h3>
                        
                        {nft.attributes && nft.attributes.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {nft.attributes.map((attr, index) => (
                                    <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                                        <div className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">
                                            {attr.trait_type}
                                        </div>
                                        <div className="text-sm font-semibold text-gray-800">
                                            {attr.value}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-3xl mb-3">🏷️</div>
                                <p className="text-gray-500 text-sm">此 NFT 暂无属性信息</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 底部操作区域 */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
                {!isOwner ? (
                    <div className="text-center">
                        <div className="text-red-500 font-medium mb-1 text-sm">❌ 您不是此 NFT 的所有者</div>
                        <p className="text-xs text-gray-600">请检查地址和 Token ID 是否正确</p>
                    </div>
                ) : isApproved ? (
                    <button
                        onClick={onList}
                        disabled={isListing || !price}
                        className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                    >
                        {isListing && <Spinner />}
                        {isListing ? '正在上架...' : '确认上架销售'}
                    </button>
                ) : (
                    <button
                        onClick={onApprove}
                        disabled={isApproving}
                        className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                    >
                        {isApproving && <Spinner />}
                        {isApproving ? '授权中...' : '授权市场访问'}
                    </button>
                )}
                
                <p className="text-xs text-gray-500 mt-2 text-center">
                    {isApproved ? 
                        '您的 NFT 已获得授权，可以进行上架！' : 
                        '需要先授权市场合约管理您的 NFT，然后才能上架。'
                    }
                </p>
            </div>
        </div>
    );
}

export default function CreatePage() {
    const { address: accountAddress, isConnected } = useAccount();
    const { writeContractAsync } = useWriteContract();

    // 表单状态
    const [nftAddress, setNftAddress] = useState('');
    const [tokenId, setTokenId] = useState('');
    const [price, setPrice] = useState('');

    // UI状态
    const [nftPreview, setNftPreview] = useState<NFTData | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [isApproved, setIsApproved] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isListing, setIsListing] = useState(false);

    // 检查NFT所有权
    const { data: ownerOf } = useReadContract({
        abi: erc721Abi,
        address: nftAddress as `0x${string}`,
        functionName: 'ownerOf',
        args: [BigInt(tokenId || '0')],
        query: {
            enabled: !!nftAddress && !!tokenId && !!accountAddress,
        },
    });

    // 检查NFT是否已授权给Marketplace合约
    const { data: approvedAddress, refetch: refetchApproval } = useReadContract({
        abi: erc721Abi,
        address: nftAddress as `0x${string}`,
        functionName: 'getApproved',
        args: [BigInt(tokenId || '0')],
        query: {
            enabled: !!nftAddress && !!tokenId,
        },
    });
    
    useEffect(() => {
      setIsApproved(approvedAddress === NFT_MARKETPLACE_ADDRESS);
    }, [approvedAddress]);

    // 当NFT地址或TokenID变化时，获取预览信息
    useEffect(() => {
        const fetchNftData = async () => {
            if (!nftAddress || !tokenId || !accountAddress) {
                setNftPreview(null);
                setIsOwner(false);
                return;
            }

            setIsLoading(true);
            setNftPreview(null);

            try {
                // 1. 检查所有权
                if (
                    ownerOf &&
                    typeof ownerOf === 'string' &&
                    ownerOf.toLowerCase() !== accountAddress.toLowerCase()
                ) {
                    toast.error("You are not the owner of this NFT.");
                    setIsOwner(false);
                    setIsLoading(false);
                    return;
                }
                setIsOwner(true);
                
                // 2. 获取基础信息
                const contractName = await getNFTContractName(nftAddress);
                const tokenURI = await getTokenURI(nftAddress, tokenId);
                
                // 3. 获取元数据
                let metadata: any = null;
                if (tokenURI) {
                    try {
                        console.log('Fetching metadata for tokenURI:', tokenURI);
                        metadata = await fetchNFTMetadata(tokenURI);
                        console.log('Received metadata:', metadata);
                    } catch (error) {
                        console.error('Error fetching metadata:', error);
                        toast.error('Could not load NFT metadata, but you can still list it.');
                    }
                }

                // 4. 构建NFT预览数据
                setNftPreview({
                    id: `${nftAddress}-${tokenId}`,
                    tokenId,
                    nftAddress,
                    chain: "Fuji",
                    contractName: contractName || 'Unknown Contract',
                    name: metadata?.name || `${contractName || 'NFT'} #${tokenId}`,
                    description: metadata?.description || 'No description available.',
                    image: metadata?.image || '',
                    attributes: metadata?.attributes || [],
                });

                // 5. 检查授权状态
                refetchApproval();

                toast.success('NFT information loaded successfully!');

            } catch (error) {
                console.error("Error fetching NFT data:", error);
                toast.error("Failed to fetch NFT data. Please check the contract address and token ID.");
                setNftPreview(null);
                setIsOwner(false);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchNftData, 500);
        return () => clearTimeout(timeoutId);
    }, [nftAddress, tokenId, accountAddress, ownerOf, refetchApproval]);
    
    // 处理授权函数
    const handleApprove = async () => {
        if (!nftAddress || !tokenId) return;

        setIsApproving(true);
        toast.loading('Requesting approval...', { id: 'approve-toast' });

        try {
            const txHash = await writeContractAsync({
                abi: erc721Abi,
                address: nftAddress as `0x${string}`,
                functionName: 'approve',
                args: [NFT_MARKETPLACE_ADDRESS, BigInt(tokenId)],
            });
            
            toast.loading('Waiting for approval confirmation...', { id: 'approve-toast' });
            
            setTimeout(() => {
                refetchApproval();
            }, 3000);
            
            toast.success('NFT Approved successfully! You can now list it.', { id: 'approve-toast' });
            setIsApproved(true);
            
        } catch (error: any) {
            console.error("Approval failed:", error);
            if (error?.message?.includes('User rejected')) {
                toast.error('Transaction was rejected by user.', { id: 'approve-toast' });
            } else {
                toast.error('Approval failed. Please try again.', { id: 'approve-toast' });
            }
        } finally {
            setIsApproving(false);
        }
    };

    // 处理上架函数（使用USDC）
    const handleListNft = async () => {
        if (!nftAddress || !tokenId || !price) {
          toast.error("Please fill in all fields.");
          return;
        }

        const priceValue = parseFloat(price);
        if (isNaN(priceValue) || priceValue <= 0) {
            toast.error("Please enter a valid price.");
            return;
        }

        setIsListing(true);
        toast.loading('Listing your NFT...', { id: 'list-toast' });

        try {
            const priceInUSDC = parseUSDC(price);
            
            console.log(`Listing NFT ${nftAddress}:${tokenId} for ${priceInUSDC} USDC units (${price} USDC)`);
            
            const txHash = await writeContractAsync({
                abi: nftMarketplaceAbi,
                address: NFT_MARKETPLACE_ADDRESS as `0x${string}`,
                functionName: 'offerMany',
                args: [
                    nftAddress as `0x${string}`,
                    [BigInt(tokenId)],
                    [priceInUSDC]
                ],
            });
            
            toast.loading('Waiting for transaction confirmation...', { id: 'list-toast' });

            toast.success(`NFT listed successfully for ${formatUSDCDisplay(price)} USDC!`, { id: 'list-toast' });
            
            // 清空表单
            setNftAddress('');
            setTokenId('');
            setPrice('');
            setNftPreview(null);
            setIsOwner(false);
            setIsApproved(false);

        } catch (error: any) {
            console.error("Listing failed:", error);
            if (error?.message?.includes('User rejected')) {
                toast.error('Transaction was rejected by user.', { id: 'list-toast' });
            } else {
                toast.error('Listing failed. Please check console for details.', { id: 'list-toast' });
            }
        } finally {
            setIsListing(false);
        }
    };
    
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
            <h1 className="text-4xl font-bold mb-8">Publish Your NFT</h1>

            {/* 调整为更平衡的 3:2 布局比例 */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[750px]">
                {/* 左侧：输入表单 - 3/5 宽度 */}
                <div className="lg:col-span-3 flex flex-col space-y-6 pr-4">
                    <div>
                        <label htmlFor="nftAddress" className="block text-sm font-medium text-gray-700 mb-2">
                            NFT Contract Address
                        </label>
                        <input
                            type="text"
                            id="nftAddress"
                            value={nftAddress}
                            onChange={(e) => setNftAddress(e.target.value.trim())}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="0x..."
                            disabled={isApproving || isListing}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Enter the contract address of the NFT collection
                        </p>
                    </div>

                    <div>
                        <label htmlFor="tokenId" className="block text-sm font-medium text-gray-700 mb-2">
                            Token ID
                        </label>
                        <input
                            type="text"
                            id="tokenId"
                            value={tokenId}
                            onChange={(e) => setTokenId(e.target.value.trim())}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="123"
                            disabled={isApproving || isListing}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Enter the specific token ID of your NFT
                        </p>
                    </div>

                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                            Price (in USDC)
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="price"
                                value={price}
                                onChange={(e) => setPrice(formatUSDCInput(e.target.value))}
                                className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="100.00"
                                disabled={isApproving || isListing}
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">
                                USDC
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Enter the price in USDC (e.g., 100.00 for 100 USDC)
                        </p>
                    </div>

                    {/* 扩展的状态面板 */}
                    {nftAddress && tokenId && (
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <span className="mr-2">📊</span>
                                NFT 状态检查
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-4 h-4 rounded-full ${isOwner ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <div>
                                            <span className="text-sm font-medium">{isOwner ? '✓ 所有权验证' : '⏳ 验证中...'}</span>
                                            <p className="text-xs text-gray-500">{isOwner ? '您拥有此NFT' : '正在检查所有权'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-4 h-4 rounded-full ${isApproved ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                        <div>
                                            <span className="text-sm font-medium">{isApproved ? '✓ 已授权' : '⏳ 需要授权'}</span>
                                            <p className="text-xs text-gray-500">{isApproved ? '市场合约已获得授权' : '需要授权后才能上架'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-4 h-4 rounded-full ${nftPreview ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        <div>
                                            <span className="text-sm font-medium">{nftPreview ? '✓ 元数据加载' : '⏳ 等待数据'}</span>
                                            <p className="text-xs text-gray-500">{nftPreview ? '已获取NFT信息' : '正在加载元数据'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-4 h-4 rounded-full ${price ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        <div>
                                            <span className="text-sm font-medium">{price ? '✓ 价格设置' : '⏳ 等待设价'}</span>
                                            <p className="text-xs text-gray-500">{price ? `${formatUSDCDisplay(price)} USDC` : '请输入售价'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 右侧：NFT详情面板 - 2/5 宽度 */}
                <div className="lg:col-span-2">
                    {!isConnected ? (
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl">
                            <div className="text-center">
                                <div className="text-5xl mb-4">🔗</div>
                                <h2 className="text-lg font-semibold text-gray-700 mb-2">连接钱包</h2>
                                <p className="text-sm text-gray-600">请先连接您的钱包以开始上架NFT</p>
                            </div>
                        </div>
                    ) : isLoading ? (
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl">
                            <div className="text-center">
                                <Spinner />
                                <h2 className="text-lg font-semibold text-gray-700 mb-2 mt-4">正在加载NFT信息...</h2>
                                <p className="text-sm text-gray-600">正在验证所有权并从IPFS加载元数据</p>
                            </div>
                        </div>
                    ) : !nftPreview ? (
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl">
                            <div className="text-center">
                                <div className="text-5xl mb-4">📝</div>
                                <h2 className="text-lg font-semibold text-gray-700 mb-2">准备就绪</h2>
                                <p className="text-sm text-gray-600">在左侧输入NFT信息即可开始预览</p>
                            </div>
                        </div>
                    ) : (
                        <NFTDetailPanel
                            nft={nftPreview}
                            price={price}
                            isOwner={isOwner}
                            isApproved={isApproved}
                            isApproving={isApproving}
                            isListing={isListing}
                            onApprove={handleApprove}
                            onList={handleListNft}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}