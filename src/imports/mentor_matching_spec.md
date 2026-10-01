# AI-Based Mentor–Entrepreneur Matching Framework
### Emerge Livelihoods Incubation Program

---

## 1. Purpose

Once an entrepreneur is admitted into the Incubation Program, they currently must be paired with a mentor. This document defines the **scope of data points** the two registration forms already collect (or should collect) that an AI matching engine can use to automatically generate a ranked list of the best mentor–entrepreneur pairs, instead of a program manager doing it manually.

The framework below is organized around one idea: for every field an entrepreneur fills in that describes a *need*, there is a corresponding field a mentor fills in that describes a *capability or preference*. The AI's job is to score how well each entrepreneur's needs align with each mentor's capabilities and preferences, then rank the possible pairs.

---

## 2. Matching Architecture — Three Layers

| Layer | What it does | Data type |
|---|---|---|
| **1. Hard Filters (eligibility gate)** | Excludes pairs that cannot work at all, before any scoring happens | Boolean / categorical |
| **2. Weighted Scoring (core match logic)** | Scores remaining pairs 0–100 across structured criteria | Categorical, numeric, multi-select |
| **3. Semantic/AI Scoring (nuance layer)** | Uses an LLM/embedding model to compare free-text fields (motivations, business descriptions, biographies) for qualitative fit | Free text |

A final composite score = weighted sum of Layer 2 + Layer 3, and the top-N mentors per entrepreneur are surfaced to the program manager for confirmation (recommended: AI proposes, human approves).

---

## 3. Layer 1 — Hard Filters (Must-Match / Disqualifiers)

These are pass/fail checks applied before scoring. A mismatch here removes the pair from consideration entirely.

| Entrepreneur Field | Mentor Field | Rule |
|---|---|---|
| Programme applied for (`Incubation`) | Programme Interest (`Incubation Programme` / `Acceleration Programme` / `Both`) | Mentor must have selected the entrepreneur's programme |
| — | Conflict of Interest declaration | If mentor has flagged a conflict of interest with this specific entrepreneur/business, exclude |
| District / Region (if in-person mentoring requested) | Preferred Mentoring Mode (Online / In-Person / Hybrid) + Mentor's District/Region | If either party requires in-person only, regions must be compatible |
| Languages Spoken | Languages Mentor Can Mentor In | Must share at least one common language |
| — | Mentor Availability (Hours Per Month) | Mentor must have remaining capacity (not already at their mentee cap) |
| — | Document completeness (CV uploaded, declaration signed) | Only "active/approved" mentors are eligible pool |

---

## 4. Layer 2 — Weighted Scoring Criteria (Structured Data)

This is the core of the matching engine. Below is the recommended field-to-field mapping, each with a suggested relative weight. Weights are configurable by the program team, but the relative emphasis (stage fit and sector fit as the two heaviest factors) reflects how mentorship placements are typically judged.

| # | Criterion | Entrepreneur Field(s) | Mentor Field(s) | Suggested Weight | Matching Logic |
|---|---|---|---|---|---|
| 1 | **Business Stage Fit** | Selected Business Stage(s): Idea / Validation / Prototype–MVP / Early Startup | Business Stage Expertise (multi-select) **and** Preferred Business Stages | 25% | Overlap score — did the mentor mark this exact stage as an expertise area *and* a preferred stage to mentor in? |
| 2 | **Sector / Industry Fit** | Business Sector (Agriculture, ICT, Health, etc.) | Industry Expertise (multi-select) **and** Preferred Industries | 20% | Exact or adjacent-category match (e.g., "Agriculture & Agribusiness" ↔ "Agriculture"/"Agritech") |
| 3 | **Support-Needs vs. Functional Expertise Fit** | Business Needs Assessment (Business Planning, Marketing, Financial Management, Legal, Investment Readiness, etc.) | Functional/Skills Expertise (grouped: Strategy, Marketing, Finance, Investment, Product, Operations, Technology, Leadership, Legal) | 20% | Set-overlap score between what the entrepreneur says they need and what the mentor says they can teach |
| 4 | **Founder Skills-Gap Fit** | Skills Self-Assessment ratings (1–5 per skill: Leadership, Sales, Marketing, Finance, Product Dev, Tech, Operations, Legal) | Functional Expertise + Years of Experience | 10% | Prioritize mentors strong in the specific skills where the entrepreneur self-rated low (e.g., entrepreneur rates Finance 1/5 → boost mentors with strong Finance expertise) |
| 5 | **Founder Type / Demographic Fit** | Demographics (youth-owned, woman-owned, disability, rural/urban), Gender | Preferred Founder Types (Youth, Women, Rural, Students, Tech Founders, Agripreneurs, etc.) | 8% | Match entrepreneur's profile against mentor's stated preference for who they like mentoring |
| 6 | **Language Fit** | Languages Spoken | Languages Mentor Can Mentor In | 5% (also a hard filter) | Number of shared languages beyond the minimum one required |
| 7 | **Logistics / Mode Fit** | District/Region, availability implied | District/Region, Preferred Mentoring Mode, Available Hours/Days per Month | 5% | Same region bonus; time-availability overlap if session scheduling data exists |
| 8 | **Entrepreneurial Empathy** | — | Entrepreneurial Experience (started/owned/co-founded a business), especially in same industry | 4% | Mentors who have *built* a business (not just advised) in a similar sector/stage score higher — lived experience bonus |
| 9 | **Mentoring Track Record** | — | Prior Mentoring Experience (years mentoring, number of startups mentored, mentoring types) | 3% | Experienced mentors get a light boost, but this should not crowd out well-matched new mentors |

**Total: 100%** (adjustable)

---

## 5. Layer 3 — AI/Semantic Scoring (Unstructured / Free-Text Fields)

These fields cannot be matched with simple rule logic — they need an LLM or embedding-similarity model to judge qualitative alignment. This is where "AI" adds value beyond a basic filter-and-score algorithm.

| Entrepreneur Free-Text Field | Mentor Free-Text Field | What the AI Should Assess |
|---|---|---|
| Problem statement, Solution description, Differentiation, Idea description | Mentor Biography, Career Summary, Motivation for mentoring, Business Achievements | Conceptual/domain similarity — has the mentor worked on, advised, or built something in a comparable problem space? |
| "Why do you want to become an entrepreneur?" / Motivation | Mentor's stated motivation for mentoring, mentoring personality traits (e.g. "Patient and empathetic," "Direct and honest," "Encouraging") | Compatibility of working style — e.g., a first-time, idea-stage founder likely needing encouragement should be paired with a mentor whose stated style is patient/encouraging rather than blunt |
| Team & Co-founder structure | — | Flag whether the entrepreneur is solo vs. has a team, which can affect the kind of mentor support needed (e.g., solo founders may need a mentor comfortable in a broader generalist/leadership role) |

Recommended implementation: generate embeddings for each entrepreneur's "problem + solution + idea description" block and each mentor's "biography + career + industry achievements" block, compute cosine similarity, and fold that into the composite score at a modest weight (e.g. 5–10%) alongside the structured Layer 2 score.

---

## 6. Composite Scoring Formula (Example)

```
Match Score (0–100) =
   0.25 × Stage Fit
 + 0.20 × Sector Fit
 + 0.20 × Needs-vs-Expertise Fit
 + 0.10 × Skills-Gap Fit
 + 0.08 × Founder-Type Fit
 + 0.05 × Language Fit
 + 0.05 × Logistics Fit
 + 0.04 × Entrepreneurial Empathy
 + 0.03 × Mentoring Track Record
 + (semantic similarity bonus, capped at +10 points)
```

For each newly admitted entrepreneur, the engine computes this score against every active, capacity-available mentor and returns the top 3–5 candidates, with a plain-language explanation (e.g., *"Matched on Idea Stage + Agriculture sector; mentor has founded an agribusiness and rated strong in Financial Management, which addresses the entrepreneur's self-rated weakness in Finance."*). The program manager reviews and confirms the final pairing rather than the AI auto-assigning without oversight — this keeps a human in the loop for a decision that affects a real relationship.

---

## 7. Data Gaps to Close Before Automating

The registration forms already collect almost everything needed above, but two things should be addressed for the matching engine to actually work in practice:

1. **Persist the full form data, not just the summary record.** Right now, the stored application record (`EntrepreneurApplication` / `MentorApplication` in the codebase) only keeps a handful of summary fields (name, district, sector/expertise, score). Most of the rich data used in this framework — skills ratings, business needs checklist, stage expertise, functional expertise, preferences, biography text — is currently captured in the form UI but not saved to the underlying data model. This needs to be extended so every field described above is stored and queryable.
2. **Add a mentor capacity/load field.** To support the "Mentor Availability" hard filter, the system needs to track how many mentees a mentor currently has versus their stated capacity (hours/month), so the engine doesn't keep recommending an already-full mentor.

---

## 8. Summary — What the AI Uses on Each Side

**From the Entrepreneur (Incubation Application Form):**
Business stage(s), sector/industry, problem/solution description, business needs checklist, founder skills self-assessment, education, employment/business experience, motivation narrative, team structure, demographics (gender, youth/woman-owned, disability, rural/urban), district/region, languages spoken.

**From the Mentor (Mentor Registration Form):**
Programme interest, business-stage expertise + preferred stages, industry expertise + preferred industries, functional/skills expertise, entrepreneurial experience, prior mentoring experience, preferred founder types, languages mentor can mentor in, preferred mentoring mode, availability (hours/month, days), biography/career/motivation narrative, mentoring personality traits, district/region, conflict-of-interest flags.

The matching engine pairs each entrepreneur "need" field to its corresponding mentor "capability/preference" field, applies the hard filters first, scores the remainder on the weighted criteria above, adds a semantic-similarity bonus from the free-text fields, and returns ranked recommendations for a human program manager to confirm.
