package com.campus.http;

import com.campus.model.Course;
import com.campus.model.Faculty;
import com.campus.model.Student;
import com.campus.store.AppData;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class CoursesHandler implements HttpHandler {
    private final AppData data;

    public CoursesHandler(AppData data) { this.data = data; }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ApiSupport.handledPreflight(exchange)) return;
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            ApiSupport.sendError(exchange, 404, "No such course route.");
            return;
        }
        System.out.println("GET " + exchange.getRequestURI().getPath());
        List<Student> students = data.students.all();
        List<Faculty> faculty = data.faculty.all();

        List<Object> out = new ArrayList<>();
        for (Course c : Course.ALL) {
            long enrolled = students.stream().filter(s -> s.getCourse().equals(c.code)).count();
            List<Object> facultyForCourse = new ArrayList<>();
            for (Faculty f : faculty) {
                if (f.getCourse().equals(c.code)) {
                    Map<String, Object> fm = new LinkedHashMap<>();
                    fm.put("name", f.getName());
                    fm.put("designation", f.getDesignation());
                    facultyForCourse.add(fm);
                }
            }
            Map<String, Object> m = c.toMap();
            m.put("enrolled", enrolled);
            m.put("faculty", facultyForCourse);
            out.add(m);
        }
        ApiSupport.sendJson(exchange, 200, out);
    }
}
