package com.aksharmarbles.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.URI;
import java.util.Properties;

/**
 * Centralized application configuration.
 * Reads application.properties from classpath with first-class environment variable overrides.
 * Seamlessly handles cloud database URL conventions (DB_URL, DATABASE_URL, MYSQL_URL)
 * and auto-formats raw mysql:// URIs to JDBC standard URLs.
 */
public final class AppConfig {

    private static final Logger logger = LoggerFactory.getLogger(AppConfig.class);
    private static final Properties properties = new Properties();

    private static String parsedDbUser = null;
    private static String parsedDbPass = null;
    private static String parsedDbUrl = null;

    static {
        loadProperties();
        parseCloudDatabaseUrl();
    }

    private AppConfig() {
    }

    private static void loadProperties() {
        try (InputStream is = AppConfig.class.getClassLoader().getResourceAsStream("application.properties")) {
            if (is != null) {
                properties.load(is);
                logger.info("Loaded application.properties successfully.");
            } else {
                logger.warn("application.properties not found on classpath, using environment or default values.");
            }
        } catch (IOException e) {
            logger.error("Failed to load application.properties: {}", e.getMessage(), e);
        }
    }

    /**
     * Inspects DATABASE_URL or MYSQL_URL if standard DB_URL is not set directly.
     * Cloud providers (Railway, Render external DB, Clever Cloud) often supply
     * mysql://user:password@host:port/database format.
     */
    private static void parseCloudDatabaseUrl() {
        String rawUrl = System.getenv("DATABASE_URL");
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            rawUrl = System.getenv("MYSQL_URL");
        }
        if (rawUrl != null && !rawUrl.trim().isEmpty()) {
            String trimmed = rawUrl.trim();
            if (trimmed.startsWith("mysql://")) {
                try {
                    URI uri = new URI(trimmed);
                    String host = uri.getHost();
                    int port = uri.getPort() > 0 ? uri.getPort() : 3306;
                    String path = uri.getPath();
                    if (path != null && path.startsWith("/")) {
                        path = path.substring(1);
                    }
                    String userInfo = uri.getUserInfo();
                    if (userInfo != null && !userInfo.isEmpty()) {
                        String[] parts = userInfo.split(":", 2);
                        parsedDbUser = java.net.URLDecoder.decode(parts[0], java.nio.charset.StandardCharsets.UTF_8);
                        if (parts.length > 1) {
                            parsedDbPass = java.net.URLDecoder.decode(parts[1], java.nio.charset.StandardCharsets.UTF_8);
                        }
                    }
                    parsedDbUrl = String.format("jdbc:mysql://%s:%d/%s?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Kolkata&useSSL=true&allowPublicKeyRetrieval=true",
                            host, port, path);
                    logger.info("Parsed cloud database URI into JDBC URL for host: {}:{}", host, port);
                } catch (Exception e) {
                    // Do not log the raw URI as it may contain sensitive credentials
                    logger.warn("Could not parse cloud database URI into JDBC format. Prefer using separate DB_URL, DB_USERNAME, and DB_PASSWORD variables. Error: {}", e.getClass().getSimpleName());
                }
            }
        }
    }

    public static String get(String key, String defaultValue) {
        // 1. Explicit specific environment variable overrides
        if ("db.url".equals(key)) {
            String val = System.getenv("DB_URL");
            if (val != null && !val.trim().isEmpty()) return val.trim();
            if (parsedDbUrl != null) return parsedDbUrl;
        } else if ("db.username".equals(key)) {
            String val = System.getenv("DB_USERNAME");
            if (val != null && !val.trim().isEmpty()) return val.trim();
            val = System.getenv("DB_USER");
            if (val != null && !val.trim().isEmpty()) return val.trim();
            if (parsedDbUser != null) return parsedDbUser;
        } else if ("db.password".equals(key)) {
            String val = System.getenv("DB_PASSWORD");
            if (val != null && !val.trim().isEmpty()) return val.trim();
            val = System.getenv("DB_PASS");
            if (val != null && !val.trim().isEmpty()) return val.trim();
            if (parsedDbPass != null) return parsedDbPass;
        } else if ("hikari.maximumPoolSize".equals(key)) {
            String val = System.getenv("HIKARI_MAXIMUMPOOLSIZE");
            if (val != null && !val.trim().isEmpty()) return val.trim();
            val = System.getenv("DB_MAX_POOL_SIZE");
            if (val != null && !val.trim().isEmpty()) return val.trim();
            if (isProduction()) {
                return "5";
            }
        } else if ("hibernate.dialect".equals(key)) {
            String val = System.getenv("HIBERNATE_DIALECT");
            if (val != null && !val.trim().isEmpty()) return val.trim();
            val = System.getenv("DB_DIALECT");
            if (val != null && !val.trim().isEmpty()) return val.trim();
            if (isProduction()) {
                return "auto";
            }
        } else if ("hibernate.hbm2ddl.auto".equals(key)) {
            String val = System.getenv("HIBERNATE_HBM2DDL_AUTO");
            if (val != null && !val.trim().isEmpty()) return val.trim();
            return "validate";
        } else if ("app.environment".equals(key)) {
            String val = System.getenv("APP_ENVIRONMENT");
            if (val != null && !val.trim().isEmpty()) return val.trim();
            val = System.getenv("ENVIRONMENT");
            if (val != null && !val.trim().isEmpty()) return val.trim();
        }

        // 2. Generic environment variable override: "app.tax.gstRate" -> "APP_TAX_GSTRATE"
        String envKey = key.toUpperCase().replace('.', '_');
        String envVal = System.getenv(envKey);
        if (envVal != null && !envVal.trim().isEmpty()) {
            return envVal.trim();
        }

        // 3. System property override: -Dkey=val
        String sysVal = System.getProperty(key);
        if (sysVal != null && !sysVal.trim().isEmpty()) {
            return sysVal.trim();
        }

        // 4. File-based property from application.properties
        return properties.getProperty(key, defaultValue);
    }

    public static String get(String key) {
        return get(key, null);
    }

    public static String getEnvironment() {
        String env = System.getenv("APP_ENVIRONMENT");
        if (env != null && !env.trim().isEmpty()) return env.trim();
        env = System.getenv("ENVIRONMENT");
        if (env != null && !env.trim().isEmpty()) return env.trim();
        return properties.getProperty("app.environment", "development");
    }

    public static boolean isProduction() {
        return "production".equalsIgnoreCase(getEnvironment());
    }

    public static int getInt(String key, int defaultValue) {
        String val = get(key);
        if (val == null || val.trim().isEmpty()) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(val.trim());
        } catch (NumberFormatException e) {
            logger.warn("Invalid integer value for '{}': '{}', falling back to default {}", key, val, defaultValue);
            return defaultValue;
        }
    }

    public static BigDecimal getBigDecimal(String key, BigDecimal defaultValue) {
        String val = get(key);
        if (val == null || val.trim().isEmpty()) {
            return defaultValue;
        }
        try {
            return new BigDecimal(val.trim());
        } catch (Exception e) {
            logger.warn("Invalid BigDecimal value for '{}': '{}', falling back to default {}", key, val, defaultValue);
            return defaultValue;
        }
    }

    public static boolean getBoolean(String key, boolean defaultValue) {
        String val = get(key);
        if (val == null || val.trim().isEmpty()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(val.trim());
    }
}
