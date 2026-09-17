package com.campus.model;

import java.util.LinkedHashMap;
import java.util.Map;

public class ActivityEntry {
    private String id;
    private String text;
    private String time;

    public ActivityEntry() {}

    public ActivityEntry(String id, String text, String time) {
        this.id = id;
        this.text = text;
        this.time = time;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("text", text);
        m.put("time", time);
        return m;
    }

    public static ActivityEntry fromMap(Map<String, Object> m) {
        return new ActivityEntry(Student.str(m, "id"), Student.str(m, "text"), Student.str(m, "time"));
    }
}
