package com.campus.store;

import com.campus.model.ActivityEntry;
import com.campus.model.AttendanceSession;
import com.campus.model.CalendarEvent;
import com.campus.model.Faculty;
import com.campus.model.FeePayment;
import com.campus.model.Notice;
import com.campus.model.Student;
import com.campus.model.TimetableEntry;

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
    public final FileStore<Notice> notices;
    public final FileStore<CalendarEvent> calendar;
    public final FileStore<TimetableEntry> timetable;
    public final FileStore<FeePayment> feePayments;

    public AppData(Path dataDir) {
        students = new FileStore<>(dataDir.resolve("students.json"), Student::toMap, Student::fromMap, ArrayList::new);
        faculty = new FileStore<>(dataDir.resolve("faculty.json"), Faculty::toMap, Faculty::fromMap, AppData::seedFaculty);
        attendance = new FileStore<>(dataDir.resolve("attendance.json"), AttendanceSession::toMap, AttendanceSession::fromMap, ArrayList::new);
        activity = new FileStore<>(dataDir.resolve("activity.json"), ActivityEntry::toMap, ActivityEntry::fromMap, AppData::seedActivity);
        notices = new FileStore<>(dataDir.resolve("notices.json"), Notice::toMap, Notice::fromMap, AppData::seedNotices);
        calendar = new FileStore<>(dataDir.resolve("calendar.json"), CalendarEvent::toMap, CalendarEvent::fromMap, AppData::seedCalendar);
        timetable = new FileStore<>(dataDir.resolve("timetable.json"), TimetableEntry::toMap, TimetableEntry::fromMap, AppData::seedTimetable);
        feePayments = new FileStore<>(dataDir.resolve("feepayments.json"), FeePayment::toMap, FeePayment::fromMap, AppData::seedFeePayments);
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
        list.add(new ActivityEntry(newId("log"), "RegEngine Campus Registration System initialized. Academic & Financial Hubs online.", Instant.now().toString()));
        return list;
    }

    public static List<Notice> seedNotices() {
        List<Notice> list = new ArrayList<>();

        list.add(new Notice(
                newId("not"),
                "SRM/NCR/ACAD/2026/108",
                "Continuous Internal Assessment (CIA-1) Schedule for Odd Semester 2026",
                "Examination",
                "Urgent",
                "2026-09-18",
                "Office of the Controller of Examinations",
                "Examination Cell",
                "All registered undergraduate and postgraduate students of B.Tech, BCA, MCA, MBA, and B.Pharm are hereby informed that Continuous Internal Assessment (CIA-1) will commence from October 14, 2026. Hall tickets and seating arrangements will be available on the Student Portal. 75% attendance rule strictly enforced.",
                "https://srmist.edu.in/downloads/cia1_schedule_2026.pdf"
        ));

        list.add(new Notice(
                newId("not"),
                "SRM/NCR/REG/2026/092",
                "Mandatory Submission of Anti-Ragging & Demographic Undertakings",
                "Administration",
                "Normal",
                "2026-09-15",
                "Dr. Avneesh Vashistha (Chief Proctor)",
                "Office of the Proctor",
                "As per UGC and Supreme Court of India statutory directives, all newly enrolled 1st-year students must upload their online Anti-Ragging affidavit reference number through the Student Registration Dossier before October 10, 2026.",
                "https://antiragging.in"
        ));

        list.add(new Notice(
                newId("not"),
                "SRM/NCR/FEE/2026/044",
                "Odd Semester 2026 Tuition Fee Payment & Institutional Digital Receipts",
                "Financial",
                "Urgent",
                "2026-09-12",
                "Finance & Accounts Secretariat",
                "Accounts Section",
                "Students are notified that the last date for payment of Odd Semester tuition and laboratory fees without late fine is October 05, 2026. Payments can be completed online via the RegEngine Fee Desk. Official digitally stamped receipts with cryptographic QR verification will be minted immediately.",
                ""
        ));

        list.add(new Notice(
                newId("not"),
                "SRM/NCR/EVENT/2026/021",
                "Annual National Hackathon & Innovation Conclave 'CodeCraft 2026'",
                "Events",
                "Normal",
                "2026-09-08",
                "Dr. Anjali Sharma (Faculty Coordinator)",
                "Department of Computer Science & Engineering",
                "The Department of Computer Science & Engineering is thrilled to announce 'CodeCraft 2026' — 36-Hour National Inter-College Hackathon on AI & Decentralized Systems with a total prize pool of ₹3,00,000. Registrations open on the portal.",
                "https://srmist.edu.in/codecraft2026"
        ));

        list.add(new Notice(
                newId("not"),
                "SRM/NCR/HOST/2026/015",
                "Campus Hostel Outpass & Gate Pass Protocol Update",
                "Administration",
                "Normal",
                "2026-09-02",
                "Hostel Warden Committee",
                "Residential Services",
                "All hostellers must submit digital outpass applications at least 6 hours prior to departure via the Student Portal. Biometric check-in before 08:30 PM is mandatory on all weekdays.",
                ""
        ));

        return list;
    }

    public static List<CalendarEvent> seedCalendar() {
        List<CalendarEvent> list = new ArrayList<>();

        list.add(new CalendarEvent(newId("cal"), "Freshers Orientation & Induction Programme", "2026-08-10", "2026-08-14", "Commencement", "Semester 1", "Campus orientation, library tour, mentor allotment, and academic regulations briefing.", "Main Auditorium, SRMIST"));
        list.add(new CalendarEvent(newId("cal"), "Commencement of Regular Academic Classes", "2026-08-16", "2026-08-16", "Academic", "All Odd Semesters", "Formal start of theory lectures and laboratory sessions as per semester timetables.", "Respective Academic Blocks"));
        list.add(new CalendarEvent(newId("cal"), "Last Date for Odd Semester Course Registration & Elective Choice", "2026-08-30", "2026-08-30", "Deadline", "All Semesters", "Students must finalize core elective selections through the student desk.", "RegEngine Portal"));
        list.add(new CalendarEvent(newId("cal"), "Continuous Internal Assessment (CIA-1) Theory Exams", "2026-10-14", "2026-10-20", "Examination", "All Semesters", "Mid-term written tests covering Units 1 & 2 of all registered courses.", "Examination Halls A & B"));
        list.add(new CalendarEvent(newId("cal"), "Dussehra & Diwali Autumn Break", "2026-10-21", "2026-10-27", "Holiday", "All Semesters", "University closed for festive autumn break. Hostel messes operate on holiday timings.", "Campus Wide"));
        list.add(new CalendarEvent(newId("cal"), "Continuous Internal Assessment (CIA-2) & Lab Evaluations", "2026-11-18", "2026-11-25", "Examination", "All Semesters", "Comprehensive evaluation covering Units 3, 4 & practical viva voce.", "Departmental Laboratories"));
        list.add(new CalendarEvent(newId("cal"), "Last Instructional Day (Odd Semester)", "2026-12-05", "2026-12-05", "Academic", "All Semesters", "Dissemination of final aggregate attendance percentages and issuance of examination admit cards.", "Academic Offices"));
        list.add(new CalendarEvent(newId("cal"), "End-Semester Practical & Viva Voce Examinations", "2026-12-08", "2026-12-15", "Examination", "All Semesters", "External laboratory evaluations with university-appointed external examiners.", "Specialized Labs"));
        list.add(new CalendarEvent(newId("cal"), "End-Semester University Theory Examinations", "2026-12-18", "2026-12-31", "Examination", "All Semesters", "Official statutory theory exams conducted by the Controller of Examinations.", "Central Exam Complex"));
        list.add(new CalendarEvent(newId("cal"), "Winter Vacation & Semester Break", "2027-01-01", "2027-01-14", "Holiday", "All Semesters", "Winter vacation for undergraduate and postgraduate cohorts.", "Campus Wide"));
        list.add(new CalendarEvent(newId("cal"), "Commencement of Even Semester 2027", "2027-01-15", "2027-01-15", "Commencement", "All Even Semesters", "Reopening of campus for Even Semester theory lectures.", "Academic Blocks"));
        list.add(new CalendarEvent(newId("cal"), "Annual National Cultural Fest 'Milan 2027'", "2027-02-20", "2027-02-23", "Event", "All Semesters", "Flagship university 4-day cultural extravaganza with musical concerts, fashion, and art.", "SRMIST Sports Ground"));

        return list;
    }

    public static List<TimetableEntry> seedTimetable() {
        List<TimetableEntry> list = new ArrayList<>();

        // Monday
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Monday", "09:00 - 10:00 AM", "21CS101J", "Programming for Problem Solving (C/C++)", "Dr. Anjali Sharma", "Room CS-304", "Theory"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Monday", "10:00 - 11:00 AM", "21MA101T", "Calculus & Linear Algebra", "Dr. Sunil Kumar Yadav", "Room CS-304", "Theory"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Monday", "11:15 - 01:15 PM", "21CS101P", "Programming Lab (Batch A & B)", "Dr. Anjali Sharma & Lab Instructor", "Computer Lab 4", "Lab"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Monday", "02:00 - 03:00 PM", "21EE101T", "Basic Electrical & Electronics Engg", "Dr. Rupali Singh", "Room CS-304", "Theory"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Monday", "03:00 - 04:00 PM", "21EN101T", "Communicative English & Soft Skills", "Dr. Meenakshi Sharma", "Room CS-304", "Theory"));

        // Tuesday
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Tuesday", "09:00 - 10:00 AM", "21MA101T", "Calculus & Linear Algebra", "Dr. Sunil Kumar Yadav", "Room CS-304", "Theory"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Tuesday", "10:00 - 11:00 AM", "21CS101J", "Programming for Problem Solving (C/C++)", "Dr. Anjali Sharma", "Room CS-304", "Theory"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Tuesday", "11:15 - 12:15 PM", "21PH101T", "Applied Engineering Physics", "Dr. R.C. Joshi", "Room CS-304", "Theory"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Tuesday", "01:15 - 03:15 PM", "21PH101P", "Physics Laboratory", "Dr. R.C. Joshi", "Physics Lab 2", "Lab"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Tuesday", "03:15 - 04:15 PM", "21CS102T", "Design Thinking & Innovation", "Dr. Dhowmya Bhatt", "Room CS-304", "Theory"));

        // Wednesday
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Wednesday", "09:00 - 10:00 AM", "21EE101T", "Basic Electrical & Electronics Engg", "Dr. Rupali Singh", "Room CS-304", "Theory"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Wednesday", "10:00 - 11:00 AM", "21CS101J", "Programming for Problem Solving (C/C++)", "Dr. Anjali Sharma", "Room CS-304", "Theory"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Wednesday", "11:15 - 01:15 PM", "21ME101P", "Engineering Workshop & CAD Practice", "Dr. Manoj Kumar Pal", "Central Workshop", "Lab"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Wednesday", "02:00 - 03:00 PM", "21MA101T", "Calculus & Linear Algebra (Tutorial)", "Dr. Sunil Kumar Yadav", "Room CS-304", "Tutorial"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Wednesday", "03:00 - 04:30 PM", "21SA101", "Sports & Extracurricular Activity", "Director of Physical Education", "Sports Complex", "Practical"));

        // Thursday
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Thursday", "09:00 - 10:00 AM", "21PH101T", "Applied Engineering Physics", "Dr. R.C. Joshi", "Room CS-304", "Theory"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Thursday", "10:00 - 11:00 AM", "21CS101J", "Data Structures Fundamentals", "Dr. Abhilasha Singh", "Room CS-304", "Theory"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Thursday", "11:15 - 12:15 PM", "21MA101T", "Calculus & Linear Algebra", "Dr. Sunil Kumar Yadav", "Room CS-304", "Theory"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Thursday", "01:15 - 03:15 PM", "21EE101P", "Basic Electrical Lab", "Dr. Rupali Singh", "EE Lab 1", "Lab"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Thursday", "03:15 - 04:15 PM", "21CS103T", "Environmental Studies & Ethics", "Dr. Niranjan Lal", "Room CS-304", "Theory"));

        // Friday
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Friday", "09:00 - 10:00 AM", "21CS101J", "Advanced Programming Practice", "Dr. Anjali Sharma", "Room CS-304", "Theory"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Friday", "10:00 - 11:00 AM", "21PH101T", "Applied Engineering Physics", "Dr. R.C. Joshi", "Room CS-304", "Theory"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Friday", "11:15 - 01:15 PM", "21CS102P", "C++ Competitive Coding Lab", "Dr. Anjali Sharma", "Computer Lab 4", "Lab"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Friday", "02:00 - 03:30 PM", "21DE101", "Dean's Special Lecture on Distributed & Cloud Systems", "Prof. (Dr.) R. P. Mahapatra", "Main Seminar Hall", "Lecture"));
        list.add(new TimetableEntry(newId("tt"), "CSE-CORE", "1", "Friday", "03:30 - 04:30 PM", "21LIB1", "Library & Self-Study Research Hour", "Librarian", "Central Library", "Practical"));

        return list;
    }

    public static List<FeePayment> seedFeePayments() {
        List<FeePayment> list = new ArrayList<>();
        list.add(new FeePayment(
                newId("pay"),
                "SRM-REC-2026-88192041",
                "TXN981029482",
                "26CS696",
                "Aadi Saxena",
                "B.Tech CSE (Core)",
                "Tuition Fee (Semester 1)",
                "Semester 1",
                "125000",
                "Online UPI (HDFC Bank)",
                "2026-09-18 10:15:30",
                "SUCCESS",
                "REF-88192041"
        ));
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
