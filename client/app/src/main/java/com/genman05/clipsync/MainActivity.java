package com.genman05.clipsync;

import android.content.Intent;
import android.os.Bundle;

import android.widget.Toast;
import androidx.fragment.app.Fragment;

import androidx.appcompat.app.AppCompatActivity;

import com.genman05.clipsync.view.auth.LoginActivity;
import com.genman05.clipsync.helper.DatabaseHelper;

import com.genman05.clipsync.view.dashboard.DashboardFragment;
import com.genman05.clipsync.view.device.DevicesFragment;
import com.genman05.clipsync.view.history.HistoryFragment;
import com.genman05.clipsync.view.profile.ProfileFragment;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.floatingactionbutton.FloatingActionButton;

public class MainActivity extends AppCompatActivity {

    private DatabaseHelper databaseHelper;
    private BottomNavigationView bottomNavigationView;
    private FloatingActionButton fabAdd;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Initialize DatabaseHelper
        databaseHelper = new DatabaseHelper(this);

        // Check if user is logged in
//        if (!databaseHelper.isLoggedIn()) {
//            goToLoginActivity();
//            return;
//        }

        // Initialize views
        bottomNavigationView = findViewById(R.id.bottom_navigation);
        fabAdd = findViewById(R.id.fab_add);

        // Set default fragment
        if (savedInstanceState == null) {
            loadFragment(new DashboardFragment());
        }

        // Bottom navigation listener
        bottomNavigationView.setOnItemSelectedListener(item -> {
            Fragment fragment = null;
            int itemId = item.getItemId();

            if (itemId == R.id.nav_dashboard) {
                fragment = new DashboardFragment();
            } else if (itemId == R.id.nav_devices) {
                fragment = new DevicesFragment();
            } else if (itemId == R.id.nav_history) {
                fragment = new HistoryFragment();
            } else if (itemId == R.id.nav_profile) {
                fragment = new ProfileFragment();
            } else if (itemId == R.id.nav_placeholder) {
                // Do nothing for placeholder
                return false;
            }

            return loadFragment(fragment);
        });

        // FAB click listener
        fabAdd.setOnClickListener(v -> {
            Toast.makeText(this, "Tambah Item", Toast.LENGTH_SHORT).show();
            // TODO: Implement your add functionality here
        });
    }

    private boolean loadFragment(Fragment fragment) {
        if (fragment != null) {
            getSupportFragmentManager()
                    .beginTransaction()
                    .replace(R.id.fragment_container, fragment)
                    .commit();
            return true;
        }
        return false;
    }

    private void goToLoginActivity() {
        Intent intent = new Intent(MainActivity.this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

//    @Override
//    protected void onResume() {
//        super.onResume();
//        // Validate login status setiap kali activity resume
//        if (!databaseHelper.isLoggedIn()) {
//            goToLoginActivity();
//        }
//    }
}