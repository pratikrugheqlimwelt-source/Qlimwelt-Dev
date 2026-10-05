import Foundation

public struct Language: Equatable, Sendable {
    public let code: String
    public let label: String

    public init(code: String, label: String) {
        self.code = code
        self.label = label
    }
}

public enum Languages {
    public static let auto = Language(code: "auto", label: "Auto-detect")

    public static let all: [Language] = [
        Language(code: "en", label: "English"),
        Language(code: "de", label: "German"),
        Language(code: "fr", label: "French"),
        Language(code: "es", label: "Spanish"),
        Language(code: "it", label: "Italian"),
        Language(code: "pt", label: "Portuguese"),
        Language(code: "nl", label: "Dutch"),
        Language(code: "pl", label: "Polish"),
        Language(code: "tr", label: "Turkish"),
        Language(code: "ru", label: "Russian"),
        Language(code: "ja", label: "Japanese"),
        Language(code: "zh", label: "Chinese"),
        Language(code: "ar", label: "Arabic"),
    ]

    public static func label(for code: String) -> String {
        if code == auto.code { return auto.label }
        return all.first { $0.code == code }?.label ?? code
    }
}

public enum LanguageDetector {
    private static let markers: [String: Set<String>] = [
        "de": words("der die das und nicht ich ist ein eine mit auf für den dem sich auch guten tag wie geht ihnen danke bitte haben wird sind kann nach bei aus zum oder aber wenn schon noch sehr hier wir mein"),
        "en": words("the and you that with have this for not are was from how today what where please thanks hello your"),
        "fr": words("les une des pas que est pour dans qui avec bonjour comment allez vous merci bonsoir êtes suis"),
        "es": words("los las que una por con para del como hola cómo estás gracias buenos días"),
        "it": words("che non una per con sono della ciao come stai oggi grazie buongiorno"),
        "pt": words("que uma não para com dos olá você está obrigado bom dia"),
        "nl": words("het een van niet voor met zijn hoe gaat hallo dank je wel vandaag"),
        "pl": words("nie się jest dla jak ale czy cześć masz dzisiaj proszę dzięki"),
        "tr": words("bir için değil bunu çok merhaba nasılsın bugün teşekkür ederim"),
    ]

    public static func detect(_ text: String) -> String? {
        if let script = scriptOf(text) { return script }
        let tokens = text.lowercased().split { character in
            !character.isLetter && character != "'"
        }.map(String.init)
        if tokens.isEmpty { return nil }
        var best: String?
        var bestScore = 0
        for (code, lexicon) in markers {
            var score = tokens.reduce(0) { $0 + (lexicon.contains($1) ? 1 : 0) }
            score += bonus(code, text)
            if score > bestScore {
                bestScore = score
                best = code
            }
        }
        return bestScore == 0 ? nil : best
    }

    private static func scriptOf(_ text: String) -> String? {
        var kana = false
        var cjk = false
        var arabic = false
        var cyrillic = false
        for scalar in text.unicodeScalars {
            let c = scalar.value
            if (0x3040...0x30FF).contains(c) { kana = true }
            else if (0x4E00...0x9FFF).contains(c) { cjk = true }
            else if (0x0600...0x06FF).contains(c) { arabic = true }
            else if (0x0400...0x04FF).contains(c) { cyrillic = true }
        }
        if kana { return "ja" }
        if cjk { return "zh" }
        if arabic { return "ar" }
        if cyrillic { return "ru" }
        return nil
    }

    private static func bonus(_ code: String, _ text: String) -> Int {
        let extra: String
        switch code {
        case "de": extra = "äöüÄÖÜß"
        case "tr": extra = "ğĞışŞ"
        case "es": extra = "ñÑ¿¡"
        case "pl": extra = "ąćęłńśźżĄĆĘŁŃŚŹŻ"
        default: return 0
        }
        return text.reduce(0) { $0 + (extra.contains($1) ? 2 : 0) }
    }

    private static func words(_ raw: String) -> Set<String> {
        Set(raw.split(separator: " ").map(String.init))
    }
}
