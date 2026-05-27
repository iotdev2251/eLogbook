# e-Logbook

## Deploy on Ubuntu (Docker)

```bash
git clone https://github.com/iotdev2251/eLogbook.git
cd eLogbook
cp .env.default .env
# Edit .env and nodeapp/.env as needed
./scripts/deploy.sh
```

`docker-compose.yml` and `scripts/deploy.sh` are in this directory (repository root).

## Manual Docker steps

1. Copy `.env.default` to `.env` and edit its settings
2. Copy `nodeapp/.env.default` to `nodeapp/.env` and edit its settings
3. If database settings in `.env` change, update `nodeapp/.env` accordingly
4. Run `docker compose up`
