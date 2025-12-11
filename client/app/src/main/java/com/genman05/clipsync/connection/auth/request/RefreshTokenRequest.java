// com/genman05/clipsync/connection/auth/request/RefreshTokenRequest.java
package com.genman05.clipsync.connection.auth.request;

public class RefreshTokenRequest {
    private String refreshToken;

    public RefreshTokenRequest(String refresh_token) {
        this.refreshToken = refresh_token;
    }

    public String getRefresh_token() {
        return refreshToken;
    }

    public void setRefresh_token(String refresh_token) {
        this.refreshToken = refresh_token;
    }
}
