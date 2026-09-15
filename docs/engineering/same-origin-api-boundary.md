# The Same-Origin API Boundary

Why this backend has no CORS configuration, why it used to have one that
broke every browser write, and what to check before adding one back.

Written after the fact, from a defect found during task 025. It had been
live since the backend was created and shipped through three tasks that
each verified their work and each missed it.

## The invariant

**The browser only ever talks to one origin.** In every runtime, one
front end serves the app and proxies `/api` to the backend on that same
origin. The browser never addresses the backend directly.

```text
dev      browser -> localhost:5173  (Vite serves app, proxies /api)  -> localhost:4000
compose  browser -> localhost:30080 (Nginx serves app, proxies /api) -> smart-job-tracker-backend:4000
k8s      browser -> localhost:30080 (Nginx serves app, proxies /api) -> smart-job-tracker-backend:4000
```

The dev proxy is `server.proxy` in `frontend/vite.config.ts`. The
container proxy is `infra/docker/nginx.conf`. The backend listens on
4000 in every runtime, not the Spring default of 8080:
`server.port=4000` in `application.properties`, matched by `proxy_pass`
in `nginx.conf` and `containerPort` in
`infra/k8s/local/backend-deployment.yaml`.

Nothing here is cross-origin, so **CORS has no work to do** and the
backend configures none. That is deliberate, not an oversight.

## What went wrong when it did configure one

`WebConfig.kt` allowlisted exactly one origin,
`http://localhost:5173`, which is the Vite dev server. In Compose and
Kubernetes the app is served from `localhost:30080`, so **every write
from the browser was refused with `403 Invalid CORS request`** - add,
edit and delete, in both containerised runtimes.

### Two enforcers, and only one of them is the famous one

This is the part worth carrying to the next framework.

1. **The browser** blocks JavaScript from *reading* a cross-origin
   response that did not opt in with `Access-Control-Allow-Origin`.
   This is what everyone means by CORS.
2. **Spring**, once any CORS configuration is registered, additionally
   refuses requests *server-side* with 403 when the `Origin` header is
   not on its allowlist.

The second one caused this. Spring cannot tell whether a request was
same-origin: it sees an `Origin` header and judges it. It never learns
that the browser considered the request same-origin and was not going to
enforce anything at all.

Read from `spring-webmvc` sources rather than assumed:
`AbstractHandlerMapping.getHandler` enters CORS processing only

```text
if (hasCorsConfigurationSource(handler) || CorsUtils.isPreFlightRequest(request))
```

and `hasCorsConfigurationSource` is true when the mapping's
`corsConfigurationSource` is set, which is precisely what
`addCorsMappings` sets. With no mapping, an ordinary request skips the
branch and the `Origin` header is ignored rather than judged.

Preflights still enter through the second half of that condition, but
they are not rejected either: `DefaultCorsProcessor.processRequest`
returns `true` immediately when the config is null. The preflight
answers 200 carrying no allow-header, and the browser blocks the real
request for want of it. So removing the configuration moves enforcement
from the server back to the browser, where it belongs; it does not
remove it.

### Why reads worked and writes did not

Browsers attach `Origin` to every request whose method is not GET or
HEAD, **same-origin requests included**. They do not attach it to a
same-origin GET.

| Request | `Origin` sent | Spring's check | Result |
| --- | --- | --- | --- |
| same-origin `GET /api/jobs` | no | nothing to check | 200 |
| same-origin `POST /api/jobs` | `http://localhost:30080` | not allowlisted | 403 |

So the dashboard, the jobs list and the detail page all loaded happily
while every button that wrote anything failed. The app looked healthy
right up to the moment you used it.

## Why it hid for three tasks

Tasks 026, 027 and 028 connected create, edit and delete. All three
verified their work. None could have seen this:

| How it was checked | Why it passed |
| --- | --- |
| Vitest and MSW | no browser, no `Origin`, no Spring |
| `npm run backend:verify` | MockMvc sends no `Origin` unless asked |
| `npm run dev:local` in a browser | serves from `localhost:5173`, the one allowed origin |
| `curl` against the stack | `curl` sends no `Origin` header |
| `npm run api:test` (Newman) | sent no `Origin` header; it does now |

Every one of those is a legitimate check. The defect lived in the gap
between all of them: it needs a real browser, pointed at a containerised
runtime, performing a write.

The general lesson: **a check that omits a header cannot see a bug
caused by that header.** When a runtime-specific defect is suspected,
reproduce it the way a user produces it.

## What guards it now

`backend/src/test/kotlin/com/smartjobtracker/config/CorsPolicyTest.kt`
sends the deployed app origin explicitly on a read and on a write, and
asserts both that they are served rather than refused and that neither
response carries an `Access-Control-Allow-Origin` header. Against the
old configuration it failed with `expected:<200> but was:<403>` and
`expected:<201> but was:<403>`.

The read case is not redundant. It proves the refusal was about the
header rather than the verb, which is the fact that makes the
reads-work-writes-fail behaviour comprehensible.

A second guard sits one layer out. `Create job`, `Update job` and
`Delete job` in `docs/api/smart-job-tracker.postman_collection.json`
each send an `Origin` header taken from the `appOrigin` environment
variable, and assert both that the response is not a 403 and that it
carries no `Access-Control-Allow-Origin`. The backend test proves the
application ignores the header; the collection proves it through the
proxy, against a stack built from images, on the port a browser really
uses. CI runs it in the Docker Build workflow.

Three properties of those assertions are deliberate:

- **All three verbs carry the header.** A mapping restricts methods as
  well as origins, so one that allowed `GET` and `POST` would break edit
  and delete while leaving create green.
- **The allow-origin header must be absent**, not merely permissive.
  Asserting only "not 403" would pass for `allowedOrigins("*")`, which
  answers the symptom by opening the API to every site.
- **That absence is what makes the check origin-independent.** It holds
  whichever value `appOrigin` carries, so the local environment's
  `http://localhost:5173` catches a reinstated mapping even though that
  was the origin the old one allowed.

The two guards fail in different situations. The backend test catches a
CORS mapping being reintroduced in code. The collection catches the same
thing plus anything a proxy does to the header in between.

Both were watched failing, not assumed to work. The collection guard was
proven by restoring the old `WebConfig`, rebuilding the stack, and
running `npm run api:test` against it:

```text
└ Create job
  POST http://localhost:30080/api/jobs [403 Forbidden, 246B, 52ms]
  1. responds 201 Created
  2. is not refused as an invalid CORS request
```

Newman exited 1, so CI would stop. Removing the file and rebuilding
returned the run to green. That transcript is from the run as it stood
then; the assertion has since been renamed and widened to cover the
allow-origin header and the other two write verbs. A guard nobody has
seen fail is the same kind of thing as the checks that missed this
defect in the first place, which is why this paragraph exists.

## Before adding CORS configuration back

Do not add one to fix a 403. Check these first:

1. **Is the browser genuinely reaching a different origin?** If the
   request goes through Nginx or the Vite proxy, it is not, and a CORS
   mapping will refuse same-origin traffic exactly as it did before.
2. **Is the `Origin` header just being forwarded by a proxy?** That is
   the usual answer, and it is not a cross-origin request.
3. **Has the deployment shape actually changed?** Tasks 075 and 076
   deploy the frontend and backend, and may put them on different hosts.
   That is a real cross-origin case and the first legitimate reason to
   configure CORS here.

If it is genuinely needed, make the allowed origins configurable per
environment rather than hardcoding runtime ports into application code.
Hardcoding is what broke it the first time: `localhost:5173` was correct
for the runtime it was written against and wrong for every other one.

Note that `localhost` and `127.0.0.1` are different origins, so an
allowlist that names one and not the other is half an allowlist.
