package com.campus.model;

import java.util.LinkedHashMap;
import java.util.Map;

public class Student {
    private String id;
    private String rollNumber;
    private String name;
    private String gender;
    private String dob;
    private String bloodGroup;
    private String category;
    private String aadharNumber;
    
    private String course;
    private String batchYear;
    private String admissionType;
    private String percentage10;
    private String percentage12;
    private String previousSchool;
    
    private String fatherName;
    private String fatherOccupation;
    private String motherName;
    private String motherOccupation;
    private String guardianPhone;
    private String guardianEmail;
    
    private String phone;
    private String email;
    private String emergencyContact;
    private String address;
    private String cityStatePin;
    private String accommodation;
    private String busRoute;
    private String enrollDate;

    public Student() {}

    public Student(String id, String rollNumber, String name, String gender, String dob,
                   String bloodGroup, String category, String aadharNumber, String course,
                   String batchYear, String admissionType, String percentage10, String percentage12,
                   String previousSchool, String fatherName, String fatherOccupation,
                   String motherName, String motherOccupation, String guardianPhone,
                   String guardianEmail, String phone, String email, String emergencyContact,
                   String address, String cityStatePin, String accommodation, String busRoute,
                   String enrollDate) {
        this.id = id;
        this.rollNumber = rollNumber;
        this.name = name;
        this.gender = gender;
        this.dob = dob;
        this.bloodGroup = bloodGroup;
        this.category = category;
        this.aadharNumber = aadharNumber;
        this.course = course;
        this.batchYear = batchYear;
        this.admissionType = admissionType;
        this.percentage10 = percentage10;
        this.percentage12 = percentage12;
        this.previousSchool = previousSchool;
        this.fatherName = fatherName;
        this.fatherOccupation = fatherOccupation;
        this.motherName = motherName;
        this.motherOccupation = motherOccupation;
        this.guardianPhone = guardianPhone;
        this.guardianEmail = guardianEmail;
        this.phone = phone;
        this.email = email;
        this.emergencyContact = emergencyContact;
        this.address = address;
        this.cityStatePin = cityStatePin;
        this.accommodation = accommodation;
        this.busRoute = busRoute;
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
        m.put("gender", gender);
        m.put("dob", dob);
        m.put("bloodGroup", bloodGroup);
        m.put("category", category);
        m.put("aadharNumber", aadharNumber);
        m.put("course", course);
        m.put("batchYear", batchYear);
        m.put("admissionType", admissionType);
        m.put("percentage10", percentage10);
        m.put("percentage12", percentage12);
        m.put("previousSchool", previousSchool);
        m.put("fatherName", fatherName);
        m.put("fatherOccupation", fatherOccupation);
        m.put("motherName", motherName);
        m.put("motherOccupation", motherOccupation);
        m.put("guardianPhone", guardianPhone);
        m.put("guardianEmail", guardianEmail);
        m.put("phone", phone);
        m.put("email", email);
        m.put("emergencyContact", emergencyContact);
        m.put("address", address);
        m.put("cityStatePin", cityStatePin);
        m.put("accommodation", accommodation);
        m.put("busRoute", busRoute);
        m.put("enrollDate", enrollDate);
        return m;
    }

    public static Student fromMap(Map<String, Object> m) {
        return new Student(
            str(m, "id"), str(m, "rollNumber"), str(m, "name"), str(m, "gender"),
            str(m, "dob"), str(m, "bloodGroup"), str(m, "category"), str(m, "aadharNumber"),
            str(m, "course"), str(m, "batchYear"), str(m, "admissionType"), str(m, "percentage10"),
            str(m, "percentage12"), str(m, "previousSchool"), str(m, "fatherName"),
            str(m, "fatherOccupation"), str(m, "motherName"), str(m, "motherOccupation"),
            str(m, "guardianPhone"), str(m, "guardianEmail"), str(m, "phone"), str(m, "email"),
            str(m, "emergencyContact"), str(m, "address"), str(m, "cityStatePin"),
            str(m, "accommodation"), str(m, "busRoute"), str(m, "enrollDate")
        );
    }

    public static String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v == null ? null : String.valueOf(v);
    }
}
