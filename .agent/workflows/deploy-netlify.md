---
description: How to deploy the FPL Assistant app to Netlify
---

This workflow will guide you through deploying your FPL Assistant app to Netlify.

### Option 1: Using Netlify CLI (Recommended)

1. **Install Netlify CLI** (if you haven't already):
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Initialize the project on Netlify**:
   Run this from the project root directory (`c:\Users\syeda\.gemini\antigravity\scratch\fpl-assistant`):
   ```bash
   netlify init
   ```
   - Select "Create & configure a new site".
   - Select your team.
   - Give your site a unique name (or leave blank for a random one).

4. **Deploy the app**:
   For a production deploy:
   ```bash
   netlify deploy --build --prod
   ```

### Option 2: Using the Netlify Web Interface (GitHub/GitLab/Bitbucket)

1. **Push your code to a Git repository** (GitHub/GitLab/Bitbucket).
2. **Log in to [Netlify](https://app.netlify.com/)**.
3. **Click "Add new site"** and select "Import an existing project".
4. **Select your Git provider** and authorize Netlify.
5. **Select the `fpl-assistant` repository**.
6. **Configure Build Settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next` (Netlify usually detects this automatically for Next.js).
7. **Click "Deploy site"**.

### Option 3: Manual Drag & Drop

1. **Build the project locally**:
   ```bash
   npm run build
   ```
2. **Navigate to the [Netlify Dashboard](https://app.netlify.com/drop)**.
3. **Drag and drop the `.next` folder** (or the whole project folder if you prefer Netlify to handle it) onto the upload area. 
   *Note: For Next.js, it's better to use the CLI or Git integration as it handles Server-Side Rendering and API routes via Netlify Functions.*

---

### Suggested `netlify.toml`

I recommend adding a `netlify.toml` file to your project root to ensure best compatibility:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```
