package app.deustch.widget.translate

import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.InetSocketAddress
import java.net.SocketTimeoutException
import java.net.URI
import java.net.URL
import java.net.URLEncoder
import java.net.UnknownHostException
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.SNIHostName
import javax.net.ssl.SSLSocket

/**
 * Free, no-key MyMemory client.
 *
 * Daily quota is enforced by MyMemory. A exhausted quota or HTTP 429 becomes
 * [TranslationException.RateLimited] so the panel can say so.
 */
class MyMemoryTranslator(
    private val fetcher: (String) -> String = { url -> httpGet(url) },
) : TranslationEngine {
    override val id: String = ENGINE_ID

    override suspend fun translate(request: TranslateRequest): TranslateResult {
        val text = request.text.trim()
        if (text.isEmpty()) {
            throw TranslationException.Unavailable("Enter something to translate.")
        }
        val pair = PairResolver.resolve(text, request.sourceLang, request.targetLang)
        if (pair.source == pair.target) {
            return TranslateResult(
                translatedText = text,
                resolvedSourceLang = pair.source,
                resolvedTargetLang = pair.target,
                usedDetection = pair.usedDetection,
                engine = id,
            )
        }
        val translated = TextChunker.chunk(text).joinToString(" ") { chunk ->
            val url = endpoint(chunk, pair.source, pair.target)
            try {
                parseBody(fetcher(url))
            } catch (error: TranslationException) {
                throw error
            } catch (_: UnknownHostException) {
                throw TranslationException.Offline()
            } catch (_: SocketTimeoutException) {
                throw TranslationException.Offline()
            } catch (_: IOException) {
                throw TranslationException.Offline()
            }
        }
        return TranslateResult(
            translatedText = translated,
            resolvedSourceLang = pair.source,
            resolvedTargetLang = pair.target,
            usedDetection = pair.usedDetection,
            engine = id,
        )
    }

    companion object {
        const val ENGINE_ID = "mymemory"

        fun endpoint(text: String, source: String, target: String): String {
            val q = URLEncoder.encode(text, Charsets.UTF_8.name())
            val pair = URLEncoder.encode("$source|$target", Charsets.UTF_8.name())
            return "https://api.mymemory.translated.net/get?q=$q&langpair=$pair"
        }

        fun parseBody(body: String): String {
            val trimmed = body.trim()
            if (trimmed.startsWith("<")) {
                throw TranslationException.Unavailable("The translation service returned a non-JSON response.")
            }
            val json = try {
                JSONObject(trimmed)
            } catch (_: Exception) {
                throw TranslationException.Unavailable("The translation service returned an unreadable response.")
            }
            val status = json.optInt("responseStatus", 0)
            val details = json.optString("responseDetails")
            val quota = json.optBoolean("quotaFinished", false)
            val translated = json.optJSONObject("responseData")?.optString("translatedText").orEmpty()
            val warning = translated.contains("MYMEMORY WARNING", ignoreCase = true) ||
                details.contains("MYMEMORY WARNING", ignoreCase = true)
            if (quota || status == 429 || warning) {
                throw TranslationException.RateLimited()
            }
            if (status != 200 || translated.isBlank()) {
                throw TranslationException.Unavailable(details.ifBlank { "Empty translation." })
            }
            return translated
        }

        fun httpGet(url: String): String {
            return try {
                httpGetSystemDns(url)
            } catch (error: UnknownHostException) {
                // Some devices (and emulators) have a route but no system resolver.
                // Ask Cloudflare for the address, then open TLS with the real hostname.
                try {
                    httpGetWithResolverFallback(url)
                } catch (fallback: TranslationException) {
                    throw fallback
                } catch (_: Exception) {
                    throw TranslationException.Offline()
                }
            }
        }

        fun firstARecord(body: String): String {
            val json = JSONObject(body)
            if (json.optInt("Status", -1) != 0) {
                throw TranslationException.Unavailable("Could not resolve the translation service.")
            }
            val answers = json.optJSONArray("Answer")
                ?: throw TranslationException.Unavailable("Could not resolve the translation service.")
            for (index in 0 until answers.length()) {
                val answer = answers.optJSONObject(index) ?: continue
                if (answer.optInt("type") == 1) {
                    val data = answer.optString("data")
                    if (data.isNotBlank()) return data
                }
            }
            throw TranslationException.Unavailable("Could not resolve the translation service.")
        }

        private fun httpGetSystemDns(url: String): String {
            val connection = (URI(url).toURL().openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 8_000
                readTimeout = 12_000
                setRequestProperty("Accept", "application/json")
                setRequestProperty("User-Agent", "DeutschWidget/1.0")
            }
            try {
                return readHttp(connection)
            } catch (error: TranslationException) {
                throw error
            } catch (error: UnknownHostException) {
                throw error
            } catch (_: SocketTimeoutException) {
                throw TranslationException.Offline()
            } catch (_: IOException) {
                throw TranslationException.Offline()
            } finally {
                connection.disconnect()
            }
        }

        private fun readHttp(connection: HttpURLConnection): String {
            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val body = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
            if (code == 429) throw TranslationException.RateLimited()
            if (code !in 200..299) {
                throw TranslationException.Unavailable("The translation service returned HTTP $code.")
            }
            return body
        }

        private fun httpGetWithResolverFallback(url: String): String {
            val parsed = URI(url)
            val host = parsed.host ?: throw TranslationException.Offline()
            val ip = resolveHost(host)
            val path = buildString {
                append(parsed.rawPath.ifBlank { "/" })
                if (!parsed.rawQuery.isNullOrEmpty()) {
                    append('?')
                    append(parsed.rawQuery)
                }
            }
            return tlsGet(ip = ip, host = host, path = path, accept = "application/json")
        }

        private fun resolveHost(host: String): String {
            val query = "/dns-query?name=${URLEncoder.encode(host, Charsets.UTF_8.name())}&type=A"
            val body = tlsGet(
                ip = "1.1.1.1",
                host = "cloudflare-dns.com",
                path = query,
                accept = "application/dns-json",
            )
            return firstARecord(body)
        }

        private fun tlsGet(ip: String, host: String, path: String, accept: String): String {
            val socket = SSLContextSocket(ip, host)
            try {
                val request = buildString {
                    append("GET $path HTTP/1.1\r\n")
                    append("Host: $host\r\n")
                    append("Accept: $accept\r\n")
                    append("User-Agent: DeutschWidget/1.0\r\n")
                    append("Connection: close\r\n\r\n")
                }
                socket.getOutputStream().write(request.toByteArray(Charsets.US_ASCII))
                socket.getOutputStream().flush()
                val raw = socket.getInputStream().readBytes()
                return parseHttp(raw)
            } finally {
                socket.close()
            }
        }

        private fun SSLContextSocket(ip: String, host: String): SSLSocket {
            val factory = javax.net.ssl.SSLContext.getDefault().socketFactory
            val socket = factory.createSocket() as SSLSocket
            socket.soTimeout = 12_000
            val parameters = socket.sslParameters
            parameters.serverNames = listOf(SNIHostName(host))
            socket.sslParameters = parameters
            socket.connect(InetSocketAddress(ip, 443), 8_000)
            socket.startHandshake()
            val verifier = HttpsURLConnection.getDefaultHostnameVerifier()
            if (!verifier.verify(host, socket.session)) {
                socket.close()
                throw TranslationException.Unavailable("Certificate did not match $host.")
            }
            return socket
        }

        internal fun parseHttp(raw: ByteArray): String {
            val headerEnd = indexOfHeaderEnd(raw)
            if (headerEnd < 0) {
                throw TranslationException.Unavailable("The translation service returned a truncated response.")
            }
            val headerText = raw.copyOfRange(0, headerEnd).toString(Charsets.US_ASCII)
            val status = headerText.lineSequence().firstOrNull().orEmpty()
            val code = status.split(' ').getOrNull(1)?.toIntOrNull() ?: 0
            if (code == 429) throw TranslationException.RateLimited()
            if (code !in 200..299) {
                throw TranslationException.Unavailable(
                    if (status.isBlank()) "The translation service returned HTTP $code." else status,
                )
            }
            val body = if (headerText.contains("chunked", ignoreCase = true)) {
                decodeChunks(raw.copyOfRange(headerEnd + 4, raw.size))
            } else {
                raw.copyOfRange(headerEnd + 4, raw.size)
            }
            return body.toString(Charsets.UTF_8)
        }

        private fun indexOfHeaderEnd(raw: ByteArray): Int {
            for (index in 0 until raw.size - 3) {
                if (raw[index] == '\r'.code.toByte() &&
                    raw[index + 1] == '\n'.code.toByte() &&
                    raw[index + 2] == '\r'.code.toByte() &&
                    raw[index + 3] == '\n'.code.toByte()
                ) {
                    return index
                }
            }
            return -1
        }

        private fun decodeChunks(raw: ByteArray): ByteArray {
            val out = java.io.ByteArrayOutputStream()
            var cursor = 0
            while (cursor < raw.size) {
                val lineEnd = indexOfCrlf(raw, cursor) ?: break
                val sizeText = raw.copyOfRange(cursor, lineEnd).toString(Charsets.US_ASCII)
                    .substringBefore(';')
                    .trim()
                val size = sizeText.toIntOrNull(16) ?: break
                if (size == 0) break
                val start = lineEnd + 2
                val end = start + size
                if (end > raw.size) break
                out.write(raw, start, size)
                cursor = end + 2
            }
            return out.toByteArray()
        }

        private fun indexOfCrlf(raw: ByteArray, from: Int): Int? {
            for (index in from until raw.size - 1) {
                if (raw[index] == '\r'.code.toByte() && raw[index + 1] == '\n'.code.toByte()) return index
            }
            return null
        }
    }
}
