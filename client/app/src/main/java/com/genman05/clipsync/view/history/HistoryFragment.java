package com.genman05.clipsync.view.history;

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

public class HistoryFragment extends BaseFragment {

    private RecyclerView rvHistory;
    private TextView tvEmptyHistory;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_history, container, false);

        // Initialize views
        rvHistory = view.findViewById(R.id.rvHistory);
        tvEmptyHistory = view.findViewById(R.id.tvEmptyHistory);

        // Setup RecyclerView
        rvHistory.setLayoutManager(new LinearLayoutManager(requireContext()));

        // Show empty state for now
        showEmptyState();

        return view;
    }

    private void showEmptyState() {
        rvHistory.setVisibility(View.GONE);
        tvEmptyHistory.setVisibility(View.VISIBLE);
    }
}
