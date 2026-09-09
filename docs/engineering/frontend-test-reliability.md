# Frontend Test Reliability

Why `frontend/vite.config.ts` carries a raised `testTimeout` and a
capped `maxWorkers`, and how to tell which kind of flaky test you are
looking at.

Written after the fact, from four failures across pull requests 12 and
13. Each blocked a push, each passed when run alone, and each had a
different cause. Recording them together because the diagnosis is the
part worth reusing.

## The shape of the problem

The suite is 107 files and 218 tests. A representative run reported:

| Phase | Time |
| --- | --- |
| tests | 44s |
| transform | 46s |
| environment | 190s |
| setup | 486s |

Test execution is the smallest number on the list. Everything else is
Vite compiling modules and jsdom being constructed, per worker, before
any assertion runs.

That is the fact the rest of this note depends on. Vitest's default
`testTimeout` of 5000ms is calibrated for tests where execution
dominates. Here it is a budget that a test can exhaust before it starts.

## Three causes, three different fixes

The failures looked identical from the outside - a timeout, passing in
isolation, failing in the full suite - and needed unrelated remedies.
Diagnose before reaching for a setting.

### 1. A test doing too much: split it

`JobDetailActivePanel` had one test named "binds the current job id to
task, note, and AI actions". It typed roughly forty characters through
`userEvent`, clicked five controls, and rerendered across three tabs.
About two seconds when idle, so 40 per cent of the budget consumed on a
quiet machine and no headroom for a busy one.

The name gave it away: three concerns joined by "and" is three tests.
Split by concern, each rendering its own tab directly rather than
rerendering through the others, the slowest became 828ms.

Reach for this when a single test covers several behaviours. It fixes
the timing as a side effect of being better testing, and no assertion
changes.

### 2. Overhead exceeding the budget: raise the ceiling

`router.test.ts` asserts that the router defines lazy route modules.
Its own work takes 795ms; transforming those modules takes about three
seconds. It cannot be split, because it is a single assertion over all
of them.

`testTimeout` is 15000ms for this reason. Nothing runs slower as a
result - a test finishing in 800ms still finishes in 800ms - and no
assertion is weakened. A raised timeout is not the same as a hidden
failure.

The check on this: a test that genuinely approaches 15 seconds is too
slow and should be split, per the first case. The ceiling exists for
overhead, not for slow tests.

### 3. Not enough machine: cap the workers

Vitest defaults to roughly one worker per core. On a 16-core machine
with about 5GB free, that is fifteen forks each carrying its own jsdom,
competing for memory that is not there. The signature is unmistakable
once seen:

```text
[vitest-pool]: Timeout terminating forks worker for test files ...
```

The pool could not shut down its own worker in time. At that point the
tests are not slow, the machine is saturated - and on that run
`router.test.ts` blew even the 15-second ceiling.

`maxWorkers` is `'50%'`. It trades parallelism for headroom and suits
CI runners too, which have far fewer cores than a development machine.
It can make a wall-clock run longer; it makes the outcome reliable,
which is the trade being bought.

## A fourth cause that is not about timing at all

`JobDetailAiPanel` asserted that a button reads "Analyzing..." and is
disabled, against a mock response with a fixed `delay(100)`. That is a
100ms window the assertion has to catch in flight. Under load it
arrived after the state had already flipped back, and the failure was
`expect(element).toBeDisabled()` - an assertion failure, not a timeout.

No timeout or worker setting fixes this. The mock now holds its
response open until the test releases it:

```ts
await waitFor(() => expect(screen.getByRole('button', { name: 'Analyzing...' })).toBeDisabled());
pendingResponse.release();
```

The loading state lasts exactly as long as the assertion needs, and no
timing dependency remains. Any test asserting on a transient
intermediate state has this problem latent in it, at any machine speed;
load only makes it visible.

## Rules

- **Diagnose first.** A timeout and a race look the same in CI. Run the
  test alone, and read whether the failure is a timeout or an
  assertion.
- **Never weaken an assertion to make a test pass.** Splitting a test,
  raising a ceiling, and making a mock deterministic all leave the
  assertions untouched. Removing an expectation does not.
- **Do not add sleeps.** They make a suite slow and flaky at the same
  time. Use `waitFor` and web-first assertions.
- **Suspect the machine before the test** when several unrelated tests
  start failing at once, or when the pool itself reports timeouts.
  Check what else is running - a local Kubernetes cluster and a Docker
  daemon were the load in every case here.

## Why this matters beyond a local annoyance

Every one of these was reachable in CI. GitHub's `ubuntu-latest`
runners have two cores, fewer than any development machine, so a suite
with no timing headroom is a CI failure waiting for an unlucky
scheduling moment. Two of the four were found only because a local
machine happened to be loaded enough to expose them first.
