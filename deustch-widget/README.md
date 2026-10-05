# deustch widget

Deutsch Widget is a German-first quick translator. A round **De** bubble expands into a translator and collapses when you close it or tap the bubble again. Drag the bubble and it snaps to the left or right edge of the screen.

The repository project name keeps the spelling **deustch widget**. The name on the home screen is **Deutsch Widget**.

This folder is separate from the Qlimwelt web app at the repository root.

## What each platform can actually do

| | Android | iOS |
| --- | --- | --- |
| In-app floating bubble | Yes | Yes |
| Expands into source text, translation, language pair, swap, copy, close | Yes | Yes |
| Drags and snaps to screen edges | Yes | Yes |
| Draws over other apps | Yes, after you allow display over other apps | **No** |
| Text from other apps | Android share sheet (`text/plain`) | Share extension |

**iOS cannot show a system-wide overlay.** Apple does not let a third-party app draw a window on top of other apps. There is no `SYSTEM_ALERT_WINDOW` equivalent that is allowed on the App Store. Deutsch Widget on iOS is an in-app floater plus a Share extension. Sharing text from Safari, Notes, or another app opens the extension, translates it, and can hand the text to the app with the `deustchwidget://` URL. The iOS app says this on its home screen. Do not describe the iOS build as a system overlay.

## Stack

Native **Kotlin** (Android) and **Swift** (iOS) in one repo. A Flutter overlay plugin was not used: the Android bubble is a real `WindowManager` view of type `TYPE_APPLICATION_OVERLAY`, which is the API behind “display over other apps,” and the iOS share extension has to be a native target anyway.

Shared behavior lives in [`shared/translate-contract.md`](shared/translate-contract.md). Android implements it in `android/translate-core`. iOS implements it in the `DeutschTranslateCore` Swift package. Both sides read the same detection fixtures.

## Translation engine

The shipping engine is [MyMemory](https://mymemory.translated.net/doc/spec.php)’s free HTTP endpoint. It needs **no API key**. Requests go to `https://api.mymemory.translated.net/get`. The panel shows a clear error when the device is offline, when MyMemory rate-limits the free quota, or when the response is unusable.

If the system DNS resolver cannot find the host, the Android client asks Cloudflare’s public DNS-over-HTTPS endpoint (`1.1.1.1`, hostname `cloudflare-dns.com`) for the address and then opens TLS to MyMemory with the real hostname checked on the certificate. That fallback is only for a broken resolver. It still needs a network path, and it still uses no API key.

Default direction is **auto-detect ↔ German**. The language row can switch to other pairs. If auto-detect decides the text is already German, the app translates it to English.

Speech input and output are not in this build, so they do not sit on the path between typing and a translation.

### Switch Android to ML Kit later

1. In `android/app/build.gradle.kts`, add `implementation("com.google.mlkit:translate:17.0.3")`.
2. Add a class that implements `app.deustch.widget.translate.TranslationEngine` using `com.google.mlkit.nl.translate`.
3. Return it from `EngineConfig.create()` in `android/app/src/main/java/app/deustch/widget/engine/EngineConfig.kt` and set `ACTIVE_ENGINE_ID` to `mlkit`.

ML Kit downloads language models on first use and does not need a key. The UI already talks only to `TranslationEngine`.

### Switch iOS to Apple Translation later

1. Import the `Translation` framework (iOS 18+).
2. Implement `TranslationEngine` with `TranslationSession`.
3. Return it from `TranslateEngines.makeDefault()` in `shared/DeutschTranslateCore/Sources/DeutschTranslateCore/MyMemoryTranslator.swift`.

Apple Translation is on-device and does not need a key. The SwiftUI panel does not know which engine is behind the protocol.

## Run on an Android emulator

Requirements: JDK 17+, Android SDK 35, an API 34 or 35 emulator image.

```bash
cd deustch-widget/android
# local.properties is not committed. Point it at your SDK:
echo "sdk.dir=$ANDROID_HOME" > local.properties
./gradlew :translate-core:test :app:assembleDebug
```

The debug APK is `android/app/build/outputs/apk/debug/app-debug.apk`.

Create an emulator (once), boot it, and install:

```bash
avdmanager create avd -n deutsch -k "system-images;android-34;google_apis;x86_64" -d pixel_6
emulator -avd deutsch
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n app.deustch.widget/.MainActivity
```

### Overlay permission

The bubble **inside** the app works with no special permission. That is the in-app expander.

To draw over other apps:

1. Tap **Allow display over other apps**. The dialog explains why.
2. On the Android settings screen, allow **Display over other apps** for Deutsch Widget.
3. Return to the app. It starts a foreground service and the **De** bubble is added with `WindowManager` as `TYPE_APPLICATION_OVERLAY`.
4. Leave the app. The bubble stays on screen. Drag it to an edge, tap to translate, close to collapse it.
5. **Hide the system bubble** in the app, or **Hide bubble** on the notification, removes the overlay.

On an emulator you can grant the permission from the shell instead of the settings UI:

```bash
adb shell appops set app.deustch.widget SYSTEM_ALERT_WINDOW allow
```

Then tap **Show the system bubble** in the app. The service type is `specialUse` because the bubble has to keep a foreground notification while it is drawn over other apps (required on Android 14+).

Share any selected text to Deutsch Widget from another app. If the system bubble is running, the text opens there. Otherwise it opens the in-app panel.

## Run on an iOS simulator

Requirements: macOS with Xcode 16 or newer. This repository’s agent environment is Linux, so the iOS app is not compiled here. Open it on a Mac:

```bash
cd deustch-widget/ios
open DeutschWidget.xcodeproj
```

1. Select the **DeutschWidget** scheme and an iPhone simulator (iOS 17+).
2. If Xcode asks for a team, choose your Personal Team. The project sets `CODE_SIGNING_REQUIRED` to `NO` so a simulator build can proceed without a paid account. A physical device still needs a team.
3. Run. Drag the **De** bubble, tap it, translate, and close it.
4. To try the Share extension: run the app once, then in Safari or Notes select text, tap Share, and choose **Deutsch Widget**. Translate there, or tap **Open in app** to pass the text through `deustchwidget://translate`.

The share extension target is `ShareExtension`, bundle id `app.deustch.widget.share`, embedded in the app.

## Tests

Android, no device required:

```bash
cd deustch-widget/android
./gradlew :translate-core:test
```

On a Mac, the same cases for the Swift package:

```bash
cd deustch-widget/shared/DeutschTranslateCore
swift test
```

Both test suites read `shared/fixtures/detect-cases.json`.
