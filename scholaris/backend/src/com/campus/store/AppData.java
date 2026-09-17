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
        faculty = new FileStore<>(dataDir.resolve("faculty.json"), Faculty::toMap, Faculty::fromMap, ArrayList::new);
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
}
