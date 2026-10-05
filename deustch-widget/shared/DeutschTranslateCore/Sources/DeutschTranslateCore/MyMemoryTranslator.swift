import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

/// Free, no-key MyMemory client. Swap this out in `TranslateEngines` for an on-device engine.
public struct MyMemoryTranslator: TranslationEngine {
    public typealias Fetcher = @Sendable (URL) async throws -> (Data, Int)

    public let id = "mymemory"
    private let fetcher: Fetcher

    public init(fetcher: Fetcher? = nil) {
        self.fetcher = fetcher ?? Self.liveFetch
    }

    public func translate(_ request: TranslateRequest) async throws -> TranslateResult {
        let text = request.text.trimmingCharacters(in: .whitespacesAndNewlines)
        if text.isEmpty {
            throw TranslationError.unavailable("Enter something to translate.")
        }
        let pair = PairResolver.resolve(
            text: text,
            sourceSelection: request.sourceLang,
            targetSelection: request.targetLang
        )
        if pair.source == pair.target {
            return TranslateResult(
                translatedText: text,
                resolvedSourceLang: pair.source,
                resolvedTargetLang: pair.target,
                usedDetection: pair.usedDetection,
                engine: id
            )
        }
        var translated: [String] = []
        for chunk in TextChunker.chunk(text) {
            guard let url = Self.endpoint(text: chunk, source: pair.source, target: pair.target) else {
                throw TranslationError.unavailable("Could not build a translation request.")
            }
            let (data, status) = try await fetchMapped(url)
            if status == 429 { throw TranslationError.rateLimited }
            if !(200...299).contains(status) {
                throw TranslationError.unavailable("The translation service returned HTTP \(status).")
            }
            translated.append(try Self.parseBody(data))
        }
        return TranslateResult(
            translatedText: translated.joined(separator: " "),
            resolvedSourceLang: pair.source,
            resolvedTargetLang: pair.target,
            usedDetection: pair.usedDetection,
            engine: id
        )
    }

    private func fetchMapped(_ url: URL) async throws -> (Data, Int) {
        do {
            return try await fetcher(url)
        } catch let error as TranslationError {
            throw error
        } catch let error as URLError {
            switch error.code {
            case .notConnectedToInternet, .timedOut, .cannotFindHost, .cannotConnectToHost,
                 .networkConnectionLost, .dnsLookupFailed, .internationalRoamingOff, .dataNotAllowed:
                throw TranslationError.offline
            default:
                throw TranslationError.unavailable(error.localizedDescription)
            }
        } catch {
            throw TranslationError.unavailable(error.localizedDescription)
        }
    }

    public static func endpoint(text: String, source: String, target: String) -> URL? {
        var components = URLComponents(string: "https://api.mymemory.translated.net/get")
        components?.queryItems = [
            URLQueryItem(name: "q", value: text),
            URLQueryItem(name: "langpair", value: "\(source)|\(target)"),
        ]
        return components?.url
    }

    public static func parseBody(_ data: Data) throws -> String {
        let trimmed = data.drop { $0 == 0x20 || $0 == 0x0A || $0 == 0x0D }
        if trimmed.first == UInt8(ascii: "<") {
            throw TranslationError.unavailable("The translation service returned a non-JSON response.")
        }
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw TranslationError.unavailable("The translation service returned an unreadable response.")
        }
        let status = json["responseStatus"] as? Int ?? 0
        let details = json["responseDetails"] as? String ?? ""
        let quota = json["quotaFinished"] as? Bool ?? false
        let responseData = json["responseData"] as? [String: Any]
        let translated = responseData?["translatedText"] as? String ?? ""
        let warning = translated.range(of: "MYMEMORY WARNING", options: .caseInsensitive) != nil
            || details.range(of: "MYMEMORY WARNING", options: .caseInsensitive) != nil
        if quota || status == 429 || warning {
            throw TranslationError.rateLimited
        }
        if status != 200 || translated.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            throw TranslationError.unavailable(details.isEmpty ? "Empty translation." : details)
        }
        return translated
    }

    private static func liveFetch(_ url: URL) async throws -> (Data, Int) {
        var request = URLRequest(url: url)
        request.timeoutInterval = 12
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("DeutschWidget/1.0", forHTTPHeaderField: "User-Agent")
        let (data, response) = try await URLSession.shared.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        return (data, status)
    }
}

public enum TranslateEngines {
    /// Active engine id. Replace `makeDefault()` to switch engines.
    public static let activeId = "mymemory"

    /// Apple Translation (iOS 18+) is the on-device upgrade: import `Translation`,
    /// run `TranslationSession`, and return that type from here. It needs no API key.
    public static func makeDefault() -> any TranslationEngine {
        MyMemoryTranslator()
    }
}
