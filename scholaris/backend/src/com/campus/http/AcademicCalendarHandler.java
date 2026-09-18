package com.campus.http;

import com.campus.model.CalendarEvent;
import com.campus.store.AppData;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class AcademicCalendarHandler implements HttpHandler {
    private final AppData data;

    public AcademicCalendarHandler(AppData data) {
        this.data = data;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ApiSupport.handledPreflight(exchange)) return;

        String method = exchange.getRequestMethod().toUpperCase();
        if (!"GET".equals(method)) {
            ApiSupport.sendError(exchange, 405, "Method not allowed");
            return;
        }

        try {
            List<CalendarEvent> events = data.calendar.all();
            List<Map<String, Object>> response = new ArrayList<>();
            for (CalendarEvent e : events) {
                response.add(CalendarEvent.toMap(e));
            }
            ApiSupport.sendJson(exchange, 200, response);
        } catch (Exception e) {
            e.printStackTrace();
            ApiSupport.sendError(exchange, 500, "Internal Server Error: " + e.getMessage());
        }
    }
}
