#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MESSAGE="${1:-Update biology education models}"

cd "$REPO_DIR"

branch="$(git branch --show-current)"
if [[ -z "$branch" ]]; then
  echo "Cannot determine current git branch." >&2
  exit 1
fi

npm test
npm run lint
npm run build

if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -m "$MESSAGE"
else
  echo "No local changes to commit."
fi

DBIO_AUTO_DEPLOY=0 git push origin "$branch"
"$SCRIPT_DIR/deploy-after-push.sh" --force
