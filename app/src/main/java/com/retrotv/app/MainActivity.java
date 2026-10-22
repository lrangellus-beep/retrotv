package com.retrotv.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.util.Base64;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends Activity {

    private WebView web;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        web.setBackgroundColor(0xFF0A1020);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        web.loadUrl("file:///android_asset/index.html");
        web.requestFocus();
    }

    /** Ponte JS -> Android: baixa listas M3U sem esbarrar em CORS. */
    private class Bridge {
        @JavascriptInterface
        public void fetchText(final String url, final String cbId) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    String result;
                    try {
                        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                        c.setConnectTimeout(15000);
                        c.setReadTimeout(30000);
                        c.setInstanceFollowRedirects(true);
                        c.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 11) RetroTV/1.0");
                        InputStream in = c.getInputStream();
                        ByteArrayOutputStream out = new ByteArrayOutputStream();
                        byte[] buf = new byte[16384];
                        int n;
                        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                        in.close();
                        result = "true,'" + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP) + "'";
                    } catch (Exception e) {
                        String m = String.valueOf(e.getMessage());
                        result = "false,'" + Base64.encodeToString(m.getBytes(), Base64.NO_WRAP) + "'";
                    }
                    final String js = "window.__fetchDone('" + cbId + "'," + result + ")";
                    web.post(new Runnable() {
                        @Override
                        public void run() {
                            web.evaluateJavascript(js, null);
                        }
                    });
                }
            }).start();
        }
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.onBack && window.onBack())", new android.webkit.ValueCallback<String>() {
            @Override
            public void onReceiveValue(String value) {
                if (!"true".equals(value)) finish();
            }
        });
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }
}
