# OKX Agentic Hackathon: event and actual scoring workbook

## What does the supplied workbook actually score?

### Takeaway
The supplied spreadsheet has six weighted categories, and its actual Scorecard contains 24 rated fields. Per user instruction this workbook takes priority over the public website, but the workbook contains an internal criteria/scorecard mismatch and labels itself a suggested starting point rather than an official sponsor rubric.

### Cited Findings
Read 2026-10-15 via unauthenticated CSV exports of all three tabs, plus XLSX formula inspection. Source: [user workbook](https://docs.google.com/spreadsheets/d/18YMghoLRhF_qbtGszXGcLeGuhwEj8HjktHZj9VXWCoM/edit).

|Category|Weight|Actual Scorecard fields (each rated 1–5)|
|---|---:|---|
|Agentic Design|20%|Autonomy; Reasoning & tool use; Safety & guardrails; On-chain agency|
|Technical Execution|15%|Working product; Architecture & code; Technical difficulty; Security|
|Avalanche Integration|10%|Deployed on Avalanche; Uses Avalanche strengths; On-chain logic central; Why Avalanche|
|OKX Integration|10%|Uses OKX tooling; Integration depth; OKX.AI listing-ready; Market data / liquidity|
|Innovation & Real-World Value|25%|Originality; Problem & user; Market potential; Post-hack viability|
|Demo & Presentation|20%|Live demo; UX; Documentation; Pitch & Q&A|

All table entries: [Scorecard tab](https://docs.google.com/spreadsheets/d/18YMghoLRhF_qbtGszXGcLeGuhwEj8HjktHZj9VXWCoM/edit#gid=2072538089).

Criteria tab separately lists the following point descriptions, which do NOT match equal four-field Scorecard averaging: Agentic autonomy 10 + reasoning/tool use 10; technical working deployed product 5 + architecture 5 + difficulty 5; Avalanche C-Chain or Avalanche L1 deployment 5 + strengths (fast finality/custom L1/interchain messaging) 5; OKX tooling (Onchain OS/ATK/Wallet/DEX APIs) 5 + could list service on OKX.AI 5; innovation originality 10 + problem/target user 5 + market/business model 5 + ready-to-market 5; demo live 5 + UX5 + pitch/Q&A10. [Criteria tab](https://docs.google.com/spreadsheets/d/18YMghoLRhF_qbtGszXGcLeGuhwEj8HjktHZj9VXWCoM/edit#gid=167640646).

XLSX inspection verified AA5:AF5 average each set of 4 inputs; AG5 requires all 24 ratings, then multiplies category means by Criteria B2:B7 weights and normalizes by sum. It returns Incomplete with fewer than 24 ratings. Thus current formulas give originality one quarter of the 25% innovation weight, NOT the 10-point annotation in Criteria. Example row scores 3.75/5. [Workbook export](https://docs.google.com/spreadsheets/d/18YMghoLRhF_qbtGszXGcLeGuhwEj8HjktHZj9VXWCoM/export?format=xlsx).

Workbook disclaimer says weights and criteria are a suggested starting point rather than official sponsor rubric; instructions also suggest possible 5–10% track-dependent weight moves. This does not override user's insider-source instruction, but prevents representing the document as independently confirmed final official rules. [Criteria tab](https://docs.google.com/spreadsheets/d/18YMghoLRhF_qbtGszXGcLeGuhwEj8HjktHZj9VXWCoM/edit#gid=167640646).

### Inferences
- Optimize against union of Criteria and Scorecard requirements, with stable category weights; don't claim precise subcriterion points are settled.
- Build genuine onchain agency, constrained tool execution, clear target customer, a plausible reusable OKX.AI service, documentation, and actual live UX. An Avalanche transaction log alone weakly addresses central onchain logic.

### Gaps
- Cannot verify which conflicting subcriterion scheme judges will actually use or whether template disclaimer is stale. No need to block research: use user's selected workbook and visibly disclose the discrepancy.

## What are eligibility and delivery requirements?

### Takeaway
Workbook ranking requires all four gates: public repository, working demo, deployment on Avalanche, and use of an OKX tool. This makes Avalanche an eligibility requirement under the user's preferred source despite public sites calling it optional bonus.

### Cited Findings
- Leaderboard has Yes/No gates for Public repo, Working demo, Deployed on Avalanche, Uses an OKX tool. F5 formula ANDs the four gates; J5 returns Not eligible if any fail. Ranking averages judges' weighted scores; equal scores favor higher Agentic Design average. [Leaderboard](https://docs.google.com/spreadsheets/d/18YMghoLRhF_qbtGszXGcLeGuhwEj8HjktHZj9VXWCoM/edit#gid=743594524).
- Criteria names C-Chain or Avalanche L1 deployment; no requirement to build own L1. Acceptable OKX tools explicitly include Onchain OS, ATK, Wallet/DEX APIs. [Criteria](https://docs.google.com/spreadsheets/d/18YMghoLRhF_qbtGszXGcLeGuhwEj8HjktHZj9VXWCoM/edit#gid=167640646).
- Public organizer site calls ATK agent the mandatory task and trading/Avalanche deployment optional bonuses; public scoring 35% autonomy,25% product/strategy,20% technical,20% demo differs from workbook. [Official site](https://agentichackathon.team1.network/tr); [community guide](https://agentic-ankara.vercel.app).

### Inferences
- Prefer ATK plus meaningful Avalanche function to satisfy both source interpretations; workbook technically permits other OKX tooling too.
- Demo submission bundle should include public repo, running deployed UI/backend, Avalanche contract address + explorer tx, setup/readme, sample scenario, tool-call traces, fallback recording; last details are recommendation, not published mandatory submission format.

### Gaps
- Public pages don't settle testnet eligibility, required demo trading capital, team-size limits, pre-existing code rules, IP/license requirements, exact file/video submission format, or ATK-versus-other-OKX-tool acceptance. Record as unknown, do not invent.

## What event logistics and conflicts matter now?

### Takeaway
Event is 17 October 2026 in Ankara; official organizer site currently says applications closed. Production runs 10:00–19:00; team ability/context from user permits a substantial hackathon-sized MVP but not a month-long platform.

### Cited Findings
- Official event: OKX TR and Team1 Türkiye, Avalanche ecosystem partnership; THK Orion Tekmer, Söğütözü Ankara; 50 selected participants. Registration08:00; opening09:00; ATK×Avalanche workshop09:30; production10:00; mentoring13:00; submission19:00; finalist presentations20:00 (10 teams,10min each); awards21:45. Prizes$1500/$1000/$500. [Official organizer page](https://agentichackathon.team1.network/tr).
- At retrieval official hero and application section both say applications closed. Community guide still urges apply and states deadline unspecified. Prefer current organizer page for application status. [Official](https://agentichackathon.team1.network/tr); [community guide](https://agentic-ankara.vercel.app).
- Community guide requires OKX TR UID for application and recommends demo configuration site=tr, demo=true; stack agent should independently verify runtime regional/product support. [Community guide](https://agentic-ankara.vercel.app).

### Inferences
- Don't let conflicting public scoring dilute user's explicit priority; report workbook-based selection.
- Don't assume user has not registered; brief application closure mention only if relevant.

### Gaps
- No confirmed organizer answer resolves rubric conflict. Date/logistics are stable across sites.
