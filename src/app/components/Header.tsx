import Image from 'next/image'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/dist/client/link'

export default function Header() {
    return (
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-zinc-200/50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo Section */}
                    <Link href="/" className="flex items-center space-x-3 group">
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-2 transition-transform duration-300 group-hover:scale-105">
                            <Image
                                src="/2.png"
                                alt="NFT Marketplace Logo"
                                width={40}
                                height={32}
                                className="relative z-10 drop-shadow-sm"
                            />
                            <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                NFT Marketplace
                            </h1>
                            <p className="text-xs text-zinc-500 -mt-1">Discover & Collect</p>
                        </div>
                    </Link>

                    {/* Center Navigation (Optional) */}
                    <nav className="hidden md:flex items-center space-x-10 font-medium">
                        {[
                            { name: "Explore", href: "/explore" },
                            { name: "Create", href: "/create" },
                            { name: "Collections", href: "/collections" },
                        ].map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className="relative text-zinc-700 hover:text-purple-600 transition-colors duration-200 group px-2 py-1"
                            >
                                {item.name}
                                {/* underline animation */}
                                <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-purple-600 transition-all duration-300 group-hover:w-full" />
                                {/* subtle hover background */}
                                <span className="absolute inset-0 rounded-lg bg-purple-100/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100 -z-10" />
                            </a>
                        ))}
                    </nav>

                    {/* Connect Button Section */}
                    <div className="flex items-center space-x-4">
                        {/* Enhanced Connect Button */}
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                            <div className="relative">
                                <ConnectButton
                                    showBalance={true}
                                    chainStatus="icon"
                                    accountStatus={{
                                        smallScreen: 'avatar',
                                        largeScreen: 'full',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden px-4 pb-3">
                <nav className="flex space-x-6">
                    <a href="/explore" className="text-sm font-medium text-zinc-600 hover:text-purple-600 transition-colors">
                        Explore
                    </a>
                    <a href="/create" className="text-sm font-medium text-zinc-600 hover:text-purple-600 transition-colors">
                        Create
                    </a>
                    <a href="/collections" className="text-sm font-medium text-zinc-600 hover:text-purple-600 transition-colors">
                        Collections
                    </a>
                </nav>
            </div>
        </header>
    )
}