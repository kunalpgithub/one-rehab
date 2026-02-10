# Reference: EXPLAIN & Query Anti-Patterns

## Reading EXPLAIN (ANALYZE, BUFFERS)

Run in Supabase SQL Editor:

```sql
EXPLAIN (ANALYZE, BUFFERS) your_query_here;
```

### Key terms

| Term | Meaning |
|------|--------|
| **Seq Scan** | Full table scan. Acceptable on tiny tables; on large tables often a sign to add an index or fix the filter. |
| **Index Scan** | Reads index then fetches matching rows from table. Good when selective. |
| **Index Only Scan** | All needed columns in the index; no table access. Best when possible. |
| **Bitmap Index Scan + Heap** | Multiple index conditions combined; then table access. Common for OR / multiple filters. |
| **Nested Loop** | Inner table scanned per outer row. Fine when inner is small or indexed; bad when both large. |
| **Hash Join** | Builds in-memory hash from one side, probes with the other. Good for large joins without sort. |
| **Sort** | In-memory or disk sort. If "Disk:" appears, consider index that provides order to avoid sort. |

### What to look for

- **cost**: Lower is better. Compare before/after changes.
- **rows**: Estimate vs actual. Large mismatch can mean outdated stats; consider `ANALYZE table_name;`.
- **Buffers: shared read**: Disk reads. High values suggest missing index or cold cache.
- **Execution Time**: Real ms. Use as the main user-visible metric.

### Red flags

- Seq Scan on a large table with a filter that could use an index.
- Nested Loop with high row counts on the inner side.
- Sort spilling to disk for a query that could be satisfied by an index order.
- Very high "rows" estimate compared to actual (run `ANALYZE`).

---

## Common Anti-Patterns

1. **SELECT *** on wide tables when only a few columns are needed → more I/O and payload.
2. **Filtering in application** after fetching many rows → do `.eq()`, `.in()`, `.gte()`, etc. in the query.
3. **No LIMIT** on list queries → use `.limit()` or `.range()`.
4. **Multiple round-trips** for related data → use joins or one RPC.
5. **Index on (A), (B)** when the query is `WHERE A = ? AND B = ?` → one composite index (A, B) is better.
6. **Expensive RLS** (subqueries, heavy functions) → simplify to direct column checks (e.g. `auth.uid() = user_id`).
