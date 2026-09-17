package com.campus.model;

import java.util.LinkedHashMap;
import java.util.Map;

public class Student {
    private String id;
    private String rollNumber;
    private String name;
    private String fatherName;
    private String motherName;
    private String phone;
    private String address;
    private String percentage12;
    private String course;
    private String enrollDate;

    public Student() {}

    public Student(String id, String rollNumber, String name, String fatherName, String motherName,
                   String phone, String address, String percentage12, String course, String enrollDate) {
        this.id = id;
        this.rollNumber = rollNumber;
        this.name = name;
        this.fatherName = fatherName;
        this.motherName = motherName;
        this.phone = phone;
        this.address = address;
        this.percentage12 = percentage12;
        this.course = course;
        this.enrollDate = enrollDate;
    }

    public String getId() { return id; }
    public String getRollNumber() { return rollNumber; }
    public String getName() { return name; }
    public String getCourse() { return course; }
    public String getEnrollDate() { return enrollDate; }

    public Map<String, Object> toMap() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("rollNumber", rollNumber);
        m.put("name", name);
        m.put("fatherName", fatherName);
        m.put("motherName", motherName);
        m.put("phone", phone);
        m.put("address", address);
        m.put("percentage12", percentage12);
        m.put("course", course);
        m.put("enrollDate", enrollDate);
        return m;
    }

    public static Student fromMap(Map<String, Object> m) {
        return new Student(
            str(m, "id"), str(m, "rollNumber"), str(m, "name"), str(m, "fatherName"),
            str(m, "motherName"), str(m, "phone"), str(m, "address"), str(m, "percentage12"),
            str(m, "course"), str(m, "enrollDate")
        );
    }

    static String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v == null ? null : String.valueOf(v);
    }
}
