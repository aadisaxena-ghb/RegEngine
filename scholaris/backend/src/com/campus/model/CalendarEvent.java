package com.campus.model;

import java.util.LinkedHashMap;
import java.util.Map;

public record CalendarEvent(
        String id,
        String title,
        String startDate,
        String endDate,
        String category,
        String semester,
        String description,
        String location
) {
    public static CalendarEvent fromMap(Map<String, Object> m) {
        return new CalendarEvent(
                (String) m.getOrDefault("id", ""),
                (String) m.getOrDefault("title", ""),
                (String) m.getOrDefault("startDate", ""),
                (String) m.getOrDefault("endDate", ""),
                (String) m.getOrDefault("category", "Academic"),
                (String) m.getOrDefault("semester", "All Semesters"),
                (String) m.getOrDefault("description", ""),
                (String) m.getOrDefault("location", "SRMIST Delhi-NCR Campus")
        );
    }

    public static Map<String, Object> toMap(CalendarEvent e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", e.id);
        m.put("title", e.title);
        m.put("startDate", e.startDate);
        m.put("endDate", e.endDate);
        m.put("category", e.category);
        m.put("semester", e.semester);
        m.put("description", e.description);
        m.put("location", e.location);
        return m;
    }
}
