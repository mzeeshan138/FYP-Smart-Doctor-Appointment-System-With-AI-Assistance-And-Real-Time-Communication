### Important
make sure .env.production file available in frontend, backend and admin to run production locally

### How to run locally in production mode

From the `Backend` folder:

```bash
npm install
npm run build:client
npm run start:prod
```

You should see:

```
server is running on 4000
NODE_ENV: PRODUCTION
Patient app: /
Admin panel: /admin
```

Then open:

- Patient app: `http://localhost:4000`
- Admin panel: `http://localhost:4000/admin`

---

### Important

- Stop any old server still running on port 4000 before starting again.
- `Frontend/.env.production` and `Admin/.env.production` are only used at **build time** (`npm run build:client`), not when starting the backend.
- Backend env at runtime comes from **`Backend/.env.production`** when `NODE_ENV=PRODUCTION`.

I verified both `/` and `/admin` return **200** after the fix. Restart your server with `npm run start:prod` and it should work.
