# Hackathon deployment

The event guide and OKX Agent TradeKit documentation describe the current CLI as a local-first tool. Hazine Ajanı therefore keeps the OKX profile, Fuji facilitator key and durable replay store on the demo computer. A Cloudflare Quick Tunnel publishes the complete local Next.js application over HTTPS while the computer remains on during judging.

This is a real deployment path: the browser receives live OKX data from the local API and x402 settlement is executed on Avalanche Fuji. No runtime fixture or cached market response is used. The temporary public URL expires when the demo process stops.

## One-time preparation

1. Install Node.js `22.20.0`, pnpm `11.25.0` and OKX Agent TradeKit `1.4.8` through `pnpm install --frozen-lockfile`.
2. Install the official Cloudflare Tunnel client: `winget install --id Cloudflare.cloudflared --exact`.
3. Keep the read-only `okx-tr-read` profile in `~/.okx/config.toml`. Never copy its credentials into this repository.
4. Fund the dedicated Avalanche Fuji test wallet with test AVAX and test USDC. These assets have no monetary value.
5. Run `pnpm check` and then `pnpm --filter @hazine-ajani/web build`.

## Start the live demo

```powershell
Set-Location "C:\Users\sahve\Documents\Codex\2026-10-15\s"
.\scripts\start-hackathon-demo.ps1
```

Enter only the dedicated Fuji test-wallet private key into the hidden PowerShell prompt. The script starts the facilitator, API, production web server and HTTPS tunnel. It prints the temporary `https://…trycloudflare.com` address after all local health checks pass. Keep that terminal open throughout the demo.

## Operational checks

```powershell
Invoke-RestMethod http://127.0.0.1:3001/health
Invoke-RestMethod http://127.0.0.1:3001/ready
```

The health response identifies the service and Git commit. Readiness is `200` only when the live OKX analysis is configured. Process logs are written below the user's temporary directory under `hazine-ajani-demo`; they contain structured correlation IDs and never contain keys.

## Failure recovery

- If the public URL does not appear, confirm `cloudflared --version`, stop the script and restart once.
- If readiness fails, run `okx --profile okx-tr-read account balance` and verify the local OKX profile without printing its secrets.
- If the live market has no acceptable proxy, show the explicit `NO_SUITABLE_PROXY` state and retry a fresh product. Do not replace it with fixture data.
- If internet access is lost, use the fallback recording and the already-confirmed Fuji explorer transaction. Clearly state that the recording is evidence from the real flow.

Sources: [event vibe-coding guide](https://agentic-ankara.vercel.app/vibe-coding), [OKX Agent TradeKit](https://tr.okx.com/en/agent-tradekit), [Cloudflare Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/).
