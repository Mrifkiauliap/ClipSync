package com.genman05.clipsync.connection.auth.request;

public class LoginRequest {
    private String email;
    private String password;
    private String device_name;
    private String device_identifier;

    public LoginRequest(String email, String password, String deviceName, String deviceIdentifier) {
        this.email = email;
        this.password = password;
        this.device_name = deviceName;
        this.device_identifier = deviceIdentifier;
    }
}
