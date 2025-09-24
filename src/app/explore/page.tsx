// pages/explore.tsx

"use client";

import { Providers } from "../providers";
import { useAccount } from "wagmi";
import { useEffect } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";

function ExploreContent() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  // 页面加载或钱包未连接时自动弹出连接弹窗
  useEffect(() => {
    if (!isConnected && openConnectModal) {
      openConnectModal();
    }
  }, [isConnected, openConnectModal]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h2 className="text-xl font-bold">正在等待连接钱包...</h2>
      </div>
    );
  }

  return <></>;
}

export default function ExplorePage() {
  return (
    <Providers>
      <ExploreContent />
      
    </Providers>
  );
}
