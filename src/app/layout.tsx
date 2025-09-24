import type { Metadata } from "next"
import "./globals.css"
import Header from "./components/Header"
import { type ReactNode } from "react"
import { Providers } from "./providers"

export const metadata: Metadata = {
    title: "NFTMarketplace, the best place to buy and sell NFTs",
    description: "A non-custodial marketplace for NFTs",
}

export default function RootLayout(props: { children: ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/2.png" sizes="any" />
            </head>
            <body className="bg-zinc-50">
                <Providers>
                    <Header />
                    {props.children}
                </Providers>
            </body>
        </html>
    )
}
