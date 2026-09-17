package com.campus.model;

import java.util.LinkedHashMap;
import java.util.Map;

public class Faculty {
    private String id;
    private String name;
    private String designation;
    private String department;
    private String subject;
    private String course;
    private String experience;
    private String email;
    private String phone;

    public Faculty() {}

    public Faculty(String id, String name, String designation, String department, String subject,
                   String course, String experience, String email, String phone) {
        this.id = id;
        this.name = name;
        this.designation = designation;
        this.department = department;
        this.subject = subject;
        this.course = course;
        this.experience = experience;
        this.email = email;
        this.phone = phone;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getDesignation() { return designation; }
    public String getCourse() { return course; }

    public Map<String, Object> toMap() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("name", name);
        m.put("designation", designation);
        m.put("department", department);
        m.put("subject", subject);
        m.put("course", course);
        m.put("experience", experience);
        m.put("email", email);
        m.put("phone", phone);
        return m;
    }

    public static Faculty fromMap(Map<String, Object> m) {
        return new Faculty(
            Student.str(m, "id"), Student.str(m, "name"), Student.str(m, "designation"),
            Student.str(m, "department"), Student.str(m, "subject"), Student.str(m, "course"),
            Student.str(m, "experience"), Student.str(m, "email"), Student.str(m, "phone")
        );
    }
}
