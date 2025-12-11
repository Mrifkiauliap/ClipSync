package com.genman05.clipsync;

import android.content.Intent;
import android.os.Bundle;

import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.genman05.clipsync.helper.DatabaseHelper;
import com.genman05.clipsync.view.auth.LoginActivity;

public class BaseFragment extends Fragment {

    protected DatabaseHelper databaseHelper;

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        databaseHelper = new DatabaseHelper(requireContext());
        validateLogin();
    }

    @Override
    public void onResume() {
        super.onResume();
        validateLogin();
    }

    private void validateLogin() {
        if (!databaseHelper.isLoggedIn()) {
            Intent intent = new Intent(requireContext(), LoginActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            requireActivity().finish();
        }
    }
}
