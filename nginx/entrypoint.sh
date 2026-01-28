#!/bin/sh
set -eu

: "${BG_MODE:=gradient}"
: "${BG_SOLID:=#0b1020}"
: "${BG_GRAD_FROM:=#0b1020}"
: "${BG_GRAD_TO:=#1b3a6b}"
: "${BG_IMAGE_URL:=}"
: "${NAV_LINKS_JSON:=[{\"label\":\"Kubernetes\",\"url\":\"https://kubernetes.io\"}]}"
: "${TEXTBOX_TITLE:=CONTROL}"
: "${TEXTBOX_PLACEHOLDER:=Type something retro...}"
: "${TEXTBOX_DEFAULT:=WELCOME, PLAYER ONE.}"

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
  textBox: {
    title: "${TEXTBOX_TITLE}",
    placeholder: "${TEXTBOX_PLACEHOLDER}",
    defaultText: "${TEXTBOX_DEFAULT}"
  }
};
EOF

# Optional: show a one-line log to confirm generation
echo "Generated $OUT" >&2

exec nginx -g 'daemon off;'
