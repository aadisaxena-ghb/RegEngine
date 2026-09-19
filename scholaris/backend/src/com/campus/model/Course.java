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
        new Course("CSE-CORE", "B.Tech Computer Science & Engineering (Core)", "Computer Science & Engineering", 180),
        new Course("CSE-AIML", "B.Tech CSE (AI & Machine Learning)", "Computer Science & Engineering", 120),
        new Course("CSE-DS", "B.Tech CSE (Data Science)", "Computer Science & Engineering", 60),
        new Course("CSE-CYBER", "B.Tech CSE (Cyber Security)", "Computer Science & Engineering", 60),
        new Course("CSE-CLOUD", "B.Tech CSE (Cloud Computing)", "Computer Science & Engineering", 60),
        new Course("ECE", "B.Tech Electronics & Communication Engineering", "Electronics & Communication", 60),
        new Course("ECE-VLSI", "B.Tech Electronics (VLSI Design & Technology)", "Electronics & Communication", 60),
        new Course("MECH", "B.Tech Mechanical Engineering", "Mechanical & Automobile Engineering", 60),
        new Course("AUTO", "B.Tech Automobile Engineering", "Mechanical & Automobile Engineering", 60),
        new Course("BCA", "Bachelor of Computer Applications (BCA)", "Computer Applications", 60),
        new Course("BCA-DS", "BCA (Data Science)", "Computer Applications", 60),
        new Course("MCA", "Master of Computer Applications (MCA)", "Computer Applications", 60),
        new Course("MCA-AI", "MCA (Generative AI)", "Computer Applications", 60),
        new Course("BBA", "Bachelor of Business Administration (BBA)", "Management Studies", 60),
        new Course("MBA", "Master of Business Administration (MBA)", "Management Studies", 60)
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

