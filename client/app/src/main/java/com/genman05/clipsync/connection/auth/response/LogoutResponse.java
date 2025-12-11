package com.genman05.clipsync.connection.auth.response;

public class LogoutResponse {
    private boolean error;
    private String message;

    public LogoutResponse(boolean error, String message) {
        this.error = error;
        this.message = message;
    }

    public boolean isError() {
        return error;
    }

    public String getMessage() {
        return message;
    }
}
