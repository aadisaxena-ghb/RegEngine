package com.campus.http;

import com.campus.model.Course;
import com.campus.model.Student;
import com.campus.store.AppData;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class StudentsHandler implements HttpHandler {
    private static final String PREFIX = "/api/students";
    private final AppData data;

    public StudentsHandler(AppData data) { this.data = data; }

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
                create(exchange);
            } else if ("DELETE".equalsIgnoreCase(method) && !tail.isEmpty()) {
                remove(exchange, tail);
            } else {
                ApiSupport.sendError(exchange, 404, "No such student route.");
            }
        } catch (IllegalArgumentException e) {
            ApiSupport.sendError(exchange, 400, e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            ApiSupport.sendError(exchange, 500, "Internal error: " + e.getMessage());
        }
    }

    private void list(HttpExchange exchange) throws IOException {
        List<Map<String, Object>> out = data.students.all().stream().map(Student::toMap).collect(Collectors.toList());
        ApiSupport.sendJson(exchange, 200, out);
    }

    private void create(HttpExchange exchange) throws IOException {
        Map<String, Object> body = ApiSupport.readJsonBody(exchange);
        String roll = req(body, "rollNumber");
        String name = req(body, "name");
        String course = req(body, "course");

        Course courseDef = Course.byCode(course);
        if (courseDef == null) throw new IllegalArgumentException("Unknown course code: " + course);

        boolean duplicate = data.students.all().stream()
            .anyMatch(s -> s.getRollNumber().equalsIgnoreCase(roll));
        if (duplicate) throw new IllegalArgumentException("A student with roll number " + roll + " is already registered.");

        long enrolledInCourse = data.students.all().stream().filter(s -> s.getCourse().equals(course)).count();
        if (enrolledInCourse >= courseDef.capacity) {
            throw new IllegalArgumentException(courseDef.name + " has reached its capacity of " + courseDef.capacity + " seats.");
        }

        Student student = new Student(
            AppData.newId("stu"), roll, name,
            str(body, "fatherName"), str(body, "motherName"), str(body, "phone"),
            str(body, "address"), str(body, "percentage12"), course, Instant.now().toString()
        );
        data.students.add(student);
        data.log(name + " (" + roll + ") enrolled in " + courseDef.name + ".");
        ApiSupport.sendJson(exchange, 201, student.toMap());
    }

    private void remove(HttpExchange exchange, String id) throws IOException {
        Student target = data.students.all().stream().filter(s -> s.getId().equals(id)).findFirst().orElse(null);
        if (target == null) { ApiSupport.sendError(exchange, 404, "Student not found."); return; }
        data.students.removeById(Student::getId, id);
        data.log(target.getName() + " (" + target.getRollNumber() + ") was removed from the register.");
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
