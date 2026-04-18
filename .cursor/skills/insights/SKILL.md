---
name: insights
description: Generate high-signal, evidence-backed insights from code, diffs, logs, tickets, and project context. Use when the user asks for insights, findings, analysis, audit takeaways, risks, root causes, or concise action plans.
---

# Insights

## Purpose

Turn noisy technical context into actionable, prioritized insights with explicit evidence and next steps.

## When To Apply

Apply this skill when:
- The user asks for "insights", "findings", "analysis", or "what matters most".
- The task involves many files, long logs, or broad project context.
- The user needs concise decisions, risks, root causes, and next actions.

## Inputs To Prioritize

Prefer this order unless the user specifies otherwise:
1. Fresh runtime/build/test logs
2. Code diffs and changed files
3. Current behavior vs expected behavior
4. Tickets/PR comments and explicit user constraints
5. Broader repository context

## Output Format

Use this structure unless the user requests a different format or template:

```markdown
## Key Insights
- [P1|P2|P3] Insight title - one sentence impact statement
  - Evidence: concrete artifact (file, diff, log line, metric, or repro step)
  - Why it matters: user/business/reliability impact

## Risks / Gaps
- Risk and likely consequence if unchanged

## Recommended Actions
1. Highest-value next step (owner + expected outcome if available)
2. Second step
3. Optional follow-up
```

Priority scale:
- `P1`: High impact or urgent risk
- `P2`: Meaningful improvement
- `P3`: Nice-to-have optimization

## Workflow

1. Identify signal:
   - Extract repeated patterns, regressions, bottlenecks, blockers, and anomalies.
2. Rank by impact:
   - Prioritize user-visible impact, reliability, security, and delivery risk.
3. Validate claims:
   - Keep only insights supported by explicit evidence.
   - If evidence is weak, mark as hypothesis and state how to validate.
4. Compress aggressively:
   - Keep insights specific and non-redundant.
5. Recommend actions:
   - Provide concrete next steps with ordering.

## Quality Bar

- Each insight states observation, evidence, and impact.
- Avoid generic restatements ("code can be improved").
- Prefer evidence-backed claims.
- Keep output short and decision-oriented.
- Do not invent data or certainty.

## If User Provides A Custom Template

- Follow the requested template exactly.
- Preserve evidence-backed claims and explicit priority labels.
- If the template omits risk or actions, include a one-line note with critical omissions.
