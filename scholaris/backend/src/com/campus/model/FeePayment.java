package com.campus.model;

import java.util.LinkedHashMap;
import java.util.Map;

public record FeePayment(
        String id,
        String receiptNumber,
        String transactionId,
        String studentRoll,
        String studentName,
        String course,
        String feeHead,
        String semester,
        String amount,
        String paymentMode,
        String paymentDate,
        String status,
        String referenceNumber
) {
    public static FeePayment fromMap(Map<String, Object> m) {
        return new FeePayment(
                (String) m.getOrDefault("id", ""),
                (String) m.getOrDefault("receiptNumber", ""),
                (String) m.getOrDefault("transactionId", ""),
                (String) m.getOrDefault("studentRoll", ""),
                (String) m.getOrDefault("studentName", ""),
                (String) m.getOrDefault("course", ""),
                (String) m.getOrDefault("feeHead", "Tuition Fee"),
                (String) m.getOrDefault("semester", "Semester 1"),
                (String) m.getOrDefault("amount", "0"),
                (String) m.getOrDefault("paymentMode", "Online UPI"),
                (String) m.getOrDefault("paymentDate", ""),
                (String) m.getOrDefault("status", "SUCCESS"),
                (String) m.getOrDefault("referenceNumber", "")
        );
    }

    public static Map<String, Object> toMap(FeePayment f) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", f.id);
        m.put("receiptNumber", f.receiptNumber);
        m.put("transactionId", f.transactionId);
        m.put("studentRoll", f.studentRoll);
        m.put("studentName", f.studentName);
        m.put("course", f.course);
        m.put("feeHead", f.feeHead);
        m.put("semester", f.semester);
        m.put("amount", f.amount);
        m.put("paymentMode", f.paymentMode);
        m.put("paymentDate", f.paymentDate);
        m.put("status", f.status);
        m.put("referenceNumber", f.referenceNumber);
        return m;
    }
}
