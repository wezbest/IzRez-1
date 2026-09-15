# Gap 05 — WaqfTrace: Zakat/Waqf Transparency + Fractional Waqf

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

Verifiable donor-facing audit rail for zakat/sadaqah/waqf (who gave, where it went, yield, Shariah audit) + fractional participation in cash-waqf / waqf-yield without violating perpetuity (*ta'bid*). Two jobs: (a) transparency-as-trust — receipt-to-impact trace, nazhir/amil scorecards; (b) fractionalization-as-access — IDR 1m / RM10 / SAR 50 tickets into CWLS-like or waqf-property yield streams, hash-anchored audit trail.

## 2. Root Causes

- **Trust deficit → informal bypass:** transparency correlates with collection; many Indonesian amil units rate less/moderately transparent; Malaysia debates distribution bottlenecks [2025 synthesis].
- **Fragmented admin:** Indonesia BAZNAS + hundreds LAZ under Law 23/2011; Malaysia state-by-state MAIN boards; Saudi centralized GAA but closed e-portal [2025](https://awqaf.gov.sa/en/services).
- **Waqf economics:** prime real estate needs lump sums; corpus perpetuity bars equity-sale tokens unless yield-right SPV/trust wrapper; no unified Smart Waqf standard.
- **Tech gap:** collection digitized (BAZNAS digital >50-60% tx counts; PPZ-MAIWP portal + IRB e-receipts) but traceability not; blockchain zakat pilots ("Zakat 4.0") remain papers/pilots [2025](https://www.atlantis-press.com/proceedings/icast-ss-25/126020628).
- **Dormant capital:** Indonesia cash-waqf potential IDR 180-181T/yr vs realized ~IDR 2.2-3.5T [2025](https://timesindonesia.co.id/english/487662/indonesias-cash-waqf-potential-hits-idr180-trillion); Saudi supervised waqf >SAR 342B but managed-fund returns only SAR 1.58B since inception [2026](https://awqaf.gov.sa/en/media-center/news/feb43d3d-6874-4f64-b26d-0c9a9dad0b08).

## 3. Why It Has Not Been Filled

Triple-compliance (property + securities + Shariah); token ≠ title deed (needs SPV/nazhir/custodian/auditor); incumbents monetize float and resist scrutiny; UX/privacy hard (mustahik dignity/PDPA, ZK-proofs roadmap). Malaysia SC Consultation 1/2025 (6 May 2025) covers only digital-twin tokens, no waqf safe harbor [2025](https://www.sc.com.my/api/documentms/download.ashx?id=5a9a10e2-5872-4b48-9ea3-5b9635cc5179). Result: GlobalSadaqah/Ethis stop at crowdfunding [2025](https://ethis.co/); GAA/BAZNAS/PPZ stay single-institution silos.

## 4. Feasibility Analysis

- **Technical:** feasible — non-custodial overlay referencing existing money (receipts, CWLS SWR holdings), nightly Merkle anchor on Polygon Amoy testnet (free).
- **Shariah:** feasible — income-rights-only tokens, temporary cash-waqf template (Awqaf NZ model [2025](https://www.awqafnz.org/en/about.html), ISRA-reviewed) + DSN-MUI/SAC fatwa.
- **Regulatory:** Indonesia 7/10, Malaysia 6/10, Saudi 8/10 — v1 hash-anchor only (no issuance) keeps it legal everywhere; v2 needs OJK sandbox + BWI nazhir cert / SC digital-twin path.
- **Market:** BAZNAS Rp50T 2025 target [2025](https://inp.polri.go.id/artikel/baznas-sets-2025-zakat-collection-target-at-rp-50-trillion); PPZ-MAIWP RM1.216B target [2025](https://bernama.com/en/news.php?id=2385620); retail CWLS IDR 1m via BSI/Muamalat to SWR006 [2025](https://www.bankmuamalat.co.id/index.php/en/investments/cash-waqf-linked-sukuk).

## 5. Viability Analysis

Nazhir SaaS (IDR 500k-3jt / RM300-1.5k /mo) + 0.5-1.5% placement on CWLS/CWLD/CSR flows (bank stays distributor, never custody) + Gold/Platinum audit-prep reports (Waqfa-compatible [2025](https://waqfa.pro/)). Indonesia headroom largest (Rp50T + IDR 180T potential).

## 6. Survivability Analysis

Moat: multi-institution neutrality + Waqfa-seal interoperability + CWLS-tracker distribution. State in-house build risk — defend via cross-LAZ/MAIN benchmarking no single body offers.

## 7. Competitor Mapping

| Player | Position | Gap |
|---|---|---|
| Waqfa | Bronze→Platinum seals, audit trails | No payments/issuance — build on it |
| Awqaf NZ | Temp cash-waqf, Smart Waqf Fund | NZ-scale model lab, no SaaS |
| GlobalSadaqah/Ethis | Donation crowdfunding + ECF | No receipt-to-impact ledger |
| GAA e-services / BAZNAS SiMBA / PPZ portal | Internal verification/collection | Single-silo, not composable |
| CWLS/SWR retail | State-guaranteed cash-waqf sukuk | Sovereign-only, no private fractional |

## 8. Pivot Points

(a) Pure B2B Shariah-audit SaaS (SiMBA/PPZ plug-in); (b) white-label CWLS tracker for BSI/Bank Islam/Al Rajhi CSR; (c) UNDP-IsDBI microfinance rail — waqf yield into mudarabah microloans [2025](https://gifiip.org/wp-content/uploads/2025/09/FINTECH-Report-2024-v9-2.pdf).

## 9. Acquisition Positioning

Ethis Group, BSI/Muamalat/Bank Islam, GAA-licensed mutawallis, IsDBI/GIFIIP partners, audit networks. [INFERENCE.]

## 10. Zero/Near-Zero Cost MVP Architecture

One nazhir + one campaign + one CWLS tracker, no issuance. Next.js/Vercel Hobby + Supabase Free (orgs, campaigns, receipts, disbursements, attestations) + Pinata IPFS free (audit PDFs) + GitHub Actions nightly Merkle anchor to Amoy + Cloudflare Workers CSV importer + manual nazhir-license/scholar-letter intake rendered as Bronze/Silver/Gold checklist. PII off-chain; hashes + aggregates on-chain. $0 infra.

## 11. MVP Presentation Strategy

Demo: donor receipt → impact timeline → nazhir scorecard → PDF audit pack + tx-hash proof. Narrative: "Copy CWLS (only proven retail waqf security), earn trust via free transparency before asking issuance permission."

## 12. Contact Targets

NextIF accelerator [2026](https://www.nextif.org/accelerator); SC FIKRALab [2026](https://www.sc.com.my/fikra-ace); BWI/BAZNAS via IsDBI toolkit channel [2025](https://isdbinstitute.org/islamic-microfinance-toolkits-isdb/). Individual emails: NOT RETRIEVED.

## 13. Monetization Methods

SaaS → placement/introduction (0.5-1.5%) → audit-prep/benchmarking → (later) tokenization structuring + registry fee. Shariah: service/placement fees, never corpus carry.

## 14. GTM Strategy

Indonesia-first: 1 university waqf nazhir + 1 LAZ branch (free Silver checklist) → public SWR tracker + zakat timeline → BSI/Muamalat CSR + campus mosques. Malaysia: one state board (PPZ-MAIWP YEZ-style) + Ethis/GlobalSadaqah channel. Saudi: verification overlay to GAA mutawalli via local partner, UNDP-GAA excellence-index narrative.

## 15. Risk Register

| Risk | L / I | Mitigation |
|---|---|---|
| Securities reclassification | M / H | v1 hash-only, non-transferable SBT |
| Fiqh rejection (ta'bid) | M / H | Income-rights-only + fatwa |
| Title oracle failure | M / H | SPV/trust + dual-record (digital-twin) |
| Mustahik PII breach | M / H | Hashes/aggregates on-chain only |
| State capture | M / M | Neutrality + Waqfa interop |

## 16. Startup Name Rationale

**WaqfTrace** — literal function as brand; English-global, SEO-clean, trust-forward.

## 17. Scores

- **Monetization: ID 8 / MY 7 / SA 6.**
- **Friction: ID 7 / MY 6 / SA 8.** Non-custodial entry keeps all three workable.

## 18. References

- GAA returns [2026](https://awqaf.gov.sa/en/media-center/news/feb43d3d-6874-4f64-b26d-0c9a9dad0b08); assets [2025](https://www.undp.org/saudi-arabia/press-releases/consultation-and-validation-workshop-awqaf-excellence-index-held-riyadh); e-services [2025](https://awqaf.gov.sa/en/services); Waqfa [2025](https://waqfa.pro/); Awqaf NZ [2025](https://www.awqafnz.org/en/about.html)
- BAZNAS target [2025](https://inp.polri.go.id/artikel/baznas-sets-2025-zakat-collection-target-at-rp-50-trillion); PPZ [2025](https://bernama.com/en/news.php?id=2385620); cash-waqf potential [2025](https://timesindonesia.co.id/english/487662/indonesias-cash-waqf-potential-hits-idr180-trillion); CWLS [2025](https://www.bankmuamalat.co.id/index.php/en/investments/cash-waqf-linked-sukuk)
- SC consultation [2025](https://www.sc.com.my/api/documentms/download.ashx?id=5a9a10e2-5872-4b48-9ea3-5b9635cc5179); Ethis [2025](https://ethis.co/); GIFIIP [2025](https://gifiip.org/wp-content/uploads/2025/09/FINTECH-Report-2024-v9-2.pdf); IsDBI toolkits [2025](https://isdbinstitute.org/islamic-microfinance-toolkits-isdb/)
