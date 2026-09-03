package com.securevault.server;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import com.securevault.dao.MasterPasswordDAO;
import com.securevault.dao.CredentialsDAO;
import com.securevault.model.Credentials;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.SQLException;
import java.util.List;

/**
 * Java-based HTTP Server for SecureVault Web Application.
 * Uses JDK built-in HttpServer (com.sun.net.httpserver).
 * Serves the web frontend from ./public and connects to SQLite via DAOs.
 */
public class CredentialServer {

    private static final int PORT = 3000;
    private static final MasterPasswordDAO masterPasswordDAO = new MasterPasswordDAO();
    private static final CredentialsDAO credentialsDAO = new CredentialsDAO();

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // API Contexts
        server.createContext("/api/status", new StatusHandler());
        server.createContext("/api/setup", new SetupHandler());
        server.createContext("/api/verify", new VerifyHandler());
        server.createContext("/api/credentials", new CredentialsHandler());
        server.createContext("/api/change-master-password", new ChangeMasterPasswordHandler());

        // Static Files Handler (public/)
        server.createContext("/", new StaticFileHandler());

        server.setExecutor(null); // default executor
        System.out.println("============================================================");
        System.out.println("🔒 SecureVault Java Web Server Running at: http://localhost:" + PORT);
        System.out.println("============================================================");
        server.start();
    }

    private static void sendJsonResponse(HttpExchange exchange, int statusCode, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String readRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buf = new byte[1024];
            int n;
            while ((n = is.read(buf)) != -1) {
                baos.write(buf, 0, n);
            }
            return baos.toString(StandardCharsets.UTF_8);
        }
    }

    // Helper to extract simple JSON string value by key
    private static String extractJsonString(String json, String key) {
        String pattern = "\"" + key + "\":\"";
        int start = json.indexOf(pattern);
        if (start == -1) return null;
        start += pattern.length();
        int end = json.indexOf("\"", start);
        if (end == -1) return null;
        return json.substring(start, end);
    }

    static class StatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            try {
                boolean hasMaster = masterPasswordDAO.hasMasterPassword();
                String salt = null;
                if (hasMaster) {
                    byte[] saltBytes = masterPasswordDAO.getSalt();
                    if (saltBytes != null) {
                        salt = java.util.Base64.getEncoder().encodeToString(saltBytes);
                    }
                }
                String json = String.format("{\"initialized\":%b,\"salt\":%s}",
                        hasMaster, salt != null ? "\"" + salt + "\"" : "null");
                sendJsonResponse(exchange, 200, json);
            } catch (SQLException e) {
                sendJsonResponse(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }

    static class SetupHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }
            try {
                String body = readRequestBody(exchange);
                String hash = extractJsonString(body, "passwordHash");
                String saltBase64 = extractJsonString(body, "salt");

                if (hash == null || saltBase64 == null) {
                    sendJsonResponse(exchange, 400, "{\"error\":\"Missing passwordHash or salt\"}");
                    return;
                }

                byte[] saltBytes = java.util.Base64.getDecoder().decode(saltBase64);
                String now = java.time.LocalDateTime.now().toString();
                masterPasswordDAO.saveMasterPassword(hash, saltBytes, now);
                sendJsonResponse(exchange, 200, "{\"success\":true}");
            } catch (Exception e) {
                sendJsonResponse(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }

    static class VerifyHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }
            try {
                String body = readRequestBody(exchange);
                String hash = extractJsonString(body, "passwordHash");
                String storedHash = masterPasswordDAO.getStoredPasswordHash();

                if (storedHash != null && storedHash.equals(hash)) {
                    byte[] saltBytes = masterPasswordDAO.getSalt();
                    String saltBase64 = java.util.Base64.getEncoder().encodeToString(saltBytes);
                    sendJsonResponse(exchange, 200, "{\"success\":true,\"salt\":\"" + saltBase64 + "\"}");
                } else {
                    sendJsonResponse(exchange, 401, "{\"success\":false,\"error\":\"Incorrect Master Password\"}");
                }
            } catch (Exception e) {
                sendJsonResponse(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }

    static class CredentialsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI().getPath();

            if ("OPTIONS".equalsIgnoreCase(method)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            try {
                if ("GET".equalsIgnoreCase(method)) {
                    List<Credentials> list = credentialsDAO.getCredentialsDB();
                    StringBuilder sb = new StringBuilder("{\"credentials\":[");
                    for (int i = 0; i < list.size(); i++) {
                        Credentials c = list.get(i);
                        if (i > 0) sb.append(",");
                        sb.append(String.format("{\"id\":%d,\"website\":\"%s\",\"username\":\"%s\",\"encryptedPassword\":\"%s\",\"createdAt\":\"%s\"}",
                                c.getId(), escapeJson(c.getWebsite()), escapeJson(c.getUsername()),
                                escapeJson(c.getEncryptedPassword()), escapeJson(c.getCreatedAt())));
                    }
                    sb.append("]}");
                    sendJsonResponse(exchange, 200, sb.toString());
                } else if ("POST".equalsIgnoreCase(method)) {
                    String body = readRequestBody(exchange);
                    String website = extractJsonString(body, "website");
                    String username = extractJsonString(body, "username");
                    String encryptedPassword = extractJsonString(body, "encryptedPassword");
                    String now = java.time.LocalDateTime.now().toString();

                    credentialsDAO.saveCredential(website, username, encryptedPassword, now);
                    Credentials last = credentialsDAO.getLastCredentials();
                    int id = last != null ? last.getId() : 0;
                    sendJsonResponse(exchange, 201, String.format("{\"success\":true,\"credential\":{\"id\":%d,\"website\":\"%s\",\"username\":\"%s\",\"encryptedPassword\":\"%s\",\"createdAt\":\"%s\"}}",
                            id, escapeJson(website), escapeJson(username), escapeJson(encryptedPassword), now));
                } else if ("DELETE".equalsIgnoreCase(method)) {
                    String[] parts = path.split("/");
                    if (parts.length >= 4) {
                        int id = Integer.parseInt(parts[3]);
                        credentialsDAO.deleteCredential(id);
                        sendJsonResponse(exchange, 200, "{\"success\":true}");
                    } else {
                        sendJsonResponse(exchange, 400, "{\"error\":\"Invalid ID\"}");
                    }
                } else {
                    exchange.sendResponseHeaders(405, -1);
                }
            } catch (Exception e) {
                sendJsonResponse(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }

    static class ChangeMasterPasswordHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }
            try {
                String body = readRequestBody(exchange);
                String currentHash = extractJsonString(body, "currentPasswordHash");
                String newHash = extractJsonString(body, "newPasswordHash");
                String storedHash = masterPasswordDAO.getStoredPasswordHash();

                if (storedHash == null || !storedHash.equals(currentHash)) {
                    sendJsonResponse(exchange, 401, "{\"error\":\"Current password incorrect\"}");
                    return;
                }

                masterPasswordDAO.updateMasterPassword(newHash);
                sendJsonResponse(exchange, 200, "{\"success\":true}");
            } catch (Exception e) {
                sendJsonResponse(exchange, 500, "{\"error\":\"" + e.getMessage() + "\"}");
            }
        }
    }

    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String requestPath = exchange.getRequestURI().getPath();
            if ("/".equals(requestPath) || "".equals(requestPath)) {
                requestPath = "/index.html";
            }

            Path filePath = Paths.get("public", requestPath.startsWith("/") ? requestPath.substring(1) : requestPath);
            if (!Files.exists(filePath) || Files.isDirectory(filePath)) {
                filePath = Paths.get("public", "index.html");
            }

            if (!Files.exists(filePath)) {
                String notFound = "404 Not Found";
                exchange.sendResponseHeaders(404, notFound.length());
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(notFound.getBytes());
                }
                return;
            }

            String contentType = "text/plain";
            String fn = filePath.getFileName().toString().toLowerCase();
            if (fn.endsWith(".html")) contentType = "text/html; charset=utf-8";
            else if (fn.endsWith(".css")) contentType = "text/css; charset=utf-8";
            else if (fn.endsWith(".js")) contentType = "application/javascript; charset=utf-8";
            else if (fn.endsWith(".json")) contentType = "application/json; charset=utf-8";
            else if (fn.endsWith(".svg")) contentType = "image/svg+xml";

            byte[] fileBytes = Files.readAllBytes(filePath);
            exchange.getResponseHeaders().set("Content-Type", contentType);
            exchange.sendResponseHeaders(200, fileBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(fileBytes);
            }
        }
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
