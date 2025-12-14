package com.genman05.clipsync.connection;

import com.genman05.clipsync.connection.device.response.ListDevicesResponse;
import com.genman05.clipsync.connection.health.HealthResponse;
import com.genman05.clipsync.connection.auth.response.*;
import com.genman05.clipsync.connection.auth.request.*;
import com.genman05.clipsync.connection.device.response.*;
import com.genman05.clipsync.connection.device.request.*;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.Header;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Path;

public interface ApiService {

    @GET("/")
    Call<HealthResponse> ping();

    @GET("/api/auth/me")
    Call<MeResponse> me(@Header("Authorization") String token);

    @POST("/api/auth/refresh")
    Call<RefreshTokenResponse> refreshToken(@Body RefreshTokenRequest body);

    @POST("/api/auth/login")
    Call<LoginResponse> login(@Body LoginRequest request);

    @POST("/api/auth/logout")
    Call<LogoutResponse> logout(@Header("Authorization") String token);

    @POST("/api/auth/logout-all")
    Call<LogoutAllResponse> logoutAll(@Header("Authorization") String token);

    @POST("/api/auth/register")
    Call<RegisterResponse> register(@Body RegisterRequest request);

    @GET("/api/device/list")
    Call<ListDevicesResponse> listDevices(@Header("Authorization") String token);

    @POST("/api/device/revoke")
    Call<RevokeDeviceResponse> revokeDevice(@Header("Authorization") String token, @Body RevokeDeviceRequest request);

    @POST("/api/device/delete")
    Call<DeleteDeviceResponse> deleteDevice(@Header("Authorization") String token, @Body DeleteDeviceRequest request);

    @POST("/api/clipboard/list")
    Call<Void> listClipboard(@Header("Authorization") String token);

}
