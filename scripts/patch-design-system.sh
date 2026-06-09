#!/bin/sh
# Patches missing files in @gtivr4/a1-design-system-react that were accidentally
# omitted from the published package. Run this after `npm install`.
set -e

PKG="node_modules/@gtivr4/a1-design-system-react/src"
LOCAL="/Users/nathandana/Sites/A1DesignSystem/packages/react/src"

cp "$LOCAL/components/structure-utils.js"         "$PKG/components/structure-utils.js"
cp "$LOCAL/components/field/maskUtils.js"          "$PKG/components/field/maskUtils.js"
cp "$LOCAL/components/fieldset/FieldsetContext.js" "$PKG/components/fieldset/FieldsetContext.js"

# Expand @custom-media queries in side-nav.css — browsers don't support them natively
SIDENAV="$PKG/components/side-nav/side-nav.css"
sed -i '' \
  's/@media (--bp-md-down)/@media (max-width: 1024px)/g;
   s/@media (--bp-lg-up)/@media (min-width: 1025px)/g;
   s/@media (--bp-xs)/@media (max-width: 480px)/g' \
  "$SIDENAV"

echo "Design system patch applied."
