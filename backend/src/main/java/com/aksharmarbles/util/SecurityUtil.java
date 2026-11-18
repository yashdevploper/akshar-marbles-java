package com.aksharmarbles.util;

import org.mindrot.jbcrypt.BCrypt;

public final class SecurityUtil {

    private static final int WORKLOAD = 12;

    private SecurityUtil() {
    }

    public static String hashPassword(String passwordPlaintext) {
        if (passwordPlaintext == null || passwordPlaintext.trim().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be null or empty.");
        }
        String salt = BCrypt.gensalt(WORKLOAD);
        return BCrypt.hashpw(passwordPlaintext, salt);
    }

    public static boolean checkPassword(String passwordPlaintext, String storedHash) {
        if (passwordPlaintext == null || storedHash == null || !storedHash.startsWith("$2a$")) {
            return false;
        }
        return BCrypt.checkpw(passwordPlaintext, storedHash);
    }
}
