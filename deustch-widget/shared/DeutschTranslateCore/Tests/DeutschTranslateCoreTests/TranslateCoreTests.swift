import XCTest
@testable import DeutschTranslateCore

final class TranslateCoreTests: XCTestCase {
    func testFixtureCasesMatchTheSharedContract() throws {
        let fixture = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .appendingPathComponent("fixtures/detect-cases.json")
        let data = try Data(contentsOf: fixture)
        let cases = try JSONSerialization.jsonObject(with: data) as! [[String: String]]
        for item in cases {
            let text = item["text"]!
            XCTAssertEqual(LanguageDetector.detect(text), item["lang"], text)
        }
    }

    func testUnknownLatinReturnsNil() {
        XCTAssertNil(LanguageDetector.detect("xyzzy plugh"))
    }

    func testAutoGermanPairFlipsWhenTheSourceIsAlreadyGerman() {
        let pair = PairResolver.resolve(text: "Guten Tag, wie geht es Ihnen?", sourceSelection: "auto", targetSelection: "de")
        XCTAssertEqual(pair.source, "de")
        XCTAssertEqual(pair.target, "en")
        XCTAssertTrue(pair.usedDetection)
    }

    func testAutoEnglishGoesToGerman() {
        let pair = PairResolver.resolve(text: "Hello, how are you today?", sourceSelection: "auto", targetSelection: "de")
        XCTAssertEqual(pair.source, "en")
        XCTAssertEqual(pair.target, "de")
    }

    func testParserReadsTranslatedText() throws {
        let body = #"{"responseData":{"translatedText":"Hallo"},"quotaFinished":false,"responseStatus":200,"responseDetails":""}"#
        XCTAssertEqual(try MyMemoryTranslator.parseBody(Data(body.utf8)), "Hallo")
    }

    func testParserTreatsQuotaWarningAsRateLimit() {
        let body = #"{"responseData":{"translatedText":"MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS"},"quotaFinished":true,"responseStatus":200}"#
        XCTAssertThrowsError(try MyMemoryTranslator.parseBody(Data(body.utf8))) { error in
            guard case TranslationError.rateLimited = error else {
                return XCTFail("expected rate limit, got \(error)")
            }
        }
    }

    func testSameLanguageSkipsTheNetwork() async throws {
        let engine = MyMemoryTranslator { _ in
            XCTFail("network should not be called")
            return (Data(), 500)
        }
        let result = try await engine.translate(TranslateRequest(text: "Hallo", sourceLang: "de", targetLang: "de"))
        XCTAssertEqual(result.translatedText, "Hallo")
        XCTAssertEqual(result.engine, "mymemory")
    }

    func testChunkerKeepsEachPieceUnderTheByteCap() {
        let text = String(repeating: "Hello there. ", count: 80)
        let parts = TextChunker.chunk(text)
        XCTAssertGreaterThan(parts.count, 1)
        for part in parts {
            XCTAssertLessThanOrEqual(part.lengthOfBytes(using: .utf8), TextChunker.maxBytes)
        }
    }
}
