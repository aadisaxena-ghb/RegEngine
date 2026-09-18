package com.campus.model;

import java.util.LinkedHashMap;
import java.util.Map;

public record Notice(
        String id,
        String refNumber,
        String title,
        String category,
        String priority,
        String publishDate,
        String author,
        String department,
        String content,
        String attachmentUrl
) {
    public static Notice fromMap(Map<String, Object> m) {
        return new Notice(
                (String) m.getOrDefault("id", ""),
                (String) m.getOrDefault("refNumber", ""),
                (String) m.getOrDefault("title", ""),
                (String) m.getOrDefault("category", "Academic"),
                (String) m.getOrDefault("priority", "Normal"),
                (String) m.getOrDefault("publishDate", ""),
                (String) m.getOrDefault("author", "Registrar Secretariat"),
                (String) m.getOrDefault("department", "Academic Affairs"),
                (String) m.getOrDefault("content", ""),
                (String) m.getOrDefault("attachmentUrl", "")
        );
    }

    public static Map<String, Object> toMap(Notice n) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", n.id);
        m.put("refNumber", n.refNumber);
        m.put("title", n.title);
        m.put("category", n.category);
        m.put("priority", n.priority);
        m.put("publishDate", n.publishDate);
        m.put("author", n.author);
        m.put("department", n.department);
        m.put("content", n.content);
        m.put("attachmentUrl", n.attachmentUrl);
        return m;
    }
}
