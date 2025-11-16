#!/bin/sh
# Check if package changes require a changeset

# Get list of changed files in packages/
PACKAGE_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep '^packages/.*\.\(ts\|tsx\|js\|jsx\|json\)$' | grep -v 'package.json$' | grep -v 'CHANGELOG.md$' || true)

# If no package files changed, exit early
if [ -z "$PACKAGE_FILES" ]; then
  exit 0
fi

# Count changesets (exclude README.md and config.json)
CHANGESET_COUNT=$(find .changeset -name '*.md' ! -name 'README.md' 2>/dev/null | wc -l | tr -d ' ')

# If no changesets exist, warn the user
if [ "$CHANGESET_COUNT" -eq 0 ]; then
  echo ""
  echo "⚠️  WARNING: You modified package files but no changeset was found!"
  echo ""
  echo "📦 Changed files in packages/:"
  echo "$PACKAGE_FILES" | sed 's/^/   - /'
  echo ""
  echo "💡 To create a changeset, run:"
  echo "   npm run changeset"
  echo ""
  echo "🚫 To bypass this check (not recommended):"
  echo "   git commit --no-verify"
  echo ""
  exit 1
fi

echo "✅ Changeset found. Proceeding with commit..."
exit 0

