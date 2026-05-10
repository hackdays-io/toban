import type * as React from "react";
import {
  LuArrowRight,
  LuChartPie,
  LuEye,
  LuGithub,
  LuHandshake,
  LuHeart,
  LuMessageSquare,
  LuPalette,
  LuPlay,
  LuRefreshCw,
} from "react-icons/lu";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";

// Brand quadrant colours — the four-tone identity from the Toban logo. Reused
// across the LP for decorative accents (pills, feature cards, corner nodes).
// Kept inline because they only live on this marketing page.
const ACCENT = {
  orange: "#EF7F36",
  orangeSoft: "#FFE7D2",
  blue: "#2D6FE0",
  blueSoft: "#DCE7FB",
  teal: "#1F9E84",
  tealSoft: "#CFEEE3",
  gold: "#F2B441",
  goldSoft: "#FBE7B4",
} as const;

const FOOTER_LINKS = {
  github: "https://github.com/hackdays-io/toban",
  document: "https://hackdays-io.github.io/toban/",
  slide:
    "https://www.canva.com/design/DAGOcvbwfFk/yKhJwHvZ9sC69AFEb0vnRg/view?utm_content=DAGOcvbwfFk&utm_campaign=designshare&utm_medium=link&utm_source=editor",
  demoVideo: "https://www.youtube.com/watch?v=jFjxNSHiCBI",
} as const;

export default function Index() {
  return (
    <div className="min-h-dvh bg-bg text-text-primary">
      <LpStyles />
      <NavBar />
      <main>
        <HeroCentered />
        <PhilosophySection />
        <FeaturesSection />
        <StepsSection />
        <UseCasesSection />
      </main>
      <SiteFooter />
    </div>
  );
}

function LpStyles() {
  // LP-only keyframes. Scoped via `[data-lp-root]` so they don't leak into
  // the rest of the app even though the rules sit in a global <style> tag.
  return (
    <style>{`
      html { scroll-behavior: smooth; }
      [data-lp-root] [data-lp-anchor] { scroll-margin-top: 88px; }
      @media (prefers-reduced-motion: reduce) {
        html { scroll-behavior: auto; }
      }
      [data-lp-root] .lp-bob {
        animation: lp-bob 5.4s ease-in-out infinite;
      }
      @keyframes lp-bob {
        0%, 100% { transform: translateY(0); }
        50%      { transform: translateY(-10px); }
      }
      [data-lp-root] .lp-breathe {
        animation: lp-breathe 4.2s ease-in-out infinite;
      }
      @keyframes lp-breathe {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        50%      { transform: translate(-50%, -50%) scale(1.04); }
      }
      [data-lp-root] .lp-ripple {
        transform-origin: center;
        transform-box: fill-box;
        animation: lp-ripple-out 5.6s ease-out infinite;
        opacity: 0;
      }
      @keyframes lp-ripple-out {
        0%   { transform: scale(0.2); opacity: 0; }
        10%  { opacity: 0.75; }
        55%  { opacity: 0.45; }
        100% { transform: scale(4.4); opacity: 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        [data-lp-root] .lp-bob,
        [data-lp-root] .lp-breathe,
        [data-lp-root] .lp-ripple {
          animation: none !important;
        }
      }
    `}</style>
  );
}

/* ===================== NAV ===================== */

// React Router's <ScrollRestoration /> in app/root.tsx intercepts navigation
// scroll, so a plain <a href="#x"> click will not scroll smoothly. Handling
// it ourselves with scrollIntoView keeps the smooth animation and respects
// `prefers-reduced-motion`.
function smoothScrollTo(hash: string) {
  if (typeof document === "undefined") return;
  const id = hash.replace(/^#/, "");
  const target = document.getElementById(id);
  if (!target) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: "start",
  });
  // Update the URL hash without triggering RR's scroll restoration.
  history.replaceState(null, "", hash);
}

function HashLink({
  href,
  children,
  className,
  style,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <a
      href={href}
      className={className}
      style={style}
      onClick={(e) => {
        e.preventDefault();
        smoothScrollTo(href);
      }}
    >
      {children}
    </a>
  );
}

function NavBar() {
  const linkClass =
    "hidden transition-colors hover:text-[var(--accent-orange)] sm:inline";
  const navStyle = { ["--accent-orange" as string]: ACCENT.orange };
  return (
    <nav
      data-lp-root
      className="sticky top-0 z-40 border-b border-border/60 bg-bg/85 backdrop-blur-md backdrop-saturate-150"
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-3 md:px-7 md:py-4">
        <Link
          to="/"
          aria-label="Toban"
          className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight text-text-primary md:text-xl"
        >
          <BrandMark className="h-7 w-7 md:h-8 md:w-8" />
          Toban
        </Link>
        <div className="flex items-center gap-4 text-[13px] font-semibold text-text-primary md:gap-7 md:text-sm">
          <HashLink href="#features" className={linkClass} style={navStyle}>
            機能
          </HashLink>
          <HashLink href="#how" className={linkClass} style={navStyle}>
            使い方
          </HashLink>
          <HashLink
            href="#cases"
            className={`${linkClass} md:inline`}
            style={navStyle}
          >
            ユースケース
          </HashLink>
          <Link to="/login">
            <Button size="sm" variant="dark" className="rounded-full">
              はじめる
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ===================== HERO (centered) ===================== */

function HeroCentered() {
  return (
    <section
      data-lp-root
      className="relative mx-auto max-w-[1200px] px-5 pt-14 pb-20 text-center md:px-7 md:pt-20 md:pb-28"
    >
      <h1 className="mx-auto max-w-4xl text-balance font-black leading-[1.08] tracking-tight text-text-primary text-[clamp(34px,7vw,72px)]">
        ひとりの<span style={{ color: ACCENT.teal }}>小さな貢献</span>を、
        <br className="hidden sm:inline" />
        みんなの<span style={{ color: ACCENT.orange }}>大きな力</span>に。
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-balance text-base font-medium leading-relaxed text-text-secondary md:text-[17px]">
        コミュニティの活動を記録し、レビューし、納得のかたちで分配へ。
        <br className="hidden sm:inline" />
        Toban は、人の手と手をつなぐ
        <span className="font-bold" style={{ color: "var(--color-primary)" }}>
          あたたかい当番帳
        </span>
        です。
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link to="/login">
          <Button
            size="lg"
            data-testid="start-button"
            className="font-bold shadow-2"
          >
            はじめる
            <LuArrowRight aria-hidden="true" />
          </Button>
        </Link>
        <HashLink href="#features">
          <Button size="lg" variant="secondary" className="font-bold">
            機能を見る
          </Button>
        </HashLink>
      </div>

      <Orbit />
    </section>
  );
}

// Corner positions in the 760×460 viewBox — keep in sync with CornerNode CSS
// placement so SMIL token paths land on the rendered cards.
const ORBIT_A: [number, number] = [92, 78];
const ORBIT_B: [number, number] = [668, 78];
const ORBIT_C: [number, number] = [162, 392];
const ORBIT_D: [number, number] = [598, 392];

// Pairs of corners exchanging Thanks / RoleShare. Each entry produces TWO
// tokens — one in each direction — so the dots appear to ping-pong between
// members. Curves are intentionally offset so the two tokens for a pair don't
// overlap perfectly.
const ORBIT_TOKENS: ReadonlyArray<{
  path: string;
  color: string;
  dur: string;
  delay: string;
}> = [
  // A ↔ B (top edge)
  {
    path: `M ${ORBIT_A[0]} ${ORBIT_A[1]} Q 380 30 ${ORBIT_B[0]} ${ORBIT_B[1]}`,
    color: ACCENT.orange,
    dur: "5.2s",
    delay: "0s",
  },
  {
    path: `M ${ORBIT_B[0]} ${ORBIT_B[1]} Q 380 130 ${ORBIT_A[0]} ${ORBIT_A[1]}`,
    color: ACCENT.blue,
    dur: "5.2s",
    delay: "-2.6s",
  },
  // C ↔ D (bottom edge)
  {
    path: `M ${ORBIT_C[0]} ${ORBIT_C[1]} Q 380 440 ${ORBIT_D[0]} ${ORBIT_D[1]}`,
    color: ACCENT.teal,
    dur: "5.4s",
    delay: "-1s",
  },
  {
    path: `M ${ORBIT_D[0]} ${ORBIT_D[1]} Q 380 340 ${ORBIT_C[0]} ${ORBIT_C[1]}`,
    color: ACCENT.gold,
    dur: "5.4s",
    delay: "-3.7s",
  },
  // A ↔ C (left edge)
  {
    path: `M ${ORBIT_A[0]} ${ORBIT_A[1]} Q 30 235 ${ORBIT_C[0]} ${ORBIT_C[1]}`,
    color: ACCENT.orange,
    dur: "5.6s",
    delay: "-0.6s",
  },
  {
    path: `M ${ORBIT_C[0]} ${ORBIT_C[1]} Q 220 235 ${ORBIT_A[0]} ${ORBIT_A[1]}`,
    color: ACCENT.teal,
    dur: "5.6s",
    delay: "-3.4s",
  },
  // B ↔ D (right edge)
  {
    path: `M ${ORBIT_B[0]} ${ORBIT_B[1]} Q 740 235 ${ORBIT_D[0]} ${ORBIT_D[1]}`,
    color: ACCENT.blue,
    dur: "5.6s",
    delay: "-1.4s",
  },
  {
    path: `M ${ORBIT_D[0]} ${ORBIT_D[1]} Q 540 235 ${ORBIT_B[0]} ${ORBIT_B[1]}`,
    color: ACCENT.gold,
    dur: "5.6s",
    delay: "-4.2s",
  },
  // A ↔ D (diagonal)
  {
    path: `M ${ORBIT_A[0]} ${ORBIT_A[1]} Q 200 320 ${ORBIT_D[0]} ${ORBIT_D[1]}`,
    color: ACCENT.orange,
    dur: "6s",
    delay: "-2s",
  },
  {
    path: `M ${ORBIT_D[0]} ${ORBIT_D[1]} Q 480 140 ${ORBIT_A[0]} ${ORBIT_A[1]}`,
    color: ACCENT.gold,
    dur: "6s",
    delay: "-5s",
  },
  // B ↔ C (diagonal)
  {
    path: `M ${ORBIT_B[0]} ${ORBIT_B[1]} Q 560 320 ${ORBIT_C[0]} ${ORBIT_C[1]}`,
    color: ACCENT.blue,
    dur: "6s",
    delay: "-0.4s",
  },
  {
    path: `M ${ORBIT_C[0]} ${ORBIT_C[1]} Q 280 140 ${ORBIT_B[0]} ${ORBIT_B[1]}`,
    color: ACCENT.teal,
    dur: "6s",
    delay: "-3.2s",
  },
];

function Orbit() {
  // Centered visual: Toban logo at the middle radiating distribution ripples
  // outward, while small Thanks / RoleShare tokens flow back-and-forth between
  // the four member cards.
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto mt-12 aspect-[760/460] w-full max-w-[760px] md:mt-16"
    >
      <svg
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 760 460"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
      >
        <defs>
          <linearGradient id="orbit-line-fade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1f1f1f" stopOpacity="0" />
            <stop offset="0.5" stopColor="#1f1f1f" stopOpacity="0.12" />
            <stop offset="1" stopColor="#1f1f1f" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Faint guide lines connecting all 6 pairs of corners */}
        <g
          stroke="url(#orbit-line-fade)"
          strokeWidth="1.1"
          strokeDasharray="2 7"
          strokeLinecap="round"
        >
          <path
            d={`M ${ORBIT_A[0]} ${ORBIT_A[1]} Q 380 60 ${ORBIT_B[0]} ${ORBIT_B[1]}`}
          />
          <path
            d={`M ${ORBIT_C[0]} ${ORBIT_C[1]} Q 380 410 ${ORBIT_D[0]} ${ORBIT_D[1]}`}
          />
          <path
            d={`M ${ORBIT_A[0]} ${ORBIT_A[1]} Q 60 235 ${ORBIT_C[0]} ${ORBIT_C[1]}`}
          />
          <path
            d={`M ${ORBIT_B[0]} ${ORBIT_B[1]} Q 720 235 ${ORBIT_D[0]} ${ORBIT_D[1]}`}
          />
        </g>

        {/* Distribution ripples — wider spread, stronger stroke for visibility */}
        <g
          fill="none"
          stroke="var(--color-primary)"
          vectorEffect="non-scaling-stroke"
        >
          <circle
            className="lp-ripple"
            cx="380"
            cy="230"
            r="60"
            strokeWidth="2.6"
            strokeOpacity="0.85"
            style={{ animationDelay: "0s" }}
          />
          <circle
            className="lp-ripple"
            cx="380"
            cy="230"
            r="60"
            strokeWidth="2.2"
            strokeOpacity="0.65"
            style={{ animationDelay: "1.4s" }}
          />
          <circle
            className="lp-ripple"
            cx="380"
            cy="230"
            r="60"
            strokeWidth="1.8"
            strokeOpacity="0.5"
            style={{ animationDelay: "2.8s" }}
          />
          <circle
            className="lp-ripple"
            cx="380"
            cy="230"
            r="60"
            strokeWidth="1.6"
            strokeOpacity="0.35"
            style={{ animationDelay: "4.2s" }}
          />
        </g>

        {/* Thanks / RoleShare tokens flowing between members */}
        <g>
          {ORBIT_TOKENS.map((tok, i) => (
            // Each token is one direction A→B; the next entry (B→A) provides
            // the return half of the exchange, so together they ping-pong.
            <circle
              // biome-ignore lint/suspicious/noArrayIndexKey: ORBIT_TOKENS is a static config array, indexes are stable
              key={i}
              r="6"
              fill={tok.color}
              opacity="0"
            >
              <animateMotion
                dur={tok.dur}
                begin={tok.delay}
                repeatCount="indefinite"
                path={tok.path}
                rotate="0"
              />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.12;0.88;1"
                dur={tok.dur}
                begin={tok.delay}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      </svg>

      {/* Corner nodes — four members (Yume / Aoi / Hiro / Haru) */}
      <CornerNode
        position="top-[4%] left-[4%] sm:left-[6%]"
        delay="0s"
        ring={ACCENT.orange}
        image="/images/lp/characters/yume.webp"
      />
      <CornerNode
        position="top-[4%] right-[4%] sm:right-[6%]"
        delay="-1.3s"
        ring={ACCENT.blue}
        image="/images/lp/characters/aoi.webp"
      />
      <CornerNode
        position="bottom-[4%] left-[10%] sm:left-[14%]"
        delay="-2.6s"
        ring={ACCENT.teal}
        image="/images/lp/characters/hiro.webp"
      />
      <CornerNode
        position="bottom-[4%] right-[10%] sm:right-[14%]"
        delay="-3.9s"
        ring={ACCENT.gold}
        image="/images/lp/characters/haru.webp"
      />

      {/* Center logo with subtle breathing */}
      <div
        className="lp-breathe absolute top-1/2 left-1/2 z-10 h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32"
        style={{ filter: "drop-shadow(0 12px 28px rgba(31, 31, 31, 0.18))" }}
      >
        <img
          src="/images/toban-logo.svg"
          alt=""
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );
}

function CornerNode({
  position,
  delay,
  ring,
  image,
}: {
  position: string;
  delay: string;
  ring: string;
  image: string;
}) {
  return (
    <div
      className={`lp-bob absolute ${position} h-16 w-16 select-none overflow-hidden rounded-[18px] bg-surface sm:h-20 sm:w-20 md:h-[92px] md:w-[92px] md:rounded-[22px]`}
      style={{
        animationDelay: delay,
        boxShadow: `0 0 0 2px ${ring}, 0 18px 40px rgba(31,31,31,0.14), 0 6px 14px rgba(31,31,31,0.06)`,
      }}
    >
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="absolute inset-x-2 top-2 bottom-0 h-[calc(100%-0.5rem)] w-[calc(100%-1rem)] object-cover object-top"
      />
    </div>
  );
}

/* ===================== PHILOSOPHY ===================== */

function PhilosophySection() {
  return (
    <section
      data-lp-root
      className="relative overflow-hidden bg-gradient-to-b from-bg to-[#F1E8CE]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 20%, rgba(239,127,54,0.08), transparent 40%), radial-gradient(circle at 88% 80%, rgba(31,158,132,0.08), transparent 40%)",
        }}
      />
      <div className="relative mx-auto max-w-[1200px] px-5 py-20 md:px-7 md:py-28">
        <SectionEyebrow color="var(--color-text-primary)">
          OUR PHILOSOPHY
        </SectionEyebrow>
        <p className="max-w-3xl text-balance font-extrabold leading-[1.45] tracking-tight text-text-primary text-[clamp(22px,3.4vw,40px)]">
          コミュニティの活力は、
          <Highlight bg={ACCENT.orangeSoft}>
            <span style={{ color: ACCENT.orange }}>名もなき貢献</span>
          </Highlight>
          でできている。
          <br className="hidden sm:inline" />
          だからこそ Toban は、
          <Highlight bg={ACCENT.blueSoft}>
            <span style={{ color: ACCENT.blue }}>小さなありがとう</span>
          </Highlight>
          を見える化し、
          <br className="hidden sm:inline" />
          誰もが納得できる
          <Highlight bg={ACCENT.tealSoft}>
            <span style={{ color: ACCENT.teal }}>分配のかたち</span>
          </Highlight>
          を、ともに育てます。
        </p>

        <div className="mt-12 grid gap-8 border-t border-border pt-12 md:mt-14 md:grid-cols-3 md:pt-14">
          <Principle
            color={ACCENT.orange}
            number="01"
            title="貢献はすべて、見えてよい。"
            body="誰がいつ何をしたかは、開かれた台帳に。隠さないから、納得が生まれる。データは特定の誰かのものではなく、コミュニティのもの。"
          />
          <Principle
            color={ACCENT.blue}
            number="02"
            title="分配は、対話で決める。"
            body="機械が一方的に決める正解はない。重みづけはコミュニティが話し合い、合意したものだけが残る。Toban はその場をつくる道具に徹する。"
          />
          <Principle
            color={ACCENT.teal}
            number="03"
            title="続けやすさを、何より大切に。"
            body="難しいツールは続かない。一行で記録、一画面でレビュー、一回のクリックで分配。あたりまえの行為のとなりに、そっと寄り添う。"
          />
        </div>
      </div>
    </section>
  );
}

function Principle({
  color,
  number,
  title,
  body,
}: {
  color: string;
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div
        className="mb-4 h-[3px] w-8 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="mb-3 text-[13px] font-bold tracking-[0.12em] text-text-secondary">
        PRINCIPLE {number}
      </div>
      <h3 className="mb-3 text-xl font-extrabold tracking-tight text-text-primary md:text-[22px]">
        {title}
      </h3>
      <p className="text-sm leading-[1.7] text-text-secondary">{body}</p>
    </div>
  );
}

/* ===================== FEATURES ===================== */

const FEATURES = [
  {
    color: ACCENT.orange,
    soft: ACCENT.orangeSoft,
    icon: LuHeart,
    title: "サンクス送信",
    desc: "誰でも一行で「ありがとう」を残せる。スタンプでも、文章でも、感謝のかたちは自由に。",
    items: ["1タップ送信", "カテゴリ自動推定", "履歴の検索とタグ付け"],
  },
  {
    color: ACCENT.blue,
    soft: ACCENT.blueSoft,
    icon: LuRefreshCw,
    title: "当番割り当て",
    desc: "くりかえしの役割を、メンバーに公平に振り分け。担当の重なりも、空きも自動で気づける。",
    items: [
      "ローテーション自動化",
      "負荷バランスの可視化",
      "当番の入れ替え通知",
    ],
  },
  {
    color: ACCENT.teal,
    soft: ACCENT.tealSoft,
    icon: LuChartPie,
    title: "分配の作成",
    desc: "記録された貢献から、ひとり一人への分配案を自動生成。重みづけや調整も、画面ひとつで完結。",
    items: ["重みづけのプレビュー", "履歴とのつき合わせ", "承認フロー内蔵"],
  },
  {
    color: ACCENT.gold,
    soft: ACCENT.goldSoft,
    icon: LuEye,
    title: "透明な台帳",
    desc: "すべての貢献と分配は、メンバー全員にひらかれた台帳に記録。後からたどれる、納得の運営へ。",
    items: ["変更履歴の保存", "外部エクスポート", "権限ロールの細分化"],
  },
] as const;

function FeaturesSection() {
  return (
    <section
      id="features"
      data-lp-root
      data-lp-anchor
      className="mx-auto max-w-[1200px] px-5 py-20 md:px-7 md:py-28"
    >
      <SectionEyebrow color={ACCENT.orange}>FEATURES</SectionEyebrow>
      <h2 className="mb-4 text-balance font-black leading-[1.18] tracking-tight text-text-primary text-[clamp(28px,4vw,44px)]">
        記録から分配まで、
        <br className="hidden sm:inline" />
        ひとつのアプリで
        <span style={{ color: ACCENT.blue }}>なめらかに</span>。
      </h2>
      <p className="mb-12 max-w-xl text-balance text-base text-text-secondary md:text-[17px]">
        日々のありがとうを、専門知識なしで記録し、レビューし、納得のかたちで分配へ。4つの機能が、コミュニティの当番帳をやさしく支えます。
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({
  color,
  soft,
  icon: IconCmp,
  title,
  desc,
  items,
}: {
  color: string;
  soft: string;
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  title: string;
  desc: string;
  items: ReadonlyArray<string>;
}) {
  return (
    <div className="rounded-md border border-border bg-surface p-7 md:p-9">
      <div className="mb-4 flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: soft, color }}
        >
          <IconCmp size={26} aria-hidden />
        </div>
        <h3 className="text-[22px] font-extrabold tracking-tight text-text-primary">
          {title}
        </h3>
      </div>
      <p className="mb-4 text-[15px] leading-relaxed text-text-secondary">
        {desc}
      </p>
      <ul className="m-0 flex flex-col gap-1.5 p-0 text-[13px] font-semibold text-text-primary">
        {items.map((it) => (
          <li key={it} className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ===================== STEPS ===================== */

function StepsSection() {
  return (
    <section
      id="how"
      data-lp-root
      data-lp-anchor
      className="bg-[#F1E8CE]"
      aria-label="使い方"
    >
      <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-7 md:py-28">
        <SectionEyebrow color={ACCENT.blue}>HOW IT WORKS</SectionEyebrow>
        <h2 className="mb-4 text-balance font-black leading-[1.18] tracking-tight text-text-primary text-[clamp(28px,4vw,44px)]">
          3ステップで、
          <br className="hidden sm:inline" />
          当番帳がはじまる。
        </h2>
        <p className="mb-12 max-w-xl text-balance text-base text-text-secondary md:text-[17px]">
          難しい設定は不要。記録 → レビュー →
          分配の3つの流れで、コミュニティに自然に馴染みます。
        </p>
        <div className="grid gap-5 md:grid-cols-3">
          <Step
            number="01"
            color={ACCENT.orange}
            title="記録"
            titleSuffix="する"
            body="誰かの行動に「ありがとう」を残す。一行のメッセージから、当番のチェックインまで。"
            visual={<StepVisualRecord />}
          />
          <Step
            number="02"
            color={ACCENT.blue}
            title="レビュー"
            titleSuffix="する"
            body="集まった貢献をみんなで確認。重みづけの調整も、コメントも、開かれた場で。"
            visual={<StepVisualReview />}
          />
          <Step
            number="03"
            color={ACCENT.teal}
            title="分配"
            titleSuffix="する"
            body="納得のかたちでひとり一人へ。お金、ポイント、感謝、その形は自由に。"
            visual={<StepVisualSplit />}
          />
        </div>
      </div>
    </section>
  );
}

function Step({
  number,
  color,
  title,
  titleSuffix,
  body,
  visual,
}: {
  number: string;
  color: string;
  title: string;
  titleSuffix: string;
  body: string;
  visual: React.ReactNode;
}) {
  return (
    <div className="rounded-md bg-surface p-7 transition-transform hover:-translate-y-1 md:p-8">
      <div
        className="mb-2 text-[13px] font-bold tracking-[0.1em]"
        style={{ color }}
      >
        STEP {number}
      </div>
      <h3 className="mb-3 text-2xl font-black tracking-tight text-text-primary">
        <span style={{ color }}>{title}</span>
        {titleSuffix}
      </h3>
      <p className="m-0 text-sm text-text-secondary">{body}</p>
      <div className="mt-5 flex h-32 items-center justify-center overflow-hidden rounded-md bg-bg md:h-36">
        {visual}
      </div>
    </div>
  );
}

function StepVisualRecord() {
  return (
    <svg
      width="200"
      height="120"
      viewBox="0 0 200 120"
      aria-hidden="true"
      className="max-h-full max-w-full"
    >
      <rect
        x="20"
        y="22"
        width="160"
        height="76"
        rx="14"
        fill="white"
        stroke="#E7E1D7"
      />
      <circle cx="42" cy="46" r="12" fill={ACCENT.orange} />
      <text
        x="42"
        y="50"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="white"
        fontFamily="Inter, sans-serif"
      >
        A
      </text>
      <rect x="62" y="38" width="100" height="8" rx="4" fill="#F1E8CE" />
      <rect
        x="62"
        y="52"
        width="70"
        height="6"
        rx="3"
        fill="#F1E8CE"
        opacity="0.6"
      />
      <rect
        x="142"
        y="74"
        width="32"
        height="16"
        rx="8"
        fill={ACCENT.orangeSoft}
      />
      <text
        x="158"
        y="85"
        textAnchor="middle"
        fontSize="10"
        fontWeight="800"
        fill={ACCENT.orange}
        fontFamily="Inter, sans-serif"
      >
        +5
      </text>
    </svg>
  );
}

function StepVisualReview() {
  return (
    <svg
      width="200"
      height="120"
      viewBox="0 0 200 120"
      aria-hidden="true"
      className="max-h-full max-w-full"
    >
      <rect
        x="14"
        y="22"
        width="172"
        height="76"
        rx="14"
        fill="white"
        stroke="#E7E1D7"
      />
      <circle cx="36" cy="42" r="9" fill={ACCENT.orange} />
      <circle cx="56" cy="42" r="9" fill="#4A87E8" />
      <circle cx="76" cy="42" r="9" fill="#2DAA90" />
      <circle cx="96" cy="42" r="9" fill={ACCENT.gold} />
      <rect
        x="32"
        y="62"
        width="136"
        height="6"
        rx="3"
        fill={ACCENT.blueSoft}
      />
      <rect x="32" y="62" width="60" height="6" rx="3" fill={ACCENT.blue} />
      <rect x="32" y="76" width="100" height="6" rx="3" fill="#F1E8CE" />
      <rect
        x="138"
        y="58"
        width="36"
        height="14"
        rx="7"
        fill={ACCENT.blueSoft}
      />
      <text
        x="156"
        y="68"
        textAnchor="middle"
        fontSize="9"
        fontWeight="800"
        fill={ACCENT.blue}
        fontFamily="Inter, sans-serif"
      >
        REVIEW
      </text>
    </svg>
  );
}

function StepVisualSplit() {
  return (
    <svg
      width="200"
      height="120"
      viewBox="0 0 200 120"
      aria-hidden="true"
      className="max-h-full max-w-full"
    >
      <circle
        cx="100"
        cy="60"
        r="40"
        fill="none"
        stroke="#E7E1D7"
        strokeWidth="1.5"
        strokeDasharray="2 4"
      />
      <path d="M100 20 A40 40 0 0 1 134 80 L100 60 Z" fill={ACCENT.orange} />
      <path d="M134 80 A40 40 0 0 1 84 96 L100 60 Z" fill="#4A87E8" />
      <path d="M84 96 A40 40 0 0 1 66 80 L100 60 Z" fill="#2DAA90" />
      <path d="M66 80 A40 40 0 0 1 100 20 L100 60 Z" fill={ACCENT.gold} />
      <circle cx="100" cy="60" r="14" fill="#FAF7F0" />
    </svg>
  );
}

/* ===================== USE CASES ===================== */

const CASES = [
  {
    tag: "DAO",
    color: ACCENT.orange,
    soft: ACCENT.orangeSoft,
    icon: LuHandshake,
    title: "DAO 運営の貢献記録",
    body: "貢献ログを台帳に集約し、四半期ごとの分配と意思決定にリンク。透明な運営をスマートコントラクトで支える。",
  },
  {
    tag: "OSS",
    color: ACCENT.blue,
    soft: ACCENT.blueSoft,
    icon: LuMessageSquare,
    title: "OSS コミュニティの貢献",
    body: "Issue レビュー、ドキュメント、登壇まで含めた多様な貢献をまるごと可視化。報酬の重みづけは合意で決める。",
  },
  {
    tag: "町内会・地域",
    color: ACCENT.teal,
    soft: ACCENT.tealSoft,
    icon: LuRefreshCw,
    title: "町内の当番ローテーション",
    body: "清掃・見守り・お祭り運営の当番を公平に割り振り、感謝とともに記録。地域のあたたかい台帳に。",
  },
  {
    tag: "部活・サークル",
    color: ACCENT.gold,
    soft: ACCENT.goldSoft,
    icon: LuPalette,
    title: "部活・サークル運営",
    body: "準備・片付け・運営役割をログに残して負担を見える化。学生コミュニティに無理のない運営を。",
  },
] as const;

function UseCasesSection() {
  return (
    <section
      id="cases"
      data-lp-root
      data-lp-anchor
      className="mx-auto max-w-[1200px] px-5 py-20 md:px-7 md:py-28"
    >
      <SectionEyebrow color={ACCENT.teal}>USE CASES</SectionEyebrow>
      <h2 className="mb-4 text-balance font-black leading-[1.18] tracking-tight text-text-primary text-[clamp(28px,4vw,44px)]">
        小さな貢献が、
        <br className="hidden sm:inline" />
        あらゆるチームで
        <span style={{ color: ACCENT.blue }}>かたちになる</span>。
      </h2>
      <p className="mb-12 max-w-xl text-balance text-base text-text-secondary md:text-[17px]">
        DAOから町内会まで。Toban
        はコミュニティの形に合わせて、しなやかに使えます。
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {CASES.map((c) => (
          <UseCaseCard key={c.title} {...c} />
        ))}
      </div>
    </section>
  );
}

function UseCaseCard({
  tag,
  color,
  soft,
  icon: IconCmp,
  title,
  body,
}: {
  tag: string;
  color: string;
  soft: string;
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-border bg-surface transition-[transform,border-color,box-shadow] hover:-translate-y-1 hover:border-text-primary hover:shadow-3">
      <div
        className="flex aspect-[4/3] w-full items-center justify-center"
        style={{ backgroundColor: soft }}
      >
        <IconCmp size={48} aria-hidden />
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 py-5 md:px-6 md:py-6">
        <span
          className="inline-flex max-w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-[0.08em]"
          style={{ backgroundColor: soft, color }}
        >
          {tag}
        </span>
        <h4 className="text-lg font-extrabold leading-snug tracking-tight text-text-primary">
          {title}
        </h4>
        <p className="text-[13px] leading-relaxed text-text-secondary">
          {body}
        </p>
      </div>
    </div>
  );
}

/* ===================== FOOTER ===================== */

function SiteFooter() {
  return (
    <footer data-lp-root className="border-t border-border bg-[#F1E8CE]">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-14 md:grid-cols-[1.2fr_repeat(3,1fr)] md:gap-12 md:px-7">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-lg font-extrabold tracking-tight text-text-primary md:text-xl"
          >
            <BrandMark className="h-8 w-8" />
            Toban
          </Link>
          <p className="mt-3 mb-5 max-w-xs text-[13px] text-text-secondary">
            あたたかい当番帳。コミュニティの貢献を見える化し、納得の分配につなげるツール。
          </p>
          <div className="flex gap-2.5">
            <SocialLink href={FOOTER_LINKS.github} label="GitHub">
              <LuGithub size={16} aria-hidden />
            </SocialLink>
            <SocialLink href={FOOTER_LINKS.demoVideo} label="Demo Video">
              <LuPlay size={16} aria-hidden />
            </SocialLink>
          </div>
        </div>
        <FooterColumn
          title="プロダクト"
          links={[
            { label: "機能", href: "#features" },
            { label: "使い方", href: "#how" },
            { label: "ユースケース", href: "#cases" },
            { label: "はじめる", to: "/login" },
          ]}
        />
        <FooterColumn
          title="リソース"
          links={[
            {
              label: "Document",
              href: FOOTER_LINKS.document,
              external: true,
            },
            { label: "Slide", href: FOOTER_LINKS.slide, external: true },
            {
              label: "Demo Video",
              href: FOOTER_LINKS.demoVideo,
              external: true,
            },
            { label: "GitHub", href: FOOTER_LINKS.github, external: true },
          ]}
        />
        <FooterColumn
          title="サイト"
          links={[
            { label: "ホーム", to: "/" },
            { label: "ログイン", to: "/login" },
            { label: "ワークスペース作成", to: "/signup" },
          ]}
        />
      </div>
      <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-2 border-t border-border px-5 py-5 text-[12px] text-text-secondary sm:flex-row sm:items-center md:px-7">
        <span>© {new Date().getFullYear()} Toban — あたたかい当番帳</span>
        <span>
          Simplest way of contribution recording and rewards distribution.
        </span>
      </div>
    </footer>
  );
}

type FooterLink = {
  label: string;
  to?: string;
  href?: string;
  external?: boolean;
};

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<FooterLink>;
}) {
  return (
    <div>
      <h5 className="mb-3 text-[12px] font-extrabold tracking-[0.12em] text-text-secondary uppercase">
        {title}
      </h5>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {links.map((link) => {
          const linkClassName =
            "text-sm font-semibold text-text-primary transition-colors hover:text-[var(--accent)]";
          const linkStyle = { ["--accent" as string]: ACCENT.orange };
          let body: React.ReactNode;
          if (link.to) {
            body = (
              <Link to={link.to} className={linkClassName} style={linkStyle}>
                {link.label}
              </Link>
            );
          } else if (link.href && link.external) {
            body = (
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className={linkClassName}
                style={linkStyle}
              >
                {link.label}
              </a>
            );
          } else if (link.href) {
            body = (
              <HashLink
                href={link.href}
                className={linkClassName}
                style={linkStyle}
              >
                {link.label}
              </HashLink>
            );
          }
          return <li key={link.label}>{body}</li>;
        })}
      </ul>
    </div>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-text-primary transition-[transform,border-color] hover:-translate-y-0.5 hover:border-text-primary"
    >
      {children}
    </a>
  );
}

/* ===================== Shared bits ===================== */

function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/images/toban-logo.svg"
      alt=""
      aria-hidden="true"
      className={className}
    />
  );
}

function SectionEyebrow({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mb-3 text-[13px] font-extrabold tracking-[0.12em] uppercase"
      style={{ color }}
    >
      {children}
    </div>
  );
}

function Highlight({
  bg,
  children,
}: {
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <span className="relative inline-block">
      <span
        className="absolute right-0 bottom-0 left-0 -z-10 block h-2 rounded opacity-70"
        style={{ backgroundColor: bg }}
        aria-hidden
      />
      {children}
    </span>
  );
}
