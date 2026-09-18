package com.campus.http;

import com.campus.model.FeePayment;
import com.campus.store.AppData;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class FeesHandler implements HttpHandler {
    private final AppData data;

    public FeesHandler(AppData data) {
        this.data = data;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ApiSupport.handledPreflight(exchange)) return;

        String method = exchange.getRequestMethod().toUpperCase();
        try {
            switch (method) {
                case "GET" -> handleGet(exchange);
                case "POST" -> handlePost(exchange);
                default -> ApiSupport.sendError(exchange, 405, "Method not allowed");
            }
        } catch (Exception e) {
            e.printStackTrace();
            ApiSupport.sendError(exchange, 500, "Internal Server Error: " + e.getMessage());
        }
    }

    private void handleGet(HttpExchange exchange) throws IOException {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("feeStructures", getFeeStructures());

        List<FeePayment> payments = data.feePayments.all();
        List<Map<String, Object>> paymentMaps = new ArrayList<>();
        for (FeePayment p : payments) {
            paymentMaps.add(FeePayment.toMap(p));
        }
        response.put("payments", paymentMaps);

        ApiSupport.sendJson(exchange, 200, response);
    }

    private void handlePost(HttpExchange exchange) throws IOException {
        Map<String, Object> body = ApiSupport.readJsonBody(exchange);

        String studentRoll = (String) body.getOrDefault("studentRoll", "");
        String studentName = (String) body.getOrDefault("studentName", "");
        String course = (String) body.getOrDefault("course", "B.Tech CSE");
        String feeHead = (String) body.getOrDefault("feeHead", "Tuition Fee (Semester 1)");
        String semester = (String) body.getOrDefault("semester", "Semester 1");
        String amount = String.valueOf(body.getOrDefault("amount", "125000"));
        String paymentMode = (String) body.getOrDefault("paymentMode", "Online UPI");

        if (studentRoll.isBlank() || studentName.isBlank()) {
            ApiSupport.sendError(exchange, 400, "Student Roll Number and Name are required for fee payment.");
            return;
        }

        String id = AppData.newId("pay");
        long rand = (long)(Math.random() * 90000000L + 10000000L);
        String txnId = "TXN" + System.currentTimeMillis() % 1000000 + "" + (int)(Math.random() * 900 + 100);
        String receiptNo = "SRM-REC-2026-" + rand;
        String nowStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        FeePayment payment = new FeePayment(
                id,
                receiptNo,
                txnId,
                studentRoll,
                studentName,
                course,
                feeHead,
                semester,
                amount,
                paymentMode,
                nowStr,
                "SUCCESS",
                "REF-" + Math.abs(receiptNo.hashCode())
        );

        List<FeePayment> current = data.feePayments.all();
        current.add(0, payment);
        data.feePayments.replaceAll(current);

        data.log("Fee Payment Received: " + studentName + " (" + studentRoll + ") paid ₹" + amount + " towards " + feeHead + ". Receipt: " + receiptNo);

        Map<String, Object> result = new LinkedHashMap<>(FeePayment.toMap(payment));
        result.put("message", "Fee payment processed successfully. Official receipt minted.");
        result.put("qrPayload", "SRMIST-VERIFIED-RECEIPT|" + receiptNo + "|" + studentRoll + "|INR" + amount + "|" + nowStr);

        ApiSupport.sendJson(exchange, 201, result);
    }

    public static List<Map<String, Object>> getFeeStructures() {
        List<Map<String, Object>> list = new ArrayList<>();

        list.add(createFeeTier("CSE-CORE", "B.Tech Computer Science & Engineering (Core)", "₹2,50,000", "₹1,25,000", "₹15,000", "₹20,000", "₹1,10,000", "₹35,000"));
        list.add(createFeeTier("CSE-AIML", "B.Tech CSE (Artificial Intelligence & ML)", "₹2,75,000", "₹1,37,500", "₹18,000", "₹20,000", "₹1,10,000", "₹35,000"));
        list.add(createFeeTier("CSE-DS", "B.Tech CSE (Data Science)", "₹2,50,000", "₹1,25,000", "₹15,000", "₹20,000", "₹1,10,000", "₹35,000"));
        list.add(createFeeTier("CSE-CYBER", "B.Tech CSE (Cyber Security)", "₹2,50,000", "₹1,25,000", "₹15,000", "₹20,000", "₹1,10,000", "₹35,000"));
        list.add(createFeeTier("ECE", "B.Tech Electronics & Communication", "₹2,00,000", "₹1,00,000", "₹15,000", "₹20,000", "₹1,10,000", "₹35,000"));
        list.add(createFeeTier("BCA", "Bachelor of Computer Applications (BCA)", "₹1,10,000", "₹55,000", "₹8,000", "₹15,000", "₹1,10,000", "₹35,000"));
        list.add(createFeeTier("MCA-AI", "Master of Computer Applications (MCA - Gen AI)", "₹1,40,000", "₹70,000", "₹10,000", "₹15,000", "₹1,10,000", "₹35,000"));
        list.add(createFeeTier("MBA", "Master of Business Administration (MBA)", "₹2,20,000", "₹1,10,000", "₹10,000", "₹25,000", "₹1,10,000", "₹35,000"));
        list.add(createFeeTier("BPHARM", "Bachelor of Pharmacy (B.Pharm)", "₹1,60,000", "₹80,000", "₹18,000", "₹15,000", "₹1,10,000", "₹35,000"));

        return list;
    }

    private static Map<String, Object> createFeeTier(String code, String name, String annual, String perSem, String lab, String registration, String hostel, String transport) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("courseCode", code);
        m.put("courseName", name);
        m.put("annualTuition", annual);
        m.put("semesterTuition", perSem);
        m.put("labExamFee", lab);
        m.put("oneTimeRegistration", registration);
        m.put("hostelFeeAnnual", hostel);
        m.put("transportFeeAnnual", transport);
        return m;
    }
}
