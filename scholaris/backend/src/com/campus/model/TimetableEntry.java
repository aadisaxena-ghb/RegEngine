package com.campus.model;

import java.util.LinkedHashMap;
import java.util.Map;

public record TimetableEntry(
        String id,
        String courseCode,
        String semester,
        String day,
        String timeSlot,
        String subjectCode,
        String subjectName,
        String facultyName,
        String roomNo,
        String type
) {
    public static TimetableEntry fromMap(Map<String, Object> m) {
        return new TimetableEntry(
                (String) m.getOrDefault("id", ""),
                (String) m.getOrDefault("courseCode", "CSE-CORE"),
                (String) m.getOrDefault("semester", "1"),
                (String) m.getOrDefault("day", "Monday"),
                (String) m.getOrDefault("timeSlot", "09:00 - 10:00 AM"),
                (String) m.getOrDefault("subjectCode", "CS101"),
                (String) m.getOrDefault("subjectName", ""),
                (String) m.getOrDefault("facultyName", ""),
                (String) m.getOrDefault("roomNo", "CS-301"),
                (String) m.getOrDefault("type", "Theory")
        );
    }

    public static Map<String, Object> toMap(TimetableEntry t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.id);
        m.put("courseCode", t.courseCode);
        m.put("semester", t.semester);
        m.put("day", t.day);
        m.put("timeSlot", t.timeSlot);
        m.put("subjectCode", t.subjectCode);
        m.put("subjectName", t.subjectName);
        m.put("facultyName", t.facultyName);
        m.put("roomNo", t.roomNo);
        m.put("type", t.type);
        return m;
    }
}
