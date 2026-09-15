# Gap 01 — JuzSukuk: Fractional Tokenized Retail Sukuk (Sukuk-as-a-Service)

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

Wholesale sukuk tickets (~USD 200,000 / AED 100,000+) lock out retail. Gap: a regulated Shariah-compliant rail letting an issuer mint once (Wakala/Ijara/Murabaha) and distribute fractional tokens (~USD 1,000 / AED 4,000 / SAR 1,000 / RM100 lots) with on-chain KYC/transfer-restriction, automated profit distribution, T+0 DvP, plus a secondary/Islamic-repo leg. Pilots prove tech; no cross-market retail-scale player exists.

## 2. Root Causes

- **Denomination + OTC structure:** traditional minimums ~USD 200,000 exclude retail [2025](https://www.adib.ae/en/news/2025/nov/abu-dhabi-islamic-bank-and-uae-ministry-of-finance-launch-first-aed-denominated-sovereign-sukuk); same barrier for Bahrain/GCC [2025](https://www.whitecase.com/insight-alert/islamic-finance-20-innovation-tokenisation-evolution-sukuk-markets-gcc).
- **Manual lifecycle:** issuance/distribution/settlement via intermediaries; smart-contract automation is the stated fix [2026](https://www.settlemint.com/insights/sukuk-and-islamic-finance-on-a-lifecycle-platform) [2026](https://www.omfif.org/2026/07/tokenised-sukuk-the-missing-layer-in-emerging-sovereign-debt/).
- **Shariah translation risk:** tokens must represent undivided beneficial ownership (AAOIFI), avoid riba/gharar/maysir; code must mirror deeds, define qabd/default/asset-loss [2025](https://www.whitecase.com/insight-our-thinking/tokenised-islamic-finance-products-shariah-compliance-meets-digital-innovation).
- **Fragmented licensing:** security = substance-over-label; UAE needs CMA/SCA vs ADGM vs DFSA vs VARA mapping [2026](https://neoslegal.co/rwa-tokenization-guide/); SC Malaysia treats tokenised sukuk as regulated security under CMSA 2007 [2025](https://www.sc.com.my/regulation/regulatory-faqs/frequently-asked-questions-on-tokenised-capital-market-products).

## 3. Why It Has Not Been Filled

- Khazanah/Danum RM100m 1-yr Wakala tranche was institutional digital-twin (KWAP/CGC/OCBC holders), not retail [2026](https://www.sc.com.my/resources/media/media-release/khazanah-leads-malaysias-first-tokenised-sukuk-pilot-in-collaboration-with-the-sc) [2026](https://www.ram.com.my/pressrelease/?prviewid=7271).
- ADIB Smart Sukuk fractionalises (USD 1,000/AED 4,000, 70–80 instruments) but bank-captive, UAE-resident only [2025](https://www.adib.ae/en/news/2025/nov/abu-dhabi-islamic-bank-and-uae-ministry-of-finance-launch-first-aed-denominated-sovereign-sukuk) [2026](https://gulfnews.com/gn-focus/digital-sukuk-opens-doors-to-everyday-investors-1.500524266).
- Fusang FDR wrapper on IILM sukuk is accredited-only, IILM unaffiliated [2025](https://fusang.co/sukuk/ilsf-4-40-17sep2025).
- INABLR (Tezos, CBB sandbox, $1,000 tickets) pre-commercial, Bahrain-only [2025](https://www.unlock23.com/inablr-middle-east-redefines-bahrains-legacy-of-financial-innovation-with-fractional-sukuk-advancements/).
- Tarmeez digitises Saudi corporate sukuk (SAR 1,000 min, >SAR 2bn) but web2, no token/secondary [2025](https://www.fintechweekly.com/magazine/articles/tali-ventures-invests-tarmeez-sukuk-fintech).

## 4. Feasibility Analysis

- **Technical:** feasible — ERC-3643 permissioned tokens, allowlist KYC, off-chain registry mirror (digital-twin), on-chain payout log; SettleMint DALP pattern validates lifecycle/DvP [2026](https://www.settlemint.com/for/sukuk).
- **Shariah:** feasible with scholar-signed logic map mirroring master trust/agency deeds; asset-pool hash on-chain; wa'ad events logged separately.
- **Regulatory:** clearest in Bahrain (CBB sandbox→licence) then Malaysia (SC consultation + Khazanah pilot); Saudi biggest prize but heaviest (CMA prospectus + Edaa/Muqassa integration) [2025](https://www.whitecase.com/insight-alert/saudi-domestic-retail-sukuk-practical-considerations-issuers-and-financial-advisors).
- **Market:** demand proven — global sukuk outstanding >USD 1tn, 2025 issuance >USD 300bn +25% YoY [2026](https://www.fitchratings.com/research/islamic-finance/global-sukuk-market-enters-2026-with-strong-fundamentals-07-01-2026); Saudi listed sukuk/debt SAR 663.5bn [2025](https://www.whitecase.com/insight-alert/saudi-domestic-retail-sukuk-practical-considerations-issuers-and-financial-advisors).

## 5. Viability Analysis

Unit economics: 30–60bps setup + 8–12bps p.a. servicing + USD 3–8k/mo white-label SaaS per arranger; secondary/ATS share later. Tarmeez 7–18% retail yields show spread tolerance; Sah ~4.58% anchors sovereign floor. WTP risk: retail fee tolerance beyond bank-subsidised pilots unproven — mitigate via issuer-paid model.

## 6. Survivability Analysis

Moat: multi-jurisdiction licence footprint + scholar-signed rule engine + ATS/repo settlement integrations (Edaa/Muqassa/Wamid Islamic repo >SAR 110m precedent [2026](https://www.saudiexchange.sa/Resources/fsPdf/2583_0_2026-03-30_12-34-39_En.pdf)). Bank-captive players won't white-label; infra vendors sell tooling, not regulated issuance.

## 7. Competitor Mapping

| Player | Position | Gap |
|---|---|---|
| INABLR (Bahrain) | Tezos SaaS, CBB graduate | Pre-scale, single market — partner/acquire target |
| Fusang | FDR/ERC-20 IILM wrapper | Accredited-only, no retail/SaaS |
| Tarmeez (Saudi) | CMA-licensed, SAR 1,000 app | Web2, no token/secondary — distribution partner |
| SettleMint DALP | Lifecycle/DvP infra | Enabler, build on it |
| ADIB Smart Sukuk | 70–80 instruments via app | Bank-captive, residents-only |

## 8. Pivot Points

(a) Pure B2B DALP-for-sukuk SaaS to arrangers; (b) Islamic-repo collateral engine for banks; (c) fractional SME Murabaha notes (Tarmeez lane) if token-securities ruling stalls.

## 9. Acquisition Positioning

Tarmeez/CMA arrangers, ADIB/FAB/Al Rajhi digital arms, Edaa/Wamid/Tadawul Group, SettleMint/Ripple infra, Fusang/Labuan exchange, Aeris Chain. Timing: post-sandbox traction + 1 repeat issuer.

## 10. Zero/Near-Zero Cost MVP Architecture

One SME Ijara/Wakala sukuk (SAR 5–10m, 12-mo) as fractional ERC-3643 on Sepolia + Tezos Ghostnet (free testnets), dual digital-twin registry (CSV + on-chain). Stack: Next.js/Vercel free + Supabase (KYC stub, registry mirror) + Thirdweb/OpenZeppelin ERC-3643 + Vercel cron payout calculator + PDF term-sheet + AAOIFI checklist signed by partner scholar (deferred fee). Settle MVP off-chain via partner ledger; tokens as record — no custody/ATS claims. Go-live: CBB sandbox first, then SC, citing Khazanah/SC + INABLR precedents.

## 11. MVP Presentation Strategy

Demo: mint → fractionalise → KYC allowlist → distribute → auto-payout, with asset-hash audit view + Shariah logic map. Narrative: "$200k tickets → $1k tickets, same deed." Proof points: OMFIF/White & Case citations, Khazanah/SC precedent slide, repo-demo clip.

## 12. Contact Targets

CBB FinTech & Innovation Unit via [portal](https://www.cbb.gov.bh/fintech/); SC Malaysia FIKRALab via [portal](https://www.sc.com.my/fikra-ace); Bahrain FinTech Bay [acceleration](https://www.bahrainfintechbay.com/acceleration); Tarmeez-type CMA arrangers; ADGM SPV desks. Individual emails: NOT RETRIEVED — use portals only.

## 13. Monetization Methods

Issuer setup 30–60bps; servicing 8–12bps p.a.; white-label SaaS USD 3–8k/mo; secondary/ATS revenue-share later. Shariah structure: Wakala/Ijara service fees, never interest.

## 14. GTM Strategy

(1) Bahrain: CBB sandbox + 1 corporate repeat of INABLR story; (2) Malaysia: pitch SC + BIX/CIMB as retail drawdown off Danum-style shelf; (3) Saudi: partner Tarmeez/Cenomi-type issuer as tech layer + Edaa/Wamid repo demo; (4) UAE: ADGM SPV + MoF/ADIB overflow (non-residents, SME tranches).

## 15. Risk Register

| Risk | Likelihood / Impact | Mitigation |
|---|---|---|
| Shariah board rejects code-as-contract | M / H | Code mirrors deed; scholar signs logic map |
| Token deemed separate prospectus | M / H | Digital-twin + CMSA/CMA filing |
| No secondary liquidity | H / M | Hold-to-maturity + Islamic-repo demo |
| Bank disintermediation fear | M / M | Position as SaaS, not issuer |

## 16. Startup Name Rationale

**JuzSukuk** — *juz'* (portion/part): fractional ownership in one word; instantly legible to Arabic/Malay/Urdu audiences; ownable brand.

## 17. Scores

- **Monetization clarity: 7/10** — fee stack obvious, demand proven; deduction for unproven retail WTP.
- **Regulatory friction: Bahrain 3 / Malaysia 4 / UAE 5 / Saudi 6** — see §4.

## 18. References

- ADIB–MoF T-Sukuk [2025](https://www.adib.ae/en/news/2025/nov/abu-dhabi-islamic-bank-and-uae-ministry-of-finance-launch-first-aed-denominated-sovereign-sukuk); WAM [2025](https://www.wam.ae/en/article/bmj5ay3-ministry-finance-signs-first-agreement-under); Gulf News [2026](https://gulfnews.com/gn-focus/digital-sukuk-opens-doors-to-everyday-investors-1.500524266)
- Khazanah/SC pilot [2026](https://www.sc.com.my/resources/media/media-release/khazanah-leads-malaysias-first-tokenised-sukuk-pilot-in-collaboration-with-the-sc); RAM [2026](https://www.ram.com.my/pressrelease/?prviewid=7271); BIX [2026](https://www.bixmalaysia.com/learning-center/articles-tutorials/how-malaysia-is-pioneering-tokenised-sukuk)
- SC tokenised products FAQ [2025](https://www.sc.com.my/regulation/regulatory-faqs/frequently-asked-questions-on-tokenised-capital-market-products)
- INABLR [2025](https://www.unlock23.com/inablr-middle-east-redefines-bahrains-legacy-of-financial-innovation-with-fractional-sukuk-advancements/); Fusang [2025](https://fusang.co/sukuk/ilsf-4-40-17sep2025); Tarmeez [2025](https://www.fintechweekly.com/magazine/articles/tali-ventures-invests-tarmeez-sukuk-fintech)
- White & Case GCC [2025](https://www.whitecase.com/insight-alert/islamic-finance-20-innovation-tokenisation-evolution-sukuk-markets-gcc) + products [2025](https://www.whitecase.com/insight-our-thinking/tokenised-islamic-finance-products-shariah-compliance-meets-digital-innovation); Saudi retail [2025](https://www.whitecase.com/insight-alert/saudi-domestic-retail-sukuk-practical-considerations-issuers-and-financial-advisors)
- OMFIF [2026](https://www.omfif.org/2026/07/tokenised-sukuk-the-missing-layer-in-emerging-sovereign-debt/); SettleMint [2026](https://www.settlemint.com/for/sukuk) + lifecycle [2026](https://www.settlemint.com/insights/sukuk-and-islamic-finance-on-a-lifecycle-platform)
- UAE RWA guide [2026](https://neoslegal.co/rwa-tokenization-guide/); Fitch [2026](https://www.fitchratings.com/research/islamic-finance/global-sukuk-market-enters-2026-with-strong-fundamentals-07-01-2026); Saudi Exchange repo [2026](https://www.saudiexchange.sa/Resources/fsPdf/2583_0_2026-03-30_12-34-39_En.pdf)
