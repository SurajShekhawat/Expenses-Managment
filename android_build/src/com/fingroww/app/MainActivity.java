package com.fingroww.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity implements View.OnClickListener, DialogInterface.OnClickListener {

    public static final String PREFS_NAME = "FinGrowwPrefs";
    public static final String KEY_SERVER_URL = "server_url";
    public static final String DEFAULT_URL = "http://10.186.249.221:3000";
    public static final int FILE_CHOOSER_REQUEST = 1001;
    public static final int PERMISSION_REQUEST_CODE = 2001;

    private WebView webView;
    private ProgressBar loadingSpinner;
    private View errorLayout;
    private TextView errorMessage;
    private Button btnRetry;
    private Button btnChangeIp;
    private ValueCallback<Uri[]> filePathCallback;
    private SharedPreferences prefs;
    private EditText inputDialog;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        webView = (WebView) findViewById(R.id.webview);
        loadingSpinner = (ProgressBar) findViewById(R.id.loading_spinner);
        errorLayout = findViewById(R.id.error_layout);
        errorMessage = (TextView) findViewById(R.id.error_message);
        btnRetry = (Button) findViewById(R.id.btn_retry);
        btnChangeIp = (Button) findViewById(R.id.btn_change_ip);

        btnRetry.setOnClickListener(this);
        btnChangeIp.setOnClickListener(this);

        setupWebView();
        requestAudioPermissions();
        loadApp();
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebViewClient(new AppWebViewClient(this));
        webView.setWebChromeClient(new AppWebChromeClient(this));
    }

    public void showLoading(boolean show) {
        if (loadingSpinner != null) {
            loadingSpinner.setVisibility(show ? View.VISIBLE : View.GONE);
        }
    }

    public void showError(boolean show, String message) {
        if (errorLayout != null) {
            errorLayout.setVisibility(show ? View.VISIBLE : View.GONE);
            if (show && errorMessage != null && message != null) {
                errorMessage.setText(message);
            }
        }
    }

    public void handleFileChooser(ValueCallback<Uri[]> callback) {
        if (filePathCallback != null) {
            filePathCallback.onReceiveValue(null);
        }
        filePathCallback = callback;

        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        startActivityForResult(Intent.createChooser(intent, "Select File / CSV"), FILE_CHOOSER_REQUEST);
    }

    @Override
    public void onClick(View v) {
        int id = v.getId();
        if (id == R.id.btn_retry) {
            loadApp();
        } else if (id == R.id.btn_change_ip) {
            showChangeIpDialog();
        }
    }

    private void loadApp() {
        String url = prefs.getString(KEY_SERVER_URL, DEFAULT_URL);
        webView.loadUrl(url);
    }

    private void showChangeIpDialog() {
        inputDialog = new EditText(this);
        String currentUrl = prefs.getString(KEY_SERVER_URL, DEFAULT_URL);
        inputDialog.setText(currentUrl);

        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("FinGroww Server IP / URL");
        builder.setMessage("Laptop ka current local IP ya Vercel URL enter karein (e.g. http://192.168.1.15:3000):");
        builder.setView(inputDialog);
        builder.setPositiveButton("Save & Connect", this);
        builder.setNegativeButton("Cancel", null);
        builder.show();
    }

    @Override
    public void onClick(DialogInterface dialog, int which) {
        if (which == DialogInterface.BUTTON_POSITIVE && inputDialog != null) {
            String newUrl = inputDialog.getText().toString().trim();
            if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
                newUrl = "http://" + newUrl;
            }
            prefs.edit().putString(KEY_SERVER_URL, newUrl).apply();
            Toast.makeText(this, "Connecting to: " + newUrl, Toast.LENGTH_SHORT).show();
            loadApp();
        }
    }

    private void requestAudioPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{android.Manifest.permission.RECORD_AUDIO}, PERMISSION_REQUEST_CODE);
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (filePathCallback != null) {
                Uri[] results = null;
                if (resultCode == RESULT_OK && data != null) {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    }
                }
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
