package com.campus.model;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class AttendanceSession {
    private String id;
    private String course;
    private String date;
    private List<Record> records;

    public static class Record {
        public String rollNumber;
        public boolean present;
        public Record() {}
        public Record(String rollNumber, boolean present) {
            this.rollNumber = rollNumber;
            this.present = present;
        }
    }

    public AttendanceSession() {}

    public AttendanceSession(String id, String course, String date, List<Record> records) {
        this.id = id;
        this.course = course;
        this.date = date;
        this.records = records;
    }

    public String getId() { return id; }
    public String getCourse() { return course; }
    public String getDate() { return date; }
    public List<Record> getRecords() { return records; }
    public void setRecords(List<Record> records) { this.records = records; }

    @SuppressWarnings("unchecked")
    public Map<String, Object> toMap() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("course", course);
        m.put("date", date);
        List<Object> recs = new ArrayList<>();
        for (Record r : records) {
            Map<String, Object> rm = new LinkedHashMap<>();
            rm.put("rollNumber", r.rollNumber);
            rm.put("present", r.present);
            recs.add(rm);
        }
        m.put("records", recs);
        return m;
    }

    @SuppressWarnings("unchecked")
    public static AttendanceSession fromMap(Map<String, Object> m) {
        List<Record> records = new ArrayList<>();
        Object rawRecords = m.get("records");
        if (rawRecords instanceof List) {
            for (Object o : (List<Object>) rawRecords) {
                Map<String, Object> rm = (Map<String, Object>) o;
                Object presentVal = rm.get("present");
                boolean present = Boolean.TRUE.equals(presentVal) || "true".equals(String.valueOf(presentVal));
                records.add(new Record(Student.str(rm, "rollNumber"), present));
            }
        }
        return new AttendanceSession(Student.str(m, "id"), Student.str(m, "course"), Student.str(m, "date"), records);
    }
}
