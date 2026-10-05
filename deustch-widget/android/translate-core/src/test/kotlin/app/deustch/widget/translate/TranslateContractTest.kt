package app.deustch.widget.translate

import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.net.UnknownHostException

class TranslateContractTest {
    @Test
    fun autoGermanPairFlipsWhenTheSourceIsAlreadyGerman() {
        val pair = PairResolver.resolve("Guten Tag, wie geht es Ihnen?", "auto", "de")
        assertEquals("de", pair.source)
        assertEquals("en", pair.target)
        assertTrue(pair.usedDetection)
    }

    @Test
    fun autoEnglishGoesToGerman() {
        val pair = PairResolver.resolve("Hello, how are you today?", "auto", "de")
        assertEquals("en", pair.source)
        assertEquals("de", pair.target)
    }

    @Test
    fun explicitPairIsLeftAlone() {
        val pair = PairResolver.resolve("Hello", "fr", "es")
        assertEquals("fr", pair.source)
        assertEquals("es", pair.target)
        assertFalse(pair.usedDetection)
    }

    @Test
    fun unknownAutoFallsBackToEnglishUnlessTargetIsEnglish() {
        assertEquals("en", PairResolver.resolve("xyzzy plugh", "auto", "de").source)
        assertEquals("de", PairResolver.resolve("xyzzy plugh", "auto", "en").source)
    }

    @Test
    fun chunkerKeepsEachPieceUnderTheByteCap() {
        val text = "Hello there. ".repeat(80)
        val parts = TextChunker.chunk(text)
        assertTrue(parts.size > 1)
        parts.forEach { part ->
            assertTrue(part.toByteArray(Charsets.UTF_8).size <= TextChunker.MAX_BYTES)
        }
    }

    @Test
    fun parserReadsTranslatedText() {
        val body = """
            {"responseData":{"translatedText":"Hallo"},"quotaFinished":false,"responseStatus":200,"responseDetails":""}
        """.trimIndent()
        assertEquals("Hallo", MyMemoryTranslator.parseBody(body))
    }

    @Test
    fun parserTreatsQuotaWarningAsRateLimit() {
        val body = """
            {"responseData":{"translatedText":"MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS"},"quotaFinished":true,"responseStatus":200,"responseDetails":""}
        """.trimIndent()
        try {
            MyMemoryTranslator.parseBody(body)
            throw AssertionError("expected rate limit")
        } catch (error: TranslationException.RateLimited) {
            assertTrue(error.message!!.contains("rate-limited"))
        }
    }

    @Test
    fun sameLanguageSkipsTheNetwork() = runBlocking {
        val engine = MyMemoryTranslator { throw AssertionError("network $it") }
        val result = engine.translate(TranslateRequest("Hallo", "de", "de"))
        assertEquals("Hallo", result.translatedText)
        assertEquals("mymemory", result.engine)
    }

    @Test
    fun offlineIsReportedAsOffline() = runBlocking {
        val engine = MyMemoryTranslator { throw UnknownHostException("nope") }
        try {
            engine.translate(TranslateRequest("Hello", "en", "de"))
            throw AssertionError("expected offline")
        } catch (error: TranslationException.Offline) {
            assertTrue(error.message!!.contains("No network"))
        }
    }

    @Test
    fun endpointEncodesTheLanguagePair() {
        val url = MyMemoryTranslator.endpoint("Hello", "en", "de")
        assertTrue(url.contains("langpair=en%7Cde"))
        assertFalse(url.contains("|"))
    }

    @Test
    fun dohJsonYieldsTheFirstAddress() {
        val body = """
            {"Status":0,"Answer":[{"name":"api.mymemory.translated.net","type":5,"data":"example.net"},{"name":"api.mymemory.translated.net","type":1,"data":"63.189.7.29"}]}
        """.trimIndent()
        assertEquals("63.189.7.29", MyMemoryTranslator.firstARecord(body))
    }

    @Test
    fun httpParserReadsAContentLengthBody() {
        val raw = "HTTP/1.1 200 OK\r\nContent-Length: 5\r\n\r\nHallo".toByteArray()
        assertEquals("Hallo", MyMemoryTranslator.parseHttp(raw))
    }

    @Test
    fun edgeSnapPicksTheNearestSide() {
        assertEquals(12, EdgeSnap.x(x = 10, width = 56, screenWidth = 400, margin = 12))
        assertEquals(400 - 56 - 12, EdgeSnap.x(x = 300, width = 56, screenWidth = 400, margin = 12))
    }
}
