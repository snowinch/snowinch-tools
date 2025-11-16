#!/bin/sh
# Auto-generate changeset if package changes detected

# Get list of changed files in packages/
PACKAGE_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep '^packages/.*\.\(ts\|tsx\|js\|jsx\)$' | grep -v 'package.json$' | grep -v 'CHANGELOG.md$' || true)

# If no package files changed, exit early
if [ -z "$PACKAGE_FILES" ]; then
  exit 0
fi

# Check if any changeset files are being committed in this commit
CHANGESET_IN_COMMIT=$(git diff --cached --name-only | grep '^\.changeset/.*\.md$' | grep -v 'README.md' || true)

# If changeset already included, we're good
if [ -n "$CHANGESET_IN_COMMIT" ]; then
  echo "✅ Changeset included in commit. Proceeding..."
  exit 0
fi

# Extract package names from changed files
PACKAGES=$(echo "$PACKAGE_FILES" | sed 's|^packages/\([^/]*\)/.*|\1|' | sort -u)
PACKAGE_COUNT=$(echo "$PACKAGES" | wc -l | tr -d ' ')

echo ""
echo "📦 Detected changes in package(s):"
echo "$PACKAGES" | sed 's/^/   - packages\//'
echo ""

# If multiple packages, show warning and require manual changeset
if [ "$PACKAGE_COUNT" -gt 1 ]; then
  echo "⚠️  Multiple packages modified. Please create changeset manually:"
  echo "   npm run changeset"
  echo ""
  exit 1
fi

# Single package - we can auto-generate
PACKAGE_NAME=$(echo "$PACKAGES" | head -1)
FULL_PACKAGE_NAME="@snowinch/${PACKAGE_NAME}"

echo "🔄 Auto-generating changeset for ${FULL_PACKAGE_NAME}..."
echo ""

# Prompt for version bump type (use /dev/tty for interactive input)
echo "Select version bump type:"
echo "  1) patch   (0.1.0 → 0.1.1) - Bug fixes"
echo "  2) minor   (0.1.0 → 0.2.0) - New features"
echo "  3) major   (0.1.0 → 1.0.0) - Breaking changes"
echo ""
printf "Choice [1-3]: "
read -r BUMP_CHOICE < /dev/tty

case "$BUMP_CHOICE" in
  1) BUMP_TYPE="patch" ;;
  2) BUMP_TYPE="minor" ;;
  3) BUMP_TYPE="major" ;;
  *)
    echo "❌ Invalid choice. Aborting."
    exit 1
    ;;
esac

# Prompt for description (use /dev/tty for interactive input)
echo ""
printf "Brief description: "
read -r DESCRIPTION < /dev/tty

if [ -z "$DESCRIPTION" ]; then
  echo "❌ Description is required. Aborting."
  exit 1
fi

# Generate changeset filename (timestamp-based)
TIMESTAMP=$(date +%s)
CHANGESET_FILE=".changeset/auto-${TIMESTAMP}.md"

# Create changeset
cat > "$CHANGESET_FILE" << EOF
---
"${FULL_PACKAGE_NAME}": ${BUMP_TYPE}
---

${DESCRIPTION}
EOF

# Add changeset to staging
git add "$CHANGESET_FILE"

echo ""
echo "✅ Changeset created and staged: ${CHANGESET_FILE}"
echo "✅ Proceeding with commit..."
echo ""

exit 0
