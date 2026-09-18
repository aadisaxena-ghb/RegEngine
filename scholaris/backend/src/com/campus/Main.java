package com.campus;

import com.campus.http.AcademicCalendarHandler;
import com.campus.http.AttendanceHandler;
import com.campus.http.CoursesHandler;
import com.campus.http.CurriculumHandler;
import com.campus.http.DashboardHandler;
import com.campus.http.FacultyHandler;
import com.campus.http.FeesHandler;
import com.campus.http.NoticesHandler;
import com.campus.http.StaticFileHandler;
import com.campus.http.StudentsHandler;
import com.campus.http.TimetableHandler;
import com.campus.store.AppData;
import com.sun.net.httpserver.HttpServer;

import java.net.InetSocketAddress;
import java.nio.file.Path;
import java.util.concurrent.Executors;

public class Main {
    public static void main(String[] args) throws Exception {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 8080;

        Path dataDir = Path.of("data");
        Path frontendDir = Path.of("..", "frontend").toAbsolutePath().normalize();
        if (!java.nio.file.Files.exists(frontendDir)) {
            frontendDir = Path.of("frontend").toAbsolutePath().normalize();
        }

        AppData data = new AppData(dataDir);

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.setExecutor(Executors.newFixedThreadPool(8));

        server.createContext("/api/students", new StudentsHandler(data));
        server.createContext("/api/faculty", new FacultyHandler(data));
        server.createContext("/api/attendance", new AttendanceHandler(data));
        server.createContext("/api/courses", new CoursesHandler(data));
        server.createContext("/api/dashboard", new DashboardHandler(data));
        server.createContext("/api/notices", new NoticesHandler(data));
        server.createContext("/api/calendar", new AcademicCalendarHandler(data));
        server.createContext("/api/timetable", new TimetableHandler(data));
        server.createContext("/api/curriculum", new CurriculumHandler());
        server.createContext("/api/fees", new FeesHandler(data));
        server.createContext("/", new StaticFileHandler(frontendDir));

        server.start();

        System.out.println("========================================================");
        System.out.println(" RegEngine Campus Registration Server running");
        System.out.println(" Portal: http://localhost:" + port + "/");
        System.out.println(" App:    http://localhost:" + port + "/app.html");
        System.out.println(" API:    http://localhost:" + port + "/api/dashboard");
        System.out.println(" Notices: http://localhost:" + port + "/api/notices");
        System.out.println(" Fees:   http://localhost:" + port + "/api/fees");
        System.out.println(" Data:   " + dataDir.toAbsolutePath());
        System.out.println("========================================================");
    }
}
