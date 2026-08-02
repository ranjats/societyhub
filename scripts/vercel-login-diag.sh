#!/bin/bash
# Vercel login diagnostic — tests the NextAuth flow step by step against a deployment.
# Usage: bash scripts/vercel-login-diag.sh https://your-app.vercel.app [email] [password]
# Defaults to the seed admin credentials.
set -u

BASE="${1:?Usage: $0 https://your-app.vercel.app [email] [password]}"
EMAIL="${2:-admin@societyhub.com}"
PASSWORD="${3:-password123}"
CK=$(mktemp)
PASS=0; FAIL=0

ok()   { PASS=$((PASS+1)); echo "  ✅ $1"; }
bad()  { FAIL=$((FAIL+1)); echo "  ❌ $1"; }

echo "=== 1. Auth route health: GET /api/auth/providers ==="
CODE=$(curl -s -o /tmp/diag_providers.json -w '%{http_code}' --max-time 20 "$BASE/api/auth/providers")
if [ "$CODE" = "200" ]; then
  ok "providers returned HTTP 200 — NextAuth module loads fine"
  echo "     $(head -c 200 /tmp/diag_providers.json)"
else
  bad "providers returned HTTP $CODE (expect 200). A 500 here = auth config crashes at module load (e.g. missing AUTH_SECRET or Prisma init failure). Check Vercel function logs."
fi

echo ""
echo "=== 2. CSRF endpoint ==="
CODE=$(curl -s -c "$CK" -o /tmp/diag_csrf.json -w '%{http_code}' --max-time 20 "$BASE/api/auth/csrf")
if [ "$CODE" = "200" ] && grep -q csrfToken /tmp/diag_csrf.json; then
  ok "csrf returned HTTP 200 + token"
else
  bad "csrf returned HTTP $CODE (expect 200 with csrfToken)"
fi

echo ""
echo "=== 3. Credentials sign-in attempt ==="
CSRF=$(python3 -c "import json; print(json.load(open('/tmp/diag_csrf.json'))['csrfToken'])" 2>/dev/null)
if [ -z "$CSRF" ]; then
  bad "no CSRF token — cannot continue"
else
  RESP=$(curl -s -b "$CK" -c "$CK" -o /tmp/diag_login.html -w '%{http_code}' --max-time 30 \
    -X POST "$BASE/api/auth/callback/credentials" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "csrfToken=$CSRF" \
    --data-urlencode "email=$EMAIL" \
    --data-urlencode "password=$PASSWORD")
  echo "     HTTP $RESP"
  # Check for session cookie being set
  if grep -q 'authjs.session-token' "$CK"; then
    ok "SESSION COOKIE WAS SET — credentials validated, NextAuth issued a session"
  else
    bad "no authjs.session-token cookie in jar"
  fi
  echo "     Set-Cookie headers from response:"
  curl -s -b "$CK" -c "$CK" -D - -o /dev/null --max-time 30 \
    -X POST "$BASE/api/auth/callback/credentials" \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "csrfToken=$CSRF" \
    --data-urlencode "email=$EMAIL" \
    --data-urlencode "password=$PASSWORD" 2>/dev/null | grep -i 'set-cookie' | sed 's/^/       /'
fi

echo ""
echo "=== 4. Protected route with cookie (middleware check) ==="
if grep -q 'authjs.session-token' "$CK"; then
  CODE=$(curl -s -b "$CK" -o /dev/null -w '%{http_code}' --max-time 20 "$BASE/dashboard")
  if [ "$CODE" = "200" ]; then
    ok "/dashboard returned HTTP 200 with the session cookie — FULL FLOW WORKS"
  elif [ "$CODE" = "307" ] || [ "$CODE" = "308" ]; then
    bad "/dashboard returned HTTP $CODE (redirect) — middleware rejected the token. Likely AUTH_SECRET mismatch between Auth.js and middleware, or cookie not sent."
  else
    bad "/dashboard returned HTTP $CODE (expect 200 or 307)"
  fi
else
  bad "skipped — no session cookie from step 3"
fi

rm -f "$CK" /tmp/diag_providers.json /tmp/diag_csrf.json /tmp/diag_login.html
echo ""
echo "=== Summary: $PASS passed, $FAIL failed ==="
