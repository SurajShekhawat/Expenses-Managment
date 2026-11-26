package com.fingroww.app;

import android.graphics.Bitmap;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class AppWebViewClient extends WebViewClient {
    private MainActivity activity;

    public AppWebViewClient(MainActivity activity) {
        this.activity = activity;
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        if (request != null && request.getUrl() != null) {
            view.loadUrl(request.getUrl().toString());
            return true;
        }
        return false;
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        view.loadUrl(url);
        return true;
    }

    @Override
    public void onPageStarted(WebView view, String url, Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
        activity.showLoading(true);
        activity.showError(false, null);
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        activity.showLoading(false);
    }

    @Override
    public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
        super.onReceivedError(view, request, error);
        if (request.isForMainFrame()) {
            activity.showLoading(false);
            activity.showError(true, "Could not connect to FinGroww server: " + error.getDescription());
        }
    }
}
