"use client";
import React, { useEffect, useState, useRef } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface Quote {
  en: string;
  zh: string;
  ru: string;
  credit: string;
}

const QUOTES: Quote[] = [
  {
    en: "Privacy for the weak, transparency for the powerful.",
    zh: "弱者要有隐私，权力必须透明。",
    ru: "Приватность для слабых, прозрачность для власти.",
    credit: "— Cypherpunk maxim"
  },
  {
    en: "Cryptography is the ultimate form of non-violent direct action.",
    zh: "密码学是非暴力直接行动的终极形式。",
    ru: "Криптография — высшая форма ненасильственного прямого действия.",
    credit: "— Julian Assange"
  },
  {
    en: "Cypherpunks write code.",
    zh: "密码朋克写代码。",
    ru: "Киберпанки пишут код.",
    credit: "— Cypherpunk manifesto"
  },
  {
    en: "We cannot expect governments to grant us privacy out of their benevolence.",
    zh: "我们不能指望政府出于仁慈而给予我们隐私。",
    ru: "Мы не можем ожидать, что правительства дадут нам приватность из доброты.",
    credit: "— Eric Hughes"
  },
  {
    en: "Code is law in cyberspace.",
    zh: "在网络空间中，代码即法律。",
    ru: "В киберпространстве код — это закон.",
    credit: "— Lawrence Lessig"
  },
  {
    en: "Don't trust, verify.",
    zh: "不要信任，要验证。",
    ru: "Не доверяй, проверяй.",
    credit: "— Bitcoin community motto"
  },
  {
    en: "Information wants to be free.",
    zh: "信息渴望自由。",
    ru: "Информация хочет быть свободной.",
    credit: "— Stewart Brand"
  },
  {
    en: "Zero knowledge proofs: proving you know something without revealing what you know.",
    zh: "零知识证明：证明你知道某事而不透露你知道什么。",
    ru: "Доказательства с нулевым разглашением: доказать знание без раскрытия содержания.",
    credit: "— Cryptography concept"
  },
  {
    en: "You can't stop a message whose time has come.",
    zh: "你无法阻止一个时代到来的信息。",
    ru: "Нельзя остановить послание, время которого пришло.",
    credit: "— Tim May"
  },
  {
    en: "Bitcoin is an experiment in decentralized trust.",
    zh: "比特币是一个去中心化信任的实验。",
    ru: "Биткойн — это эксперимент в децентрализованном доверии.",
    credit: "— Satoshi Nakamoto"
  },
  {
    en: "The right to read is the right to think.",
    zh: "阅读的权利就是思考的权利。",
    ru: "Право читать — это право мыслить.",
    credit: "— Richard Stallman"
  },
  {
    en: "A free society is one where it is safe to be unpopular.",
    zh: "自由的社会是一个不受欢迎也安全的社会。",
    ru: "Свободное общество — это там, где безопасно быть непопулярным.",
    credit: "— Adlai Stevenson"
  },
  {
    en: "Freedom of the press is guaranteed only to those who own one.",
    zh: "新闻自由只属于拥有印刷机的人。",
    ru: "Свобода печати гарантирована только тем, у кого есть печатный станок.",
    credit: "— A.J. Liebling"
  },
  {
    en: "The internet treats censorship as a malfunction and routes around it.",
    zh: "互联网把审查当作故障并绕过它。",
    ru: "Интернет рассматривает цензуру как сбой и обходит её.",
    credit: "— Internet adage"
  },
  {
    en: "Anonymity is not a crime.",
    zh: "匿名不是犯罪。",
    ru: "Анонимность — это не преступление.",
    credit: "— Digital rights slogan"
  }
];

// 可调参数
const TYPING_SPEED = 35;
const DELETING_SPEED = 12;
const HOLD_AFTER_TYPE = 800;
const HOLD_AFTER_DELETE = 250;

type Language = 'en' | 'zh' | 'ru';

const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  zh: '中文',
  ru: 'Русский'
};

const LANGUAGE_CODES: Record<Language, string> = {
  en: 'EN',
  zh: '中',
  ru: 'RU'
};

interface LanguageDisplay {
  language: Language;
  text: string;
}

function useMultiLanguageSimultaneousTypewriter(quotes: Quote[]) {
  const [displays, setDisplays] = useState<LanguageDisplay[]>([
    { language: 'zh', text: '' }, 
    { language: 'en', text: '' },
    { language: 'ru', text: '' }
  ]);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting">("typing");
  const [maxLength, setMaxLength] = useState(0);
  const [currentLength, setCurrentLength] = useState(0);
  const mounted = useRef(true);

  const languages: Language[] = ['en', 'zh', 'ru'];
  const currentQuote = quotes[quoteIndex];

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const lengths = languages.map(lang => currentQuote[lang].length);
    setMaxLength(Math.max(...lengths));
    setCurrentLength(0);
  }, [currentQuote]);

  useEffect(() => {
    let timer: number;

    if (phase === "typing") {
      if (currentLength < maxLength) {
        timer = window.setTimeout(() => {
          if (!mounted.current) return;
          
          setDisplays(prev => prev.map(({ language }) => {
            const fullText = currentQuote[language];
            const progress = Math.min(currentLength + 1, fullText.length);
            const displayText = fullText.slice(0, progress);
            return { language, text: displayText };
          }));
          
          setCurrentLength(prev => prev + 1);
        }, TYPING_SPEED);
      } else {
        timer = window.setTimeout(() => setPhase("holding"), HOLD_AFTER_TYPE);
      }
    } else if (phase === "holding") {
      timer = window.setTimeout(() => setPhase("deleting"), HOLD_AFTER_TYPE / 3);
    } else if (phase === "deleting") {
      if (currentLength > 0) {
        timer = window.setTimeout(() => {
          if (!mounted.current) return;
          
          setDisplays(prev => prev.map(({ language }) => {
            const fullText = currentQuote[language];
            const progress = Math.max(0, Math.min(currentLength - 1, fullText.length));
            const displayText = fullText.slice(0, progress);
            return { language, text: displayText };
          }));
          
          setCurrentLength(prev => prev - 1);
        }, DELETING_SPEED);
      } else {
        timer = window.setTimeout(() => {
          if (!mounted.current) return;
          setQuoteIndex(i => i < quotes.length - 1 ? i + 1 : 0);
          setPhase("typing");
        }, HOLD_AFTER_DELETE);
      }
    }

    return () => clearTimeout(timer);
  }, [currentLength, phase, maxLength, quoteIndex, quotes.length, currentQuote]);

  return { displays, quoteIndex };
}

const TypewriterQuotes: React.FC = () => {
  const { displays, quoteIndex } = useMultiLanguageSimultaneousTypewriter(QUOTES);
  const current = QUOTES[quoteIndex];

  return (
    <div className="mt-12 relative max-w-6xl mx-auto">
      <div className="relative rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-zinc-900/95 via-zinc-800/80 to-emerald-900/20 p-8 shadow-2xl backdrop-blur-sm">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-purple-500/10 p-[1px]">
          <div className="w-full h-full rounded-3xl bg-gradient-to-br from-zinc-900/95 via-zinc-800/80 to-emerald-900/20" />
        </div>
        
        <div className="relative z-10 grid gap-6 md:gap-8">
          {displays.map(({ language, text }) => (
            <div key={language} className="group">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 animate-pulse" />
                  <span className="text-sm font-mono text-emerald-400/80 tracking-wider">
                    [{LANGUAGE_CODES[language]}]
                  </span>
                  <span className="text-sm text-zinc-400 font-medium">
                    {LANGUAGE_NAMES[language]}
                  </span>
                </div>
                <div className="flex-1 h-[1px] bg-gradient-to-r from-emerald-400/30 to-transparent" />
              </div>
              
              <div className="bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/50 group-hover:border-emerald-400/30 transition-colors duration-300">
                <div className="font-mono text-base md:text-lg text-zinc-100 leading-relaxed tracking-wide min-h-[2rem] flex items-center">
                  {text}
                  {text.length > 0 && (
                    <span 
                      className="inline-block w-[2px] h-5 bg-gradient-to-b from-emerald-400 to-cyan-400 ml-1 animate-pulse rounded-full"
                      style={{ boxShadow: '0 0 6px rgba(52, 211, 153, 0.6)' }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {current.credit && (
          <div className="relative z-10 text-sm text-zinc-400/80 mt-8 italic text-center font-mono border-t border-zinc-700/50 pt-6">
            {current.credit}
          </div>
        )}

        <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-emerald-400 animate-pulse opacity-60" />
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-cyan-400 animate-pulse opacity-60" style={{animationDelay: '1s'}} />
        <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-purple-400 animate-pulse opacity-60" style={{animationDelay: '2s'}} />
        <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-pink-400 animate-pulse opacity-60" style={{animationDelay: '3s'}} />
        
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent animate-pulse" />
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-pulse" style={{animationDelay: '1s'}} />
      </div>

      <div className="absolute -inset-3 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-purple-500/20 blur-3xl rounded-3xl -z-10 animate-pulse" />
      <div className="absolute -inset-6 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-purple-500/10 blur-[40px] rounded-3xl -z-20" />
      
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-emerald-400/50 font-mono tracking-wider">
        {'< MULTI_LANG_TRANSMISSION_SYNC />'}
      </div>
      
    </div>
  );
};

export default function Home() {
  return (
    <main className="p-6 md:p-10 space-y-16">
      {/* Hero */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 text-transparent bg-clip-text">
          Marketplace One
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
            href="https://testnet.snowtrace.io/address/0x3213EB712A2A97E06E9F13a1349ad49FA4331443/contract/43113/code"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 rounded-xl border border-zinc-400/30 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-800/10 transition inline-block"
          >
            查看合约
          </a>
        </div>
      </section>

      <section className="max-w-3xl mx-auto space-y-4 text-center">
        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
          我们相信开放、可验证的协议层能降低信任成本；
          加密与隐私增强技术（ZK、批签名、离线撮合等）使用户在保持主权的同时获得更佳体验。
        </p>
      </section>

      <TypewriterQuotes />

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

      <section className="text-center mt-12 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-10 rounded-2xl">
        <h2 className="text-2xl font-bold mb-4">立即开始探索去中心化 NFT 世界</h2>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </section>
    </main>
  );
}
