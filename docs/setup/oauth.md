# OAuth credentials

Peakelo signs people in with **Google**, **Lichess**, and **Chess.com**. There is no password.

Copy `server/.env.example` to `server/.env` and `client/.env.example` to `client/.env.local` before starting.

Redirect URIs below assume the API listens on `http://localhost:4000`. Change the host if you change `PORT`.

---

## 1. Session secret

In `server/.env`:

```bash
SESSION_SECRET=$(openssl rand -base64 48)
```

Paste the value. It must be at least 32 characters. Used to sign the OAuth state cookie and to derive the key that encrypts provider tokens at rest.

---

## 2. Google

Google is a confidential OAuth 2.0 client (client id + secret).

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or pick an existing one). Name it `Peakelo`.
3. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name: `Peakelo`
   - User support email: yours
   - Developer contact: yours
   - Save. Scopes can stay at the defaults (`email`, `profile`, `openid`) — Peakelo requests those three.
   - Test users: add your own Gmail while the app is in Testing.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `Peakelo local`
   - Authorized JavaScript origins:
     - `http://localhost:4000`
     - `http://localhost:3000`
   - Authorized redirect URIs:
     - `http://localhost:4000/auth/google/callback`
5. Copy the client id and secret into `server/.env`:

```
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
```

6. Restart the server. **Continue with Google** on `/join` should redirect to Google and come back to `/onboarding`.

Production: add the real API origin and `https://<api-host>/auth/google/callback`. Publish the consent screen when you leave Testing.

---

## 3. Lichess

Lichess is a public OAuth 2.0 client with PKCE. **You do not register an app and there is no client secret.**

1. Pick a unique client id for this machine, e.g. `peakelo-local-<your-name>`.
2. Put it in `server/.env`:

```
LICHESS_CLIENT_ID=peakelo-local-<your-name>
```

3. The redirect URI Peakelo sends is `http://localhost:4000/auth/lichess/callback`. Lichess accepts it as part of the request.
4. Restart the server. **Continue with Lichess** on `/join` should open Lichess, ask for `email:read`, and return to `/onboarding`.

Optional (not required for Peakelo): you can still create a named app at [https://lichess.org/account/oauth/app](https://lichess.org/account/oauth/app) if you want the consent screen to show a proper title. Use that app’s client id as `LICHESS_CLIENT_ID`.

---

## 4. Chess.com

Chess.com **does not** hand out OAuth credentials from a self-serve dashboard.

Public games (the import + 30-minute sync) do **not** need Chess.com OAuth. After Google or Lichess login, onboarding can link a Chess.com username and pull games from the [Published Data API](https://www.chess.com/news/view/published-data-api). That link does **not** prove the person owns the username — official OAuth does.

To enable **Continue with Chess.com** as a real login:

1. Read [Chess.com OAuth / Login / Connected Board](https://www.chess.com/blog/CHESScom/chess-com-oauth-login-connected-board-application).
2. Apply with their form: [OAuth / Connected Board Request](https://docs.google.com/forms/d/e/1FAIpQLSds2AeKLj9xqgu96Pu-rEAS0ItyqDbZbSgUFer0Mo6qMRx4Jg/viewform).
   - Application name: `Peakelo`
   - Why OAuth: sign players in and confirm they own the Chess.com account we import from.
   - Redirect URI to list: `http://localhost:4000/auth/chesscom/callback` (and your production API callback later).
   - Demo: this repo.
3. Chess.com emails the client id, secret, and the authorize / token / userinfo URLs. They are not public.
4. Put them in `server/.env`:

```
CHESSCOM_CLIENT_ID=
CHESSCOM_CLIENT_SECRET=
CHESSCOM_AUTHORIZATION_URL=
CHESSCOM_TOKEN_URL=
CHESSCOM_USERINFO_URL=
CHESSCOM_SCOPE=
```

5. Restart the server. `/auth/providers` should report `chesscom.configured: true`.

Until those variables are set, the Chess.com button on `/join` stays disabled and points here.

Also set a contact User-Agent. Chess.com rate-limits anonymous clients:

```
CHESSCOM_USER_AGENT=Peakelo/0.0.0 (contact: you@example.com)
```

---

## 5. Local database

Auth stores users and sessions in Postgres.

```bash
docker compose up -d postgres
pnpm --filter @peakelo/server exec prisma migrate dev
```

`DATABASE_URL` and `DIRECT_URL` in `server/.env` should match `docker-compose.yml` (`postgresql://peakelo@localhost:5432/peakelo`).

---

## 6. Check it worked

```bash
curl -s http://localhost:4000/auth/providers
```

You want `google` and `lichess` with `configured: true`. `chesscom` is `true` only after step 4.
