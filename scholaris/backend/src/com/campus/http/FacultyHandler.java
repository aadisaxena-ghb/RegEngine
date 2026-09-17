package com.campus.http;

import com.campus.model.Course;
import com.campus.model.Faculty;
import com.campus.store.AppData;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class FacultyHandler implements HttpHandler {
    private static final String PREFIX = "/api/faculty";
    private final AppData data;

    public FacultyHandler(AppData data) { this.data = data; }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ApiSupport.handledPreflight(exchange)) return;
        String method = exchange.getRequestMethod();
        String tail = ApiSupport.pathTail(exchange, PREFIX);
        try {
            if ("GET".equalsIgnoreCase(method) && tail.isEmpty()) {
                list(exchange);
            } else if ("POST".equalsIgnoreCase(method) && tail.isEmpty()) {
                create(exchange);
            } else if ("DELETE".equalsIgnoreCase(method) && !tail.isEmpty()) {
                remove(exchange, tail);
            } else {
                ApiSupport.sendError(exchange, 404, "No such faculty route.");
            }
        } catch (IllegalArgumentException e) {
            ApiSupport.sendError(exchange, 400, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            ApiSupport.sendError(exchange, 500, "Internal error: " + e.getMessage());
        }
    }

    private void list(HttpExchange exchange) throws IOException {
        List<Map<String, Object>> out = data.faculty.all().stream().map(Faculty::toMap).collect(Collectors.toList());
        ApiSupport.sendJson(exchange, 200, out);
    }

    private void create(HttpExchange exchange) throws IOException {
        Map<String, Object> body = ApiSupport.readJsonBody(exchange);
        String name = req(body, "name");
        String course = req(body, "course");
        Course courseDef = Course.byCode(course);
        if (courseDef == null) throw new IllegalArgumentException("Unknown course code: " + course);

        String empId = str(body, "employeeId");
        if (empId == null || empId.isBlank()) {
            empId = "EMP-" + (100 + data.faculty.all().size() + 1);
        }

        Faculty f = new Faculty(
            AppData.newId("fac"),
            empId,
            name,
            req(body, "designation"),
            req(body, "department"),
            str(body, "qualification"),
            req(body, "subject"),
            course,
            str(body, "experience"),
            req(body, "email"),
            req(body, "phone"),
            str(body, "officeRoom"),
            Instant.now().toString()
        );
        data.faculty.add(f);
        data.log(name + " registered as " + f.getDesignation() + " in " + f.toMap().get("department") + ".");
        ApiSupport.sendJson(exchange, 201, f.toMap());
    }

    private void remove(HttpExchange exchange, String id) throws IOException {
        Faculty target = data.faculty.all().stream().filter(f -> f.getId().equals(id)).findFirst().orElse(null);
        if (target == null) { ApiSupport.sendError(exchange, 404, "Faculty member not found."); return; }
        data.faculty.removeById(Faculty::getId, id);
        data.log(target.getName() + " was removed from the faculty directory.");
        ApiSupport.sendJson(exchange, 200, Map.of("removed", true));
    }

    private static String req(Map<String, Object> body, String key) {
        String v = str(body, key);
        if (v == null || v.isBlank()) throw new IllegalArgumentException("Missing required field: " + key);
        return v;
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : String.valueOf(v);
    }
}
