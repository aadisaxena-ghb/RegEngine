package com.campus.http;

import com.campus.model.Notice;
import com.campus.store.AppData;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class NoticesHandler implements HttpHandler {
    private final AppData data;

    public NoticesHandler(AppData data) {
        this.data = data;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ApiSupport.handledPreflight(exchange)) return;

        String method = exchange.getRequestMethod().toUpperCase();
        try {
            switch (method) {
                case "GET" -> handleGet(exchange);
                case "POST" -> handlePost(exchange);
                default -> ApiSupport.sendError(exchange, 405, "Method not allowed");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ApiSupport.sendError(exchange, 500, "Internal Server Error: " + e.getMessage());
        }
    }

    private void handleGet(HttpExchange exchange) throws IOException {
        List<Notice> notices = data.notices.all();
        List<Map<String, Object>> response = new ArrayList<>();
        for (Notice n : notices) {
            response.add(Notice.toMap(n));
        }
        ApiSupport.sendJson(exchange, 200, response);
    }

    private void handlePost(HttpExchange exchange) throws IOException {
        Map<String, Object> body = ApiSupport.readJsonBody(exchange);
        String title = (String) body.getOrDefault("title", "");
        if (title.isBlank()) {
            ApiSupport.sendError(exchange, 400, "Notice title is required");
            return;
        }

        String id = AppData.newId("not");
        String refNumber = (String) body.getOrDefault("refNumber", "SRM/NCR/CIR/2026/" + (int)(Math.random() * 900 + 100));
        String category = (String) body.getOrDefault("category", "Academic");
        String priority = (String) body.getOrDefault("priority", "Normal");
        String publishDate = (String) body.getOrDefault("publishDate", LocalDate.now().toString());
        String author = (String) body.getOrDefault("author", "Registrar Secretariat");
        String department = (String) body.getOrDefault("department", "Academic Affairs");
        String content = (String) body.getOrDefault("content", "");
        String attachmentUrl = (String) body.getOrDefault("attachmentUrl", "");

        Notice newNotice = new Notice(id, refNumber, title, category, priority, publishDate, author, department, content, attachmentUrl);
        List<Notice> list = data.notices.all();
        list.add(0, newNotice);
        data.notices.replaceAll(list);

        data.log("Official Circular Published: [" + refNumber + "] " + title);
        ApiSupport.sendJson(exchange, 201, Notice.toMap(newNotice));
    }
}
