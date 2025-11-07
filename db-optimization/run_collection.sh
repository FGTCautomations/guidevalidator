#!/bin/bash
# ============================================================================
# Script to collect database statistics for Guide Validator optimization
# Requires: SUPABASE_DB_URL environment variable
# ============================================================================

set -e

# Check for database URL
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "Error: SUPABASE_DB_URL environment variable not set"
    echo "Export it like: export SUPABASE_DB_URL='postgresql://postgres:password@host:5432/postgres'"
    exit 1
fi

echo "Collecting database statistics..."
echo "This may take a few minutes..."
echo ""

# Create output directory
mkdir -p db-optimization/output

# Run collection script
psql "$SUPABASE_DB_URL" -f db-optimization/collect_stats.sql > db-optimization/output/raw_stats.txt 2>&1

echo ""
echo "Statistics collected successfully!"
echo "Output saved to: db-optimization/output/raw_stats.txt"
echo ""
echo "Next steps:"
echo "1. Review the raw statistics"
echo "2. Run specific EXPLAIN ANALYZE on slow queries"
echo "3. Apply recommended optimizations"
