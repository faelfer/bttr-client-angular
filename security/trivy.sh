#!/bin/sh
set -eu

report=/reports/trivy-filesystem.json
trivy_timeout=${TRIVY_TIMEOUT:-60m}
download_retries=${TRIVY_DOWNLOAD_RETRIES:-2}
database_repository=${TRIVY_DB_REPOSITORY:-ghcr.io/aquasecurity/trivy-db:2}

case "$download_retries" in
  '' | *[!0-9]*)
    echo 'TRIVY_DOWNLOAD_RETRIES deve ser um inteiro positivo.' >&2
    exit 2
    ;;
esac
if [ "$download_retries" -lt 1 ]; then
  echo 'TRIVY_DOWNLOAD_RETRIES deve ser maior que zero.' >&2
  exit 2
fi

attempt=1
while [ "$attempt" -le "$download_retries" ]; do
  echo "Atualizando a base do Trivy (tentativa $attempt/$download_retries)..."
  if trivy image \
    --timeout "$trivy_timeout" \
    --no-progress \
    --db-repository "$database_repository" \
    --download-db-only; then
    break
  fi
  if [ "$attempt" -eq "$download_retries" ]; then
    echo 'Não foi possível atualizar a base do Trivy.' >&2
    exit 1
  fi
  attempt=$((attempt + 1))
done

trivy fs \
  --timeout "$trivy_timeout" \
  --skip-db-update \
  --no-progress \
  --scanners vuln,secret,misconfig \
  --skip-dirs /workspace/.angular \
  --skip-dirs /workspace/.ci \
  --skip-dirs /workspace/.git \
  --skip-dirs /workspace/coverage \
  --skip-dirs /workspace/dist \
  --skip-dirs /workspace/lighthouse-report \
  --skip-dirs /workspace/node_modules \
  --skip-dirs /workspace/playwright-report \
  --skip-dirs /workspace/security-reports \
  --skip-dirs /workspace/test-results \
  --format json \
  --output "$report" \
  /workspace

trivy convert --scanners vuln,secret,misconfig \
  --format template --template '@/contrib/html.tpl' \
  --output /reports/trivy-filesystem.html "$report"
trivy convert --scanners vuln,secret,misconfig \
  --format sarif --output /reports/trivy-filesystem.sarif "$report"
trivy convert --scanners vuln,secret,misconfig \
  --severity HIGH,CRITICAL --exit-code 1 --format table "$report"
