# @flexent/ensemble

YAML-driven process manager for running multiple Node.js apps locally.

## Install

```bash
npm install @flexent/ensemble
```

## CLI

From the directory that contains `ensemble.yaml`:

```bash
npx ensemble
```

Options:

- `-f, --file <path>` — config file (default: `ensemble.yaml` in cwd)

## Config

Create `ensemble.yaml` at the project root:

```yaml
apps:
  - id: api
    dir: packages/api
    entrypoint: out/bin/run.js
    env:
      HTTP_PORT: "32001"
      META_HTTP_PORT: "38001"
    waitForPorts:
      - HTTP_PORT
      - META_HTTP_PORT
  - id: worker
    dir: packages/worker
    entrypoint: out/bin/run.js
    waitForPorts:
      - 39001
    env:
      SKIP_STORAGE_SETUP: "true"

sharedEnv:
  LOG_PRETTY: "true"
  REGISTRY_URL: http://localhost:32003

stopGracePeriodMs: 5000
```

Each app is forked with `stdio: inherit` in a detached process group. On stop, ensemble sends `SIGTERM` to the whole group, waits `stopGracePeriodMs` (default `5000`), then sends `SIGKILL` if the group is still running.

`stopGracePeriodMs` is optional. It applies to each app stop and to the graceful shutdown triggered by `SIGINT` / `SIGTERM`.

`waitForPorts` lists env var names or literal port numbers. Ensemble waits until each port accepts TCP connections on `127.0.0.1` before starting the next app. Env var names are resolved from the app’s merged env (`sharedEnv`, then per-app `env`).

`sharedEnv` is merged into each forked app’s environment. Per-app `env` overrides shared values. The ensemble parent process is not modified.

## Programmatic API

```typescript
import { Ensemble } from '@flexent/ensemble';

const ensemble = new Ensemble();
await ensemble.resolve('path/to/ensemble.yaml');
await ensemble.start('api');
await ensemble.stop('api');
// OR
await ensemble.startAll();
await ensemble.stopAll();
```
