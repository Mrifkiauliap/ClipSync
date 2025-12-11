package com.genman05.clipsync;

import android.animation.ObjectAnimator;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.view.animation.DecelerateInterpolator;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

import com.genman05.clipsync.view.auth.LoginActivity;

import androidx.appcompat.app.AppCompatActivity;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import com.genman05.clipsync.connection.health.HealthResponse;
import com.genman05.clipsync.connection.RetrofitClient;
import com.genman05.clipsync.connection.ApiService;
import com.genman05.clipsync.connection.auth.response.RefreshTokenResponse;
import com.genman05.clipsync.helper.DatabaseHelper;
import com.genman05.clipsync.connection.auth.request.RefreshTokenRequest;

public class SplashActivity extends AppCompatActivity {

    private ProgressBar progressBar;
    private Button btnRetry;
    private TextView tvStatus;
    private TextView tvVersion;
    private ImageView ivLogo;
    private DatabaseHelper databaseHelper;
    private Handler handler;

    private static final int SPLASH_DISPLAY_LENGTH = 1000;
    private int currentProgress = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        // Initialize views
        progressBar = findViewById(R.id.progressBar);
        tvStatus = findViewById(R.id.tvStatus);
        tvVersion = findViewById(R.id.tvVersion);
        ivLogo = findViewById(R.id.ivLogo);
        btnRetry = findViewById(R.id.btnRetry); // FIX: Initialize the retry button

        // Initialize DatabaseHelper
        databaseHelper = new DatabaseHelper(this);
        handler = new Handler();

        // Set initial state for retry button
        btnRetry.setVisibility(View.GONE);
        btnRetry.setOnClickListener(v -> {
            btnRetry.setVisibility(View.GONE);
            tvStatus.setTextColor(getResources().getColor(android.R.color.darker_gray));
            checkServerHealth();
        });


        // Start logo animation
        startLogoAnimation();

        // Start checking process
        handler.postDelayed(() -> {
            checkServerHealth();
        }, SPLASH_DISPLAY_LENGTH);
    }

    private void startLogoAnimation() {
        // Scale animation for logo
        ivLogo.setAlpha(0f);
        ivLogo.setScaleX(0.3f);
        ivLogo.setScaleY(0.3f);

        ivLogo.animate()
                .alpha(1f)
                .scaleX(1f)
                .scaleY(1f)
                .setDuration(800)
                .setInterpolator(new DecelerateInterpolator())
                .start();
    }

    private void updateProgress(int progress, String status) {
        ObjectAnimator animation = ObjectAnimator.ofInt(progressBar, "progress", currentProgress, progress);
        animation.setDuration(500);
        animation.setInterpolator(new DecelerateInterpolator());
        animation.start();

        currentProgress = progress;
        tvStatus.setText(status);
    }

    private void checkServerHealth() {
        updateProgress(20, "Checking server...");
        databaseHelper.getVersionApp();
        String versionApp = databaseHelper.getVersionApp();

        tvVersion.setText("Version: " + versionApp);

        updateProgress(30, "Pinging server...");

        ApiService apiService = RetrofitClient.getApiService();
        Call<HealthResponse> call = apiService.ping();

        call.enqueue(new Callback<HealthResponse>() {
            @Override
            public void onResponse(Call<HealthResponse> call, Response<HealthResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    HealthResponse healthResponse = response.body();

                    if (healthResponse.isActive()) {
                        updateProgress(50, "Server is online");

                        databaseHelper.saveVersionApp(
                                healthResponse.getVersion()
                        );

                        tvVersion.setText("Version: " + healthResponse.getVersion());

                        // Delay before checking login status
                        handler.postDelayed(() -> {
                            checkLoginStatus();
                        }, 800);
                    } else {
                        showErrorAndRetry("Server not active");
                    }
                } else {
                    showErrorAndRetry("Server not responding");
                }
            }

            @Override
            public void onFailure(Call<HealthResponse> call, Throwable t) {
                showErrorAndRetry("Cannot connect to server");
            }
        });
    }

    private void checkLoginStatus() {
        boolean isLoggedIn = databaseHelper.isLoggedIn();

        if (isLoggedIn) {
            updateProgress(70, "Refreshing token...");
            refreshToken();
        } else {
            updateProgress(100, "Complete");
            handler.postDelayed(() -> {
                goToLogin();
            }, 500);
        }
    }

    private void refreshToken() {
        DatabaseHelper.UserData userData = databaseHelper.getUser();

        // Jika belum login / data user kosong → langsung ke login
        if (userData == null || userData.getRefreshToken() == null) {
            goToLogin();
            return;
        }

        String refreshToken = userData.getRefreshToken();

        ApiService apiService = RetrofitClient.getClient().create(ApiService.class);
        RefreshTokenRequest body = new RefreshTokenRequest(refreshToken);
        Call<RefreshTokenResponse> call = apiService.refreshToken(body);



        // Update UI state
        updateProgress(30, "Refreshing session...");

        call.enqueue(new Callback<RefreshTokenResponse>() {
            @Override
            public void onResponse(Call<RefreshTokenResponse> call, Response<RefreshTokenResponse> response) {
                if (!response.isSuccessful()) {
                    // --- Server mengembalikan error status ---
                    int code = response.code();

                    if (code == 401 || code == 403) {
                        // Refresh token invalid atau expired
                        databaseHelper.logout();
                        runOnUiThread(() -> {
                            updateProgress(100, "Session expired");
                            Toast.makeText(SplashActivity.this,
                                    "Sesi berakhir, silakan login ulang.",
                                    Toast.LENGTH_SHORT).show();
                            goToLogin();
                        });
                    } else {
                        // Server error, tapi jangan langsung logout
                        runOnUiThread(() -> {
                            updateProgress(100, "Server error");
                            Toast.makeText(SplashActivity.this,
                                    "Server tidak merespons (" + code + ").",
                                    Toast.LENGTH_SHORT).show();
                            goToMain(); // masih bisa lanjut pakai token lama
                        });
                    }
                    return;
                }

                RefreshTokenResponse refreshResponse = response.body();
                if (refreshResponse == null) {
                    runOnUiThread(() -> {
                        updateProgress(100, "Invalid response");
                        Toast.makeText(SplashActivity.this,
                                "Gagal memperbarui sesi (respon kosong).",
                                Toast.LENGTH_SHORT).show();
                        goToLogin();
                    });
                    return;
                }

                if (refreshResponse.isError()) {
                    // Respon valid tapi API menolak refresh token
                    databaseHelper.logout();
                    runOnUiThread(() -> {
                        updateProgress(100, "Session expired");
                        Toast.makeText(SplashActivity.this,
                                refreshResponse.getMessage() != null ? refreshResponse.getMessage()
                                        : "Refresh token tidak valid.",
                                Toast.LENGTH_SHORT).show();
                        goToLogin();
                    });
                    return;
                }

                // --- Refresh berhasil ---
                RefreshTokenResponse.RefreshData data = refreshResponse.getData();
                if (data == null) {
                    runOnUiThread(() -> {
                        updateProgress(100, "Invalid data");
                        Toast.makeText(SplashActivity.this,
                                "Data refresh tidak lengkap.", Toast.LENGTH_SHORT).show();
                        goToLogin();
                    });
                    return;
                }

                boolean updated = databaseHelper.saveUser(
                        userData.getUserId(),
                        userData.getNama(),
                        userData.getEmail(),
                        data.getToken(),
                        data.getRefreshToken(),
                        data.getExpiresAt()
                );

                if (updated) {
                    runOnUiThread(() -> {
                        updateProgress(100, "Session refreshed");
                        Toast.makeText(SplashActivity.this,
                                "Sesi diperbarui.", Toast.LENGTH_SHORT).show();

                        // Pastikan activity belum destroyed
                        if (!isFinishing()) {
                            new Handler().postDelayed(() -> goToMain(), 500);
                        }
                    });
                } else {
                    databaseHelper.logout();
                    runOnUiThread(() -> goToLogin());
                }
            }

            @Override
            public void onFailure(Call<RefreshTokenResponse> call, Throwable t) {
                // --- Tidak bisa konek ke server (offline, timeout, dsb) ---
                runOnUiThread(() -> {
                    updateProgress(100, "Offline mode");
                    Toast.makeText(SplashActivity.this,
                            "Tidak bisa terhubung ke server.\nMelanjutkan dengan sesi lama.",
                            Toast.LENGTH_SHORT).show();

                    DatabaseHelper.UserData localData = databaseHelper.getUser();
                    if (localData != null && localData.getToken() != null) {
                        // Masih punya token lama, lanjut aja
                        if (!isFinishing()) goToMain();
                    } else {
                        // Token kosong, paksa login
                        goToLogin();
                    }
                });
            }
        });
    }


    private void showErrorAndRetry(String message) {
        updateProgress(0, message);
        tvStatus.setTextColor(getResources().getColor(android.R.color.holo_red_dark));
        btnRetry.setVisibility(View.VISIBLE); // Show the retry button on error

        // Remove the automatic retry handler
         handler.postDelayed(() -> {
             tvStatus.setTextColor(getResources().getColor(android.R.color.darker_gray));
             checkServerHealth();
         }, 5000);
    }

    private void goToLogin() {
        Intent intent = new Intent(SplashActivity.this, LoginActivity.class);
        startActivity(intent);
        finish();
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }

    private void goToMain() {
        Intent intent = new Intent(SplashActivity.this, MainActivity.class);
        startActivity(intent);
        finish();
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (handler != null) {
            handler.removeCallbacksAndMessages(null);
        }
    }
}
