#!/bin/sh
set -eu

: "${BG_MODE:=gradient}"
: "${BG_SOLID:=#0b1020}"
: "${BG_GRAD_FROM:=#0b1020}"
: "${BG_GRAD_TO:=#1b3a6b}"
: "${BG_IMAGE_URL:=}"
: "${NAV_LINKS_JSON:=[{\"label\":\"Kubernetes\",\"url\":\"https://kubernetes.io\"}]}"

# NEW: static center box config
: "${CENTER_BOX_TITLE:=RETROPLAY}"
: "${CENTER_BOX_TEXT:=WELCOME, PLAYER ONE.}"
: "${CENTER_BOX_SUBTEXT:=Configured via ConfigMap/env.}"

OUT=/tmp/config.js
cat > "$OUT" <<EOF
window.APP_CONFIG = {
  background: {
    mode: "${BG_MODE}",
    solid: "${BG_SOLID}",
    gradientFrom: "${BG_GRAD_FROM}",
    gradientTo: "${BG_GRAD_TO}",
    imageUrl: "${BG_IMAGE_URL}"
  },
  navLinks: ${NAV_LINKS_JSON},
  centerBox: {
    title: "${CENTER_BOX_TITLE}",
    text: "${CENTER_BOX_TEXT}",
    subtext: "${CENTER_BOX_SUBTEXT}"
  }
};
EOF

# Optional: show a one-line log to confirm generation
echo "Generated $OUT" >&2

exec nginx -g 'daemon off;'
