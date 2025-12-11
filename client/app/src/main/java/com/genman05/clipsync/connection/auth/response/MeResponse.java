package com.genman05.clipsync.connection.auth.response;

public class MeResponse {
    private boolean error;
    private UserData data;

    public boolean isError() {
        return error;
    }

    public UserData getData() {
        return data;
    }

    public static class UserData {
        private int id;
        private String nama;
        private String email;
        private boolean is_active;
        private String createdAt;
        private DeviceInfo devices;

        public int getId() {
            return id;
        }

        public String getNama() {
            return nama;
        }

        public String getEmail() {
            return email;
        }

        public boolean isActive() {
            return is_active;
        }

        public String getCreatedAt() {
            return createdAt;
        }

        public DeviceInfo getDevices() {
            return devices;
        }
    }

    public static class DeviceInfo {
        private int id;
        private String name;
        private String type;
        private String identifier;

        public int getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public String getType() {
            return type;
        }

        public String getIdentifier() {
            return identifier;
        }
    }
}