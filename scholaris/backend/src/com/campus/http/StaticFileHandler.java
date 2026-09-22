package com.campus.http;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;

public class StaticFileHandler implements HttpHandler {
    private final Path root;

    public StaticFileHandler(Path root) { this.root = root; }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        if (path.equals("/")) path = "/index.html";

        Path file = root.resolve(path.substring(1)).normalize();
        if (!file.startsWith(root) || !Files.exists(file) || Files.isDirectory(file)) {
            byte[] body = "404 — not found".getBytes();
            exchange.sendResponseHeaders(404, body.length);
            try (OutputStream os = exchange.getResponseBody()) { os.write(body); }
            return;
        }

        exchange.getResponseHeaders().set("Content-Type", contentType(file.toString()));
        byte[] bytes = Files.readAllBytes(file);
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) { os.write(bytes); }
    }

    private static String contentType(String name) {
        String lower = name.toLowerCase();
        if (lower.endsWith(".html")) return "text/html; charset=utf-8";
        if (lower.endsWith(".css")) return "text/css; charset=utf-8";
        if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "application/javascript; charset=utf-8";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".json")) return "application/json; charset=utf-8";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".ico")) return "image/x-icon";
        if (lower.endsWith(".woff2")) return "font/woff2";
        if (lower.endsWith(".woff")) return "font/woff";
        if (lower.endsWith(".ttf")) return "font/ttf";
        if (lower.endsWith(".mp3")) return "audio/mpeg";
        if (lower.endsWith(".wav")) return "audio/wav";
        if (lower.endsWith(".csv")) return "text/csv; charset=utf-8";
        if (lower.endsWith(".pdf")) return "application/pdf";
        return "application/octet-stream";
    }
}
