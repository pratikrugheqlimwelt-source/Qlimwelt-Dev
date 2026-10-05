# Translate contract

Both the Android app and the iOS app implement this contract. The wire format is the MyMemory HTTP API today. The in-process types are the same on both platforms so a later on-device engine can replace the client without changing the UI.

## Request

| Field | Type | Notes |
| --- | --- | --- |
| `text` | string | Trimmed. Empty text is rejected locally and does not hit the network. Longer text is split into chunks of at most 450 UTF-8 bytes. |
| `sourceLang` | string | `auto` or an ISO 639-1 code from the language list. |
| `targetLang` | string | ISO 639-1 code. Never `auto`. |

Default pair: `auto` → `de` (German).

## Direction rules

1. If `sourceLang` is a concrete language, translate that language into `targetLang`.
2. If the two concrete languages are equal, return the original text and do not call the network.
3. If `sourceLang` is `auto`, detect the language on device (script + stopword score).
4. If detection finds nothing, assume `en`, unless the target is already `en`, in which case assume `de`.
5. If the detected language is the same as the target, flip the target to the other side of the German pair: `en` when the target was `de`, otherwise `de`. That is what “auto ↔ German” means when the user already wrote German.

## Response

| Field | Type | Notes |
| --- | --- | --- |
| `translatedText` | string | Display this. |
| `resolvedSourceLang` | string | Language actually translated from. |
| `resolvedTargetLang` | string | Language actually translated into. |
| `usedDetection` | boolean | True when step 3 above ran. |
| `engine` | string | `mymemory` today. Later: `mlkit` or `apple-translation`. |

## Errors

Show these in the panel. Do not replace them with a blank result.

| Code | When | UI copy |
| --- | --- | --- |
| `offline` | DNS failure, timeout, or no connection | No network. Check your connection and try again. |
| `rate_limited` | HTTP 429, `quotaFinished`, or a body that contains `MYMEMORY WARNING` | The free translation service is rate-limited right now. Wait and try again. |
| `unavailable` | Any other non-200 or empty payload | Translation failed, plus the short server detail. |

## Language codes

`en` `de` `fr` `es` `it` `pt` `nl` `pl` `tr` `ru` `ja` `zh` `ar`

Detection fixtures live in `fixtures/detect-cases.json`. Android and the Swift package both read that file in tests.

## Engine boundary

UI code depends on `TranslationEngine.translate(request) -> result`. It does not know about MyMemory. See the README for how to switch the Android engine to ML Kit and the iOS engine to Apple Translation.
