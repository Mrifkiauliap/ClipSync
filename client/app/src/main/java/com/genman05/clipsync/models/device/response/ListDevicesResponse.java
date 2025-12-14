package com.genman05.clipsync.connection.device.response;

import java.util.List;

public class ListDevicesResponse {
    private boolean error;
    private List<Device> data;
    private int total;

    public boolean isError() {
        return error;
    }

    public List<Device> getData() {
        return data;
    }

    public int getTotal() {
        return total;
    }

    public class Device {
        private int id;
        private String device_name;
        private String device_type;
        private String last_active;
        private String createdAt;

        public int getId() {
            return id;
        }

        public String getDeviceName() {
            return device_name;
        }

        public String getDeviceType() {
            return device_type;
        }

        public String getLastActive() {
            return last_active;
        }

        public String getCreatedAt() {
            return createdAt;
        }
    }
}
