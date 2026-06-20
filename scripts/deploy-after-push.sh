#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_BRANCH="${DBIO_AUTO_DEPLOY_BRANCH:-main}"
ALIYUN_DEPLOY_SCRIPT="${ALIYUN_DEPLOY_SCRIPT:-$REPO_DIR/../aliyun-root-login/deploy-dbio.sh}"
FORCE=0

usage() {
  cat <<EOF
Usage: scripts/deploy-after-push.sh [--force]

Deploy dbio after main is pushed.

Environment:
  DBIO_AUTO_DEPLOY=0       Disable deployment when called from git hooks.
  DBIO_SKIP_CHECKS=1       Skip local test/lint/build checks.
  DBIO_SKIP_VERCEL=1       Skip Vercel production deploy.
  DBIO_SKIP_ALIYUN=1       Skip Aliyun /dbio deploy.
  DBIO_AUTO_DEPLOY_BRANCH  Branch to deploy. Default: main.
  ALIYUN_DEPLOY_SCRIPT     Override Aliyun deploy script path.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)
      FORCE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ "${DBIO_AUTO_DEPLOY:-1}" == "0" ]]; then
  echo "DBIO_AUTO_DEPLOY=0; skipping deployment."
  exit 0
fi

should_deploy="$FORCE"
if [[ "$FORCE" != "1" ]]; then
  while read -r local_ref local_sha remote_ref remote_sha; do
    if [[ "$local_sha" =~ ^0+$ ]]; then
      continue
    fi

    if [[ "$local_ref" == "refs/heads/$TARGET_BRANCH" ||
      "$remote_ref" == "refs/heads/$TARGET_BRANCH" ]]; then
      should_deploy=1
    fi
  done
fi

if [[ "$should_deploy" != "1" ]]; then
  echo "No $TARGET_BRANCH push detected; skipping deployment."
  exit 0
fi

cd "$REPO_DIR"

if [[ "${DBIO_SKIP_CHECKS:-0}" != "1" ]]; then
  npm test
  npm run lint
  npm run build
fi

if [[ "${DBIO_SKIP_VERCEL:-0}" != "1" ]]; then
  npx vercel --prod --yes
fi

if [[ "${DBIO_SKIP_ALIYUN:-0}" != "1" ]]; then
  if [[ ! -x "$ALIYUN_DEPLOY_SCRIPT" ]]; then
    echo "Missing executable Aliyun deploy script: $ALIYUN_DEPLOY_SCRIPT" >&2
    exit 1
  fi

  "$ALIYUN_DEPLOY_SCRIPT"
fi
