package com.gramiatechnologies.gramia

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.work.*
import com.gramiatechnologies.gramia.NotificationWorker
import java.util.concurrent.TimeUnit

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action == Intent.ACTION_BOOT_COMPLETED) {

            val sharedPrefs = context.getSharedPreferences("easiwrap_prefs", Context.MODE_PRIVATE)
            val institutionUserId = sharedPrefs.getString("last_institution_user_id", null)
            val userId = sharedPrefs.getString("user_id", null)

            if (!institutionUserId.isNullOrEmpty() && !userId.isNullOrEmpty()) {
                val inputData = workDataOf(
                    "institution_user_id" to institutionUserId,
                    "userId" to userId
                )

                val workRequest = PeriodicWorkRequestBuilder<NotificationWorker>(15, TimeUnit.MINUTES)
                    .setInputData(inputData)
                    .build()

                WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                    "notificationPolling", // ✅ Use consistent name
                    ExistingPeriodicWorkPolicy.KEEP, // ✅ Keep existing if already scheduled
                    workRequest
                )
            }
        }
    }
}