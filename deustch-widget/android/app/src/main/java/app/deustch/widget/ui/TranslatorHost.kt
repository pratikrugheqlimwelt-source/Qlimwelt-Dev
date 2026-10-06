package app.deustch.widget.ui

internal interface TranslatorHost {
    fun dragBy(dx: Int, dy: Int)
    fun snapToEdge()
    fun onChromeChanged(expanded: Boolean)
}
