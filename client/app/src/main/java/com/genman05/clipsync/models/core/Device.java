package com.genman05.clipsync.models;

public class Device {
    private int id;
    private String device_name;
    private String device_type;
    private String device_identifier;
    private String last_active;
    private Boolean is_active;

    public int getId() { return id; }
    public String getDeviceName() { return device_name; }
    public String getDeviceType() { return device_type; }
    public String getDeviceIdentifier() { return device_identifier; }
    public String getLastActive() { return last_active; }
    public Boolean getIsActive() { return is_active; }
}
