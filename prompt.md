```
{
  itemBoughts(first: 1000) {
    buyer
    nftAddress
    tokenId
  }
  itemCanceleds(first: 1000) {
    seller
    nftAddress
    tokenId
  }

    itemListeds(first: 1000){
    tokenId
    nftAddress
  }
}
```

```
  "dependencies": {
    "@rainbow-me/rainbowkit": "^2.2.8",
    "@tanstack/react-query": "^5.90.2",
    "next": "15.5.4",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "viem": "~2.37.8",
    "wagmi": "^2.17.2"
  },
```
上面是我subgraph的查询语句和我目前使用的依赖

```
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
```

```
// src/app/components/NFTBox.tsx
"use client"
```

我想在这个ExplorePage里面实现NFTDisplayCase，展示很多NFT只显示NFT的图片和价格，这个图片的显示我希望支持的是从json中提起image链接然后显示，然后用户可以点击NFTDisplayCase中的NFT此时就是要弹出一个NFTBox（请实现这个组件）有侧窗显示NFT的图片，合约地址，token id，价格，chain等详细信息，这些信息可以分组显示，比如block datail一个组