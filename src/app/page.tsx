"use client";
import React, { useEffect, useState, useRef } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface Quote {
  en: string;
  zh: string;
  credit?: string;
}

const QUOTES: Quote[] = [
  {
    en: "Privacy for the weak, transparency for the powerful.",
    zh: "弱者要有隐私，强者必须透明。",
    credit: "— Cypherpunk maxim"
  },
  {
    en: "Strong cryptography is the immune system of the digital world.",
    zh: "强大的密码学是数字世界的免疫系统。",
    credit: "— Keren Elazari"
  },
  {
    en: "With cryptography, no amount of violence will ever solve a math problem.",
    zh: "在密码学面前，再多的暴力也解不开一个数学问题。",
    credit: "— Jacob Appelbaum"
  }
];

// 可调参数
const TYPING_SPEED = 45;      // 每个字符打字毫秒
const DELETING_SPEED = 28;    // 删除时每字符毫秒
const HOLD_AFTER_TYPE = 2200; // 完整打出后停留
const HOLD_AFTER_DELETE = 500;// 删除后下一轮前等待
const SHOW_BILINGUAL = true;  // 是否同时显示中英（英→换行→中）
const LOOP = true;

function useTypewriter(quotes: Quote[]) {
  const [display, setDisplay] = useState("");
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting">("typing");
  const [fullText, setFullText] = useState("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const q = quotes[index];
    const text = SHOW_BILINGUAL ? `${q.en}\n${q.zh}` : q.en;
    setFullText(text);
  }, [index, quotes]);

  useEffect(() => {
    if (!fullText) return;
    let timer: number;

    if (phase === "typing") {
      if (display.length < fullText.length) {
        timer = window.setTimeout(() => {
          if (!mounted.current) return;
          setDisplay(fullText.slice(0, display.length + 1));
        }, TYPING_SPEED);
      } else {
        timer = window.setTimeout(() => setPhase("holding"), HOLD_AFTER_TYPE);
      }
    } else if (phase === "holding") {
      timer = window.setTimeout(() => setPhase("deleting"), HOLD_AFTER_TYPE / 2);
    } else if (phase === "deleting") {
      if (display.length > 0) {
        timer = window.setTimeout(() => {
          if (!mounted.current) return;
          setDisplay(fullText.slice(0, display.length - 1));
        }, DELETING_SPEED);
      } else {
        timer = window.setTimeout(() => {
          if (!mounted.current) return;
          if (index < quotes.length - 1) {
            setIndex(i => i + 1);
          } else if (LOOP) {
            setIndex(0);
          }
          setPhase("typing");
        }, HOLD_AFTER_DELETE);
      }
    }

    return () => clearTimeout(timer);
  }, [display, phase, fullText, index]);

  return { display, index, phase };
}

const TypewriterQuotes: React.FC = () => {
  const { display, index } = useTypewriter(QUOTES);
  const current = QUOTES[index];

  return (
    <div className="mt-12 relative max-w-3xl mx-auto">
      <div className="rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 p-6 shadow-lg">
        {/* 打字文本 */}
        <div className="whitespace-pre-line font-mono text-base md:text-lg text-zinc-100 leading-relaxed min-h-[5rem]">
          {display}
          <span className="inline-block w-2 bg-emerald-400 ml-1 animate-pulse h-5 align-middle rounded-sm" />
        </div>

        {/* 引用来源 */}
        {current.credit && (
          <div className="text-sm text-zinc-400 mt-3 italic text-right">
            —— {current.credit}
          </div>
        )}
      </div>

      {/* 装饰渐变光晕 */}
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-2xl rounded-2xl -z-10" />
    </div>
  );
};


export default function Home() {
  return (
    <main className="p-6 md:p-10 space-y-16">
      {/* Hero */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 text-transparent bg-clip-text">
          NFT Marketplace
        </h1>
        <p className="text-lg text-zinc-700 dark:text-zinc-300 max-w-3xl mx-auto">
          一个完全 <span className="font-semibold">Permissionless</span>、<span className="font-semibold">Non-Custodial</span>、<span className="font-semibold">Composable</span> 的 NFT 交易与发现平台。
        </p>
        <div className="flex justify-center gap-4 mt-6">
          <a
            href="/explore"
            className="px-5 py-2 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition"
          >
            开始探索
          </a>
          <a
            href="https://etherscan.io"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 rounded-xl border border-zinc-400/30 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-800/10 transition inline-block"
          >
            查看合约
          </a>
        </div>
      </section>

      {/* 功能介绍 */}
      <section className="max-w-3xl mx-auto space-y-4 text-center">
        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
          我们相信开放、可验证的协议层能降低信任成本；
          加密与隐私增强技术（ZK、批签名、离线撮合等）使用户在保持主权的同时获得更佳体验。
        </p>
      </section>

      <TypewriterQuotes />

      {/* Features */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/5 p-5">
          <h3 className="font-semibold text-emerald-300 mb-2">Permissionless</h3>
          <p className="text-sm text-zinc-300">
            开放接入，无需审核；开发者可直接集成聚合路由与报价端点。
          </p>
        </div>
        <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/5 p-5">
          <h3 className="font-semibold text-cyan-300 mb-2">Non-Custodial</h3>
          <p className="text-sm text-zinc-300">
            数字收藏品永远留在你的钱包；签名后链上结算，无中心化托管风险。
          </p>
        </div>
        <div className="rounded-xl border border-fuchsia-300/30 bg-fuchsia-500/5 p-5">
          <h3 className="font-semibold text-fuchsia-300 mb-2">Composable</h3>
          <p className="text-sm text-zinc-300">
            协议接口模块化：报价、撮合、清算、版税策略均可替换或扩展。
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center mt-12 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-10 rounded-2xl">
        <h2 className="text-2xl font-bold mb-4">立即开始探索去中心化 NFT 世界</h2>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </section>
    </main>
  );
}
