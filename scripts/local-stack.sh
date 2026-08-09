#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
COMPOSE_DIR="$ROOT/deploy/compose"
ENV_FILE="$COMPOSE_DIR/.env.local"
COMPOSE_FILE="$COMPOSE_DIR/compose.local.yml"

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

init_env() {
  if [[ -e "$ENV_FILE" ]]; then
    echo "local stack credentials already exist: deploy/compose/.env.local"
    return
  fi
  umask 077
  cat > "$ENV_FILE" <<EOF
EXOCORE_POSTGRES_DATABASE=exocore_dev
EXOCORE_POSTGRES_USER=exocore_app
EXOCORE_POSTGRES_PASSWORD=$(openssl rand -hex 24)
EXOCORE_QDRANT_API_KEY=$(openssl rand -hex 24)
EXOCORE_NEO4J_PASSWORD=$(openssl rand -hex 24)
EOF
  chmod 600 "$ENV_FILE"
  echo "generated ignored local credentials: deploy/compose/.env.local"
}

load_env() {
  [[ -f "$ENV_FILE" ]] || { echo "missing .env.local; run scripts/local-stack.sh init-env" >&2; exit 1; }
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
}

verify() {
  load_env
  compose up -d --wait
  table_count=$(compose exec -T postgres psql -U "$EXOCORE_POSTGRES_USER" -d "$EXOCORE_POSTGRES_DATABASE" -Atc "SELECT count(*) FROM information_schema.tables WHERE table_schema='exocore';")
  [[ "$table_count" == "8" ]] || { echo "expected 8 PostgreSQL tables, got $table_count" >&2; exit 1; }

  python3 - "$EXOCORE_QDRANT_API_KEY" <<'PY'
import json, sys, urllib.request, urllib.error
key=sys.argv[1]
base='http://127.0.0.1:26333/collections/exocore_records_v1'
headers={'api-key':key,'Content-Type':'application/json'}
request=urllib.request.Request(base,headers=headers,method='GET')
try:
    urllib.request.urlopen(request,timeout=10).read()
except urllib.error.HTTPError as error:
    if error.code != 404: raise
    body=json.dumps({'vectors':{'size':384,'distance':'Cosine'}}).encode()
    urllib.request.urlopen(urllib.request.Request(base,data=body,headers=headers,method='PUT'),timeout=10).read()
result=json.loads(urllib.request.urlopen(urllib.request.Request(base,headers=headers),timeout=10).read())
assert result.get('status')=='ok', result
print('qdrant_collection=exocore_records_v1 status=ok authority=projection')
PY

  compose exec -T neo4j cypher-shell -u neo4j -p "$EXOCORE_NEO4J_PASSWORD" < "$ROOT/contracts/persistence/neo4j/constraints.v1.cypher" >/dev/null
  neo_constraints=$(compose exec -T neo4j cypher-shell -u neo4j -p "$EXOCORE_NEO4J_PASSWORD" --format plain "SHOW CONSTRAINTS YIELD name WHERE name STARTS WITH 'exocore_' RETURN count(*) AS count;" | tail -n 1 | tr -d '[:space:]')
  [[ "$neo_constraints" == "2" ]] || { echo "expected 2 Neo4j constraints, got $neo_constraints" >&2; exit 1; }

  echo "LOCAL_STACK_SUMMARY schema=exocore.local-stack.v1 postgres_tables=8 qdrant_collections=1 neo4j_constraints=2 authority=postgresql projections=qdrant+neo4j"
}

case "${1:-}" in
  init-env) init_env ;;
  up) load_env; compose up -d --wait ;;
  verify) verify ;;
  status) load_env; compose ps ;;
  down) load_env; compose down ;;
  destroy) load_env; compose down -v ;;
  *) echo "usage: scripts/local-stack.sh {init-env|up|verify|status|down|destroy}" >&2; exit 2 ;;
esac
