package com.campus.http;

import com.campus.model.ActivityEntry;
import com.campus.model.AttendanceSession;
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
import java.util.stream.Collectors;

public class DashboardHandler implements HttpHandler {
    private final AppData data;

    public DashboardHandler(AppData data) { this.data = data; }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ApiSupport.handledPreflight(exchange)) return;
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            ApiSupport.sendError(exchange, 404, "No such dashboard route.");
            return;
        }
        System.out.println("GET " + exchange.getRequestURI().getPath());

        List<Student> students = data.students.all();
        List<Faculty> faculty = data.faculty.all();
        List<AttendanceSession> sessions = data.attendance.all();

        int totalMarked = 0, totalPresent = 0;
        for (AttendanceSession s : sessions) {
            for (AttendanceSession.Record r : s.getRecords()) {
                totalMarked++;
                if (r.present) totalPresent++;
            }
        }
        Integer avgAttendance = totalMarked == 0 ? null : Math.round((totalPresent * 100f) / totalMarked);

        List<Object> distribution = new ArrayList<>();
        for (Course c : Course.ALL) {
            long n = students.stream().filter(s -> s.getCourse().equals(c.code)).count();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("code", c.code);
            m.put("name", c.name);
            m.put("count", n);
            distribution.add(m);
        }

        long departments = faculty.stream().map(Faculty::getDesignation).distinct().count();
        long deptCount = faculty.stream().map(f -> f.toMap().get("department")).distinct().count();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalStudents", students.size());
        out.put("totalFaculty", faculty.size());
        out.put("totalCourses", Course.ALL.size());
        out.put("departmentCount", deptCount);
        out.put("avgAttendance", avgAttendance);
        out.put("attendanceSessionsMarked", totalMarked);
        out.put("distribution", distribution);
        out.put("activity", data.activity.all().stream().map(ActivityEntry::toMap).collect(Collectors.toList()));

        ApiSupport.sendJson(exchange, 200, out);
    }
}
