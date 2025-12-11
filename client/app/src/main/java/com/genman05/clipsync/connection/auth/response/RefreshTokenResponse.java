package com.genman05.clipsync.connection.auth.response;

public class RefreshTokenResponse {
    private boolean error;
    private String message;
    private RefreshData data;

    public boolean isError() {
        return error;
    }

    public String getMessage() {
        return message;
    }

    public RefreshData getData() {
        return data;
    }

    public static class RefreshData {
        private String token;
        private String refreshToken;
        private String expiresAt;

        public String getToken() {
            return token;
        }

        public String getRefreshToken() {
            return refreshToken;
        }

        public String getExpiresAt() {
            return expiresAt;
        }
    }
}