package app.deustch.widget.translate

import org.json.JSONArray
import org.junit.Assert.assertEquals
import org.junit.Test
import java.io.File

class LanguageDetectorTest {
    @Test
    fun fixtureCasesMatchTheSharedContract() {
        val file = File("../../shared/fixtures/detect-cases.json")
        val cases = JSONArray(file.readText())
        for (i in 0 until cases.length()) {
            val item = cases.getJSONObject(i)
            val text = item.getString("text")
            assertEquals(text, item.getString("lang"), LanguageDetector.detect(text))
        }
    }

    @Test
    fun unknownLatinReturnsNull() {
        assertEquals(null, LanguageDetector.detect("xyzzy plugh"))
    }
}
