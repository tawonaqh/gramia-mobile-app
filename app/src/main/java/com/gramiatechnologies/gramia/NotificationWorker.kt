package com.gramiatechnologies.gramia

import android.content.Context
import android.util.Log
import androidx.work.Worker
import androidx.work.WorkerParameters
import okhttp3.*
import org.json.JSONObject
import java.io.IOException

class NotificationWorker(appContext: Context, workerParams: WorkerParameters) : Worker(appContext, workerParams) {

    override fun doWork(): Result {
        val institutionUserId = inputData.getString("institution_user_id") ?: return Result.failure()
        val useriD = inputData.getString("userId") ?: return Result.failure()

        val client = OkHttpClient()
        var url = ""
        //url = "http://192.168.0.184:80/easiwrap/public/tray-notification-count" // update this to your actual API
       // url = "http://localhost/easiwrap/public/tray-notification-count" // update this to your actual API
        url = "http://139.84.233.196:80/gramia/public/tray-notification-count" // update this to your actual API

        val formBody = FormBody.Builder()
            .add("institution_user", institutionUserId)
            .add("api", "true")
            .add("user", useriD)
            .add("clear", "true")
            .build()

        val request = Request.Builder()
            .url(url)
            .post(formBody)
            .build()

        try {
            val response = client.newCall(request).execute()
            val responseBody = response.body?.string()
            Log.e("NotificationWorker", "Server response: $responseBody")  // 🔍 Print full response

            val json = JSONObject(responseBody ?: "{}")

            val count = json.getInt("count")

            if (count > 0 && json.has("records")) {
                val records = json.getJSONArray("records")
                for (i in 0 until records.length()) {
                    val notif = records.getJSONObject(i)
                    val title = notif.getString("title")
                    val message = notif.getString("message")
                    NotificationUtils.showNotification(applicationContext, title, message)
                }
            }

            return Result.success()

        } catch (e: IOException) {
            e.printStackTrace()
            return Result.retry()
        }
    }
}