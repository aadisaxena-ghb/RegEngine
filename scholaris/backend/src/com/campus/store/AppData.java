package com.campus.store;

import com.campus.model.ActivityEntry;
import com.campus.model.AttendanceSession;
import com.campus.model.Faculty;
import com.campus.model.Student;

import java.nio.file.Path;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class AppData {
    public final FileStore<Student> students;
    public final FileStore<Faculty> faculty;
    public final FileStore<AttendanceSession> attendance;
    public final FileStore<ActivityEntry> activity;

    public AppData(Path dataDir) {
        students = new FileStore<>(dataDir.resolve("students.json"), Student::toMap, Student::fromMap, AppData::seedStudents);
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
        while (current.size() > 25) current.remove(current.size() - 1);
        activity.replaceAll(current);
    }

    private static String isoDaysAgo(int days) {
        return Instant.now().minus(days, ChronoUnit.DAYS).toString();
    }

    private static List<Student> seedStudents() {
        List<Student> list = new ArrayList<>();
        list.add(new Student(newId("stu"), "SIT24CS041", "Ananya Sharma", "Rakesh Sharma", "Meena Sharma", "98110 22341", "Sector 12, Dwarka, New Delhi", "91.4", "CSE-CORE", isoDaysAgo(46)));
        list.add(new Student(newId("stu"), "SIT24CS118", "Vihaan Mehta", "Sunil Mehta", "Pooja Mehta", "99887 65432", "Kothrud, Pune", "88.7", "CSE-AIML", isoDaysAgo(44)));
        list.add(new Student(newId("stu"), "SIT24DS027", "Ishita Verma", "Manoj Verma", "Suman Verma", "97654 12098", "Indiranagar, Bengaluru", "93.2", "CSE-DS", isoDaysAgo(40)));
        list.add(new Student(newId("stu"), "SIT24EC009", "Arjun Nair", "Prakash Nair", "Lakshmi Nair", "90210 44556", "Vastrapur, Ahmedabad", "85.9", "ECE", isoDaysAgo(38)));
        list.add(new Student(newId("stu"), "SIT24CS204", "Kabir Singh", "Harpreet Singh", "Simran Singh", "93123 87765", "Model Town, Ludhiana", "79.6", "CSE-CORE", isoDaysAgo(21)));
        return list;
    }

    private static List<Faculty> seedFaculty() {
        List<Faculty> list = new ArrayList<>();
        list.add(new Faculty(newId("fac"), "Dr. Rohan Kapoor", "Associate Professor", "Computer Science", "Data Structures & Algorithms", "CSE-CORE", "11", "r.kapoor@scholaris.edu", "98765 11223"));
        list.add(new Faculty(newId("fac"), "Dr. Neha Iyer", "Assistant Professor", "Computer Science", "Machine Learning", "CSE-AIML", "7", "n.iyer@scholaris.edu", "98765 33445"));
        list.add(new Faculty(newId("fac"), "Prof. Aditya Rao", "Professor", "Electronics & Communication", "Digital Signal Processing", "ECE", "16", "a.rao@scholaris.edu", "98765 55667"));
        return list;
    }

    private static List<ActivityEntry> seedActivity() {
        List<ActivityEntry> list = new ArrayList<>();
        list.add(new ActivityEntry(newId("log"), "Registrar server initialised with sample records.", Instant.now().toString()));
        return list;
    }
}
