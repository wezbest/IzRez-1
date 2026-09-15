# Gap 06 — AdlScore: Shariah P2P Crowdfunding + AI Credit Scoring

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

Two-sided marketplace where retail/institutional funders crowd-fund SME working capital via Murabaha/Wakalah/Musyarakah-Mudarabah, with AI alternative-credit-score for thin-file borrowers (e-wallet, e-commerce, telecom, accounting feeds). 100% asset-backed, DPS-supervised, retail-accessible, score-driven — distinct from interest-based P2P and bank Islamic windows.

## 2. Root Causes

- **Religious exclusion:** 32–35% MENA SMEs demand Shariah products; preference >90% in Saudi Arabia [2026 retrieval](https://www.ifac.org/knowledge-gateway/discussion/islamic-finance-opportunity-sme-financing).
- **Deficit scale:** MENA Islamic SME gap $8.6–13.2B [2026](https://arabianbusiness.com/business/13-2bn-gap-for-islamic-sme-financing-554112); Indonesia MSME deficit >$230B.
- **Thin-file:** cash-economy SMEs lack collateral/audited/bureau footprint; blind P2P spikes defaults [2025](https://www.povertyactionlab.org/blog/3-21-24/using-alternative-data-and-artificial-intelligence-expand-financial-inclusion-evidence).
- **New-rail high bar:** Indonesia POJK 40/2024 + SEOJK 19/2025 (UUS, DPS+DSN-MUI, IDR 25B capital, 5-tier quality) [2025](https://www.bakermckenzie.com/en/insight/publications/alerts/2025/08/indonesia-ojk-issues-seojk-19-2025-sharpening-p2p-oversight) [2025](https://ojk.go.id/id/regulasi/Pages/SEOJK-19-SEOJK06-2025-Penyelenggaraan-LPBBTI.aspx); OJK Reg 29/2024 licenses Alternative Credit Scoring (IDR 5B, local DC) [2025](https://www.arma-law.com/news-event/newsflash/ojk-sets-regulatory-framework-for-alternative-credit-scoring).
- **Saudi parallel:** CMA sukuk-via-crowdfunding SAR 1.5B (2023)→3.4B (2024), 17 permits; permanent arranger framework Sep 2025 [2025](https://saudigazette.com.sa/article/654814/SAUDI-ARABIA/CMA-allows-crowdfunding-of-debt-instruments-through-institutions-licensed-for-arranging-activities) [2025](https://www.spa.gov.sa/en/N2393257).

## 3. Why It Has Not Been Filled

ALAMI/Hijra (supply-chain + bank upsell), Ammana (micro/BMT), Ethis/Nusa Kapital (property), Beehive (GCC term finance, $1B+ at <1% default [2025](https://www.beehive.ae/statistics)), Qardus/Nester (UK diaspora/property) — none offers portable score-as-service + multi-contract working-capital engine. Shariah-ops cost (DPS + commodity leg, e.g. Beehive via Eiger [2025](https://www.beehive.om/islamic-finance)) deters generic P2P. Indonesia TWP90 hit 4.33% Nov 2025 on IDR 94.85T outstanding [2025](https://en.tempo.co/read/2079233/indonesias-fintech-lending-reaches-rp94-85-trillion-as-default-rate-rises) vs Beehive 0.25% 2024 — scoring + closed-loop collection is the differentiator.

## 4. Feasibility Analysis

- **Technical:** feasible — consented CSV upload v1 (no paid open-banking), sklearn/LightGBM + SHAP explainability, shadow-score 3 months pre-pricing.
- **Shariah:** feasible — Murabaha promise+wakalah PDFs (DocuSeal self-host), supplier-invoice novation pending Eiger-type leg, DPS revenue-share.
- **Regulatory:** HARD as de-novo licence; feasible as UUS-partner / arranger-rider tech provider (no balance sheet).
- **Market:** ALAMI 12–17% funder yields leave spread [2025](https://alamisharia.co.id/en/); CMA SAR 3.4B flow proves demand.

## 5. Viability Analysis

3% arrangement + 1.5% p.a. servicing + 15% wakalah share of funder profit + per-call score API. Proof: Beehive $1B durability; ALAMI yields. Minus 2 for rate caps + DPS cost.

## 6. Survivability Analysis

Moat: closed-loop deduction + score-API + multi-contract engine across corridors. ALAMI licence + bank moat is Indonesia-only; Beehive GCC-only — cross-corridor portability wins.

## 7. Competitor Mapping

| Player | Position | Gap |
|---|---|---|
| ALAMI/Hijra | OJK sharia P2P, TKB90 97.62% | No open score-API, ID-only |
| Ethis/Nusa Kapital | SC-regulated, 9–14% property | Not working-capital scoring |
| KapitalBoost | SG/ID Murabaha PO finance | Subscale, no scoring product |
| Beehive | DFSA/FSA, Murabaha-via-Eiger, $1B+ | GCC-only term finance |
| Qardus / Nester | UK SME/property | HNW-only / property-only |

## 8. Pivot Points

(a) Pure B2B score-API (ACS licence only); (b) single-anchor Wakala invoice factoring; (c) UK-GCC diaspora property bridge if SME NPF blows; (d) DPS-reporting SaaS.

## 9. Acquisition Positioning

ALAMI/Hijra, Ethis/HASAN.VC, Beehive, Saudi CMA arrangers, BSI/Al Rajhi/DIB, Gatehouse/Al Rayan UK. Timing: after shadow-score vs TWP90 benchmark + 50-warung pilot.

## 10. Zero/Near-Zero Cost MVP Architecture

Single corridor (ID Java warung restock ≤IDR 50jt, 30–90d) + funder web app. Next.js/Vercel free + Supabase + FastAPI scoring microservice (Render/Fly free) + manual-upload features + WhatsApp Cloud nudges + Metabase dashboards for quality-tier reporting + Tesseract OCR. Operate as tech provider to licensed UUS — revenue-share, no licence.

## 11. MVP Presentation Strategy

Demo: warung CSV → score → funded Murabaha → collected. Narrative: "Sell default-rate reduction, not religion." Proof: shadow-score vs TWP90 + Beehive-comp chart.

## 12. Contact Targets

OJK ITSK portal [2025](https://ojk.go.id/en/fungsi-utama/itsk/regulatory-sandbox/default.aspx); SC SARANA [2025](https://www.sc.com.my/sarana); SECP sandbox (sandbox@secp.gov.pk). Individual emails: NOT RETRIEVED.

## 13. Monetization Methods

Origination + servicing + wakalah profit-share + score-API per-call + Saudi white-label SaaS. Late fees Shariah-capped (ta'widh/charity-routing).

## 14. GTM Strategy

90 days ~$0: 1 UUS/koperasi + 1 DPS scholar → 50 warung via pesantren/BMT + 1 FMCG distributor closed-loop → 200 diaspora funders (9–14% story) → publish benchmark → CMA sandbox copy.

## 15. Risk Register

| Risk | L / I | Mitigation |
|---|---|---|
| TWP90 contagion (4.33%) | H / H | Closed-loop + score gate |
| DPS rejects scoring-priced markup | M / H | Pre-approved templates |
| PDP/data-sovereignty breach | M / H | Local DC, consent ledger |
| Licence capital wall | H / M | Partner-rider, no de-novo |

## 16. Startup Name Rationale

**AdlScore** — *adl* (justice): fair credit; score-as-product explicit; cross-lingual, ownable.

## 17. Scores

- **Monetization: 8/10** — take-rate + float/wakala + SaaS; proven spreads.
- **Friction: 8/10 (hard)** — dual licence (P2P IDR 25B + ACS IDR 5B) + CMA/FCA perimeters; newcomer must partner.

## 18. References

- POJK/SEOJK [2025](https://snlaw.id/insights/indonesia-digital-lending-compliance-2026) [2025](https://www.bakermckenzie.com/en/insight/publications/alerts/2025/08/indonesia-ojk-issues-seojk-19-2025-sharpening-p2p-oversight) [2025](https://ojk.go.id/id/regulasi/Pages/SEOJK-19-SEOJK06-2025-Penyelenggaraan-LPBBTI.aspx); ACS [2025](https://www.arma-law.com/news-event/newsflash/ojk-sets-regulatory-framework-for-alternative-credit-scoring)
- CMA [2025](https://saudigazette.com.sa/article/654814/SAUDI-ARABIA/CMA-allows-crowdfunding-of-debt-instruments-through-institutions-licensed-for-arranging-activities) [2025](https://www.spa.gov.sa/en/N2393257)
- ALAMI [2025](https://alamisharia.co.id/en/); Beehive [2025](https://www.beehive.om/islamic-finance) [2025](https://www.beehive.ae/statistics); TWP90 [2025](https://en.tempo.co/read/2079233/indonesias-fintech-lending-reaches-rp94-85-trillion-as-default-rate-rises); thin-file AI [2025](https://www.povertyactionlab.org/blog/3-21-24/using-alternative-data-and-artificial-intelligence-expand-financial-inclusion-evidence)
