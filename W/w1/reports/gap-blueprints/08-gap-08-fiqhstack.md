# Gap 08 — FiqhStack: AI Shariah-Compliance Layer (Screening API + SSB Workflow)

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

Developer-first API + internal GRC workflow doing (a) multi-standard equity/ETF/sukuk screening (business-activity 5% + financial ratios ~33% + purification/zakat outputs) and (b) SSB/Shariah-Committee/DPS paperwork automation: precedent retrieval (fatwa/RAG), product-submission checklists, SNC-event tracking, audit trail for BNM SGPD / UAE HSA / OJK-DSN-MUI regimes. Buyer: Islamic banks, windows, takaful, asset managers, brokers/robo-advisors embedding halal flags. Consumer screeners (Zoya, Musaffa) prove demand; gap is institutional workflow + multi-jurisdiction auditability, not another retail app. Pure B2B tech supplied exclusively to CBUAE-licensed FI does NOT trigger separate CBUAE licence under Federal Decree-Law 6/2025 Art.62 FAQs [2025](https://www.pinsentmasons.com/out-law/news/cbuae-guidance-technology-firms-regulation-shift).

## 2. Root Causes

- **Dual-layer burden:** secular prudential + continuous transaction-level Shariah proof; 40–60% of SSB review time is precedent search/paper-trail (single-vendor source, directional) [2025](https://blog.zeroh.io/the-shariah-compliance-bottleneck-nobody-talks-about-and-how-to-fix-it/).
- **Scholar bottleneck:** small elite pool, many board seats; manual review can't scale with digital Murabaha/wallet/algo straight-through processing [2025](https://blog.zeroh.io/the-shariah-compliance-bottleneck-nobody-talks-about-and-how-to-fix-it/).
- **Fragmentation:** Malaysia dual apex (BNM IFSA + SGPD stack; SC-SAC biannual lists, Maqasid Guidance) [2025](https://www.bnm.gov.my/publications/ar2025/ch1d); Indonesia DSN-MUI fatwas soft-law until OJK codifies, DPS capacity varies [2025](https://ojk.go.id/id/berita-dan-kegiatan/siaran-pers/Pages/Ijtima-Sanawi-2025.aspx); UAE HSA + Feb-2026 AI guidance (model risk, explainability, third-party AI) [2026](https://www.yuverse.ai/resources/posts/cbuae-ai-guidance-financial-institutions-explained).
- **Moving target:** SC Maqasid shift binary→welfare/ESG, RSAs must cite Maqasid [2026](https://www.allenandgledhill.com/perspectives/publications/bulletins-malaysia/2026/securities-commission-malaysia-issues-revised-guidelines-on-islamic-capital-market-products-and-services); AAOIFI GS-25 approved in principle, full texts subscription-gated [2025](https://aaoifi.com/announcement/aaoifi-governance-and-ethics-board-ageb-approves-in-principle-the-issuance-of-the-governance-standard-gs-25-principles-of-assessment-of-necessity-for-obtaining-conventional-reinsurance/?lang=en).
- **Spreadsheet back-office vs real-time front-end:** regulators demand proof code upholds riba/asset-backing/purification; silos fail audits [2025](https://www.finastra.com/viewpoints/articles/islamic-banking-scale-why-core-systems-are-now-deciding-factor).

## 3. Why It Has Not Been Filled

IdealRatings/FTSE + Bloomberg indicator serve large managers with enterprise SaaS + quarterly rebalance, not SSB workflow/RAG [2025](https://www.idealratings.com/islamic-finance-solutions/) [2025](https://www.bloomberg.com/company/press/bloomberg-and-idealratings-announce-sharia-compliant-indicator-for-sukuk-on-bloomberg-terminal/). Zoya GraphQL + sandbox and Musaffa REST (60k–120k tickers) optimise consumer UX, not audit evidence [2025](https://zoya.finance/api) [2025](https://musaffa.com/for-business/). Temenos/Finastra/Intellect embed contract math in core, not cross-standard screening [2025](https://www.temenos.com/products/islamic-banking/). Regulator labs (SC FIKRALab under CMM 2026–2030 [2026](https://www.thestar.com.my/business/business-news/2026/03/26/sc-launches-fikralab-to-drive-development-of-islamic-capital-market-products)) co-create but don't ship product. Trust + liability: fatwa can't be outsourced; DPS upskilling push proves automation must stay assistive [2025](https://mui.or.id/baca/berita/pra-ijtima-sanawi-ke-10-dsn-mui-tak-cuma-fikih-muamalah-dps-harus-upgrade-skill-industri-keuangan).

## 4. Feasibility Analysis

- **Technical:** feasible — versioned rule engine (SAC snapshots + AAOIFI deltas) + cited RAG over public summaries (no paywalled redistribution) + scholar approve/reject gate.
- **Shariah:** feasible as assistive-only with human sign-off, jurisdiction flag (MY-SAC vs AAOIFI vs DSN-MUI), purification math shown, no auto-fatwa copy.
- **Regulatory:** 4/10 as pure B2B infra (UAE Law 6/2025 FAQ exemption; no UAE horizontal AI Act; FI bears Feb-2026 AI burden). Mis-position as advisor/fatwa-issuer or B2C would spike to 8–9/10.
- **Market:** $5.98T assets, 72% banking [2025](https://www.lseg.com/en/data-analytics/islamic-finance/islamic-market-intelligence/islamic-finance-development-report-2025); IdealRatings enterprise + Zoya/Musaffa paid APIs prove budgets.

## 5. Viability Analysis

Tiered B2B: Dev API undercuts IdealRatings enterprise; GRC workflow per-seat; annual SSB pack. Anchors: IdealRatings SaaS/quarterly + purification [2025](https://www.idealratings.com/islamic-finance-solutions/); Zoya/Musaffa paid-live vs free-sandbox [2025](https://developer.zoya.finance/docs). Deduction: long bank procurement + scholar-sign-off caps automation premium.

## 6. Survivability Analysis

Moat: versioned multi-standard rule engine + cited RAG pack scholars actually sign + SNC log + Maqasid pronouncement drafts. Incumbent bundling (IdealRatings/Bloomberg/LSEG) is main threat — defend via workflow depth + FIKRALab co-creation credibility.

## 7. Competitor Mapping

| Player | Position | Gap |
|---|---|---|
| IdealRatings (+FTSE/LSEG, Bloomberg) | Institutional AAOIFI screens, indices, purification | No SSB/DPS workflow, enterprise price |
| Zoya API | 60k+ AAOIFI, ETF breakdowns | Retail/broker, no SNC pack |
| Musaffa API | 120k+ global, grades/purification | Breadth over governance |
| HalalTerminal/Muslim Xchange/Ailat | Multi-standard dev APIs | No scholar workflow |
| Temenos/Finastra/Intellect | Core contract logic | Core-bound, no screening |
| Amanah-type advisory firms | Human fatwa/structuring | Unscalable — partner channel |

## 8. Pivot Points

(a) Purification/zakat reporting API for funds; (b) sukuk covenant monitor (Bloomberg-indicator complement); (c) DPS micro-training + certification tracker (Indonesia); (d) Maqasid-ESG attestation pack for SC ICM funds.

## 9. Acquisition Positioning

IdealRatings/LSEG, Bloomberg, Temenos/Finastra/Intellect (SSB sidecar), Zoya/Musaffa (enterprise tier), Big-4/advisory rollups. [INFERENCE on fit.]

## 10. Zero/Near-Zero Cost MVP Architecture

Scope 6–8 wks: `POST /screen {ticker|ISIN, standard}` → {status, activity %, ratios, purification, as-of, sources}; `POST /ssb/pack` → submission PDF + SNC log + Maqasid template. Data free: SC SAC May/Nov PDFs (manual CSV first) [2025](https://www.sc.com.my/development/icm/icm-publications/list-of-shariah-compliant-securities); Bursa methodology; LSEG/IdealRatings methodology factsheets (rules only). Stack $0: Cloudflare Workers + D1 (SAC cache, audit log) + R2 (PDFs); HuggingFace sentence-transformers + pgvector via Supabase/Neon free (RAG over public docs); Next.js/Vercel Hobby dashboard; Resend free SNC alerts; GitHub Actions SAC-diff cron. Guardrails: read-only RAG with citations, on-device redaction option.

## 11. MVP Presentation Strategy

Demo: screen call → SSB pack PDF → SNC log. Narrative: "Cut submission→opinion cycle time; zero SNC findings." Metric: cycle-time reduction on pilot product.

## 12. Contact Targets

SC FIKRALab co-creation/Maqasid clinic [2026](https://fintechnews.my/57399/islamic-fintech/sc-malaysia-fikralab/); BNM IBW desks (Jan-2025 pressure); OJK Ijtima channel [2025](https://ojk.go.id/id/berita-dan-kegiatan/siaran-pers/Pages/Ijtima-Sanawi-2025.aspx); advisory co-sell (Amanah-type). Individual emails: NOT RETRIEVED.

## 13. Monetization Methods

Dev API $99–499/mo + per-1k overage; GRC $1.5–4k/mo per FI/window; annual SSB pack $10–25k/yr; purification/zakat add-on per fund.

## 14. GTM Strategy

MY→ID→UAE: FIKRALab pilot → 2 Islamic windows + 1 robo → co-sell via advisory/core vendors → Indonesia DPS-upskilling angle → UAE B2B-only contracts citing Law 6/2025 FAQ exemption to shorten procurement.

## 15. Risk Register

| Risk | L / I | Mitigation |
|---|---|---|
| Scholar liability (AI as fatwa) | H / H | Human sign-off + advisory endorsement |
| AAOIFI paywall redistribution | M / H | Rules-as-code + portal citations |
| SAC/DSN drift | H / M | Snapshot versioning |
| CBUAE/DIFC AI scrutiny on buyers | M / M | Explainability logs |
| Incumbent bundling | M / M | Workflow depth |

## 16. Startup Name Rationale

**FiqhStack** — *fiqh* (jurisprudence) + stack: dev-infra legible; ownable, SEO-clean.

## 17. Scores

- **Monetization: 8/10** — maps to existing screening/GRC/audit budgets.
- **Friction: 4/10** — pure B2B infra exempt; residual from multi-regime rule-packs.

## 18. References

- Bottleneck + checklist [2025](https://blog.zeroh.io/the-shariah-compliance-bottleneck-nobody-talks-about-and-how-to-fix-it/) [2025](https://blog.zeroh.io/the-81-point-shariah-compliance-checklist-every-islamic-finance-team-should-be-using/)
- BNM AR2025 [2025](https://www.bnm.gov.my/publications/ar2025/ch1d); Maqasid guidance; ICM guidelines [2026](https://www.allenandgledhill.com/perspectives/publications/bulletins-malaysia/2026/securities-commission-malaysia-issues-revised-guidelines-on-islamic-capital-market-products-and-services); SAC lists [2025](https://www.sc.com.my/development/icm/icm-publications/list-of-shariah-compliant-securities)
- FIKRALab [2026](https://www.thestar.com.my/business/business-news/2026/03/26/sc-launches-fikralab-to-drive-development-of-islamic-capital-market-products) [2026](https://fintechnews.my/57399/islamic-fintech/sc-malaysia-fikralab/)
- AAOIFI GS-25 [2025](https://aaoifi.com/announcement/aaoifi-governance-and-ethics-board-ageb-approves-in-principle-the-issuance-of-the-governance-standard-gs-25-principles-of-assessment-of-necessity-for-obtaining-conventional-reinsurance/?lang=en)
- DSN-MUI/DPS [2025](https://ojk.go.id/id/berita-dan-kegiatan/siaran-pers/Pages/Ijtima-Sanawi-2025.aspx); CBUAE FAQs [2025](https://www.pinsentmasons.com/out-law/news/cbuae-guidance-technology-firms-regulation-shift); CBUAE AI [2026](https://www.yuverse.ai/resources/posts/cbuae-ai-guidance-financial-institutions-explained)
- Zoya [2025](https://zoya.finance/api); Musaffa [2025](https://musaffa.com/for-business/); IdealRatings [2025](https://www.idealratings.com/islamic-finance-solutions/); Temenos [2025](https://www.temenos.com/products/islamic-banking/); Finastra [2025](https://www.finastra.com/viewpoints/articles/islamic-banking-scale-why-core-systems-are-now-deciding-factor)
- IFDI [2025](https://www.lseg.com/en/data-analytics/islamic-finance/islamic-market-intelligence/islamic-finance-development-report-2025)
