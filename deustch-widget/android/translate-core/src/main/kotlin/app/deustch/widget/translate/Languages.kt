package app.deustch.widget.translate

data class Language(val code: String, val label: String)

object Languages {
    val auto = Language("auto", "Auto-detect")

    val all: List<Language> = listOf(
        Language("en", "English"),
        Language("de", "German"),
        Language("fr", "French"),
        Language("es", "Spanish"),
        Language("it", "Italian"),
        Language("pt", "Portuguese"),
        Language("nl", "Dutch"),
        Language("pl", "Polish"),
        Language("tr", "Turkish"),
        Language("ru", "Russian"),
        Language("ja", "Japanese"),
        Language("zh", "Chinese"),
        Language("ar", "Arabic"),
    )

    fun label(code: String): String {
        if (code == auto.code) return auto.label
        return all.firstOrNull { it.code == code }?.label ?: code
    }
}

object LanguageDetector {
    private val markers: Map<String, Set<String>> = mapOf(
        "de" to words("der die das und nicht ich ist ein eine mit auf für den dem sich auch guten tag wie geht ihnen danke bitte haben wird sind kann nach bei aus zum oder aber wenn schon noch sehr hier wir mein"),
        "en" to words("the and you that with have this for not are was from how today what where please thanks hello your"),
        "fr" to words("les une des pas que est pour dans qui avec bonjour comment allez vous merci bonsoir êtes suis"),
        "es" to words("los las que una por con para del como hola cómo estás gracias buenos días"),
        "it" to words("che non una per con sono della ciao come stai oggi grazie buongiorno"),
        "pt" to words("que uma não para com dos olá você está obrigado bom dia"),
        "nl" to words("het een van niet voor met zijn hoe gaat hallo dank je wel vandaag"),
        "pl" to words("nie się jest dla jak ale czy cześć masz dzisiaj proszę dzięki"),
        "tr" to words("bir için değil bunu çok merhaba nasılsın bugün teşekkür ederim"),
    )

    fun detect(text: String): String? {
        scriptOf(text)?.let { return it }
        val tokens = WORD.findAll(text.lowercase()).map { it.value }.toList()
        if (tokens.isEmpty()) return null
        var best: String? = null
        var bestScore = 0
        for ((code, lexicon) in markers) {
            var score = tokens.count { it in lexicon }
            score += bonus(code, text)
            if (score > bestScore) {
                bestScore = score
                best = code
            }
        }
        return if (bestScore == 0) null else best
    }

    private fun scriptOf(text: String): String? {
        var kana = false
        var cjk = false
        var arabic = false
        var cyrillic = false
        for (ch in text) {
            val c = ch.code
            when {
                c in 0x3040..0x30FF -> kana = true
                c in 0x4E00..0x9FFF -> cjk = true
                c in 0x0600..0x06FF -> arabic = true
                c in 0x0400..0x04FF -> cyrillic = true
            }
        }
        return when {
            kana -> "ja"
            cjk -> "zh"
            arabic -> "ar"
            cyrillic -> "ru"
            else -> null
        }
    }

    private fun bonus(code: String, text: String): Int = when (code) {
        "de" -> text.count { it in "äöüÄÖÜß" } * 2
        "tr" -> text.count { it in "ğĞışŞ" } * 2
        "es" -> text.count { it in "ñÑ¿¡" } * 2
        "pl" -> text.count { it in "ąćęłńśźżĄĆĘŁŃŚŹŻ" } * 2
        else -> 0
    }

    private fun words(raw: String): Set<String> = raw.split(' ').filter { it.isNotEmpty() }.toSet()

    private val WORD = Regex("[\\p{L}']+")
}
