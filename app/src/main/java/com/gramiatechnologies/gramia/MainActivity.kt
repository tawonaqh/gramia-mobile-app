package com.gramiatechnologies.gramia

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.annotation.RequiresApi
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf

import android.util.Base64
import android.webkit.WebSettings
import java.io.File
import java.io.FileOutputStream
import androidx.core.content.FileProvider

class MainActivity : ComponentActivity() {
    private lateinit var myWebView: WebView
    val FILE_CHOOSER_REQUEST_CODE = 1000
    private val NOTIFICATION_PERMISSION_REQUEST_CODE = 2000
    @RequiresApi(Build.VERSION_CODES.O)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        myWebView = findViewById(R.id.myWebView)
        val webSettings = myWebView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true // ✅ THIS LINE
        webSettings.allowFileAccess = true
        webSettings.allowFileAccessFromFileURLs = true
        webSettings.allowUniversalAccessFromFileURLs = true
        webSettings.allowContentAccess = true
        // In your Activity
        myWebView.addJavascriptInterface(WebAppInterface(), "AndroidInterface")
        //myWebView.setRenderPriority(WebSettings.RenderPriority.HIGH) // For older versions
        myWebView.webViewClient = WebViewClient()
        // So everything opens in this WebView instead of an external browser

        myWebView.loadUrl("file:///android_asset/index.html")
        myWebView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
                if (url == "exit://app") {
                    finishAffinity() // or finish() depending on behavior
                    return true
                }
                return false
            }
        }
        myWebView.webChromeClient = MyWebChromeClient(this)
        val channel = NotificationChannel(
            "easiwrap_channel",
            "Easiwrap Notifications",
            NotificationManager.IMPORTANCE_HIGH
        )
        requestNotificationPermissionIfNeeded()
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)
    }
    fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
            ) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    NOTIFICATION_PERMISSION_REQUEST_CODE
                )
            }
        }
    }
    fun scheduleNotificationPolling(context: Context, institutionUserId: String, userId: String) {
        val sharedPreferences = context.getSharedPreferences("easiwrap_prefs", Context.MODE_PRIVATE)
        val lastInstitutionUserId = sharedPreferences.getString("last_institution_user_id", null)

        if (institutionUserId == lastInstitutionUserId) {
            // No change — do not reschedule
            return
        }

        // Save the new ID
        sharedPreferences.edit().putString("last_institution_user_id", institutionUserId).apply()

        val inputData = workDataOf(
            "institution_user_id" to institutionUserId,
            "userId" to userId
        )

        val workRequest = PeriodicWorkRequestBuilder<NotificationWorker>(15, java.util.concurrent.TimeUnit.MINUTES)
            .setInputData(inputData)
            .build()

        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(
                "notificationPolling",
                ExistingPeriodicWorkPolicy.REPLACE,  // Replace since we need to update the ID
                workRequest
            )
    }
    @RequiresApi(Build.VERSION_CODES.O)
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        (myWebView.webChromeClient as? MyWebChromeClient)?.onActivityResult(requestCode, resultCode, data)
    }
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == NOTIFICATION_PERMISSION_REQUEST_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(this, "Notification permission granted", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "Notification permission denied", Toast.LENGTH_SHORT).show()
            }
        }
    }
    @Suppress("MissingSuperCall")
    override fun onBackPressed() {
        myWebView.evaluateJavascript("goBackView();", null)
    }

    inner class WebAppInterface {
        @JavascriptInterface
        fun openUrlExternally(url: String) {
            val intent = Intent(Intent.ACTION_VIEW)
            intent.data = Uri.parse(url)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            this@MainActivity.startActivity(intent)
        }
        @JavascriptInterface
        fun showToast(message: String) {
            Toast.makeText(this@MainActivity, message, Toast.LENGTH_SHORT).show()
        }
        @JavascriptInterface
        fun startNotificationPolling(institutionUserId: String, userId: String) {
            runOnUiThread {
                scheduleNotificationPolling(this@MainActivity, institutionUserId, userId)
            }
        }
        @JavascriptInterface
        fun saveBase64PDF(base64: String, filename: String) {
            try {
                val pdfData = base64.substringAfter("base64,", "")
                val bytes = Base64.decode(pdfData, Base64.DEFAULT)

                val file = File(this@MainActivity.getExternalFilesDir(null), filename)
                FileOutputStream(file).use { it.write(bytes) }

                val uri = FileProvider.getUriForFile(
                    this@MainActivity,
                    "${this@MainActivity.packageName}.provider",
                    file
                )

                val intent = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(uri, "application/pdf")
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }

                this@MainActivity.startActivity(intent)

            } catch (e: Exception) {
                e.printStackTrace()
            }
        }


        @JavascriptInterface
        fun requestNotificationPermission() {
            requestNotificationPermissionIfNeeded()
        }
        @JavascriptInterface
        fun startBackgroundNotificationService(userId: String) {
            val intent = Intent(this@MainActivity, NotificationService::class.java)
            intent.putExtra("institution_user_id", userId)
            startService(intent)
        }
        @JavascriptInterface
        fun showNativeNotification(title: String, message: String) {
            val builder = NotificationCompat.Builder(this@MainActivity, "easiwrap_channel")
                .setSmallIcon(R.drawable.ic_notification_ee) // make sure this icon exists
                .setContentTitle(title)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_HIGH)

            val notificationManager = NotificationManagerCompat.from(this@MainActivity)
            if (ActivityCompat.checkSelfPermission(
                    this@MainActivity,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                // TODO: Consider calling
                //    ActivityCompat#requestPermissions
                // here to request the missing permissions, and then overriding
                //   public void onRequestPermissionsResult(int requestCode, String[] permissions,
                //                                          int[] grantResults)
                // to handle the case where the user grants the permission. See the documentation
                // for ActivityCompat#requestPermissions for more details.
                return
            }
            notificationManager.notify(System.currentTimeMillis().toInt(), builder.build())
        }
    }

    inner class MyWebChromeClient(private val activity: ComponentActivity) : android.webkit.WebChromeClient() {
        private var filePathCallback: android.webkit.ValueCallback<Array<android.net.Uri>>? = null

        override fun onShowFileChooser(
            webView: WebView,
            filePathCallback: android.webkit.ValueCallback<Array<android.net.Uri>>,
            fileChooserParams: FileChooserParams
        ): Boolean {
            this.filePathCallback?.onReceiveValue(null)
            this.filePathCallback = filePathCallback

            val intent = fileChooserParams.createIntent()
            try {
                activity.startActivityForResult(intent, FILE_CHOOSER_REQUEST_CODE)
            } catch (e: android.content.ActivityNotFoundException) {
                this.filePathCallback = null
                Toast.makeText(activity, "Cannot open file chooser", Toast.LENGTH_SHORT).show()
                return false
            }
            return true
        }

        fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
            if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
                val results: Array<android.net.Uri>? = if (resultCode == RESULT_OK && data != null) {
                    FileChooserParams.parseResult(resultCode, data)
                } else null
                filePathCallback?.onReceiveValue(results)
                filePathCallback = null
            }
        }


    }

}
