#!/bin/sh
set -eu

: "${CI_UID:=$(id -u)}"
: "${CI_GID:=$(id -g)}"
: "${COMPOSE_PROJECT_NAME:=bttr-client-security}"
: "${BTTR_MOCK_API_IMAGE:=bttr-server-mock:security}"
: "${TRIVY_CACHE_VOLUME:=bttr-trivy-cache}"
export CI_UID CI_GID COMPOSE_PROJECT_NAME BTTR_MOCK_API_IMAGE TRIVY_CACHE_VOLUME

compose() {
  docker compose -f compose.security.yaml "$@"
}

cleanup() {
  status=$?
  trap - EXIT INT TERM
  set +e
  if [ "$status" -ne 0 ]; then
    compose logs --no-color mock-api web
  fi
  compose down --remove-orphans
  docker image rm "$BTTR_MOCK_API_IMAGE" >/dev/null 2>&1
  exit "$status"
}
trap cleanup EXIT INT TERM

mkdir -p security-reports
rm -rf security-reports/*
docker volume inspect "$TRIVY_CACHE_VOLUME" >/dev/null 2>&1 ||
  docker volume create "$TRIVY_CACHE_VOLUME" >/dev/null

compose run --rm -T --no-deps audit-build
compose run --rm -T --no-deps trivy
compose run --rm -T --no-deps gitleaks
compose up -d --build --wait mock-api web
compose run --rm -T --no-deps zap
