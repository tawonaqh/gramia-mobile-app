package com.gramiatechnologies.gramia

import android.app.Notification
import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import java.util.Timer
import java.util.TimerTask
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.FormBody
import okhttp3.Call
import okhttp3.Callback
import okhttp3.Response
import java.io.IOException
class NotificationService : Service() {
    private var userId: String? = null
    private lateinit var timer: Timer

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        userId = intent?.getStringExtra("institution_user_id")

        startForeground(1, showNativeNotification("Easiwrap", "Notification service running"))

        timer = Timer()
        timer.scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                userId?.let {
                    checkForNotifications(it)
                }
            }
        }, 0, 10 * 60 * 1000) // Every 10 minutes

        return START_STICKY
    }

    private fun checkForNotifications(userId: String) {
        val url = "http://192.168.0.113:80/easiwrap/public/notification-count"
        val body = FormBody.Builder()
            .add("institution_user", userId)
            .add("api", "true")
            .build()

        val request = Request.Builder().url(url).post(body).build()
        val client = OkHttpClient()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {}
            override fun onResponse(call: Call, response: Response) {
                val responseText = response.body?.string()
                if (response.isSuccessful && responseText?.contains("record") == true) {
                    showNativeNotification("Easiwrap", "You have new notifications")
                }
            }
        })
    }

    private fun showNativeNotification(title: String, message: String): Notification {
        val builder = NotificationCompat.Builder(this, "easiwrap_channel")
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_HIGH)

        return builder.build()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        timer.cancel()
        super.onDestroy()
    }
}