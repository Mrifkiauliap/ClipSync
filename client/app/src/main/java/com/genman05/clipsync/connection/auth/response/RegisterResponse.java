package com.genman05.clipsync.connection.auth.response;

public class RegisterResponse {
    private boolean success;
    private String message;
    private RegisterData data;

    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public RegisterData getData() {
        return data;
    }

    public static class RegisterData {
        private int id;
        private String nama;
        private String email;

        public int getId() {
            return id;
        }

        public String getNama() {
            return nama;
        }

        public String getEmail() {
            return email;
        }
    }
}
