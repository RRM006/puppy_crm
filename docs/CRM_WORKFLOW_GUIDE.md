# 🧭 CRM Workflow Guide

## Overview
This guide explains how data moves through the CRM from initial lead capture to closed deals, including activity logging, pipeline progression, and best practices for maintaining clean data. It reflects Phase 4 completion (Leads, Deals, Pipelines, Activities, Reports).

## 1. Lead Lifecycle
1. Capture: Lead is created with basic info (name, email, source, status=new).
2. Qualification: Status advances (contacted → qualified) based on discovery work.
3. Assignment: A team member (assigned_to) becomes the owner for follow‑up.
4. Enrichment: Add phone, company_name, job_title, estimated_value, notes.
5. Conversion: When sufficiently qualified, convert the lead to a deal:
   - Creates new Deal in default or selected Pipeline + initial Stage.
   - `crm_lead.converted_to_deal_id` populated; status updates to `converted`.
6. Post‑Conversion: Further communication happens on the Deal object; lead remains historical reference.

### Lead Best Practices
- Keep statuses accurate; avoid leaving everything as `new`.
- Always assign leads quickly to reduce response time.
- Record discovery notes early to improve handoffs.
- Convert only when budget, need, authority, and timing are reasonably validated.

## 2. Deal Progression
1. Creation: Created manually or via lead conversion; placed in selected pipeline at first stage.
2. Stage Advancement: Move through ordered stages (Prospecting → Qualification → Proposal → Negotiation → Closed Won / Lost).
3. Probability Sync: Deal probability mirrors current stage probability (for forecasting).
4. Expected Close Date: Updated as timeline clarifies; used for "Deals Closing This Month" and overdue calculations.
5. Closing:
   - Won: Set status=won, `won_at` timestamp, triggers revenue attribution.
   - Lost: Set status=lost with `lost_reason` and `lost_at` timestamp; retain for analytics.
6. Post‑Close: Deal remains immutable except for notes or post‑mortem updates.

### Deal Best Practices
- Keep stages current—stale stage data wrecks funnel accuracy.
- Set realistic expected_close_date early; update if negotiations slip.
- Capture lost_reason to feed win/loss analysis improvements.
- Maintain value field accuracy for forecasting dashboards.

## 3. Pipeline & Stage Management
- Each company starts with a default pipeline auto‑seeded with standard stages.
- Stages have enforced order and probability (0–100%).
- Reordering stages updates funnel visualization and conversion metrics alignment.
- Additional pipelines can model distinct sales motions (e.g., SMB vs Enterprise).

### Pipeline Best Practices
- Limit number of active pipelines to avoid fragmenting analytics.
- Ensure probabilities roughly reflect historical conversion ratios.
- Avoid too many micro‑stages—keep focus on key progression checkpoints.

## 4. Activities & Timeline
Activities attach to leads and/or deals documenting chronological interactions:
- Types: note, call, email, meeting, task.
- Scheduled tasks use `scheduled_at` and can later be marked completed.
- Activity streams feed detail screens and context for handoffs.

### Activity Best Practices
- Log calls/emails immediately for compliance and collaboration.
- Use concise subjects; reserve details for description.
- Close tasks promptly—overdue tasks clutter dashboards.

## 5. Reporting & Analytics Flow
Data sources powering reports:
- KPI Summary: Aggregates leads, deal values, win/loss counts.
- Funnels: Derived from count of deals grouped by stage.
- Revenue Trend: Sum of won deals grouped by month of `won_at`.
- Top Performers: Deals won grouped by assigned user.
- Overdue Deals: Open deals past expected_close_date.
- Closing This Month: Open deals with expected_close_date in current month.
- Recent Won Deals: Last N won deals ordered by `won_at` desc.

### Reporting Best Practices
- Encourage timely status/stage updates for accurate metrics.
- Use team scope to coach managers; self scope for rep daily focus.
- Export monthly PDFs for archival and stakeholder review.

## 6. Role-Based Data Scope
- CEO / Manager: `scope=all` – full tenant visibility.
- Sales Manager: `scope=team` – only team members they manage.
- Staff: `scope=self` – personal leads/deals only.
Frontend derives scope; backend enforces with filtered queries.

## 7. Conversion Checklist (Lead → Deal)
Before converting:
- Status should be at least `qualified`.
- Contact fields (email/phone) validated.
- Estimated value defined.
- Notes include need & decision timeline.
On conversion:
- Choose appropriate pipeline if multiple exist.
- Auto-select first active stage.
- Transfer contact fields and estimated value into Deal record.

## 8. Data Hygiene Guidelines
- Remove obviously invalid leads daily (bounce, fake data).
- Merge duplicates prior to conversion (future feature placeholder).
- Keep notes factual—not personal or sensitive data.
- Review overdue deals weekly; close or update expected date.

## 9. KPIs Definitions
- Win Rate: `won_deals / (won_deals + lost_deals)` * 100.
- Average Deal Size: Sum of won deal values / count of won deals.
- Pipeline Velocity (future): Time from first stage to close.
- Conversion Rate (future): Qualified leads to closed won deals.

## 10. Troubleshooting
| Symptom | Cause | Resolution |
|---------|-------|-----------|
| Funnel counts off | Stage not updated | Ensure reps move deals promptly |
| Win rate unrealistic | Deals left open | Audit old open deals, close appropriately |
| Overdue list huge | Expected dates stale | Bulk update expected_close_date values |
| Revenue trend zero | Won_at not set | Ensure closing sets status=won correctly |

## 11. Future Enhancements
- Automated attribution on lead source performance.
- SLA tracking for first response time.
- Forecast confidence weighting by stage age.
- AI summaries of activity history.

---
**Last Updated:** November 15, 2025
