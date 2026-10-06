package app.deustch.widget.ui

import android.content.Context

internal class BubblePrefs(context: Context) {
    private val prefs = context.getSharedPreferences("bubble", Context.MODE_PRIVATE)

    var snapRight: Boolean
        get() = prefs.getBoolean(KEY_RIGHT, true)
        set(value) = prefs.edit().putBoolean(KEY_RIGHT, value).apply()

    var yFraction: Float
        get() = prefs.getFloat(KEY_Y, 0.72f)
        set(value) = prefs.edit().putFloat(KEY_Y, value).apply()

    var sourceLang: String
        get() = prefs.getString(KEY_SOURCE, "auto") ?: "auto"
        set(value) = prefs.edit().putString(KEY_SOURCE, value).apply()

    var targetLang: String
        get() = prefs.getString(KEY_TARGET, "de") ?: "de"
        set(value) = prefs.edit().putString(KEY_TARGET, value).apply()

    private companion object {
        const val KEY_RIGHT = "snap_right"
        const val KEY_Y = "y_fraction"
        const val KEY_SOURCE = "source_lang"
        const val KEY_TARGET = "target_lang"
    }
}
