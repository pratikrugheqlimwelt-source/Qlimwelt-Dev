package app.deustch.widget.translate

data class TranslateRequest(
    val text: String,
    val sourceLang: String,
    val targetLang: String,
)

data class TranslateResult(
    val translatedText: String,
    val resolvedSourceLang: String,
    val resolvedTargetLang: String,
    val usedDetection: Boolean,
    val engine: String,
) {
    val pairLabel: String
        get() {
            val from = Languages.label(resolvedSourceLang)
            val to = Languages.label(resolvedTargetLang)
            return if (usedDetection) "Detected $from → $to" else "$from → $to"
        }
}

sealed class TranslationException(message: String) : Exception(message) {
    class Offline : TranslationException(
        "No network. Check your connection and try again.",
    )

    class RateLimited : TranslationException(
        "The free translation service is rate-limited right now. Wait and try again.",
    )

    class Unavailable(detail: String) : TranslationException(
        if (detail.isBlank()) "Translation failed." else "Translation failed. $detail",
    )
}

data class ResolvedPair(
    val source: String,
    val target: String,
    val usedDetection: Boolean,
)

object PairResolver {
    fun resolve(text: String, sourceSelection: String, targetSelection: String): ResolvedPair {
        if (sourceSelection != Languages.auto.code) {
            return ResolvedPair(sourceSelection, targetSelection, usedDetection = false)
        }
        val detected = LanguageDetector.detect(text)
        val source = detected ?: if (targetSelection == "en") "de" else "en"
        val target = if (source == targetSelection) counterpart(targetSelection) else targetSelection
        return ResolvedPair(source, target, usedDetection = true)
    }

    /** The other side of the German-first pair. */
    fun counterpart(lang: String): String = if (lang == "en") "de" else "en"
}

object TextChunker {
    const val MAX_BYTES = 450

    fun chunk(text: String, maxBytes: Int = MAX_BYTES): List<String> {
        val trimmed = text.trim()
        if (trimmed.isEmpty()) return emptyList()
        if (bytes(trimmed) <= maxBytes) return listOf(trimmed)
        val parts = mutableListOf<String>()
        var current = StringBuilder()
        for (piece in trimmed.split(Regex("(?<=[.!?])\\s+"))) {
            val candidate = if (current.isEmpty()) piece else current.toString() + " " + piece
            if (bytes(candidate) <= maxBytes) {
                current.clear()
                current.append(candidate)
            } else {
                if (current.isNotEmpty()) {
                    parts += current.toString()
                    current.clear()
                }
                if (bytes(piece) <= maxBytes) {
                    current.append(piece)
                } else {
                    parts += hardSplit(piece, maxBytes)
                }
            }
        }
        if (current.isNotEmpty()) parts += current.toString()
        return parts
    }

    private fun hardSplit(text: String, maxBytes: Int): List<String> {
        val parts = mutableListOf<String>()
        var start = 0
        while (start < text.length) {
            var end = text.length
            while (end > start && bytes(text.substring(start, end)) > maxBytes) {
                end--
            }
            if (end == start) end = start + 1
            parts += text.substring(start, end)
            start = end
        }
        return parts
    }

    private fun bytes(value: String): Int = value.toByteArray(Charsets.UTF_8).size
}

interface TranslationEngine {
    val id: String
    suspend fun translate(request: TranslateRequest): TranslateResult
}
