# 🧪 Reports & Analytics Testing Checklist

## Purpose
Manual verification steps ensuring accuracy and performance of Phase 4 Reports & Analytics (web + mobile).

## 1. Environment Prep
1. Ensure backend running with latest migrations.
2. Seed sample data: at least 25 leads (mixed sources/statuses), 20 deals (spread across stages), 10 activities.
3. Confirm at least 3 users (CEO, Sales Manager, Staff) with assigned deals.

## 2. Role-Based Scope
| Role | Expected Scope | Verification |
|------|----------------|--------------|
| CEO/Manager | all | Sees all totals (compare DB counts) |
| Sales Manager | team | Totals limited to managed team members |
| Staff | self | Only deals/leads assigned_to user |

Steps:
1. Login as CEO → record total leads / deals value.
2. Login as Staff → confirm lower numbers subset.
3. Login as Sales Manager → verify team-only (compare direct SQL or admin panel).

## 3. KPI Summary
Check displayed values against database queries:
- Total Leads: `SELECT COUNT(*) FROM crm_lead WHERE company_id=?;`
- Total Deals Value (Open + Won): `SELECT SUM(value) FROM crm_deal WHERE company_id=?;`
- Win Rate: `won / (won + lost)` ensure denominator excludes open.
- Average Deal Size: `AVG(value)` for won deals only.

## 4. Charts
| Chart | Validation Query |
|-------|------------------|
| Leads by Source | `SELECT lead_source, COUNT(*) FROM crm_lead GROUP BY lead_source;` |
| Leads by Status | `SELECT status, COUNT(*) FROM crm_lead GROUP BY status;` |
| Deals by Stage | `SELECT stage_id, COUNT(*) FROM crm_deal WHERE status='open' GROUP BY stage_id;` |
| Monthly Revenue Trend | `SELECT DATE_TRUNC('month', won_at), SUM(value) FROM crm_deal WHERE status='won' GROUP BY 1;` |
| Deals Won vs Lost | `SELECT status, COUNT(*) FROM crm_deal WHERE status IN ('won','lost') GROUP BY status;` |
| Top Performers | `SELECT assigned_to_id, COUNT(*) FROM crm_deal WHERE status='won' GROUP BY assigned_to_id;` |

## 5. Tables
| Table | Criteria |
|-------|----------|
| Recent Won Deals | Ordered by won_at DESC limit 20 |
| Closing This Month | status='open' AND expected_close_date within current month |
| Overdue Deals | status='open' AND expected_close_date < today |

## 6. Export Testing (Web)
1. Click CSV export → verify 3 files download (recent_won_deals.csv, deals_closing_this_month.csv, overdue_deals.csv).
2. Open each file → column headers present, counts match tables.
3. Click PDF export → open file, check summary block & truncated tables.
4. Edge: No data scenario (clear DB) → export should succeed with empty rows.

## 7. Performance
| Action | Target |
|--------|--------|
| Initial load aggregated endpoint | <1.2s with 1000 leads/500 deals |
| Individual fallback endpoints (10 calls) | <2.5s total |
| Mobile chart render | <1s after data arrival |

## 8. Error Handling
Simulate:
- Invalid date range (start > end) → client validation or server 400.
- Unauthorized (expired token) → auto refresh then retry.
- Empty result sets → charts render with graceful "No data" or zero slices/bars.

## 9. Visual QA
Checklist:
- Responsive layout (web) down to 360px width.
- Chart labels legible (truncate long performer names).
- Color palette consistent with design system.
- Dark mode (if later added) contrast safe.

## 10. Regression
Confirm existing features unaffected:
- Pipeline page loads & drag reorder still works.
- Lead conversion flow unaffected.
- Deal stage move persists probability sync.

## 11. Mobile Specific
| Test | Expectation |
|------|-------------|
| Scroll all charts | Smooth; no layout thrash |
| Refresh button | Re-fetch data; spinner shows |
| Offline (airplane mode) | Graceful warning / no crash |
| Orientation change | Charts resize correctly |

## 12. Sign-Off
All checks passing → mark Phase 4 reports complete in `DEVELOPMENT_PROGRESS.md`.

---
**Last Updated:** November 15, 2025
