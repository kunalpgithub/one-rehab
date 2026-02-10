---
name: database-query-optimization
description: Handles complex database queries, query performance tuning, and database design optimization for PostgreSQL/Supabase. Use when writing complex SQL (CTEs, window functions, joins), improving slow queries, optimizing schema/indexes, or when the user asks for EXPLAIN analysis, query tuning, or database performance.
---

# Database Query & Design Optimization

## When to Use This Skill

- Writing or refactoring **complex queries** (multi-table joins, CTEs, window functions, aggregations).
- **Slow queries**: user reports slowness or you need to tune an existing query.
- **Performance improvement**: reducing latency, avoiding N+1, cutting payload size.
- **Database design optimization**: indexes, schema changes, partitioning, RLS policy cost.
- **EXPLAIN / EXPLAIN ANALYZE**: interpreting plans and fixing Seq Scans, high cost, or large row estimates.

Use the **supabase-nextjs** skill for standard Supabase + Next.js patterns (client usage, RLS, migrations). Use this skill when the focus is complexity or performance of the query/schema itself.

---

## Workflow: Optimize a Query or Design

```
1. Understand → 2. Measure → 3. Optimize → 4. Verify
```

### 1. Understand

- What columns and tables are needed? What filters and sort order?
- Is this one query or multiple (N+1)? Prefer one round-trip with joins.
- Where does it run? (Supabase client vs server; RLS applies on client.)

### 2. Measure

- Run the query (or equivalent raw SQL in Supabase SQL Editor).
- Use **EXPLAIN (ANALYZE, BUFFERS)** to get real timing and I/O.
- Note: **Seq Scan** on large tables, **high "cost" or "rows"**, **Buffers: read**.

See [reference.md](reference.md) for how to read EXPLAIN output.

### 3. Optimize

- **Indexes**: Add or adjust indexes for columns in `WHERE`, `JOIN`, `ORDER BY`, `GROUP BY`. Prefer composite indexes that match the query shape.
- **Query shape**: Select only needed columns; filter and sort in the DB; use `.limit()` / `.range()`; use joins instead of N+1.
- **Schema**: If a query pattern is hot, consider a targeted index (including partial or expression indexes), or a small denormalization; avoid broad schema changes until measured.

### 4. Verify

- Re-run EXPLAIN (ANALYZE, BUFFERS) and confirm: lower cost, Index Scan (or Index Only Scan) where expected, lower buffer reads.
- Re-test from the app (latency, payload size).

---

## Complex Query Patterns (PostgreSQL / Supabase)

### CTEs (WITH)

Use for readability and to avoid repeating subqueries. For very large intermediate result sets, test whether inlining or a materialized CTE (`WITH ... AS MATERIALIZED`) is better.

```sql
WITH filtered_visits AS (
  SELECT patient_id, scheduled_date, status
  FROM visit_attendance
  WHERE scheduled_date >= $1 AND scheduled_date <= $2
)
SELECT p.id, p.name, f.scheduled_date, f.status
FROM patients p
JOIN filtered_visits f ON f.patient_id = p.id
ORDER BY f.scheduled_date;
```

### Window functions

Use for per-group rankings or running totals without collapsing rows.

```sql
SELECT id, patient_id, scheduled_date, status,
       ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY scheduled_date DESC) AS rn
FROM visit_attendance;
```

- Index columns in `PARTITION BY` and `ORDER BY` when these queries are hot.

### Aggregations + JOINs

Do aggregation first, then join to other tables to keep row counts small.

```sql
-- Prefer: aggregate then join
WITH visit_counts AS (
  SELECT patient_id, COUNT(*) AS cnt
  FROM visit_attendance
  WHERE status = 'completed'
  GROUP BY patient_id
)
SELECT p.*, v.cnt
FROM patients p
LEFT JOIN visit_counts v ON v.patient_id = p.id;
```

### Supabase client

- Use `.select('col1, col2, parent(fk_col)')` for joins; avoid multiple round-trips.
- For logic that can’t be expressed in the client, use a **database function** (RPC) or a **view** and query that.

---

## Index Design

- **Single column**: Already covered in project schema (e.g. FKs, `scheduled_date`, `status`). Add one when a new filter/sort column appears in hot queries.
- **Composite**: For `WHERE a = ? AND b = ? ORDER BY c`, use one index `(a, b, c)`; equality columns first, then range/sort.
- **Partial**: If many queries filter on one value (e.g. `status = 'pending'`), use `CREATE INDEX ... ON table (col) WHERE status = 'pending'`.
- **Expression**: For conditions on expressions (e.g. `date_trunc('month', created_at)`), use an expression index if the query is hot.
- **Avoid**: Indexing every column; duplicate indexes that overlap heavily with an existing composite.

---

## Schema / Design Optimization

- **RLS**: Keep `USING` / `WITH CHECK` cheap (e.g. `auth.uid() = user_id`). Avoid heavy subqueries or functions per row.
- **Types**: Use the smallest type that fits (e.g. INTEGER/BIGINT for counts) for less I/O and better cache.
- **JSONB**: Use for variable structure; prefer normal columns for fields you filter/sort on. Add expression indexes only for JSONB keys you query often.
- **Large tables**: For append-heavy, very large tables, consider partitioning (e.g. by `created_at` or id range). Use EXPLAIN to confirm partition pruning.

---

## Checklist (before calling “done”)

- [ ] Query uses indexes (EXPLAIN shows Index Scan / Index Only Scan where expected).
- [ ] No unbounded result sets (limit/range or equivalent).
- [ ] No N+1; related data fetched via join or single RPC.
- [ ] Selected columns minimal; filter/sort in DB.
- [ ] New indexes justified by EXPLAIN and real usage; no redundant indexes.
- [ ] RLS policies stay simple and fast.

---

## Reference

- EXPLAIN interpretation and anti-patterns: [reference.md](reference.md)
- Project schema and Supabase patterns: **supabase-nextjs** skill and `supabase/schema.sql`
