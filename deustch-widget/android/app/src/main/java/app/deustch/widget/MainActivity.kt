package app.deustch.widget

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.FrameLayout
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import app.deustch.widget.databinding.ActivityMainBinding
import app.deustch.widget.overlay.BubbleOverlayService
import app.deustch.widget.ui.FloatingTranslatorView
import app.deustch.widget.ui.InAppTranslatorHost

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var inApp: InAppTranslatorHost
    private var pendingOverlayStart = false

    private val notificationPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { /* The bubble still runs if notifications are denied. */ }

    private val overlayReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            renderOverlayState()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        val host = findViewById<FrameLayout>(R.id.root)
        inApp = InAppTranslatorHost(host, FloatingTranslatorView(this))
        binding.overlayButton.setOnClickListener { onOverlayButton() }
        consumeShare(intent)
        renderOverlayState()
    }

    override fun onStart() {
        super.onStart()
        ContextCompat.registerReceiver(
            this,
            overlayReceiver,
            android.content.IntentFilter(BubbleOverlayService.ACTION_OVERLAY_STATE),
            ContextCompat.RECEIVER_NOT_EXPORTED,
        )
    }

    override fun onResume() {
        super.onResume()
        if (pendingOverlayStart && Settings.canDrawOverlays(this)) {
            pendingOverlayStart = false
            startBubble()
        }
        renderOverlayState()
    }

    override fun onStop() {
        unregisterReceiver(overlayReceiver)
        super.onStop()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        consumeShare(intent)
    }

    private fun onOverlayButton() {
        if (BubbleOverlayService.isRunning) {
            stopService(Intent(this, BubbleOverlayService::class.java))
            return
        }
        if (!Settings.canDrawOverlays(this)) {
            explainThenRequestOverlay()
            return
        }
        startBubble()
    }

    private fun explainThenRequestOverlay() {
        AlertDialog.Builder(this)
            .setTitle(R.string.permission_title)
            .setMessage(R.string.permission_body)
            .setNegativeButton(R.string.permission_not_now, null)
            .setPositiveButton(R.string.permission_continue) { _, _ ->
                pendingOverlayStart = true
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:$packageName"),
                )
                startActivity(intent)
            }
            .show()
    }

    private fun startBubble() {
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
        ContextCompat.startForegroundService(this, Intent(this, BubbleOverlayService::class.java))
    }

    private fun consumeShare(intent: Intent?) {
        if (intent?.action != Intent.ACTION_SEND) return
        val text = intent.getStringExtra(Intent.EXTRA_TEXT)?.trim().orEmpty()
        if (text.isEmpty()) return
        if (BubbleOverlayService.isRunning) {
            startService(
                Intent(this, BubbleOverlayService::class.java)
                    .putExtra(BubbleOverlayService.EXTRA_TEXT, text),
            )
        } else {
            inApp.view.prefillAndExpand(text)
        }
        intent.action = null
    }

    private fun renderOverlayState() {
        val running = BubbleOverlayService.isRunning
        val allowed = Settings.canDrawOverlays(this)
        inApp.setVisible(!running)
        binding.overlayStatus.setText(
            when {
                running -> R.string.overlay_on
                allowed -> R.string.overlay_off
                else -> R.string.overlay_needs_permission
            },
        )
        binding.overlayButton.setText(
            when {
                running -> R.string.hide_bubble
                allowed -> R.string.show_bubble
                else -> R.string.allow_overlay
            },
        )
    }
}
