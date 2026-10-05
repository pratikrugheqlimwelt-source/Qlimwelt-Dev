package app.deustch.widget.overlay

import android.animation.ValueAnimator
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.util.DisplayMetrics
import android.view.ContextThemeWrapper
import android.view.Gravity
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import app.deustch.widget.MainActivity
import app.deustch.widget.R
import app.deustch.widget.translate.EdgeSnap
import app.deustch.widget.ui.BubblePrefs
import app.deustch.widget.ui.FloatingTranslatorView
import app.deustch.widget.ui.TranslatorHost
import kotlin.math.roundToInt

/**
 * Real draw-over-other-apps bubble. The view is a system overlay window
 * (TYPE_APPLICATION_OVERLAY), not an in-app decoration.
 */
class BubbleOverlayService : Service(), TranslatorHost {
    private lateinit var windowManager: WindowManager
    private lateinit var bubble: FloatingTranslatorView
    private lateinit var params: WindowManager.LayoutParams
    private lateinit var prefs: BubblePrefs
    private var snapRight = true
    private var animator: ValueAnimator? = null
    private var attached = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        isRunning = true
        prefs = BubblePrefs(this)
        snapRight = prefs.snapRight
        createChannel()
        startAsForeground()
        try {
            attachWindow()
        } catch (_: Exception) {
            stopSelf()
            return
        }
        broadcastState()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopSelf()
                return START_NOT_STICKY
            }
        }
        val text = intent?.getStringExtra(EXTRA_TEXT)
        if (!text.isNullOrBlank() && ::bubble.isInitialized) {
            bubble.prefillAndExpand(text)
        }
        return START_STICKY
    }

    override fun onDestroy() {
        animator?.cancel()
        if (attached) {
            try {
                windowManager.removeView(bubble)
            } catch (_: Exception) {
                // Already detached.
            }
            attached = false
        }
        isRunning = false
        broadcastState()
        super.onDestroy()
    }

    override fun dragBy(dx: Int, dy: Int) {
        animator?.cancel()
        params.x += dx
        params.y += dy
        updateLayout()
    }

    override fun snapToEdge() {
        val size = screen()
        snapRight = params.x + bubble.width / 2 >= size.first / 2
        prefs.snapRight = snapRight
        place(animate = true)
    }

    override fun onChromeChanged(expanded: Boolean) {
        applyFocus(expanded)
        bubble.post { bubble.post { place(animate = true) } }
    }

    private fun attachWindow() {
        windowManager = getSystemService(WindowManager::class.java)
        val themed = ContextThemeWrapper(this, R.style.Theme_DeutschWidget)
        bubble = FloatingTranslatorView(themed)
        bubble.host = this
        params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
            PixelFormat.TRANSLUCENT,
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 0
            y = 0
            softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN
        }
        windowManager.addView(bubble, params)
        attached = true
        bubble.viewTreeObserver.addOnGlobalLayoutListener {
            if (attached && bubble.width > 0 && params.x == 0 && params.y == 0) {
                place(animate = false)
            }
        }
    }

    private fun applyFocus(expanded: Boolean) {
        val base = WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
            WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED or
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
        params.flags = if (expanded) {
            base
        } else {
            base or WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
        }
        updateLayout()
    }

    private fun place(animate: Boolean) {
        if (!attached || bubble.width == 0) return
        val (screenW, screenH) = screen()
        val margin = dp(12)
        val targetX = EdgeSnap.x(if (snapRight) screenW else 0, bubble.width, screenW, margin)
        val currentY = if (params.y == 0) {
            (prefs.yFraction * screenH - bubble.height / 2f).roundToInt()
        } else {
            params.y
        }
        val targetY = EdgeSnap.clampY(currentY, bubble.height, screenH, margin + statusBar())
        prefs.yFraction = ((targetY + bubble.height / 2f) / screenH).coerceIn(0.1f, 0.9f)
        if (!animate) {
            params.x = targetX
            params.y = targetY
            updateLayout()
            return
        }
        animator?.cancel()
        val startX = params.x
        val startY = params.y
        animator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 180
            addUpdateListener { value ->
                val t = value.animatedFraction
                params.x = (startX + (targetX - startX) * t).roundToInt()
                params.y = (startY + (targetY - startY) * t).roundToInt()
                updateLayout()
            }
            start()
        }
    }

    private fun updateLayout() {
        if (!attached) return
        try {
            windowManager.updateViewLayout(bubble, params)
        } catch (_: Exception) {
            attached = false
            stopSelf()
        }
    }

    private fun screen(): Pair<Int, Int> {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val bounds = windowManager.currentWindowMetrics.bounds
            bounds.width() to bounds.height()
        } else {
            val metrics = DisplayMetrics()
            @Suppress("DEPRECATION")
            windowManager.defaultDisplay.getRealMetrics(metrics)
            metrics.widthPixels to metrics.heightPixels
        }
    }

    private fun statusBar(): Int {
        val id = resources.getIdentifier("status_bar_height", "dimen", "android")
        return if (id > 0) resources.getDimensionPixelSize(id) else dp(24)
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private fun startAsForeground() {
        val notification = buildNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun buildNotification(): Notification {
        val open = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE,
        )
        val stop = PendingIntent.getService(
            this,
            1,
            Intent(this, BubbleOverlayService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_IMMUTABLE,
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_translate)
            .setContentTitle(getString(R.string.notif_title))
            .setContentText(getString(R.string.notif_text))
            .setOngoing(true)
            .setContentIntent(open)
            .addAction(0, getString(R.string.notif_stop), stop)
            .build()
    }

    private fun createChannel() {
        val manager = getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(
            CHANNEL_ID,
            getString(R.string.notif_channel),
            NotificationManager.IMPORTANCE_LOW,
        )
        manager.createNotificationChannel(channel)
    }

    private fun broadcastState() {
        sendBroadcast(Intent(ACTION_OVERLAY_STATE).setPackage(packageName))
    }

    companion object {
        const val ACTION_STOP = "app.deustch.widget.STOP_BUBBLE"
        const val ACTION_OVERLAY_STATE = "app.deustch.widget.OVERLAY_STATE"
        const val EXTRA_TEXT = "text"
        private const val CHANNEL_ID = "bubble"
        private const val NOTIFICATION_ID = 42

        @Volatile
        var isRunning: Boolean = false
            private set
    }
}
