package com.genman05.clipsync.view.dashboard;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.genman05.clipsync.BaseFragment;
import com.genman05.clipsync.R;
import com.genman05.clipsync.helper.DatabaseHelper;

public class DashboardFragment extends BaseFragment {

    private TextView tvWelcome;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_dashboard, container, false);

        // Initialize views
        tvWelcome = view.findViewById(R.id.tvWelcome);

        // Load user data
        loadUserData();

        return view;
    }

    private void loadUserData() {
        DatabaseHelper.UserData userData = databaseHelper.getUser();
        if (userData != null) {
            tvWelcome.setText("Selamat datang, " + userData.getNama() + "!");
        }
    }
}
