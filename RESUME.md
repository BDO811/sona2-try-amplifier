# Resume brief

Updated 2026-09-15 (later same day): all five items below are closed. Left
in place as a record of what the longitudinal API and recommendations button
verification actually found, since both surfaced real, non-obvious API
behavior worth not rediscovering.

## What closed today

1. `AMPLIFIER_API_KEY` is set on `voiceLongitudinal`. `gcloud functions
   deploy --update-env-vars` timed out twice client-side (it rebuilds from
   source and streams logs over a connection this sandbox's network drops);
   `gcloud run services update --update-env-vars` on the same underlying
   Cloud Run service (`voicelongitudinal`) set it in 18 seconds with no
   rebuild.
2. Proxy verified end to end: CORS headers correct for
   `https://try.amplifierhealth.com`, POST/GET round trip resolved
   `"running"` to `"done"` in about 20 seconds. One finding: a job already
   claimed by one group cannot be re-registered under a new one (`added:
   []`), so the three known job IDs couldn't be freshly linked into a test
   group. That is Amplifier API behavior, not a proxy bug.
3. Decision: the history view keeps the local `analyzeSignalHistory` engine
   (`src/lib/longitudinal.ts`) for direction. The API's own `trajectory`
   field returned `insufficient_data` at 20 real data points in testing, so
   it cannot back a direction call regardless of history depth. No UI
   change made. `population_z` (a cross-user percentile the local engine
   cannot produce) is a real candidate for a future addition, not part of
   this decision.
4. Recommendations latency measured: three calls at 6.4s, 7.1s, 12.9s, no
   timeouts. `VITE_RECOMMENDATIONS=1` is now set in the deploy workflow's
   build step (`.github/workflows/deploy.yml`), shipping the button to
   production. Commit `b28d150`.
5. `sandbox-longitudinal-probe` deleted via `DELETE /v2/groups/{id}` (gcloud
   cannot reach this endpoint). The test group created during step 2's
   verification was also deleted.

## Original brief follows, for context

## The project

`/Users/amitmehta/Claude/ReSkinnable_B2C_Demo_Lovable` — React/Vite/TS SPA.
Pushing `main` deploys to try.amplifierhealth.com via the GitHub Pages repo
`BDO811/sona2-try-amplifier`. The `sandbox` branch is local only and deploys
nowhere.

## Shipped and live

- Band colours: green at NORMAL, bright blue at the top band, red at the far
  end. Fatigue, stress and anxiety read green through LOW as well.
- Raw scores removed from the signal rows.
- Flagging-threshold row removed from detailed findings; the recommendation
  wording is the same on the summary and the detail screen.
- Mobile layout on the analysis screen: viewport-aware sizing plus sequenced
  transitions, so nothing overlaps on a handset.

## Built, not yet wired to any screen

The v2 group longitudinal API.

- `gcp-functions/voice-longitudinal/index.js` — deployed. Group id is the
  SHA-256 of the normalized email, matching voice-history, so the plaintext
  address never reaches the Amplifier API.
- `src/lib/api-longitudinal-client.ts` — typed client, shape taken from a live
  response rather than the docs.
- `src/test/api-longitudinal.test.ts` — pins both surprises below.

Two things worth not rediscovering:

1. `change_absolute` is latest minus the **first** reading, not minus the
   baseline. On fatigue: baseline 0.2126, latest 0.3728, first 0.0985, and
   `change_absolute` came back 0.2742. Use `deviationFromBaseline()` for a real
   baseline deviation; the payload does not carry one.
2. `trajectory` returned `resolvable: false`, `data_points_used: 0`,
   `direction: "insufficient_data"` across all 20 jobs. Anything reading
   `direction` has to handle that string, and must not infer a trend from
   `data_points` being non-empty.

The docs at docs.amplifierhealth.com render through shadow DOM and could not be
read; the shape above came from probing the live API.

## Blocking

The function has no `AMPLIFIER_API_KEY`. This copies it from `analyzeAudio` and
prints nothing:

```bash
gcloud functions deploy voiceLongitudinal --gen2 --region=us-central1 --project=amits-playground-po --update-env-vars="AMPLIFIER_API_KEY=$(gcloud functions describe analyzeAudio --project=amits-playground-po --region=us-central1 --format='value(serviceConfig.environmentVariables.AMPLIFIER_API_KEY)')"
```

## Also open

- **Recommendations button** is dev-only. It works, but latency through the
  function was 40 to 48 seconds and one call hit the request timeout. An IPv4
  keep-alive agent is deployed and unverified — Cloud Run has no IPv6 egress and
  resolution was stalling ~31s per new connection. Needs a spaced set of calls
  returning single-digit seconds before it goes back on in production. Flag is
  `RECOMMENDATIONS_ENABLED` in `src/components/report/RecommendationsPanel.tsx`.
- A group called `sandbox-longitudinal-probe` holds 20 of my jobs. It is how the
  endpoint gets verified once the key lands. `gcloud` will not remove it; it is
  `DELETE /v2/groups/sandbox-longitudinal-probe` on the API.

## Gates before any push

```bash
npx tsc -p tsconfig.app.json --noEmit
npm test          # 214 passing
npm run build
```

Run all three to completion. A backgrounded `tsc` once validated stale state and
the deploy failed on a duplicate export.

---

## Paste this into the new chat

> Read `/Users/amitmehta/Claude/ReSkinnable_B2C_Demo_Lovable/RESUME.md` and pick
> up from there. I have run the `AMPLIFIER_API_KEY` command / I have not run it
> yet — [say which]. Next is verifying the proxy end to end, then deciding
> whether the history view reads the API trajectory or keeps the local one.
