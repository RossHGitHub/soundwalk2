# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Cloudflare R2 Media Setup

The media gallery expects a private R2 bucket and these server-side environment variables:

```bash
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET=""
R2_MEDIA_PREFIX=""
MEDIA_URL_SIGNING_SECRET=""
```

How it works:

- `POST /api/media` lists image objects in the bucket and syncs them into the Mongo `media` collection.
- `GET /api/media` returns only database-backed media records plus short-lived signed asset URLs.
- `GET /api/media-asset` validates the signed URL and streams the object from R2 without exposing the bucket directly to the browser.

Recommended Cloudflare-side settings:

- Keep the bucket private. Do not enable public bucket access.
- Use a long, unique `MEDIA_URL_SIGNING_SECRET`.
- If your images live in a folder-like prefix inside the bucket, set `R2_MEDIA_PREFIX` such as `Website/`.
- Enable Cloudflare Hotlink Protection on the site zone if the media is served behind your main domain.
- If you have access to Bot Fight Mode or stronger WAF controls on your plan, enable them for `/api/media` and `/api/media-asset`.

## Facebook Auto-Posting Setup

The Facebook auto-post feature expects these server-side environment variables:

```bash
FACEBOOK_PAGE_ID=""
FACEBOOK_PAGE_ACCESS_TOKEN=""
CRON_SECRET=""
SITE_BASE_URL=""
```

Optional:

```bash
FACEBOOK_GRAPH_VERSION="v23.0"
```

Notes:

- `CRON_SECRET` is used by Vercel Cron and sent as a `Bearer` authorization header.
- `SITE_BASE_URL` should be your public site origin, for example `https://soundwalkband.co.uk`, so Facebook can fetch signed image URLs when needed.
