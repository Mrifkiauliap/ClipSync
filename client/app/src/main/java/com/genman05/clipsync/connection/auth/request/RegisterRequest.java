package com.genman05.clipsync.connection.auth.request;

public class RegisterRequest {
    private String nama;
    private String email;
    private String password;

    public RegisterRequest(String nama, String email, String password) {
        this.nama = nama;
        this.email = email;
        this.password = password;
    }
}
