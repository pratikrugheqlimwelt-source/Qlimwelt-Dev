package app.deustch.widget.translate

object EdgeSnap {
    fun x(x: Int, width: Int, screenWidth: Int, margin: Int): Int {
        val center = x + width / 2.0
        return if (center < screenWidth / 2.0) margin else screenWidth - width - margin
    }

    fun clampY(y: Int, height: Int, screenHeight: Int, margin: Int): Int {
        val max = (screenHeight - height - margin).coerceAtLeast(margin)
        return y.coerceIn(margin, max)
    }
}
