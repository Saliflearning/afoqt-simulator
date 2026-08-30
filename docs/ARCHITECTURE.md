# Architecture

## System boundary

AFOQTPro is a static client application. The browser owns all runtime state;
there is no application server, database, user account, remote scoring service,
or telemetry pipeline.

```text
Authored questions (lib/questions.ts)
        |
        v
Practice UI (app/*) ---> timing + answer capture
        |                         |
        v                         v
SM-2-style scheduler       progress calculations
        |                         |
        +----------+--------------+
                   v
           browser localStorage
                   |
                   v
            review + analytics
```

## Main modules

| Module | Responsibility |
|---|---|
| `lib/questions.ts` | authored question bank and configurable practice-section metadata |
| `lib/sm2.ts` | deterministic interval updates, due-state, and review priority |
| `lib/storage.ts` | local-state normalization, persistence, streaks, and session history |
| `lib/utils.ts` | percentages, section/topic aggregation, and display utilities |
| `app/drill` | section practice and test-style feedback modes |
| `app/exam` | timed multi-section practice sequence |
| `app/adaptive` | weak/due-question review queue |
| `app/review` | searchable question and attempt review |
| `app/analytics` | local progress charts and explicitly non-official group summaries |

## Data flow

1. A learner selects a practice flow.
2. The UI reads static authored questions and locally stored card/session state.
3. Each answer records correctness and elapsed time.
4. The scheduler updates a card's review interval from a bounded quality value.
5. A completed session is normalized and written under `afoqt_state_v2`.
6. Analytics derive section and weak-topic summaries from local sessions.

## Security and privacy model

- No credentials, profile data, contact details, or network API are required.
- Browser storage can be cleared from the product and is never transmitted by
  application code.
- Malformed local JSON falls back to a safe empty state.
- Public release scanners block owner PII, private paths, credential shapes,
  and current-tree agent artifacts; reachable history is scanned for PII and secrets.
- CI uses least-privilege permissions and GitHub-native dependency/code scanning.

## Intentional limitations

The architecture optimizes for a demonstrable offline-capable learning product,
not multi-device sync, official scoring, account analytics, or controlled exam
content. Any future server component would require a separate privacy, threat,
retention, and migration design.
