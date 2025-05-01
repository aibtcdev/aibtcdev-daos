#!/usr/bin/env bash
# chadsay - Chad ASCII meme with configurable speech bubble position

# ----- Config -----
BUBBLE_POS="side"  # default bubble position
INDENT="   "       # horizontal indent for top-bubble

# ----- Argument parsing -----
for arg in "$@"; do
  case "$arg" in
    --top) BUBBLE_POS="top"; shift ;;
    --side) BUBBLE_POS="side"; shift ;;
  esac
done

# Get message from args or stdin
if [ $# -gt 0 ]; then
  MSG="$*"
else
  MSG=$(cat)
fi

# Wrap and split lines (40 chars wide)
IFS=$'\n' read -rd '' -a lines <<<"$(echo "$MSG" | fold -s -w 40)"

# Max width for bubble
max=0
for l in "${lines[@]}"; do
  (( ${#l} > max )) && max=${#l}
done

# Build bubble
bubble_top="  .$(printf "%0.s\`" $(seq 1 $((max+2))))"
bubble_bottom="  \`$(printf "%0.s." $(seq 1 $((max+2))))"
bubble_lines=()
for l in "${lines[@]}"; do
  bubble_lines+=("  : $(printf "%-${max}s" "$l") :")
done

# ----- Chad ASCII (flipped) -----
read -r -d '' CHAD_ASCII <<'EOF'
⣿⣿⣿⣿⣿⣿⣿⣿⡿⠟⠛⠉⠉⠉⠉⠉⠙⠛⠛⠛⠿⢿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⡿⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⢿⣿⣿⣿⣿⣿
⣿⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀⢀⣠⣤⣤⣤⣀⠀⠀⠀⠀⠀⠀⠀⣀⢹⣿⣿⣿⣿
⣿⣿⣿⠁⠀⠀⠀⠀⠀⠀⢰⣿⣿⣿⣿⣿⣿⡷⠀⠀⠀⠀⠀⣾⣿⣦⡹⣿⣿⣿
⣿⣿⡇⠀⠀⠀⠀⠀⠀⡔⣾⣿⣿⣿⣿⣿⣷⡀⠀⠀⠀⠀⠀⠈⢻⣿⣷⣻⣿⣿
⣿⣿⠀⠀⠀⠀⠀⠀⣠⣾⣿⣿⣿⣿⠟⠋⠀⠀⠀⠀⠀⠀⠠⢦⠀⣻⣿⣿⣿⣿
⣿⣿⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⡦⠶⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠟⠻⣿⣿⣿
⣿⢠⣿⣶⣦⠀⢠⣿⣿⣿⣿⣿⣧⡀⠀⠀⠀⠀⠀⠀⠀⠀⣴⡄⡆⠀⠀⢀⣈⣿
⣧⠿⠛⣻⣿⡃⠺⣿⣿⣿⣿⣿⣿⣿⣦⠀⠀⠀⠀⠀⠀⢰⣿⡇⠱⠀⠀⠀⢙⣿
⣧⡀⣼⣿⣿⡇⠀⢸⣿⣿⣿⣿⣿⠿⠋⠀⠀⠀⠀⠀⢀⡿⢿⣿⡆⢡⡀⠙⣿⣿
⣿⣿⣿⣿⣿⠀⠀⠀⠙⠛⠋⠉⠁⣼⡿⠀⠀⠀⠀⠀⠘⠛⠙⠛⠃⠠⡟⣾⣿⣿
⣿⣿⣿⣿⡇⠀⠀⡘⡀⠀⠀⠀⠀⠻⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠁⠀⣼⣿⣿
⣿⣿⣿⣿⠀⢇⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠲⠶⢶⣦⣤⣄⡺⠦⠀⢿⣿⣿
⣿⣿⣿⣿⠀⠉⠛⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀ ⠀⠹⣿⣷⡄⢀⣿⣿⣿
⣿⣿⣿⣿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡏⠁⣼⣿⣿⣿
⣿⣿⣿⣿⣿⣷⣦⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠁⢠⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣼⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠃⠀⠀⠀⠀⣀⣀⣀⣀⣠⣴⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⢠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
EOF

IFS=$'\n' read -rd '' -a chad_lines <<<"$CHAD_ASCII"

# ----- Render Output -----
if [[ "$BUBBLE_POS" == "top" ]]; then
  echo "$bubble_top"
  for l in "${bubble_lines[@]}"; do echo "$l"; done
  echo "$bubble_bottom"
  echo "$INDENT/"
  echo "$INDENT.'"
  printf "%s\n" "${chad_lines[@]}"
else
  mouth_line=11  # where the bubble should exit
  bubble_block=("${bubble_top}" "${bubble_lines[@]}" "${bubble_bottom}")
  for i in "${!chad_lines[@]}"; do
    printf "%s" "${chad_lines[i]}"
    if [ "$i" -ge "$mouth_line" ] && [ "$i" -lt $((mouth_line + ${#bubble_block[@]})) ]; then
      idx=$((i - mouth_line))
      printf "   %s" "${bubble_block[idx]}"
    fi
    echo
  done
fi
