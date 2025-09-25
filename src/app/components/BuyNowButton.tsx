"use client"

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { NFTData } from '@/hooks/useNFTData';
import { 
  getUSDCAllowance, 
  getUSDCBalance, 
  approveUSDC, 
  buyNFT, 
  waitForTransaction, 
  formatUSDCPrice, 
  isNFTSeller 
} from '@/utils/marketplace';
import { parseUnits } from 'viem';

interface BuyNowButtonProps {
  nft: NFTData;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

type ButtonState = 'approve' | 'buy' | 'loading' | 'seller' | 'insufficient' | 'error';

export default function BuyNowButton({ nft, onSuccess, onError, className = "" }: BuyNowButtonProps) {
  const { address, isConnected } = useAccount();
  const [buttonState, setButtonState] = useState<ButtonState>('approve');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));
  const [allowance, setAllowance] = useState<bigint>(BigInt(0));

  // 检查用户状态和余额
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!isConnected || !address || !nft.price) {
        setButtonState('error');
        return;
      }

      // 检查是否是卖家
      if (isNFTSeller(nft, address)) {
        setButtonState('seller');
        return;
      }

      try {
        const [balance, currentAllowance] = await Promise.all([
          getUSDCBalance(address),
          getUSDCAllowance(address)
        ]);

        setUserBalance(balance);
        setAllowance(currentAllowance);

        const requiredAmount = parseUnits(nft.price, 6);

        // 检查余额是否充足
        if (balance < requiredAmount) {
          setButtonState('insufficient');
          return;
        }

        // 检查授权额度
        if (currentAllowance >= requiredAmount) {
          setButtonState('buy');
        } else {
          setButtonState('approve');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        setButtonState('error');
      }
    };

    checkUserStatus();
  }, [isConnected, address, nft.price, nft.seller]);

  const handleApprove = async () => {
    if (!nft.price) return;

    setIsProcessing(true);
    setButtonState('loading');

    try {
      const hash = await approveUSDC(nft.price);
      
      if (!hash) {
        throw new Error('Approval transaction failed');
      }

      // 等待交易确认
      const success = await waitForTransaction(hash);
      
      if (success) {
        // 重新检查授权额度
        if (address) {
          const newAllowance = await getUSDCAllowance(address);
          setAllowance(newAllowance);
          
          const requiredAmount = parseUnits(nft.price, 6);
          if (newAllowance >= requiredAmount) {
            setButtonState('buy');
          } else {
            setButtonState('approve');
          }
        }
      } else {
        throw new Error('Approval transaction was not successful');
      }
    } catch (error) {
      console.error('Error approving USDC:', error);
      setButtonState('approve');
      onError?.(error instanceof Error ? error.message : 'Approval failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBuy = async () => {
    setIsProcessing(true);
    setButtonState('loading');

    try {
      const hash = await buyNFT(nft.nftAddress, nft.tokenId);
      
      if (!hash) {
        throw new Error('Purchase transaction failed');
      }

      // 等待交易确认
      const success = await waitForTransaction(hash);
      
      if (success) {
        onSuccess?.();
      } else {
        throw new Error('Purchase transaction was not successful');
      }
    } catch (error) {
      console.error('Error buying NFT:', error);
      setButtonState('buy');
      onError?.(error instanceof Error ? error.message : 'Purchase failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonContent = () => {
    switch (buttonState) {
      case 'approve':
        return {
          text: 'Approve USDC',
          icon: '🔓',
          onClick: handleApprove,
          disabled: isProcessing || !isConnected
        };
      case 'buy':
        return {
          text: 'Buy Now',
          icon: '💳',
          onClick: handleBuy,
          disabled: isProcessing || !isConnected
        };
      case 'loading':
        return {
          text: isProcessing ? 'Processing...' : 'Loading...',
          icon: '⏳',
          onClick: () => {},
          disabled: true
        };
      case 'seller':
        return {
          text: 'You own this NFT',
          icon: '👤',
          onClick: () => {},
          disabled: true
        };
      case 'insufficient':
        return {
          text: 'Insufficient USDC',
          icon: '💸',
          onClick: () => {},
          disabled: true
        };
      case 'error':
        return {
          text: 'Connect Wallet',
          icon: '🔗',
          onClick: () => {},
          disabled: true
        };
      default:
        return {
          text: 'Loading...',
          icon: '⏳',
          onClick: () => {},
          disabled: true
        };
    }
  };

  const buttonContent = getButtonContent();
  
  const getButtonStyles = () => {
    switch (buttonState) {
      case 'approve':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg shadow-yellow-500/30';
      case 'buy':
        return 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30';
      case 'loading':
        return 'bg-gray-400 text-white cursor-not-allowed';
      case 'seller':
        return 'bg-green-100 text-green-800 cursor-not-allowed border border-green-200';
      case 'insufficient':
        return 'bg-red-100 text-red-800 cursor-not-allowed border border-red-200';
      case 'error':
        return 'bg-gray-100 text-gray-800 cursor-not-allowed border border-gray-200';
      default:
        return 'bg-gray-400 text-white cursor-not-allowed';
    }
  };

  return (
    <div className="space-y-3">
      {/* 用户余额和价格信息 */}
      {isConnected && buttonState !== 'seller' && buttonState !== 'error' && nft.price && (
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Your Balance:</span>
            <span className="font-mono">{formatUSDCPrice(userBalance.toString())} USDC</span>
          </div>
          <div className="flex justify-between">
            <span>NFT Price:</span>
            <span className="font-mono font-semibold">{formatUSDCPrice(nft.price)} USDC</span>
          </div>
          {buttonState === 'approve' && (
            <div className="text-yellow-600 text-center">
              💡 First approve, then buy
            </div>
          )}
        </div>
      )}

      {/* 购买按钮 */}
      <button
        onClick={buttonContent.onClick}
        disabled={buttonContent.disabled}
        className={`
          w-full py-3.5 px-4 rounded-xl font-semibold text-base 
          flex items-center justify-center gap-2 
          transition-all duration-300 
          ${getButtonStyles()} 
          ${className}
          ${isProcessing ? 'animate-pulse' : ''}
        `}
        aria-label={buttonContent.text}
      >
        <span className="text-lg">{buttonContent.icon}</span>
        {buttonContent.text}
        {isProcessing && (
          <div className="ml-2 animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        )}
      </button>
    </div>
  );
}