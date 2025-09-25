"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import {avalancheFuji, sepolia } from "wagmi/chains"

export default getDefaultConfig({
    appName: "NFT Marketplace",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    chains: [avalancheFuji, sepolia],
    ssr: true,
})