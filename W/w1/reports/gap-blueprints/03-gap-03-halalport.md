# Gap 03 — HalalPort: All-in-One Halal Brokerage (Screen + Execute)

## Table of Contents

1. [Gap Definition](#1-gap-definition)
2. [Root Causes](#2-root-causes)
3. [Why It Has Not Been Filled](#3-why-it-has-not-been-filled)
4. [Feasibility Analysis](#4-feasibility-analysis)
5. [Viability Analysis](#5-viability-analysis)
6. [Survivability Analysis](#6-survivability-analysis)
7. [Competitor Mapping](#7-competitor-mapping)
8. [Pivot Points](#8-pivot-points)
9. [Acquisition Positioning](#9-acquisition-positioning)
10. [Zero/Near-Zero Cost MVP Architecture](#10-zeronear-zero-cost-mvp-architecture)
11. [MVP Presentation Strategy](#11-mvp-presentation-strategy)
12. [Contact Targets](#12-contact-targets)
13. [Monetization Methods](#13-monetization-methods)
14. [GTM Strategy](#14-gtm-strategy)
15. [Risk Register](#15-risk-register)
16. [Startup Name Rationale](#16-startup-name-rationale)
17. [Scores](#17-scores)
18. [References](#18-references)

## 1. Gap Definition

Single retail app: search any stock/ETF, see *why* halal/haram/doubtful under stated methodology (AAOIFI vs S&P/DJIM vs SC-Malaysia), tap buy, hold through flips with auto-alerts, purification + zakat handled — no juggling screener (Zoya/Musaffa) + conventional broker. Wahed = hands-off robo (0.49–0.79% AUM) vs Zoya = screener, no native execution [2026](https://www.halalwallet.us/compare/wahed-invest-vs-zoya). Demand: $198B→$341B by 2029 [2025](https://www.arabnews.com/business/saudi-arabia-uae-malaysia-lead-islamic-fintech-as-market-eyes-341bn-report-2634241); Wahed >$2B AUM/400k users [2025](https://www.wahed.com/mme/crossing-2-billion-in-aum-what-this-milestone-means-for-wahed-and-the-future-of-islamic-finance); Zoya >$500M→>$1B connected [2025](https://blog.zoya.finance/half-a-billion/) [2026](https://blog.zoya.finance/a-billion-dollar-milestone/).

## 2. Root Causes

- **Methodology fragmentation:** AAOIFI (<30% debt/cash/receivables, <5% impure, mkt-cap denominator) vs S&P DJI (<33%, 36-mo smoothing) [2025](https://halalscreener.app/en/blog/aaoifi-vs-djim-screening-standards); Malaysia SC-SAC two-tier (5/20/50% + <33%, refreshed May/Nov; 30 May + 28 Nov 2025) [2025](https://www.sc.com.my/api/documentms/download.ashx?id=2671e073-8b4c-4291-af90-7cb34ad7715f). No single screen satisfies all scholars.
- **Idle-cash riba:** need swap-free, no interest on sweep, no margin/short — ADGM IFR + SSB required [2025](https://tabadulat.com/blog/tabadulat-secures-full-fsra-license-to-launch-uaes-first-free-halal-trading-platform); Bursa Malaysia-i riba-free accounts [2025](https://www.sc.com.my/development/icm/icm-publications/list-of-shariah-compliant-securities).
- **Status drift:** flips need continuous screening + alerts; Malaysia disposal rules (sell if price>cost, donate excess) [2025](https://www.sc.com.my/api/documentms/download.ashx?id=2671e073-8b4c-4291-af90-7cb34ad7715f).
- **Ethical overlay:** AAOIFI misses BDS/human-rights screens; SPUS/HLAL pass sharia but hold boycotted tech [2025](https://halalfinanx.com/stock-screener).
- **Licence moat:** ADGM Cat 3A ~$500k base [2025](https://licensing.truvis.ae/); UK no Islamic regime, full FCA burden [2025](https://ffnews.com/news/ayan-capital-secures-fca-credit-license-and-launches-tech-driven-islamic-consumer-finance); US needs FINRA/SIPC clearing (Alpaca model) [2026](https://www.businesswire.com/news/home/20260226409179/en/Musaffa-Expands-Faith-Aligned-Investing-With-Their-Global-Halal-Investment-Platform-for-US-Markets).

## 3. Why It Has Not Been Filled

Incumbents chose halves (Wahed robo, Zoya screener). Rails only just arrived: Akinda backend (AAOIFI No.21, AI 10-K/Q parsing, 20k assets) [2025](https://akinda.io/for-business); Alpaca sharia embedding (Musaffa, Abyan, ZAD) [2026](https://alpaca.markets/shariah-compliant). Geography locks: UAE integrated licence only Dec 2025 — Tabadulat Cat 3A [2025](https://fintechnews.ae/29193/abudhabi/tabadulat-full-fsra-license-halal-trading/); Musaffa×Alpaca US only Feb 2026 [2026](https://www.businesswire.com/news/home/20260226409179/en/Musaffa-Expands-Faith-Aligned-Investing-With-Their-Global-Halal-Investment-Platform-for-US-Markets). BaaS production needs volume/minimums, custom quotes [2025](https://alpaca.markets/forum/alpaca.markets/t/what-is-the-pricing-model-for-using-alpaca-service/4423).

## 4. Feasibility Analysis

- **Technical:** feasible — own AAOIFI calculator + methodology toggle + Alpaca sandbox execution + nightly re-check jobs.
- **Shariah:** feasible — publish methodology mapping AAOIFI Std 21/S&P/SC-SAC; part-time SSB scholar day 0 (ADGM IFR requirement).
- **Regulatory:** UAE 4/10 (Tabadulat precedent, but ~$500k capital); Malaysia 5/10 (RM2.7T ICM [2025](https://nzchambers.com/offering-of-shariah-compliant-crypto-assets-in-malaysia-legal-regulatory-compliance-analysis/), but flip/disposal tracking); UK 7/10; US 8/10 (B2B-on-Alpaca only).
- **Market:** proven WTP — Zoya Pro $14.99/mo [2025](https://help.zoya.finance/en/articles/8307704-how-much-does-zoya-pro-cost); Wahed $2B scale.

## 5. Viability Analysis

Stackable: freemium Pro + FX spread + Murabaha cash-sweep spread + purification/zakat premium + B2B API (Akinda playbook). Minus: small-balance price sensitivity + BaaS minimums pre-scale.

## 6. Survivability Analysis

Moat: multi-standard verdict engine (show both AAOIFI + S&P verdicts, never single stamp) + flip-alert + purification ledger + BDS double-screen. Copy risk from Wahed (DIY arm) / Tabadulat-Musaffa roll-up — defend via UAE licence + Malaysia window partnerships.

## 7. Competitor Mapping

| Player | Position | Gap |
|---|---|---|
| Wahed ($2B/400k) | Robo | No DIY picking |
| Zoya ($1B connected) | Screener $14.99/mo | No execution |
| Musaffa + Alpaca (US, Feb 2026) | Grades + execution | US-only, AAOIFI-only |
| Tabadulat (ADGM Cat 3A) | Commission-free US + AAOIFI | UAE-anchored, early X-border |
| Akinda | B2B API 20k assets | Rails, not consumer — partner |
| Kestrl (UK) | Money app + light screening [2025](https://kestrl.io/) | No trading depth |

## 8. Pivot Points

(a) Pure B2B screening API (Akinda clone) if brokerage capital too high; (b) BDS-ethical overlay standalone premium; (c) white-label for Islamic banks (Malaysia RM2.7T ICM).

## 9. Acquisition Positioning

Wahed (DIY arm), Alpaca/DriveWealth (faith vertical), GCC Islamic banks, Bursa/Malaysian brokers, Tabadulat/Musaffa geography roll-up. [INFERENCE on fit.]

## 10. Zero/Near-Zero Cost MVP Architecture

SEC EDGAR free filings + own calculator (toggle AAOIFI/S&P/SC-MY) cached in Supabase free; BDS overlay via curated CSV; Alpaca Broker sandbox/paper free; Next.js/Vercel hobby + Supabase Auth/Postgres + Alpaca SDK; delayed IEX free (defer SIP/OPRA fees); nightly re-check + push flip alerts + purification ledger (S&P dividend-factor) + zakat CSV. Slice: 200 most-held US stocks + SPUS/HLAL/UMMA, paper trade. SSB advisor from day 0.

## 11. MVP Presentation Strategy

Demo: screen → why-explainer → paper buy → flip alert → purification export. Narrative: "Zoya tells you, Wahed decides for you — we let you act." Metric: 5k paper users + 15% Pro intent + SSB sign-off letter.

## 12. Contact Targets

ADGM FSRA via Tabadulat-precedent channel [2025](https://fintechnews.ae/29193/abudhabi/tabadulat-full-fsra-license-halal-trading/); DIFC Innovation Hub [2026](https://www.difc.com/ecosystem/innovation-hub); SC FIKRALab [2026](https://www.sc.com.my/fikra-ace). Individual emails: NOT RETRIEVED.

## 13. Monetization Methods

Freemium ($14.99/mo Pro anchor); FX spread X-border; Murabaha cash-sweep; BDS+purification premium; B2B screening API.

## 14. GTM Strategy

Reddit r/IslamicFinance + HalalWallet comparisons (Wahed-vs-Zoya confusion [2026](https://www.halalwallet.us/compare/wahed-invest-vs-zoya)); mosque/student ambassadors UK/MY; BDS-double-screen launch hook [2025](https://halalfinanx.com/stock-screener); UAE launch partner for ADGM credibility.

## 15. Risk Register

| Risk | L / I | Mitigation |
|---|---|---|
| Scholar disagreement (30 vs 33%) | H / H | Show both verdicts |
| Flip liability | M / H | Auto-alert + MY disposal guidance |
| BaaS minimums kill pre-scale | H / M | Start read-only + broker-sync |
| FCA/US BD cost | M / H | B2B-on-Alpaca, partner licence |

## 16. Startup Name Rationale

**HalalPort** — portfolio + port (safe harbor): where halal money docks; English-global, ownable.

## 17. Scores

- **Monetization: 8/10** — Zoya Pro + Wahed AUM + PFOF/sweep prove stack.
- **Friction: UAE 4 / MY 5 / UK 7 / US 8.**

## 18. References

- Wahed vs Zoya [2026](https://www.halalwallet.us/compare/wahed-invest-vs-zoya); Zoya Pro [2025](https://help.zoya.finance/en/articles/8307704-how-much-does-zoya-pro-cost); Wahed $2B [2025](https://www.wahed.com/mme/crossing-2-billion-in-aum-what-this-milestone-means-for-wahed-and-the-future-of-islamic-finance); Zoya milestones [2025](https://blog.zoya.finance/half-a-billion/) [2026](https://blog.zoya.finance/a-billion-dollar-milestone/)
- AAOIFI vs DJIM [2025](https://halalscreener.app/en/blog/aaoifi-vs-djim-screening-standards); SC-SAC [2025](https://www.sc.com.my/api/documentms/download.ashx?id=2671e073-8b4c-4291-af90-7cb34ad7715f)
- Tabadulat licence [2025](https://fintechnews.ae/29193/abudhabi/tabadulat-full-fsra-license-halal-trading/) [2025](https://tabadulat.com/blog/tabadulat-secures-full-fsra-license-to-launch-uaes-first-free-halal-trading-platform); Musaffa×Alpaca [2026](https://www.businesswire.com/news/home/20260226409179/en/Musaffa-Expands-Faith-Aligned-Investing-With-Their-Global-Halal-Investment-Platform-for-US-Markets); Alpaca sharia [2026](https://alpaca.markets/shariah-compliant); Akinda [2025](https://akinda.io/for-business)
- BDS screen [2025](https://halalfinanx.com/stock-screener); Cat 3A capital [2025](https://licensing.truvis.ae/); FCA [2025](https://ffnews.com/news/ayan-capital-secures-fca-credit-license-and-launches-tech-driven-islamic-consumer-finance); MY ICM [2025](https://nzchambers.com/offering-of-shariah-compliant-crypto-assets-in-malaysia-legal-regulatory-compliance-analysis/); Kestrl [2025](https://kestrl.io/)
