<a href="https://ai-sdk-starter-groq.vercel.app">
  <h1 align="center">Vercel x Groq Chatbot</h1>
</a>

<p align="center">
  An open-source AI chatbot app template built with Next.js, the AI SDK by Vercel, and Groq.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running Locally</strong></a> ·
  <a href="#authors"><strong>Authors</strong></a>
</p>
<br/>

## Features

- Streaming text responses powered by the [AI SDK by Vercel](https://sdk.vercel.ai/docs), allowing multiple AI providers to be used interchangeably with just a few lines of code.
- Answers grounded in [Project Aureum](https://aumm.fi) via the canonical [`aummfi-bit/aumm-skill`](https://github.com/aummfi-bit/aumm-skill) git submodule (`vendor/aumm-skill`): the model reads numbered specs through a `readAummReference` tool.
- Reasoning model support.
- [shadcn/ui](https://ui.shadcn.com/) components for a modern, responsive UI powered by [Tailwind CSS](https://tailwindcss.com).
- Built with the latest [Next.js](https://nextjs.org) App Router.

## Deploy Your Own

You can deploy your own version to Vercel by clicking the button below:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?project-name=Vercel+x+Groq+Chatbot&repository-name=ai-sdk-starter-groq&repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Fai-sdk-starter-groq&demo-title=Vercel+x+Groq+Chatbot&demo-url=https%3A%2F%2Fai-sdk-starter-groq.labs.vercel.dev%2F&demo-description=A+simple+chatbot+application+built+with+Next.js+that+uses+Groq+via+the+AI+SDK+and+the+Vercel+Marketplace&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22ai%22%2C%22productSlug%22%3A%22api-key%22%2C%22integrationSlug%22%3A%22groq%22%7D%5D)

After deploying, add the server-side API keys in Vercel under **Project Settings → Environment Variables** and redeploy:

```bash
GROQ_API_KEY=""
GOOGLE_GENERATIVE_AI_API_KEY=""
AI_GATEWAY_API_KEY=""
OPENROUTER_API_KEY=""
```

`GROQ_API_KEY` powers the Groq Llama models, `GOOGLE_GENERATIVE_AI_API_KEY` powers Gemini, `OPENROUTER_API_KEY` enables the **free OpenRouter** routes in the model picker (Gemma 4 31B, gpt-oss-120b, Nemotron 3 Super, MiniMax M2.5 — routed via `@ai-sdk/openai` to `https://openrouter.ai/api/v1`), and `AI_GATEWAY_API_KEY` powers the premium AI Gateway models. Do not prefix these values with `NEXT_PUBLIC_`.

Optional for OpenRouter rankings/attribution: `OPENROUTER_HTTP_REFERER` (your site URL) and `OPENROUTER_APP_TITLE` (defaults to `Aureum Chat`).

## Running Locally

1. Clone the repository **with submodules** (required — canon lives in `vendor/aumm-skill`) and install dependencies:

   ```bash
   git clone --recurse-submodules https://github.com/<your-org>/aumm-chat-bot.git
   cd aumm-chat-bot
   ```

   If you already cloned without submodules:

   ```bash
   git submodule update --init --recursive
   ```

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

   **Vercel:** enable **Include Git Submodules** for this project (Project → Settings → Git). Otherwise production builds will not have `vendor/aumm-skill` and chat will return 503 when loading the corpus.

2. Install the [Vercel CLI](https://vercel.com/docs/cli):

   ```bash
   npm i -g vercel
   # or
   yarn global add vercel
   # or
   pnpm install -g vercel
   ```

   Once installed, link your local project to your Vercel project:

   ```bash
   vercel link
   ```

   After linking, pull your environment variables:

   ```bash
   vercel env pull
   ```

   This will create a `.env.local` file with all the necessary environment variables.

3. Run the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view your new AI chatbot application.

## Authors

This repository is maintained by the [Vercel](https://vercel.com) team and community contributors.

Contributions are welcome! Feel free to open issues or submit pull requests to enhance functionality or fix bugs.
