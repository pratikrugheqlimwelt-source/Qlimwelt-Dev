import Foundation

public struct TranslateRequest: Sendable {
    public var text: String
    public var sourceLang: String
    public var targetLang: String

    public init(text: String, sourceLang: String, targetLang: String) {
        self.text = text
        self.sourceLang = sourceLang
        self.targetLang = targetLang
    }
}

public struct TranslateResult: Sendable {
    public var translatedText: String
    public var resolvedSourceLang: String
    public var resolvedTargetLang: String
    public var usedDetection: Bool
    public var engine: String

    public init(
        translatedText: String,
        resolvedSourceLang: String,
        resolvedTargetLang: String,
        usedDetection: Bool,
        engine: String
    ) {
        self.translatedText = translatedText
        self.resolvedSourceLang = resolvedSourceLang
        self.resolvedTargetLang = resolvedTargetLang
        self.usedDetection = usedDetection
        self.engine = engine
    }

    public var pairLabel: String {
        let from = Languages.label(for: resolvedSourceLang)
        let to = Languages.label(for: resolvedTargetLang)
        return usedDetection ? "Detected \(from) → \(to)" : "\(from) → \(to)"
    }
}

public struct ResolvedPair: Sendable {
    public var source: String
    public var target: String
    public var usedDetection: Bool
}

public enum TranslationError: Error, LocalizedError, Sendable {
    case offline
    case rateLimited
    case unavailable(String)

    public var errorDescription: String? {
        switch self {
        case .offline:
            return "No network. Check your connection and try again."
        case .rateLimited:
            return "The free translation service is rate-limited right now. Wait and try again."
        case .unavailable(let detail):
            return detail.isEmpty ? "Translation failed." : "Translation failed. \(detail)"
        }
    }
}

public enum PairResolver {
    public static func resolve(text: String, sourceSelection: String, targetSelection: String) -> ResolvedPair {
        if sourceSelection != Languages.auto.code {
            return ResolvedPair(source: sourceSelection, target: targetSelection, usedDetection: false)
        }
        let detected = LanguageDetector.detect(text)
        let source = detected ?? (targetSelection == "en" ? "de" : "en")
        let target = source == targetSelection ? counterpart(targetSelection) : targetSelection
        return ResolvedPair(source: source, target: target, usedDetection: true)
    }

    public static func counterpart(_ lang: String) -> String {
        lang == "en" ? "de" : "en"
    }
}

public enum TextChunker {
    public static let maxBytes = 450

    public static func chunk(_ text: String, maxBytes: Int = maxBytes) -> [String] {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { return [] }
        if byteCount(trimmed) <= maxBytes { return [trimmed] }
        var parts: [String] = []
        var current = ""
        let sentences = splitSentences(trimmed)
        for piece in sentences {
            let candidate = current.isEmpty ? piece : current + " " + piece
            if byteCount(candidate) <= maxBytes {
                current = candidate
            } else {
                if !current.isEmpty {
                    parts.append(current)
                    current = ""
                }
                if byteCount(piece) <= maxBytes {
                    current = piece
                } else {
                    parts.append(contentsOf: hardSplit(piece, maxBytes: maxBytes))
                }
            }
        }
        if !current.isEmpty { parts.append(current) }
        return parts
    }

    private static func splitSentences(_ text: String) -> [String] {
        var parts: [String] = []
        var current = ""
        for character in text {
            current.append(character)
            if ".!?".contains(character) {
                parts.append(current.trimmingCharacters(in: .whitespaces))
                current = ""
            }
        }
        let tail = current.trimmingCharacters(in: .whitespaces)
        if !tail.isEmpty { parts.append(tail) }
        return parts.filter { !$0.isEmpty }
    }

    private static func hardSplit(_ text: String, maxBytes: Int) -> [String] {
        var parts: [String] = []
        var start = text.startIndex
        while start < text.endIndex {
            var end = text.endIndex
            while end > start && byteCount(String(text[start..<end])) > maxBytes {
                end = text.index(before: end)
            }
            if end == start { end = text.index(after: start) }
            parts.append(String(text[start..<end]))
            start = end
        }
        return parts
    }

    private static func byteCount(_ value: String) -> Int {
        value.lengthOfBytes(using: .utf8)
    }
}

public protocol TranslationEngine: Sendable {
    var id: String { get }
    func translate(_ request: TranslateRequest) async throws -> TranslateResult
}
