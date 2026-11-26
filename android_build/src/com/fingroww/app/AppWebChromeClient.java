package com.fingroww.app;

import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.PermissionRequest;
import android.content.Intent;
import android.net.Uri;

public class AppWebChromeClient extends WebChromeClient {
    private MainActivity activity;

    public AppWebChromeClient(MainActivity activity) {
        this.activity = activity;
    }

    @Override
    public void onPermissionRequest(PermissionRequest request) {
        request.grant(request.getResources());
    }

    @Override
    public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback,
                                      FileChooserParams fileChooserParams) {
        activity.handleFileChooser(filePathCallback);
        return true;
    }
}
