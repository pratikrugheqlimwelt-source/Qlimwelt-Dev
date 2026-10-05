package app.deustch.widget.ui

import android.animation.ValueAnimator
import android.view.ViewGroup
import android.widget.FrameLayout
import app.deustch.widget.translate.EdgeSnap
import kotlin.math.roundToInt

/**
 * Same expander as the system bubble, hosted inside the activity so translation
 * works before overlay permission is granted.
 */
internal class InAppTranslatorHost(
    private val container: FrameLayout,
    val view: FloatingTranslatorView,
) : TranslatorHost {
    private val prefs = BubblePrefs(container.context)
    private var snapRight = prefs.snapRight
    private var dragging = false
    private var animator: ValueAnimator? = null

    init {
        view.host = this
        container.addView(
            view,
            FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
            ),
        )
        container.addOnLayoutChangeListener { _, _, _, _, _, _, _, _, _ ->
            if (!dragging) place(animate = false)
        }
        view.post { place(animate = false) }
    }

    fun setVisible(visible: Boolean) {
        view.visibility = if (visible) android.view.View.VISIBLE else android.view.View.GONE
    }

    override fun dragBy(dx: Int, dy: Int) {
        dragging = true
        animator?.cancel()
        view.x += dx
        view.y += dy
    }

    override fun snapToEdge() {
        dragging = false
        val size = screen()
        snapRight = view.x + view.width / 2f >= size.first / 2f
        prefs.snapRight = snapRight
        place(animate = true)
    }

    override fun onChromeChanged(expanded: Boolean) {
        view.post { place(animate = true) }
    }

    private fun place(animate: Boolean) {
        val (screenW, screenH) = screen()
        if (screenW == 0 || view.width == 0) return
        val margin = dp(12)
        val targetX = EdgeSnap.x(if (snapRight) screenW else 0, view.width, screenW, margin)
        val currentY = if (view.y == 0f && !dragging) {
            (prefs.yFraction * screenH - view.height / 2f).roundToInt()
        } else {
            view.y.roundToInt()
        }
        val targetY = EdgeSnap.clampY(currentY, view.height, screenH, margin)
        prefs.yFraction = ((targetY + view.height / 2f) / screenH).coerceIn(0.1f, 0.9f)
        if (!animate) {
            view.x = targetX.toFloat()
            view.y = targetY.toFloat()
            return
        }
        animator?.cancel()
        val startX = view.x
        val startY = view.y
        animator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 180
            addUpdateListener { value ->
                val t = value.animatedFraction
                view.x = startX + (targetX - startX) * t
                view.y = startY + (targetY - startY) * t
            }
            start()
        }
    }

    private fun screen(): Pair<Int, Int> = container.width to container.height

    private fun dp(value: Int): Int = (value * container.resources.displayMetrics.density).toInt()
}
