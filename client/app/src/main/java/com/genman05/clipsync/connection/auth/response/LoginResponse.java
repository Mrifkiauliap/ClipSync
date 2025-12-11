package com.genman05.clipsync.connection.auth.response;

public class LoginResponse {
    private boolean error;
    private String message;
    private LoginData data;

    public boolean isError() {
        return error;
    }

    public String getMessage() {
        return message;
    }

    public LoginData getData() {
        return data;
    }

    public static class LoginData {
        private User user;
        private Device device;
        private String token;
        private String refreshToken;
        private String expiresAt;

        public User getUser() {
            return user;
        }

        public Device getDevice() {
            return device;
        }

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

    public static class User {
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

    public static class Device {
        private int id;
        private String name;
        private String type;

        public int getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public String getType() {
            return type;
        }
    }
}
