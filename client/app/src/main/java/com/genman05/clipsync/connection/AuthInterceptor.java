package com.genman05.clipsync.connection.interceptor;

import com.genman05.clipsync.connection.SessionManager;

public class AuthInterceptor implements Interceptor {

    private final SessionManager session;

    public AuthInterceptor(SessionManager session) {
        this.session = session;
    }

    @Override
    public Response intercept(Chain chain) throws IOException {
        Request request = chain.request();

        String token = session.getAccessToken();
        if (token != null) {
            request = request.newBuilder()
                    .addHeader("Authorization", "Bearer " + token)
                    .build();
        }

        return chain.proceed(request);
    }
}
