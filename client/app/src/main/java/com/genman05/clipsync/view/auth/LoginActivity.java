package com.genman05.clipsync.view.auth;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.genman05.clipsync.connection.ApiService;
import com.genman05.clipsync.helper.DatabaseHelper;
import com.genman05.clipsync.connection.auth.request.LoginRequest;
import com.genman05.clipsync.connection.auth.response.LoginResponse;
import com.genman05.clipsync.MainActivity;
import com.genman05.clipsync.R;
import com.genman05.clipsync.connection.RetrofitClient;
import com.google.android.material.textfield.TextInputEditText;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    private TextInputEditText etEmail, etPassword;
    private Button btnLogin;
    private TextView tvRegister;
    private ProgressBar progressBar;
    private DatabaseHelper databaseHelper;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        // Initialize DatabaseHelper
        databaseHelper = new DatabaseHelper(this);

        // Check if already logged in
        if (databaseHelper.isLoggedIn()) {
            goToMainActivity();
            return;
        }

        // Initialize views
        etEmail = findViewById(R.id.etEmail);
        etPassword = findViewById(R.id.etPassword);
        btnLogin = findViewById(R.id.btnLogin);
        tvRegister = findViewById(R.id.tvRegister);
        progressBar = findViewById(R.id.progressBar);

        // Login button click
        btnLogin.setOnClickListener(v -> {
            String email = etEmail.getText().toString().trim();
            String password = etPassword.getText().toString().trim();

            if (email.isEmpty()) {
                etEmail.setError("Email tidak boleh kosong");
                etEmail.requestFocus();
                return;
            }

            if (password.isEmpty()) {
                etPassword.setError("Password tidak boleh kosong");
                etPassword.requestFocus();
                return;
            }

            performLogin(email, password);
        });

        // Navigate to register
        tvRegister.setOnClickListener(v -> {
            Intent intent = new Intent(LoginActivity.this, RegisterActivity.class);
            startActivity(intent);
        });
    }

    private void performLogin(String email, String password) {
        // Show loading
        progressBar.setVisibility(View.VISIBLE);
        btnLogin.setEnabled(false);

        // Get device name
        String manufacturer = Build.MANUFACTURER;
        String model = Build.MODEL;
        String deviceName = manufacturer + " " + model;

        // Get Android ID
        String androidId = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);

        // Create login request
        LoginRequest request = new LoginRequest(email, password, deviceName, androidId);

        // API call
        ApiService apiService = RetrofitClient.getApiService();
        Call<LoginResponse> call = apiService.login(request);

        call.enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                progressBar.setVisibility(View.GONE);
                btnLogin.setEnabled(true);

                LoginResponse loginResponse = response.body();
                if (!response.isSuccessful() || loginResponse == null) {
                    handleLoginError("Login gagal, cek kembali email dan password.");
                    return;
                }

                if (loginResponse.isError()) {
                    // Use the API message if available, otherwise show a generic one
                    String message = loginResponse.getMessage() != null ? loginResponse.getMessage() : "Login failed.";
                    handleLoginError(message);
                    return;
                }

                LoginResponse.LoginData loginData = loginResponse.getData();

                if (loginData == null || loginData.getUser() == null) {
                    handleLoginError("Login gagal, cek kembali email dan password.");
                    return;
                }

                Toast.makeText(LoginActivity.this, loginResponse.getMessage(), Toast.LENGTH_SHORT).show();
                databaseHelper.saveLoginData(loginData);
                goToMainActivity();
            }

            @Override
            public void onFailure(Call<LoginResponse> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                btnLogin.setEnabled(true);
                Toast.makeText(LoginActivity.this,
                        "Error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    // 5. Create a dedicated method for handling errors
    private void handleLoginError(String message) {
        Toast.makeText(LoginActivity.this, message, Toast.LENGTH_LONG).show();
    }

    private void goToMainActivity() {
        Intent intent = new Intent(LoginActivity.this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}