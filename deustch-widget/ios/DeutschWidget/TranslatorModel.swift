import Foundation
import SwiftUI
import DeutschTranslateCore

@MainActor
final class TranslatorModel: ObservableObject {
    @Published var expanded = false
    @Published var sourceText = ""
    @Published var translatedText = ""
    @Published var pairLabel = "Auto-detect → German"
    @Published var errorMessage: String?
    @Published var isTranslating = false
    @Published var sourceLang = "auto"
    @Published var targetLang = "de"
    @Published var snapRight = true
    @Published var yFraction = 0.72

    private let engine: any TranslationEngine
    private let defaults = UserDefaults.standard
    private var lastResolvedSource = "en"

    init(engine: (any TranslationEngine)? = nil) {
        self.engine = engine ?? TranslateEngines.makeDefault()
        sourceLang = defaults.string(forKey: "source_lang") ?? "auto"
        targetLang = defaults.string(forKey: "target_lang") ?? "de"
        snapRight = defaults.object(forKey: "snap_right") as? Bool ?? true
        yFraction = defaults.object(forKey: "y_fraction") as? Double ?? 0.72
        pairLabel = "\(Languages.label(for: sourceLang)) → \(Languages.label(for: targetLang))"
    }

    func consume(url: URL) {
        guard url.scheme == "deustchwidget" else { return }
        let text = URLComponents(url: url, resolvingAgainstBaseURL: false)?
            .queryItems?
            .first { $0.name == "text" }?
            .value?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !text.isEmpty else { return }
        sourceText = text
        expanded = true
        Task { await translate() }
    }

    func selectSource(_ code: String) {
        sourceLang = code
        defaults.set(code, forKey: "source_lang")
        pairLabel = "\(Languages.label(for: sourceLang)) → \(Languages.label(for: targetLang))"
    }

    func selectTarget(_ code: String) {
        targetLang = code
        defaults.set(code, forKey: "target_lang")
        pairLabel = "\(Languages.label(for: sourceLang)) → \(Languages.label(for: targetLang))"
    }

    func swap() {
        let newSource = targetLang
        var newTarget = sourceLang == Languages.auto.code ? lastResolvedSource : sourceLang
        if newTarget == newSource {
            newTarget = newSource == "en" ? "de" : "en"
        }
        selectSource(newSource)
        selectTarget(newTarget)
    }

    func translate() async {
        let text = sourceText.trimmingCharacters(in: .whitespacesAndNewlines)
        if text.isEmpty {
            errorMessage = "Enter something to translate."
            return
        }
        isTranslating = true
        errorMessage = nil
        do {
            let result = try await engine.translate(
                TranslateRequest(text: text, sourceLang: sourceLang, targetLang: targetLang)
            )
            translatedText = result.translatedText
            pairLabel = result.pairLabel
            lastResolvedSource = result.resolvedSourceLang
        } catch {
            translatedText = ""
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
        isTranslating = false
    }

    func rememberPosition(snapRight: Bool, yFraction: Double) {
        self.snapRight = snapRight
        self.yFraction = yFraction
        defaults.set(snapRight, forKey: "snap_right")
        defaults.set(yFraction, forKey: "y_fraction")
    }
}
