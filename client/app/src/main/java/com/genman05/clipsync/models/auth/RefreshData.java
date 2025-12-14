package com.genman05.clipsync.models;

public class RefreshData {
    private String token;
    private String refreshToken;
    private long expiresAt;

    public String getToken() {
        return token;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public long getExpiresAt() {
        return expiresAt;
    }
}
