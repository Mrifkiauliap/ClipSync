package com.genman05.clipsync.view.device;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.genman05.clipsync.BaseFragment;
import com.genman05.clipsync.R;

public class DevicesFragment extends BaseFragment {

    private RecyclerView rvDevices;
    private TextView tvEmptyDevices;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_devices, container, false);

        // Initialize views
        rvDevices = view.findViewById(R.id.rvDevices);
        tvEmptyDevices = view.findViewById(R.id.tvEmptyDevices);

        // Setup RecyclerView
        rvDevices.setLayoutManager(new LinearLayoutManager(requireContext()));

        // Show empty state for now
        showEmptyState();

        return view;
    }

    private void showEmptyState() {
        rvDevices.setVisibility(View.GONE);
        tvEmptyDevices.setVisibility(View.VISIBLE);
    }
}
