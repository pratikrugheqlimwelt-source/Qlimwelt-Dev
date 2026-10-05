package app.deustch.widget.ui

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.util.AttributeSet
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.FrameLayout
import android.widget.TextView
import androidx.core.view.isVisible
import app.deustch.widget.R
import app.deustch.widget.databinding.ViewFloatingTranslatorBinding
import app.deustch.widget.engine.EngineConfig
import app.deustch.widget.translate.Languages
import app.deustch.widget.translate.TranslateRequest
import app.deustch.widget.translate.TranslationException
import kotlin.math.hypot
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

internal class FloatingTranslatorView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : FrameLayout(context, attrs) {
    private val binding = ViewFloatingTranslatorBinding.inflate(LayoutInflater.from(context), this, true)
    private val prefs = BubblePrefs(context)
    private val engine = EngineConfig.create()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var translateJob: Job? = null
    private var expanded = false
    private var pickingSource = true
    private var sourceCode = prefs.sourceLang
    private var targetCode = prefs.targetLang
    private var lastResolvedSource = if (targetCode == "en") "de" else "en"
    private var dragging = false
    private var downX = 0f
    private var downY = 0f
    private var lastX = 0f
    private var lastY = 0f

    lateinit var host: TranslatorHost

    init {
        binding.sourceLang.setOnClickListener { showPicker(forSource = true) }
        binding.targetLang.setOnClickListener { showPicker(forSource = false) }
        binding.swapButton.setOnClickListener { swap() }
        binding.closeButton.setOnClickListener { setExpanded(false) }
        binding.translateButton.setOnClickListener { translate() }
        binding.copyButton.setOnClickListener { copyResult() }
        binding.sourceInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                translate()
                true
            } else {
                false
            }
        }
        binding.bubble.setOnTouchListener(dragTouch(toggleOnTap = true))
        binding.dragHandle.setOnTouchListener(dragTouch(toggleOnTap = false))
        renderLanguages()
        binding.pairLabel.text = pairPreview()
    }

    fun prefillAndExpand(text: String) {
        setExpanded(true)
        binding.sourceInput.setText(text)
        binding.sourceInput.setSelection(text.length)
        translate()
    }

    override fun onDetachedFromWindow() {
        translateJob?.cancel()
        scope.cancel()
        super.onDetachedFromWindow()
    }

    private fun setExpanded(value: Boolean) {
        if (expanded == value) return
        expanded = value
        binding.bubble.isVisible = !value
        binding.panel.isVisible = value
        if (!value) binding.languagePicker.isVisible = false
        if (::host.isInitialized) host.onChromeChanged(value)
    }

    private fun showPicker(forSource: Boolean) {
        if (binding.languagePicker.isVisible && pickingSource == forSource) {
            binding.languagePicker.isVisible = false
            return
        }
        pickingSource = forSource
        binding.languageList.removeAllViews()
        val options = if (forSource) listOf(Languages.auto) + Languages.all else Languages.all
        for (language in options) {
            val row = TextView(context).apply {
                text = language.label
                textSize = 15f
                setTextColor(context.getColor(R.color.ink))
                val pad = dp(12)
                setPadding(pad, dp(10), pad, dp(10))
                setOnClickListener {
                    if (forSource) {
                        sourceCode = language.code
                        prefs.sourceLang = language.code
                    } else {
                        targetCode = language.code
                        prefs.targetLang = language.code
                    }
                    renderLanguages()
                    binding.languagePicker.isVisible = false
                    binding.pairLabel.text = pairPreview()
                }
            }
            binding.languageList.addView(row)
        }
        binding.languagePicker.isVisible = true
    }

    private fun swap() {
        val newSource = if (sourceCode == Languages.auto.code) targetCode else targetCode
        val newTarget = if (sourceCode == Languages.auto.code) lastResolvedSource else sourceCode
        sourceCode = newSource
        targetCode = if (newTarget == newSource) {
            if (newSource == "en") "de" else "en"
        } else {
            newTarget
        }
        prefs.sourceLang = sourceCode
        prefs.targetLang = targetCode
        renderLanguages()
        binding.pairLabel.text = pairPreview()
    }

    private fun renderLanguages() {
        binding.sourceLang.text = Languages.label(sourceCode)
        binding.targetLang.text = Languages.label(targetCode)
    }

    private fun pairPreview(): String {
        val from = Languages.label(sourceCode)
        val to = Languages.label(targetCode)
        return "$from → $to"
    }

    private fun translate() {
        val text = binding.sourceInput.text?.toString().orEmpty()
        if (text.isBlank()) {
            showError(context.getString(R.string.enter_text))
            return
        }
        translateJob?.cancel()
        translateJob = scope.launch {
            binding.translateButton.isEnabled = false
            binding.translateButton.text = context.getString(R.string.translating)
            binding.errorText.isVisible = false
            try {
                val result = withContext(Dispatchers.IO) {
                    engine.translate(TranslateRequest(text, sourceCode, targetCode))
                }
                lastResolvedSource = result.resolvedSourceLang
                binding.resultText.text = result.translatedText
                binding.resultText.setTextColor(context.getColor(R.color.ink))
                binding.pairLabel.text = result.pairLabel
                binding.copyButton.text = context.getString(R.string.copy)
            } catch (error: TranslationException) {
                showError(error.message ?: context.getString(R.string.enter_text))
            } catch (_: kotlinx.coroutines.CancellationException) {
                throw kotlinx.coroutines.CancellationException()
            } catch (error: Exception) {
                showError(error.message ?: "Translation failed.")
            } finally {
                binding.translateButton.isEnabled = true
                binding.translateButton.text = context.getString(R.string.translate)
            }
        }
    }

    private fun showError(message: String) {
        binding.errorText.text = message
        binding.errorText.isVisible = true
    }

    private fun copyResult() {
        val text = binding.resultText.text?.toString().orEmpty()
        if (text.isBlank() || text == context.getString(R.string.result_placeholder)) return
        val clipboard = context.getSystemService(ClipboardManager::class.java)
        clipboard?.setPrimaryClip(ClipData.newPlainText("translation", text))
        binding.copyButton.text = context.getString(R.string.copied)
    }

    private fun dragTouch(toggleOnTap: Boolean): OnTouchListener {
        return OnTouchListener { _, event ->
            if (!::host.isInitialized) return@OnTouchListener false
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    dragging = false
                    downX = event.rawX
                    downY = event.rawY
                    lastX = event.rawX
                    lastY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val travel = hypot(event.rawX - downX, event.rawY - downY)
                    if (!dragging && travel > dp(4)) dragging = true
                    if (dragging) {
                        host.dragBy((event.rawX - lastX).toInt(), (event.rawY - lastY).toInt())
                        lastX = event.rawX
                        lastY = event.rawY
                    }
                    true
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    if (dragging) {
                        host.snapToEdge()
                    } else if (event.actionMasked == MotionEvent.ACTION_UP && toggleOnTap) {
                        setExpanded(!expanded)
                    }
                    true
                }
                else -> false
            }
        }
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}
