package com.genman05.clipsync.helper;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import com.genman05.clipsync.connection.auth.response.LoginResponse;

public class DatabaseHelper extends SQLiteOpenHelper {

    private static final String DATABASE_NAME = "clipsync.db";
    private static final int DATABASE_VERSION = 1;

    // Table name
    private static final String TABLE_USER = "user";

    // Columns
    private static final String COL_ID = "id";
    private static final String COL_USER_ID = "user_id";
    private static final String COL_NAMA = "nama";
    private static final String COL_EMAIL = "email";
    private static final String COL_TOKEN = "token";
    private static final String COL_REFRESH_TOKEN = "refresh_token";
    private static final String COL_EXPIRES_AT = "expires_at";

    public DatabaseHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        String createTableUser = "CREATE TABLE " + TABLE_USER + " (" +
                COL_ID + " INTEGER PRIMARY KEY AUTOINCREMENT, " +
                COL_USER_ID + " INTEGER, " +
                COL_NAMA + " TEXT, " +
                COL_EMAIL + " TEXT, " +
                COL_TOKEN + " TEXT, " +
                COL_REFRESH_TOKEN + " TEXT, " +
                COL_EXPIRES_AT + " TEXT)";
        db.execSQL(createTableUser);
        String createTableVersionApp = "CREATE TABLE IF NOT EXISTS version_app (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "version_app TEXT)";
        db.execSQL(createTableVersionApp);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS " + TABLE_USER);
        db.execSQL("DROP TABLE IF EXISTS version_app");
        onCreate(db);
    }


    // Save user data after login
    public boolean saveUser(int userId, String nama, String email, String token,
                            String refreshToken, String expiresAt) {
        SQLiteDatabase db = this.getWritableDatabase();

        // Clear previous user data
        db.delete(TABLE_USER, null, null);

        ContentValues values = new ContentValues();
        values.put(COL_USER_ID, userId);
        values.put(COL_NAMA, nama);
        values.put(COL_EMAIL, email);
        values.put(COL_TOKEN, token);
        values.put(COL_REFRESH_TOKEN, refreshToken);
        values.put(COL_EXPIRES_AT, expiresAt);

        long result = db.insert(TABLE_USER, null, values);
        db.close();

        return result != -1;
    }

    // Save version app
    public void saveVersionApp(String versionApp) {
        SQLiteDatabase db = this.getWritableDatabase();
        db.delete("version_app", null, null); // clear old version
        ContentValues values = new ContentValues();
        values.put("version_app", versionApp);
        db.insert("version_app", null, values);
        db.close();
    }

    // Check if user is logged in
    public boolean isLoggedIn() {
        SQLiteDatabase db = this.getReadableDatabase();
        Cursor cursor = db.query(TABLE_USER, null, null, null, null, null, null);
        boolean hasUser = cursor.getCount() > 0;
        cursor.close();
        db.close();
        return hasUser;
    }

    // Get user data
    public UserData getUser() {
        SQLiteDatabase db = this.getReadableDatabase();
        Cursor cursor = db.query(TABLE_USER, null, null, null, null, null, null);

        UserData userData = null;
        if (cursor.moveToFirst()) {
            int userIdIndex = cursor.getColumnIndex(COL_USER_ID);
            int namaIndex = cursor.getColumnIndex(COL_NAMA);
            int emailIndex = cursor.getColumnIndex(COL_EMAIL);
            int tokenIndex = cursor.getColumnIndex(COL_TOKEN);
            int refreshTokenIndex = cursor.getColumnIndex(COL_REFRESH_TOKEN);
            int expiresAtIndex = cursor.getColumnIndex(COL_EXPIRES_AT);

            userData = new UserData(
                    cursor.getInt(userIdIndex),
                    cursor.getString(namaIndex),
                    cursor.getString(emailIndex),
                    cursor.getString(tokenIndex),
                    cursor.getString(refreshTokenIndex),
                    cursor.getString(expiresAtIndex)
            );
        }

        cursor.close();
        db.close();
        return userData;
    }

    // Logout - clear user data
    public void logout() {
        SQLiteDatabase db = this.getWritableDatabase();
        db.delete(TABLE_USER, null, null);
        db.close();
    }

    // Inner class for user data
    public static class UserData {
        private int userId;
        private String nama;
        private String email;
        private String token;
        private String refreshToken;
        private String expiresAt;

        public UserData(int userId, String nama, String email, String token,
                        String refreshToken, String expiresAt) {
            this.userId = userId;
            this.nama = nama;
            this.email = email;
            this.token = token;
            this.refreshToken = refreshToken;
            this.expiresAt = expiresAt;
        }

        public int getUserId() { return userId; }
        public String getNama() { return nama; }
        public String getEmail() { return email; }
        public String getToken() { return token; }
        public String getRefreshToken() { return refreshToken; }
        public String getExpiresAt() { return expiresAt; }
    }

    public String getVersionApp() {
        SQLiteDatabase db = this.getReadableDatabase();
        Cursor cursor = db.query("version_app", null, null, null, null, null, null);

        String versionApp = null;
        if (cursor.moveToFirst()) {
            int versionAppIndex = cursor.getColumnIndex("version_app");
            versionApp = cursor.getString(versionAppIndex);
        }

        cursor.close();
        db.close();
        return versionApp;
    }

    public void saveLoginData(LoginResponse.LoginData data) {
        LoginResponse.User user = data.getUser();
        saveUser(
                user.getId(),
                user.getNama(),
                user.getEmail(),
                data.getToken(),
                data.getRefreshToken(),
                data.getExpiresAt()
        );
    }
}
