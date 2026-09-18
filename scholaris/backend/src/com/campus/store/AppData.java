package com.campus.store;

import com.campus.model.ActivityEntry;
import com.campus.model.AttendanceSession;
import com.campus.model.Faculty;
import com.campus.model.Student;

import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class AppData {
    public final FileStore<Student> students;
    public final FileStore<Faculty> faculty;
    public final FileStore<AttendanceSession> attendance;
    public final FileStore<ActivityEntry> activity;

    public AppData(Path dataDir) {
        students = new FileStore<>(dataDir.resolve("students.json"), Student::toMap, Student::fromMap, ArrayList::new);
        faculty = new FileStore<>(dataDir.resolve("faculty.json"), Faculty::toMap, Faculty::fromMap, AppData::seedFaculty);
        attendance = new FileStore<>(dataDir.resolve("attendance.json"), AttendanceSession::toMap, AttendanceSession::fromMap, ArrayList::new);
        activity = new FileStore<>(dataDir.resolve("activity.json"), ActivityEntry::toMap, ActivityEntry::fromMap, AppData::seedActivity);
    }

    public static String newId(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    public void log(String text) {
        List<ActivityEntry> current = activity.all();
        current.add(0, new ActivityEntry(newId("log"), text, Instant.now().toString()));
        while (current.size() > 50) current.remove(current.size() - 1);
        activity.replaceAll(current);
    }

    private static List<ActivityEntry> seedActivity() {
        List<ActivityEntry> list = new ArrayList<>();
        list.add(new ActivityEntry(newId("log"), "RegEngine Campus Registration System initialized. Ready for student admissions.", Instant.now().toString()));
        return list;
    }

    public static List<Faculty> seedFaculty() {
        List<Faculty> list = new ArrayList<>();
        list.add(new Faculty(newId("fac"), "EMP-101", "Dr. Anjali Sharma", "Associate Professor", "Computer Science & Engineering", "Ph.D. Computer Science", "Advanced Programming Practice", "CSE-CORE", "12", "anjali.sharma@regengine.edu", "+91 98101 23456", "Room CS-304", "2018-07-15"));
        list.add(new Faculty(newId("fac"), "EMP-102", "Prof. (Dr.) R. P. Mahapatra", "Professor & Dean", "Computer Science & Engineering", "Ph.D., M.Tech", "Cloud Computing & Distributed Systems", "CSE-CLOUD", "24", "rp.mahapatra@regengine.edu", "+91 98111 22334", "Dean Office CS-101", "2010-06-01"));
        list.add(new Faculty(newId("fac"), "EMP-103", "Dr. Dhowmya Bhatt", "Professor & Dean IQAC", "Computer Science & Engineering", "Ph.D. CSE", "Software Engineering & Data Analytics", "CSE-DS", "18", "dhowmya.bhatt@regengine.edu", "+91 98112 33445", "Room CS-202", "2014-08-10"));
        list.add(new Faculty(newId("fac"), "EMP-104", "Dr. Avneesh Vashistha", "Associate Professor & HOD", "Computer Science & Engineering", "Ph.D. AI/ML", "Machine Learning & Soft Computing", "CSE-AIML", "15", "avneesh.vashistha@regengine.edu", "+91 98113 44556", "HOD Office CS-201", "2016-01-20"));
        list.add(new Faculty(newId("fac"), "EMP-105", "Dr. Niranjan Lal", "Associate Professor & Deputy HOD", "Computer Science & Engineering", "Ph.D. Information Security", "Cyber Security & Cryptography", "CSE-CYBER", "14", "niranjan.lal@regengine.edu", "+91 98114 55667", "Room CS-205", "2017-03-12"));
        list.add(new Faculty(newId("fac"), "EMP-106", "Dr. Abhilasha Singh", "Assistant Professor", "Computer Science & Engineering", "Ph.D. Computer Science", "Design & Analysis of Algorithms", "CSE-CORE", "9", "abhilasha.singh@regengine.edu", "+91 98115 66778", "Room CS-310", "2020-09-01"));
        list.add(new Faculty(newId("fac"), "EMP-107", "Dr. Rupali Singh", "Associate Professor & HOD", "Electronics & Communication Engineering", "Ph.D. ECE", "Digital Signal Processing & VLSI", "ECE", "16", "rupali.singh@regengine.edu", "+91 98116 77889", "HOD Office EC-101", "2015-05-18"));
        list.add(new Faculty(newId("fac"), "EMP-108", "Dr. Satya Sai Srikant", "Professor", "Electronics & Communication Engineering", "Ph.D. VLSI & Embedded", "Embedded Systems & IoT", "ECE-VLSI", "20", "satyasai.srikant@regengine.edu", "+91 98117 88990", "Room EC-204", "2012-11-05"));
        list.add(new Faculty(newId("fac"), "EMP-109", "Dr. Lalit Kishore Arora", "Associate Professor & HOD", "Computer Applications", "Ph.D. Computer Applications", "Object Oriented Programming & Python", "BCA", "17", "lalit.arora@regengine.edu", "+91 98118 99001", "HOD Office CA-101", "2013-04-14"));
        list.add(new Faculty(newId("fac"), "EMP-110", "Dr. Gyanendra Prasad Bagri", "Professor & HOD", "Mechanical & Automobile Engineering", "Ph.D. Mechanical Engg", "Thermodynamics & Fluid Mechanics", "MECH", "22", "gp.bagri@regengine.edu", "+91 98119 00112", "HOD Office ME-101", "2011-08-25"));
        list.add(new Faculty(newId("fac"), "EMP-111", "Dr. Manoj Kumar Pal", "Associate Professor", "Mechanical & Automobile Engineering", "Ph.D. Manufacturing", "Manufacturing Technology & CAD/CAM", "AUTO", "15", "manoj.pal@regengine.edu", "+91 98120 11223", "Room ME-208", "2016-10-10"));
        list.add(new Faculty(newId("fac"), "EMP-112", "Dr. Sunil Kumar Yadav", "Associate Professor", "Science & Humanities", "Ph.D. Chemistry", "Applied Chemistry & Materials Science", "BPHARM", "13", "sunil.yadav@regengine.edu", "+91 98121 22334", "Room SH-105", "2017-02-15"));
        return list;
    }
}

