# Gap 07 — SiratRemit: Shariah-Screened Stablecoin Remittance (Conditional)

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

Fiat-in → screened fiat-backed stablecoin settlement → fiat-out, sender/receiver see only fiat, stablecoin settles in minutes at <1% all-in, with Shariah layer: (1) 1:1 fiat-backed allowlist (never algo/privacy), (2) reserve-riba firewall + purification, (3) SSB veto/attestation per corridor, (4) licensed on/off-ramps. Wedge: GCC → South Asia migrant corridors where legacy costs 5–6%+ and settlement multi-day. Global avg $200 remittance ~6.36% vs SDG 3% target; banks ~14.99%; digital MTOs ~3.54% [2026](https://remittanceprices.worldbank.org/sites/default/files/2026-04/RPW_main_report_and_annex_Q325.pdf). Stablecoin X-border $135B +64% YoY 2025 [2026](https://www.allium.so/reports/stablecoins-cross-border-payments-2026).

> RETENTION FLAG: friction 9/10 — build ONLY as rented-rails single-corridor pilot; no issuance/custody/licence day-1.

## 2. Root Causes

- **Legacy cost:** Gulf–South Asia all-in 2–5%+ multi-day SWIFT chains [2025].
- **Crypto-ambiguity:** MUI: crypto-as-currency haram; as commodity only if tangible underlying [2025](https://fatwamui.com/storage/614/HUKUM-CRYPTOCURRENCY.pdf); LPS: "non-halal" [2025](https://jakartaglobe.id/business/crypto-is-nonhalal-indonesias-lps-boss-says). No unified AAOIFI stablecoin standard — exposure drafts only.
- **Reserve-riba trap:** USDT/USDC reserves = T-bills generating riba; transactional-use permissible if holder takes no interest — needs screening + purification [2025](https://4irelabs.com/articles/shariah-compliant-defi/).
- **Fragmented perimeter:** CBB SIO Jul-2025 (single-currency fiat-backed only, B.S.C. + BHD 250k + 1:1 + redemption) [2025](https://www.cbb.gov.bh/media-center/central-bank-of-bahrain-issues-framework-for-regulating-stablecoin-issuance/); ADGM FRT distinct activity [2025](https://www.adgm.com/media/announcements/proposed-regulatory-framework-for-the-issuance-of-fiat-referenced-tokens); DFSA eff. 12 Jan 2026 [2026](https://www.dfsa.ae/news/dfsa-publishes-crypto-token-faqs-support-implementation-updated-regulatory-framework); VARA Cat-1 licence [2026](https://cryptoslate.com/crypto-laws/vara-virtual-asset-issuance-rulebook/); Pakistan PVARA Ordinance Jul-2025 → Act Mar-2026, 10 licences, 5yr/PKR 50m penalties [2026](https://www.frasatpartners.com/articles/pvara-pakistan-virtual-assets-regulatory-authority-complete-legal-guide-2026).
- **Off-ramp bottleneck:** South Asian capital controls; true X-border retail = single-digit % of on-chain trillions.

## 3. Why It Has Not Been Filled

Fatwa risk aversion (no one mass-markets "halal stablecoin" while MUI/LPS label standard crypto non-halal); B2B bias (Endl = payouts to 160+ countries, $1.5m pre-seed 2026 [2026](https://www.business-standard.com/content/press-releases-ani/fintech-platform-endl-secures-1-5-million-dollar-investment-to-scale-global-payment-infrastructure-126021300860_1.html), not retail halal UX; Fasset = savings-led super-app + Labuan provisional Islamic-bank [2025](https://thedigitalbanker.com/fasset-secures-provisional-banking-license-to-become-worlds-first-stablecoin-powered-islamic-bank), not corridor remittance; Fusang = sukuk venue). Licence cost forces rent-don't-own. Trust UX gap: migrants need fiat-abstracted wallets + per-transfer halal receipt in Urdu/Hindi/Bengali/Tagalog.

## 4. Feasibility Analysis

- **Technical:** feasible — orchestration + screening + fiat abstraction on rented rails; USDC-only allowlist; testnet (Stellar/XRPL/Circle faucet) MVP.
- **Shariah:** feasible narrowly — transactional-use position + SSB per-corridor comfort letter + purification calculator + multisig token-add veto.
- **Regulatory:** 9/10 hard — multi-licence (CBB/ADGM/DFSA/VARA + PVARA + SBP CMA plumbing); VARA 2026 active enforcement; unlicensed PK = criminal. Only path: partner VASP + bank CMA, one corridor (UAE→Pakistan).
- **Market:** GCC outward >$130B, GCC–India >$56B; sandwich <1% vs 2–5% legacy [2026](https://www.spark.money/research/crypto-remittance-corridor-economics).

## 5. Viability Analysis

0.7% flat + 20–30bp FX (still ~1/5th bank avg); B2B2C white-label; T+0 Wakalah-sukuk sweep (Fasset pattern); screening API; purification-pool fee. Needs volume on $200 tickets; cannot monetize interest — fee/wakalah only.

## 6. Survivability Analysis

Moat: corridor SSB fatwa letters + published purification ledger + cheapest compliant landed-cost proof (World Bank RPW methodology). Fasset/Ajman MoU pattern [2025](https://www.ajmanbank.ae/site/newsdetail/fasset-and-ajman-bank-sign-landmark-mou-to-launch-shariah-compliant-stablecoins-and-tokenized-assets) shows bank-stack consolidation risk — defend via corridor depth.

## 7. Competitor Mapping

| Player | Position | Gap |
|---|---|---|
| Endl (500 Batch 9) | B2B payouts 160+ countries | No retail halal/SSB layer |
| Fasset (+Labuan Islamic-bank) | Stablecoin super-app, Wakalah savings→Fusang sukuk | Savings-led, not corridor remittance |
| Fusang | IILM tokenized sukuk venue | Infrastructure, not remittance |
| MTOs/hawala/P2P OTC | Cost base | Not screened/stablecoin |

## 8. Pivot Points

(a) B2B mass-payout API for Gulf SMEs; (b) halal screening-oracle API for VASPs; (c) Wakalah micro-savings into tokenized sukuk if margin thins.

## 9. Acquisition Positioning

Fasset/Ajman Bank stack, LuLu Financial/exchange houses, Endl (halal-retail layer), super-apps (Careem Pay, JazzCash parents). [INFERENCE.]

## 10. Zero/Near-Zero Cost MVP Architecture

No issuance/custody/licence. Expo RN or Next.js PWA (fiat-only UI, hides hashes) + Supabase (users, quotes, screening, purification ledger) + Cloudflare Workers quote cache + Sumsub/Onfido sandbox + Chainalysis/TRM sandbox + partner VASP/bank-CMA rails (Stellar/XRPL/Circle testnet + Tron Nile demo) + `fatwa_rules` table + `screen_transfer` Edge Function + public `/halal-proof/{id}` page + partner payout sandbox (JazzCash/Easypaisa) or manual OTC ledger. Pilot: 100 UAE→PK $50–200 transfers, <1% fee, <10min, 100% halal receipts.

## 11. MVP Presentation Strategy

Demo: fiat send → halal receipt (token, reserve-hash, purification paisa, SSB ref) → fiat receive. Narrative: "Western Union price ÷ 5, with a fatwa receipt." Metric: 500 transfers/mo before Bangladesh lane.

## 12. Contact Targets

VARA-licensed distributors; PK CMA partner banks; 500 Global/Sanabil network intros to Endl/Fasset as rails. Individual emails: NOT RETRIEVED.

## 13. Monetization Methods

Flat + FX spread; white-label per-seat; Wakalah-sweep profit-share; screening API; purification handling fee (capped, disclosed).

## 14. GTM Strategy

90 days ~$0: one corridor UAE→Pakistan via one VARA distributor + one PK CMA partner; 5 mosque/labour-camp champions (Jummah demos, WhatsApp referral); Urdu TikTok/Shorts fiat-UX + scholar Q&A + live receipt.

## 15. Risk Register

| Risk | L / I | Mitigation |
|---|---|---|
| Fatwa reversal widens haram label | M / H | USDC-only + SSB kill-switch |
| VARA/PVARA enforcement on partner lapse | M / H | Dual-partner redundancy |
| USDC depeg/reserve headline | L / H | Daily attestation pin |
| Off-ramp freeze (capital controls) | M / H | Segregated CMAs |
| P2P taint (Tron/USDT) | M / M | Pre-screen, allowlist |

## 16. Startup Name Rationale

**SiratRemit** — *sirat* (path, straight way): the compliant path for money home; remit explicit; ownable.

## 17. Scores

- **Monetization: 7/10** — corridor math crisp; deduction for ticket-size/volume + no-interest constraint.
- **Friction: 9/10** — multi-licence + MUI/LPS labels + no AAOIFI final standard (+2 ambiguity penalty). Rented-rails pilot only.

## 18. References

- CBB SIO [2025](https://www.cbb.gov.bh/media-center/central-bank-of-bahrain-issues-framework-for-regulating-stablecoin-issuance/) [2025](https://muhami.ae/articles/how-bahrains-stablecoin-regulation-differs-from-ot/); ADGM [2025](https://www.adgm.com/media/announcements/proposed-regulatory-framework-for-the-issuance-of-fiat-referenced-tokens); DFSA [2026](https://www.dfsa.ae/news/dfsa-publishes-crypto-token-faqs-support-implementation-updated-regulatory-framework); VARA [2026](https://cryptoslate.com/crypto-laws/vara-virtual-asset-issuance-rulebook/); Gibson Dunn guide [2026](https://www.gibsondunn.com/wp-content/uploads/2026/03/global-stablecoin-rules-in-focus-a-cross-border-guide-to-the-new-era-of-stablecoin-regulation.pdf)
- Endl [2026](https://www.business-standard.com/content/press-releases-ani/fintech-platform-endl-secures-1-5-million-dollar-investment-to-scale-global-payment-infrastructure-126021300860_1.html); Fasset [2025](https://thedigitalbanker.com/fasset-secures-provisional-banking-license-to-become-worlds-first-stablecoin-powered-islamic-bank); Ajman MoU [2025](https://www.ajmanbank.ae/site/newsdetail/fasset-and-ajman-bank-sign-landmark-mou-to-launch-shariah-compliant-stablecoins-and-tokenized-assets)
- MUI fatwa [2025](https://fatwamui.com/storage/614/HUKUM-CRYPTOCURRENCY.pdf); LPS [2025](https://jakartaglobe.id/business/crypto-is-nonhalal-indonesias-lps-boss-says); PVARA [2026](https://www.frasatpartners.com/articles/pvara-pakistan-virtual-assets-regulatory-authority-complete-legal-guide-2026)
- World Bank RPW [2026](https://remittanceprices.worldbank.org/sites/default/files/2026-04/RPW_main_report_and_annex_Q325.pdf); Allium [2026](https://www.allium.so/reports/stablecoins-cross-border-payments-2026); screening [2025](https://4irelabs.com/articles/shariah-compliant-defi/)
