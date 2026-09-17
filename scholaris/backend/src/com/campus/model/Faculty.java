package com.campus.model;

import java.util.LinkedHashMap;
import java.util.Map;

public class Faculty {
    private String id;
    private String employeeId;
    private String name;
    private String designation;
    private String department;
    private String qualification;
    private String subject;
    private String course;
    private String experience;
    private String email;
    private String phone;
    private String officeRoom;
    private String joinDate;

    public Faculty() {}

    public Faculty(String id, String employeeId, String name, String designation, String department,
                   String qualification, String subject, String course, String experience,
                   String email, String phone, String officeRoom, String joinDate) {
        this.id = id;
        this.employeeId = employeeId;
        this.name = name;
        this.designation = designation;
        this.department = department;
        this.qualification = qualification;
        this.subject = subject;
        this.course = course;
        this.experience = experience;
        this.email = email;
        this.phone = phone;
        this.officeRoom = officeRoom;
        this.joinDate = joinDate;
    }

    public String getId() { return id; }
    public String getEmployeeId() { return employeeId; }
    public String getName() { return name; }
    public String getDesignation() { return designation; }
    public String getCourse() { return course; }

    public Map<String, Object> toMap() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("employeeId", employeeId);
        m.put("name", name);
        m.put("designation", designation);
        m.put("department", department);
        m.put("qualification", qualification);
        m.put("subject", subject);
        m.put("course", course);
        m.put("experience", experience);
        m.put("email", email);
        m.put("phone", phone);
        m.put("officeRoom", officeRoom);
        m.put("joinDate", joinDate);
        return m;
    }

    public static Faculty fromMap(Map<String, Object> m) {
        return new Faculty(
            Student.str(m, "id"),
            Student.str(m, "employeeId"),
            Student.str(m, "name"),
            Student.str(m, "designation"),
            Student.str(m, "department"),
            Student.str(m, "qualification"),
            Student.str(m, "subject"),
            Student.str(m, "course"),
            Student.str(m, "experience"),
            Student.str(m, "email"),
            Student.str(m, "phone"),
            Student.str(m, "officeRoom"),
            Student.str(m, "joinDate")
        );
    }
}
