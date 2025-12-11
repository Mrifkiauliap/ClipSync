package com.genman05.clipsync.connection.health;

public class HealthResponse {
    private String message;
    private String version;
    private String status;
    private String timestamp;

    public String getMessage() {
        return message;
    }

    public String getVersion() {
        return version;
    }

    public String getStatus() {
        return status;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public boolean isActive() {
        return "active".equalsIgnoreCase(status);
    }
}