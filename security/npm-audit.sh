#!/bin/sh
set -u

report_dir=${SECURITY_REPORT_DIR:-security-reports}
report_file=$report_dir/npm-audit.json
mkdir -p "$report_dir"

status=0
npm audit --audit-level=high --json >"$report_file" || status=$?
cat "$report_file"

if [ "$status" -ne 0 ]; then
  echo 'npm audit bloqueou o build por vulnerabilidade HIGH ou CRITICAL.' >&2
fi
exit "$status"
