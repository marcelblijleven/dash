# dash

A self-hosted homelab dashboard built with Next.js. Discovers services from Docker labels and Traefik routes, and displays configurable widgets for host metrics, media, and smart home data.

## Features

- Auto-discovers running containers via Docker socket proxy
- Resolves service URLs from Traefik router rules
- Manual app entries via `config.yml`
- Searchable app launcher with category grouping and per-app shortcuts
- Live widgets: host stats, Docker, Traefik, TeslaMate, and \*arr services
- Theme presets with optional custom accent color and glass blur effects
- Forward auth integration via Authentik

## Quick start

```yaml
# docker-compose.yml
services:
  dash:
    image: ghcr.io/marcelblijleven/dash:latest
    ports:
      - "3000:3000"
    volumes:
      - ./config.yml:/config/config.yml:ro
    environment:
      - DASH_CONFIG=/config/config.yml
```

The dashboard is served at `http://localhost:3000`. If no config file is mounted, dash starts with sensible defaults and no widgets.

## Configuration

Dash reads a single YAML file (default path: `/config/config.yml`). All string values support `${ENV_VAR}` interpolation.

See [`config/config.yml.example`](config/config.yml.example) for a fully annotated reference.

### Theme

```yaml
theme:
  preset: catppuccin   # see presets below
  primary: "#ff5733"   # optional: override accent with any CSS color
  glass: regular       # optional: card blur level
```

**Accent-only presets** (neutral base unchanged): `orange` (default), `blue`, `green`, `purple`, `rose`, `mono`

**Full-palette presets** (paired light + dark, toggle still works): `catppuccin`, `tokyo-night`, `dracula`, `nord`, `gruvbox`

**Glass levels**: `none` (solid, default), `subtle`, `regular`, `clear` - automatically removed when the user has `prefers-reduced-transparency` set.

### Apps

Apps appear in the searchable launcher. They can be added manually in `config.yml` or auto-discovered from Docker labels.

```yaml
apps:
  - title: Grafana
    url: https://grafana.example.com
    local-url: http://grafana:3000   # used when on the local network
    icon: grafana                    # name from selfh.st/icons, or a full URL
    category: Monitoring
    description: Metrics and dashboards
    shortcuts:
      - name: Dashboards
        path: /dashboards
      - name: Alerts
        path: /alerting/list
        icon: bell
```

### Widgets

Widgets appear on the dashboard in the order they are listed. The `size` field controls column span.

| Size | Columns |
|------|---------|
| `small` | 1 |
| `medium` | 2 (default) |
| `large` | 3 / full row |

```yaml
widgets:
  - type: host-stats
    size: medium
```

All widgets accept an optional `title` field to override the default heading.

## Widget reference

### `host-stats`

Combined uptime, load average, memory usage, and CPU stats. Polls the host `/proc` filesystem.

```yaml
- type: host-stats
  size: medium
```

### `host-chart`

Sparkline chart of load average or memory usage over time.

```yaml
- type: host-chart
  size: medium
  metric: load   # load (default) | memory
```

### `host-stat-load` / `host-stat-memory` / `host-stat-uptime`

Individual stat cards for load, memory, or uptime.

```yaml
- type: host-stat-load
  size: small

- type: host-stat-memory
  size: small

- type: host-stat-uptime
  size: small
```

### `docker-stats`

Shows total, running, and unhealthy container counts. Requires Docker socket proxy access.

```yaml
- type: docker-stats
  size: small
```

Configure the Docker socket proxy URL under the top-level `docker` key:

```yaml
docker:
  proxy_url: http://dockersocket:2375   # default
```

### `traefik-status`

Shows total router count, enabled routers, and services that are down. Requires Traefik API access.

```yaml
- type: traefik-status
  size: small
```

Configure the Traefik API URL under the top-level `traefik` key:

```yaml
traefik:
  api_url: http://traefik:8080   # default
```

### `arr`

Queue depth and upcoming calendar for Sonarr, Radarr, Lidarr, or Readarr.

```yaml
- type: arr
  size: medium
  service: sonarr              # sonarr | radarr | lidarr | readarr
  url: http://sonarr:8989
  api_key: ${SONARR_API_KEY}
  title: TV                    # optional, defaults to capitalised service name
  limit: 3                     # number of upcoming items to show (1-50, default 3)
```

### TeslaMate widgets

All TeslaMate widgets share a top-level connection block:

```yaml
teslamate:
  mqtt:
    url: mqtt://mosquitto:1883
    username: ${MQTT_USERNAME}   # optional
    password: ${MQTT_PASSWORD}   # optional
    topic_prefix: teslamate      # default
  postgres:
    host: teslamate-db
    port: 5432                   # default
    database: teslamate          # default
    user: teslamate              # default
    password: ${TESLAMATE_DB_PASSWORD}
    ssl: false                   # default
```

#### `teslamate`

Live battery level, range, and charging state. Requires `teslamate.mqtt`.

```yaml
- type: teslamate
  size: medium
  car_id: 1   # default: 1
```

#### `teslamate-stats`

Lifetime and 30-day totals for distance, energy, and cost. Requires `teslamate.postgres`.

```yaml
- type: teslamate-stats
  size: medium
  car_id: 1
```

#### `teslamate-recent`

Last N drives or charge sessions. Requires `teslamate.postgres`.

```yaml
- type: teslamate-recent
  size: medium
  car_id: 1
  mode: drives   # drives (default) | charges
  limit: 3       # 1-20
```

#### `teslamate-efficiency`

Wh/km sparkline over the last 30 days. Requires `teslamate.postgres`.

```yaml
- type: teslamate-efficiency
  size: medium
  car_id: 1
```

#### `teslamate-cost`

Monthly charging cost split by home and public charging. Requires `teslamate.postgres`.

```yaml
- type: teslamate-cost
  size: medium
  car_id: 1
```

## Docker label auto-discovery

Dash can auto-discover services by reading Docker container labels. Labels use the `dash.` prefix.

```yaml
labels:
  dash.enable: "true"            # explicitly include this container
  dash.title: "My App"           # display name (defaults to container name)
  dash.url: "https://app.example.com"
  dash.local-url: "http://app:8080"
  dash.icon: "my-app"            # selfh.st/icons name or full URL
  dash.category: "Media"
  dash.description: "Short description"
  dash.hide: "true"              # exclude from dashboard even if auto-discovered

  # Shortcuts (index can be any string, sorted alphabetically)
  dash.shortcut.0.name: "Settings"
  dash.shortcut.0.path: "/settings"
  dash.shortcut.0.icon: "settings"
  dash.shortcut.1.name: "Logs"
  dash.shortcut.1.path: "/logs"
```

When Traefik integration is configured, dash also reads `traefik.http.routers.<name>.rule` labels to resolve the service URL automatically. Containers without a resolvable URL are hidden unless `dash.enable` is set.

## Authentication

Dash supports [Authentik](https://goauthentik.io) forward auth. When enabled, every request must carry Authentik proxy headers.

```bash
DASH_AUTH_MODE=forward_auth
DASH_PROXY_SECRET=a-long-random-secret   # optional but recommended
```

When `DASH_PROXY_SECRET` is set, Traefik (or your reverse proxy) must send it in the `x-dash-proxy-secret` header. Requests without the matching secret have all Authentik headers stripped, preventing header spoofing.

The group `dash-admins` grants admin access within the dashboard.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `DASH_CONFIG` | `/config/config.yml` | Path to the YAML config file |
| `DASH_AUTH_MODE` | `none` | Authentication mode: `none` or `forward_auth` |
| `DASH_PROXY_SECRET` | - | Shared secret for the forward auth trust boundary |
| `DASH_PROC_ROOT` | `/proc` | Override the `/proc` mount (useful in development) |
| `DASH_DEV_USER` | - | Dev-only: mock authenticated username (ignored in production) |
| `DASH_DEV_EMAIL` | - | Dev-only: mock authenticated email |
| `DASH_DEV_NAME` | - | Dev-only: mock authenticated display name |
| `DASH_DEV_GROUPS` | - | Dev-only: comma-separated mock groups |

`DASH_DEV_*` variables are only read when `NODE_ENV !== production`.

## Development

```bash
pnpm install
pnpm dev
```

The dev script sets `DASH_CONFIG=./config/config.yml` and `DASH_PROC_ROOT=.dev/proc` automatically. Copy `config/config.yml.example` to `config/config.yml` and adjust to your setup.

```bash
pnpm test           # unit tests
pnpm test:e2e       # Playwright end-to-end tests
pnpm lint           # Biome lint check
pnpm format         # Biome format check
```
