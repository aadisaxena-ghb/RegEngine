package com.campus.model;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class Course {
    public final String code;
    public final String name;
    public final String department;
    public final int capacity;

    public Course(String code, String name, String department, int capacity) {
        this.code = code;
        this.name = name;
        this.department = department;
        this.capacity = capacity;
    }

    public static final List<Course> ALL = List.of(
        new Course("CSE-CORE", "B.Tech CSE Core", "Computer Science", 60),
        new Course("CSE-AIML", "B.Tech CSE AIML", "Computer Science", 60),
        new Course("CSE-DS", "B.Tech CSE Data Science", "Computer Science", 50),
        new Course("ECE", "B.Tech ECE", "Electronics & Communication", 50)
    );

    public static Course byCode(String code) {
        for (Course c : ALL) if (c.code.equals(code)) return c;
        return null;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", code);
        m.put("name", name);
        m.put("department", department);
        m.put("capacity", capacity);
        return m;
    }
}
