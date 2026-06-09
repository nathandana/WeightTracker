#!/bin/sh
# Patches missing files in @gtivr4/a1-design-system-react that were accidentally
# omitted from the published package. Run this after `npm install`.
set -e

PKG="node_modules/@gtivr4/a1-design-system-react/src"
LOCAL="/Users/nathandana/Sites/A1DesignSystem/packages/react/src"
VENDOR="scripts/design-system-patches"

# Use local design system source if available, otherwise fall back to vendored copies
if [ -d "$LOCAL" ]; then
  SRC="$LOCAL"
else
  SRC="$VENDOR"
fi

cp "$SRC/components/structure-utils.js"         "$PKG/components/structure-utils.js"
cp "$SRC/components/field/maskUtils.js"          "$PKG/components/field/maskUtils.js"
cp "$SRC/components/fieldset/FieldsetContext.js" "$PKG/components/fieldset/FieldsetContext.js"

# Expand @custom-media queries in side-nav.css — browsers don't support them natively
SIDENAV="$PKG/components/side-nav/side-nav.css"
sed -i '' \
  's/@media (--bp-md-down)/@media (max-width: 1024px)/g;
   s/@media (--bp-lg-up)/@media (min-width: 1025px)/g;
   s/@media (--bp-xs)/@media (max-width: 480px)/g' \
  "$SIDENAV" 2>/dev/null || \
sed -i \
  's/@media (--bp-md-down)/@media (max-width: 1024px)/g;
   s/@media (--bp-lg-up)/@media (min-width: 1025px)/g;
   s/@media (--bp-xs)/@media (max-width: 480px)/g' \
  "$SIDENAV"

echo "Design system patch applied (source: $SRC)."
