package com.gramiatechnologies.gramia

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import okhttp3.Call
import okhttp3.Callback
import okhttp3.FormBody
import okhttp3.OkHttpClient
import okhttp3.Request
import android.util.Log
import androidx.work.Worker
import androidx.work.WorkerParameters
import androidx.work.impl.utils.ForceStopRunnable
import okhttp3.*
import org.json.JSONObject
import java.io.IOException

class NotificationClickReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val notificationId = intent.getIntExtra("notificationId", -1)
        if (notificationId != -1) {
            clearNotificationOnServer(context, notificationId)
        }
    }

    private fun clearNotificationOnServer(context: Context, notificationId: Int) {
        val client = OkHttpClient()
        val url = "http://192.168.0.113:80/gramia/public/clear-notification"

        val formBody = FormBody.Builder()
            .add("notification_id", notificationId.toString())
            .add("api", "true")
            .build()

        val request = Request.Builder().url(url).post(formBody).build()
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e("ClearNotif", "Failed to notify server", e)
            }

            override fun onResponse(call: Call, response: Response) {
                Log.i("ClearNotif", "Server acknowledged notification clear")
            }
        })
    }
}