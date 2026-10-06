package app.deustch.widget.engine

import app.deustch.widget.translate.MyMemoryTranslator
import app.deustch.widget.translate.TranslationEngine

/**
 * Active engine id: "mymemory". No API key.
 *
 * To switch Android to on-device ML Kit later:
 * 1. Add `implementation("com.google.mlkit:translate:17.0.3")` in app/build.gradle.kts.
 * 2. Implement [TranslationEngine] with `com.google.mlkit.nl.translate.Translation`.
 * 3. Return that implementation from [create] and set [ACTIVE_ENGINE_ID] to "mlkit".
 * ML Kit downloads language models on first use and does not need a key.
 */
object EngineConfig {
    const val ACTIVE_ENGINE_ID: String = MyMemoryTranslator.ENGINE_ID

    fun create(): TranslationEngine = MyMemoryTranslator()
}
