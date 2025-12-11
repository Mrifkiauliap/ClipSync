package com.genman05.clipsync.view.profile;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.genman05.clipsync.BaseFragment;
import com.genman05.clipsync.R;
import com.genman05.clipsync.connection.ApiService;
import com.genman05.clipsync.connection.RetrofitClient;
import com.genman05.clipsync.connection.auth.response.LoginResponse;
import com.genman05.clipsync.helper.DatabaseHelper;
import com.genman05.clipsync.view.auth.LoginActivity;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import retrofit2.http.Header;

import com.genman05.clipsync.connection.auth.response.LogoutResponse;


public class ProfileFragment extends BaseFragment {

    private TextView tvProfileName, tvProfileEmail, tvUserId, tvDeviceInfo;
    private Button btnLogout;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_profile, container, false);

        // Initialize views
        tvProfileName = view.findViewById(R.id.tvProfileName);
        tvProfileEmail = view.findViewById(R.id.tvProfileEmail);
        tvUserId = view.findViewById(R.id.tvUserId);
        tvDeviceInfo = view.findViewById(R.id.tvDeviceInfo);
        btnLogout = view.findViewById(R.id.btnLogout);

        // Load user data
        loadUserData();

        // Logout button
        btnLogout.setOnClickListener(v -> logout());

        return view;
    }

    private void loadUserData() {
        DatabaseHelper.UserData userData = databaseHelper.getUser();
        if (userData != null) {
            tvProfileName.setText(userData.getNama());
            tvProfileEmail.setText(userData.getEmail());
            tvUserId.setText(userData.getUserId());

            // Get device info
            String manufacturer = Build.MANUFACTURER;
            String model = Build.MODEL;
            tvDeviceInfo.setText("Device: " + manufacturer + " " + model);
        }
    }

    private void logout() {
        DatabaseHelper.UserData userData = databaseHelper.getUser();

        if (userData == null || userData.getToken() == null) {
            goToLogin();
            return;
        }

        ApiService apiService = RetrofitClient.getApiService();
        Call<LogoutResponse> call = apiService.logout("Bearer " + userData.getToken());

        call.enqueue(new Callback<LogoutResponse>() {
            @Override
            public void onResponse(Call<LogoutResponse> call, Response<LogoutResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    LogoutResponse logoutResponse = response.body();
                    Toast.makeText(requireContext(), logoutResponse.getMessage(), Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(requireContext(), "Logout gagal, coba lagi.", Toast.LENGTH_SHORT).show();
                }

                // tetap hapus data dan arahkan ke login
                databaseHelper.logout();
                goToLogin();
            }

            @Override
            public void onFailure(Call<LogoutResponse> call, Throwable t) {
                Toast.makeText(requireContext(), "Gagal koneksi ke server", Toast.LENGTH_SHORT).show();

                // tetap logout lokal biar sesi aman
                databaseHelper.logout();
                goToLogin();
            }
        });
    }

    private void goToLogin() {
        Intent intent = new Intent(requireContext(), LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        requireActivity().finish();
    }

}
