#!/bin/sh
# Builds two outputs from src/:
#   reefglass.html   – page fragment (for the Claude artifact viewer, which wraps it)
#   dist/index.html  – complete standalone document, deployed to reefglass.fish
set -e
cd "$(dirname "$0")"
JS="src/01_core.js src/02_env.js src/03a_reef_paint.js src/03b_reef_build.js src/04_life.js src/04b_life_extra.js src/05a_fish_paint.js src/05b_fish_paint.js src/06_fish.js src/07_visitors_a.js src/08_visitors_b.js src/09_main.js"
body() {
  cat src/00_head.html
  printf '\n<script>\n'
  for f in $JS; do cat "$f"; printf '\n'; done
  printf '</script>\n'
}
body > reefglass.html
mkdir -p dist
{
  cat <<'HEAD'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#03141f">
<meta name="description" content="A living coral reef aquarium for your screen: twenty-odd species, a real day and night, and rare special visitors.">
<meta property="og:title" content="Reefglass">
<meta property="og:description" content="A living coral reef aquarium for your screen, in the spirit of the classic After Dark screensavers.">
<meta property="og:url" content="https://reefglass.fish/">
<meta property="og:type" content="website">
<meta property="og:image" content="https://reefglass.fish/og.jpg?v=2">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="A sunlit coral reef with tropical fish and a manta ray">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%2303141f'/%3E%3Cpath d='M5 16c4-6 11-7 16-3l5-4v14l-5-4c-5 4-12 3-16-3z' fill='%23ff9f5a'/%3E%3Ccircle cx='10' cy='15' r='1.4' fill='%2303141f'/%3E%3C/svg%3E">
</head>
<body>
HEAD
  body
  printf '</body>\n</html>\n'
} > dist/index.html
wc -c reefglass.html dist/index.html
