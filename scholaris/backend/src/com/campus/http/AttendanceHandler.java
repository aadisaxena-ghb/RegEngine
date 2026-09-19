package com.campus.http;

import com.campus.model.AttendanceSession;
import com.campus.model.Course;
import com.campus.store.AppData;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class AttendanceHandler implements HttpHandler {
    private static final String PREFIX = "/api/attendance";
    private final AppData data;

    public AttendanceHandler(AppData data) { this.data = data; }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ApiSupport.handledPreflight(exchange)) return;
        String method = exchange.getRequestMethod();
        String tail = ApiSupport.pathTail(exchange, PREFIX);
        System.out.println(method + " " + exchange.getRequestURI().getPath());
        try {
            if ("GET".equalsIgnoreCase(method) && tail.isEmpty()) {
                list(exchange);
            } else if ("POST".equalsIgnoreCase(method) && tail.isEmpty()) {
                save(exchange);
            } else {
                ApiSupport.sendError(exchange, 404, "No such attendance route.");
            }
        } catch (IllegalArgumentException e) {
            ApiSupport.sendError(exchange, 400, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            ApiSupport.sendError(exchange, 500, "Internal error: " + e.getMessage());
        }
    }

    private void list(HttpExchange exchange) throws IOException {
        List<Map<String, Object>> out = data.attendance.all().stream().map(AttendanceSession::toMap).collect(Collectors.toList());
        ApiSupport.sendJson(exchange, 200, out);
    }

    @SuppressWarnings("unchecked")
    private void save(HttpExchange exchange) throws IOException {
        Map<String, Object> body = ApiSupport.readJsonBody(exchange);
        String course = str(body, "course");
        String section = str(body, "section");
        if (section == null || section.isBlank()) section = "Section A";
        String date = str(body, "date");
        if (course == null || course.isBlank()) throw new IllegalArgumentException("Missing course.");
        if (date == null || date.isBlank()) throw new IllegalArgumentException("Missing date.");
        Course courseDef = Course.byCode(course);
        if (courseDef == null) throw new IllegalArgumentException("Unknown course code: " + course);

        Object rawRecords = body.get("records");
        if (!(rawRecords instanceof List)) throw new IllegalArgumentException("Missing attendance records.");

        List<AttendanceSession.Record> records = new ArrayList<>();
        int presentCount = 0;
        for (Object o : (List<Object>) rawRecords) {
            Map<String, Object> rm = (Map<String, Object>) o;
            String roll = String.valueOf(rm.get("rollNumber"));
            boolean present = Boolean.TRUE.equals(rm.get("present"));
            if (present) presentCount++;
            records.add(new AttendanceSession.Record(roll, present));
        }

        final String finalSection = section;
        AttendanceSession existing = data.attendance.all().stream()
            .filter(s -> s.getCourse().equals(course) && (s.getSection() == null || s.getSection().equals(finalSection)) && s.getDate().equals(date))
            .findFirst().orElse(null);

        AttendanceSession session = new AttendanceSession(
            existing != null ? existing.getId() : AppData.newId("att"), course, section, date, records
        );
        data.attendance.upsert(s -> s.getCourse().equals(course) && (s.getSection() == null || s.getSection().equals(finalSection)) && s.getDate().equals(date), session);
        data.log("Attendance recorded for " + courseDef.name + " (" + section + ") on " + date + " (" + presentCount + "/" + records.size() + " present).");
        ApiSupport.sendJson(exchange, 200, session.toMap());
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : String.valueOf(v);
    }
}
