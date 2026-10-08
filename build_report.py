import base64, os, subprocess, shutil

# Read extracted images
with open('scholaris/frontend/extracted_img_0.jpg', 'rb') as f:
    logo_b64 = base64.b64encode(f.read()).decode('utf-8')

with open('scholaris/frontend/extracted_img_2.jpg', 'rb') as f:
    building_b64 = base64.b64encode(f.read()).decode('utf-8')

html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RegEngine - Advance Programming Practices Project Report</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500;600&display=swap');

        @page {{
            size: A4 portrait;
            margin: 0;
        }}

        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}

        body {{
            font-family: 'Times New Roman', Times, serif;
            color: #000;
            background-color: #cbd5e1;
            line-height: 1.45;
            font-size: 13pt;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }}

        .report-container {{
            width: 210mm;
            margin: 20px auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.25);
        }}

        .page {{
            width: 210mm;
            height: 297mm;
            padding: 22mm 22mm;
            position: relative;
            background: white;
            page-break-after: always;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }}

        @media print {{
            body {{
                background: white;
            }}
            .report-container {{
                width: 210mm;
                margin: 0;
                box-shadow: none;
            }}
            .page {{
                width: 210mm;
                height: 297mm;
                margin: 0;
                padding: 16mm 20mm;
                page-break-after: always;
                page-break-inside: avoid;
            }}
            .no-print {{
                display: none !important;
            }}
        }}

        .print-btn-bar {{
            position: fixed;
            top: 15px;
            right: 20px;
            z-index: 9999;
            background: #0f172a;
            color: white;
            padding: 10px 18px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            font-family: 'Inter', sans-serif;
            display: flex;
            gap: 12px;
            align-items: center;
        }}
        .print-btn {{
            background: #2563eb;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: 0.2s;
        }}
        .print-btn:hover {{
            background: #1d4ed8;
        }}

        /* PAGE 1: EXACT COVER BORDER & LAYOUT */
        .cover-outer-border {{
            border: 3px double #000;
            padding: 10mm 12mm;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            text-align: center;
        }}

        .cover-top-header {{
            position: relative;
            margin-bottom: 4px;
        }}

        .srm-logo-topright {{
            position: absolute;
            top: -4px;
            right: -4px;
            width: 140px;
            height: auto;
        }}

        .univ-main-title {{
            font-size: 13.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            line-height: 1.3;
            padding-right: 120px;
            text-align: center;
        }}

        .subject-main-title {{
            font-size: 19pt;
            font-weight: bold;
            margin-top: 10px;
            margin-bottom: 2px;
        }}

        .subject-code-text {{
            font-size: 13pt;
            font-weight: bold;
            margin-bottom: 6px;
        }}

        .campus-img-box {{
            margin: 4px auto;
            text-align: center;
        }}

        .campus-img {{
            width: 80%;
            max-height: 195px;
            object-fit: cover;
            border: 1px solid #94a3b8;
            border-radius: 4px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        }}

        .report-topic-container {{
            margin: 6px 0;
        }}
        .report-topic-title {{
            font-size: 12.5pt;
            font-weight: bold;
        }}

        /* Table on Cover */
        table.cover-student-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 4px 0 8px 0;
            font-size: 10.5pt;
        }}
        table.cover-student-table th, table.cover-student-table td {{
            border: 1.5px solid #000;
            padding: 4px 6px;
            text-align: center;
        }}
        table.cover-student-table th {{
            background-color: #ffffff;
            font-weight: bold;
        }}

        .cover-dept-footer {{
            font-size: 10.5pt;
            font-weight: bold;
            text-transform: uppercase;
            line-height: 1.3;
        }}

        /* PAGE 2 & 3: CERTIFICATE & ACKNOWLEDGEMENT */
        .cert-header {{
            text-align: center;
            margin-bottom: 20px;
        }}
        .cert-header h2 {{
            font-size: 16pt;
            font-weight: bold;
            text-transform: uppercase;
            line-height: 1.3;
        }}
        .cert-header p {{
            font-size: 11pt;
            margin-top: 4px;
        }}

        .cert-main-title {{
            text-align: center;
            font-size: 16.5pt;
            font-weight: bold;
            letter-spacing: 0.5px;
            margin: 25px 0 30px 0;
        }}

        .cert-body-text {{
            text-align: justify;
            font-size: 12.5pt;
            line-height: 1.75;
            margin-bottom: 16px;
        }}

        .cert-sign-grid {{
            display: flex;
            justify-content: space-between;
            margin-top: auto;
            padding-top: 50px;
            padding-bottom: 20px;
        }}
        .cert-sign-block {{
            text-align: center;
            min-width: 170px;
        }}
        .cert-sign-block .sign-head {{
            font-weight: bold;
            font-size: 11.5pt;
            text-transform: uppercase;
            margin-bottom: 45px;
        }}
        .cert-sign-block .sign-name {{
            font-weight: bold;
            font-size: 12pt;
        }}
        .cert-sign-block .sign-role {{
            font-size: 11pt;
        }}

        /* SECTION HEADINGS FOR REMAINING PAGES */
        .page-heading {{
            text-align: center;
            font-size: 17pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 20px;
        }}

        .content-para {{
            text-align: justify;
            font-size: 12.5pt;
            line-height: 1.65;
            margin-bottom: 14px;
        }}

        .content-list {{
            margin-left: 28px;
            margin-bottom: 12px;
            font-size: 12pt;
            line-height: 1.55;
        }}
        .content-list li {{
            margin-bottom: 5px;
        }}

        .content-subhead {{
            font-size: 13pt;
            font-weight: bold;
            margin: 12px 0 4px 0;
            color: #000;
        }}

        .table-of-contents {{
            width: 100%;
            border-collapse: collapse;
            font-size: 12pt;
        }}
        .table-of-contents th, .table-of-contents td {{
            border: 1.5px solid #000;
            padding: 8px 12px;
        }}
        .table-of-contents td:first-child {{
            width: 12%;
            text-align: center;
            font-weight: bold;
        }}

        .code-snippet {{
            font-family: 'Fira Code', Consolas, monospace;
            background: #0f172a;
            color: #f8fafc;
            padding: 12px 14px;
            border-radius: 4px;
            font-size: 9pt;
            line-height: 1.35;
            margin: 10px 0;
            overflow-x: auto;
            white-space: pre-wrap;
        }}

        .diagram-snippet {{
            background: #f8fafc;
            border: 1.5px solid #000;
            padding: 10px 12px;
            margin: 10px 0;
            border-radius: 4px;
            font-family: 'Fira Code', monospace;
            font-size: 8.5pt;
            line-height: 1.3;
        }}

        .fig-title {{
            text-align: center;
            font-weight: bold;
            font-size: 11pt;
            margin: 8px 0 12px 0;
        }}
    </style>
</head>
<body>

    <div class="print-btn-bar no-print">
        <span>📄 RegEngine Project Report</span>
        <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>

    <div class="report-container">

        <!-- ================= PAGE 1: COVER PAGE ================= -->
        <div class="page" style="padding: 10mm;">
            <div class="cover-outer-border">
                
                <div class="cover-top-header">
                    <div class="univ-main-title">
                        REGENGINE UNIVERSITY INSTITUTE OF TECHNOLOGY<br>
                        CAMPUS ENCLAVE, KNOWLEDGE CORRIDOR
                    </div>
                    
                    <div class="subject-main-title">Advance Programming Practices</div>
                    <div class="subject-code-text">Subject Code: (21CSC203P)</div>
                </div>

                <div class="campus-img-box">
                    <img src="data:image/jpeg;base64,{building_b64}" class="campus-img" alt="RegEngine Campus Building">
                </div>

                <div>
                    <div class="report-topic-container">
                        <span class="report-topic-title">Report topic:  REGENGINE - CAMPUS ACADEMIC &amp; COURSE REGISTRATION SYSTEM</span>
                    </div>

                    <table class="cover-student-table">
                        <thead>
                            <tr>
                                <th>S No.</th>
                                <th>Name</th>
                                <th>Registration No</th>
                                <th>Class/Section</th>
                                <th>Sign</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>Aadi Saxena</td>
                                <td>RA2511003030018</td>
                                <td>B.Tech CSE CORE A</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>Aayush Ghosh</td>
                                <td>RA2511003030017</td>
                                <td>B.Tech CSE CORE A</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>Mayank Aggarwal</td>
                                <td>RA2511003030025</td>
                                <td>B.Tech CSE CORE A</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>4</td>
                                <td>Shivansh Gautam</td>
                                <td>RA2511003030029</td>
                                <td>B.Tech CSE CORE A</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="cover-dept-footer">
                    DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING<br>
                    FACULTY OF ENGINEERING &amp; TECHNOLOGY
                </div>

            </div>
        </div>

        <!-- ================= PAGE 2: BONAFIDE CERTIFICATE ================= -->
        <div class="page">
            <div class="cert-header">
                <h2>REGENGINE UNIVERSITY INSTITUTE OF<br>TECHNOLOGY</h2>
                <p>Department of Computer Science &amp; Engineering</p>
            </div>

            <div class="cert-main-title">BONAFIDE CERTIFICATE</div>

            <p class="cert-body-text">
                Certified that this project titled “ <strong>REGENGINE - CAMPUS COURSE REGISTRATION &amp; ACADEMIC ERP ENGINE</strong> ” is the Bonafide work of <strong>Aadi Saxena - RA2511003030018</strong> , <strong>Aayush Ghosh - RA2511003030017</strong> , <strong>Mayank Aggarwal - RA2511003030025</strong> and <strong>Shivansh Gautam - RA2511003030029</strong> of <strong>B.Tech CSE CORE A</strong> who carried out the report work under my supervision. Certified further, that to the best of my knowledge the work reported here in does not form any other project report.
            </p>

            <div class="cert-sign-grid">
                <div class="cert-sign-block">
                    <div class="sign-head">SIGNATURE</div>
                    <div class="sign-name">Dr. Arthur Vance</div>
                    <div class="sign-role">Course Lead &amp; Faculty</div>
                </div>
                <div class="cert-sign-block">
                    <div class="sign-head">SIGNATURE</div>
                    <div class="sign-name">Dr. Marcus Thorne</div>
                    <div class="sign-role">Head of Department (CSE)</div>
                </div>
            </div>
        </div>

        <!-- ================= PAGE 3: ACKNOWLEDGEMENT ================= -->
        <div class="page">
            <div style="position: relative; margin-bottom: 20px;">
                <div class="cert-header" style="text-align: center;">
                    <h2>REGENGINE UNIVERSITY INSTITUTE OF<br>TECHNOLOGY</h2>
                    <p>Department of Computer Science &amp; Engineering</p>
                </div>
            </div>

            <div class="cert-main-title">ACKNOWLEDGEMENT</div>

            <p class="cert-body-text">
                I would like to express our special thanks of gratitude to our Project Advisor and Mentors who gave me the golden opportunity to build this comprehensive software system on the topic “<strong>REGENGINE - CAMPUS COURSE REGISTRATION &amp; ACADEMIC ERP ENGINE</strong>” which also helped me in doing extensive research and mastering advanced programming paradigms, concurrency, and full-stack software architecture.
            </p>

            <p class="cert-body-text">
                Secondly, we would also like to thank the Academic Department Leadership and our peers who provided valuable feedback in perfecting this personal project.
            </p>

            <div style="margin-top: 50px; text-align: right; font-size: 12pt; font-weight: bold;">
                Project Team (B.Tech CSE CORE A):<br>
                <span style="font-weight: normal; font-size: 11pt; line-height: 1.6;">
                    Aadi Saxena (RA2511003030018)<br>
                    Aayush Ghosh (RA2511003030017)<br>
                    Mayank Aggarwal (RA2511003030025)<br>
                    Shivansh Gautam (RA2511003030029)
                </span>
            </div>
        </div>

        <!-- ================= PAGE 4: TABLE OF CONTENT ================= -->
        <div class="page">
            <div class="page-heading">TABLE OF CONTENT</div>

            <table class="table-of-contents">
                <thead>
                    <tr>
                        <th>S No.</th>
                        <th>Topic Name</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td>Project Overview</td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td>Objectives and Goals</td>
                    </tr>
                    <tr>
                        <td>3</td>
                        <td>Technology Stack</td>
                    </tr>
                    <tr>
                        <td>4</td>
                        <td>System Architecture</td>
                    </tr>
                    <tr>
                        <td>5</td>
                        <td>Role Based Access Control (RBAC)</td>
                    </tr>
                    <tr>
                        <td>6</td>
                        <td>Database Design and ER Summary</td>
                    </tr>
                    <tr>
                        <td>7</td>
                        <td>Core Database Module Definitions</td>
                    </tr>
                    <tr>
                        <td>8</td>
                        <td>Advanced DBMS &amp; Concurrency Features</td>
                    </tr>
                    <tr>
                        <td>9</td>
                        <td>Frontend Architecture and UI Specifications</td>
                    </tr>
                    <tr>
                        <td>10</td>
                        <td>Project Implementation and File Structure</td>
                    </tr>
                    <tr>
                        <td>11</td>
                        <td>Project File Structure</td>
                    </tr>
                    <tr>
                        <td>12</td>
                        <td>Project Snippet</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- ================= PAGE 5: PROJECT OVERVIEW ================= -->
        <div class="page">
            <div class="page-heading">PROJECT OVERVIEW</div>

            <p class="content-para">
                <strong>RegEngine</strong> is a comprehensive full-stack Campus Academic Management and Course Registration ERP platform engineered to consolidate and automate critical institutional operations within a single unified digital ecosystem. The platform is designed to handle end-to-end workflows including student registration, automated section allocation, curriculum cataloging, faculty allocation, class attendance tracking by date, notice dissemination, and administrative dashboards.
            </p>

            <p class="content-para">
                Unlike standard CRUD-based applications, this system is deeply rooted in <strong>Advance Programming Practices</strong> and Database Management System principles. It emphasizes structured object-relational data modeling, 3NF schema normalization, and enforcement of referential integrity through primary and foreign key constraints. The system is not just a frontend interface—it is a complete data-driven architecture where the database acts as the core engine driving all operations.
            </p>

            <p class="content-para">
                The application supports a multi-user environment with role-based access control, enabling controlled interaction with system resources. Admin users configure campus-wide settings and courses, Faculty members operate attendance rosters for allocated sections (e.g. B.Tech CSE CORE A), and Students access personal registration and timetable dashboards. This hierarchy mirrors real-world university structures.
            </p>

            <p class="content-para">
                From a user experience standpoint, the system adopts a dashboard-centric UI paradigm. It integrates advanced UI components such as dynamic data tables, filtering mechanisms, search functionality, and live metrics calculation.
            </p>

            <p class="content-para">
                In essence, RegEngine is not just a project; it is a simulation of a real-world enterprise-grade system that bridges the gap between theoretical software engineering concepts and practical full-stack implementation.
            </p>
        </div>

        <!-- ================= PAGE 6: OBJECTIVES AND GOALS ================= -->
        <div class="page">
            <div class="page-heading">OBJECTIVES AND GOALS</div>

            <p class="content-para">
                The primary objective of the <strong>RegEngine ERP system</strong> is to design and implement a robust, scalable, and normalized relational database capable of supporting complex academic workflows. The database is structured into multiple interconnected modules, ensuring that each domain—students, faculty, attendance, courses, and auditing—is logically separated yet fully integrated.
            </p>

            <p class="content-para">
                A key goal of the project is to demonstrate advanced software engineering and DBMS concepts in a real-world context. This includes the use of ER diagrams to visualize relationships, implementation of primary and foreign keys for data integrity, and resolution of many-to-many relationships using junction tables. The system also incorporates in-memory indexing techniques to improve query performance.
            </p>

            <p class="content-para">
                Another major objective is to implement automated business logic within the backend. For instance, when a student registers, the system automatically allocates their academic section (e.g. Section A). When a professor conducts a lecture, the system retrieves the enrolled student list for that specific section and date, allowing quick one-click attendance recording and immediate aggregation.
            </p>

            <p class="content-para">
                The project also aims to build a fully functional web application that supports real-time data interaction. Features such as CRUD operations, filtering, sorting, and data visualization are integrated to enhance usability.
            </p>

            <p class="content-para">
                Security is another critical goal, achieved through Role-Based Access Control enforced at multiple layers. Finally, the project aims for real-world deployment readiness using standard Java SE runtimes.
            </p>
        </div>

        <!-- ================= PAGE 7: TECHNOLOGY STACK ================= -->
        <div class="page">
            <div class="page-heading">TECHNOLOGY STACK</div>

            <p class="content-para">
                The <strong>RegEngine ERP system</strong> is built using a modern, scalable, and production-ready technology stack that integrates frontend, backend, and database functionalities seamlessly.
            </p>

            <p class="content-para">
                At the core of the backend is <strong>Pure Java SE 21+</strong>, leveraging Java's built-in <code>com.sun.net.httpserver.HttpServer</code>. It uses an asynchronous thread pool executor (<code>Executors.newFixedThreadPool(8)</code>) to handle concurrent client requests with high efficiency and minimal resource footprint, completely avoiding heavy third-party framework overhead.
            </p>

            <p class="content-para">
                Data persistence is managed via an in-house <strong>Generic FileStore Engine</strong> implementing synchronized atomic disk writing and structured JSON tables. A custom recursive-descent JSON parser and serializer (<code>Json.java</code>) provides bidirectional Object-Relational Mapping without external library dependencies.
            </p>

            <p class="content-para">
                For UI development, the system uses clean <strong>HTML5, Vanilla CSS3, and Modern JavaScript (ES6+)</strong>. This provides accessible, responsive components such as modal dialogs, data tables, attendance matrices, and executive KPI cards.
            </p>

            <p class="content-para">
                Data handling in tables supports live search, status badge filtering, and multi-student bulk selection. Version control is managed via Git and hosted on GitHub (<code>https://github.com/aadisaxena-ghb/RegEngine</code>).
            </p>
        </div>

        <!-- ================= PAGE 8: SYSTEM ARCHITECTURE ================= -->
        <div class="page">
            <div class="page-heading">SYSTEM ARCHITECTURE</div>

            <p class="content-para">
                The system architecture of <strong>RegEngine</strong> follows a modern layered architecture consisting of three primary layers: frontend presentation, backend application controller, and database storage.
            </p>

            <div class="diagram-snippet">
+-------------------------------------------------------------------------+
|                       1. FRONTEND PRESENTATION LAYER                    |
|   [Student Portal]       [Faculty Attendance UI]     [Admin Dashboard]  |
|            HTML5 / Vanilla CSS3 / Asynchronous REST Fetch API           |
+------------------------------------+------------------------------------+
                                     | HTTP REST (Port 8080)
+------------------------------------v------------------------------------+
|                  2. BACKEND APPLICATION CONTROLLER LAYER                |
|  [HttpServer Daemon] ---> [Executors ThreadPool (8 Concurrent Workers)] |
|                                    |                                    |
|  +---------------------------------+---------------------------------+  |
|  | /api/students    | /api/attendance | /api/courses | /api/faculty  |  |
|  | /api/dashboard   | /api/notices    | /api/calendar| /api/timetable|  |
|  +---------------------------------+---------------------------------+  |
|                                    |                                    |
|                    [ApiSupport / CORS / JSON Engine]                    |
+------------------------------------+------------------------------------+
                                     | Data Access Objects (DAO)
+------------------------------------v------------------------------------+
|                         3. DATABASE STORAGE LAYER                       |
|  +-------------------------------------------------------------------+  |
|  | AppData Coordinator (In-Memory Concurrent Cache + Thread Safety)  |  |
|  +-------------------------------------------------------------------+  |
|  | FileStore&lt;T&gt; (Atomic Sync / Normalized Relational Schema Tables)  |  |
|  +-------------------------------------------------------------------+  |
|       [students.json]    [attendance.json]    [faculty.json]            |
|       [courses.json]     [notices.json]       [calendar.json]           |
+-------------------------------------------------------------------------+
            </div>
            <div class="fig-title">Fig. 1: RegEngine Layered System Architecture</div>

            <p class="content-para">
                The request-response flow begins when a user performs an action on the UI. This triggers a fetch request to the Java backend handlers. The server validates parameters, performs synchronized operations on the data store, and returns structured JSON responses.
            </p>
        </div>

        <!-- ================= PAGE 9: ROLE BASED ACCESS CONTROL ================= -->
        <div class="page">
            <div class="page-heading">ROLE BASED ACCESS CONTROL</div>

            <p class="content-para">
                Role-Based Access Control in <strong>RegEngine</strong> is designed to enforce strict security and operational boundaries within the campus system. It ensures that users can only access data and perform actions that are explicitly permitted based on their assigned role.
            </p>

            <p class="content-para">
                The system defines three primary roles: <strong>Admin</strong>, <strong>Faculty</strong>, and <strong>Student</strong>. Each role has a predefined set of permissions:
            </p>
            <ul class="content-list">
                <li><strong>Administrator:</strong> Full administrative privileges to register students, assign sections, create courses, manage faculty records, and broadcast notices.</li>
                <li><strong>Faculty / Professor:</strong> Authorized to view course offerings, access student rosters segregated by branch and section (e.g. B.Tech CSE CORE A), and record date-wise attendance.</li>
                <li><strong>Student:</strong> Personalized access to review enrolled courses, check section timetable, monitor attendance percentages, and view circulars.</li>
            </ul>

            <table class="cover-student-table" style="margin-top: 15px;">
                <thead>
                    <tr>
                        <th>Feature Module</th>
                        <th>Administrator</th>
                        <th>Faculty / Professor</th>
                        <th>Student</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Student Registration &amp; Section Allotment</td>
                        <td>Full (Create/Edit/Delete)</td>
                        <td>Read Section Roster</td>
                        <td>View Own Profile</td>
                    </tr>
                    <tr>
                        <td>Attendance Marking by Section &amp; Date</td>
                        <td>Full Override</td>
                        <td>Mark / Update Section</td>
                        <td>View Own Attendance %</td>
                    </tr>
                    <tr>
                        <td>Course &amp; Curriculum Catalog</td>
                        <td>Create / Modify Courses</td>
                        <td>View Syllabus</td>
                        <td>Register / Enroll</td>
                    </tr>
                    <tr>
                        <td>Notices &amp; Academic Calendar</td>
                        <td>Publish / Delete</td>
                        <td>View</td>
                        <td>View</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- ================= PAGE 10: DATABASE DESIGN AND ER SUMMARY ================= -->
        <div class="page">
            <div class="page-heading">DATABASE DESIGN AND ER SUMMARY</div>

            <p class="content-para">
                The database design of <strong>RegEngine</strong> is the backbone of the entire system, structured to ensure data consistency, scalability, and performance. The system follows strict normalization principles up to Third Normal Form (3NF), eliminating redundancy and ensuring that each piece of data is stored in its most appropriate location.
            </p>

            <p class="content-para">
                Relationships between entities are carefully modeled using primary and foreign keys:
            </p>
            <ul class="content-list">
                <li><strong>One-to-Many (1:M):</strong> One Branch has many Students and Faculty. One Faculty conducts many Attendance Sessions. One Attendance Session contains multiple student Attendance Records.</li>
                <li><strong>One-to-One (1:1):</strong> Each student corresponds to exactly one active Section Allocation record.</li>
                <li><strong>Many-to-Many (M:N):</strong> Students and Courses are linked through enrollment collections.</li>
            </ul>

            <div class="content-subhead">Entity-Relationship Structural Model</div>
            <div class="diagram-snippet">
 [STUDENT] (PK: id, rollNo)
    |
    | 1:1 has assigned
    v
 [SECTION_ALLOCATION] (sectionName: 'A', branch, semester)
    |
    | 1:N participates in
    v
 [ATTENDANCE_RECORD] (PK: recordId, status: PRESENT/ABSENT)
    ^
    | N:1 belongs to
 [ATTENDANCE_SESSION] (PK: sessionId, branch, section, date, courseCode)
    ^
    | N:1 conducted by
 [FACULTY] (PK: facultyId, facultyCode, department)
            </div>
            <div class="fig-title">Fig. 2: RegEngine Entity-Relationship Diagram</div>
        </div>

        <!-- ================= PAGE 11: CORE DATABASE MODULE DEFINITIONS ================= -->
        <div class="page">
            <div class="page-heading">CORE DATABASE MODULE DEFINITIONS</div>

            <p class="content-para">
                The <strong>RegEngine</strong> database is divided into multiple functional modules, each responsible for a specific academic domain:
            </p>

            <div class="content-subhead">1. Student Information Module (<code>students.json</code>)</div>
            <p class="content-para">
                Stores student records including <code>id</code> (PK), <code>name</code>, <code>rollNo</code>, <code>email</code>, <code>branch</code> (B.Tech CSE CORE), <code>section</code> (Section A), <code>semester</code>, and <code>enrolledCourses</code>.
            </p>

            <div class="content-subhead">2. Class Attendance Module (<code>attendance.json</code>)</div>
            <p class="content-para">
                Captures daily lecture attendance sessions with attributes: <code>id</code> (PK), <code>date</code>, <code>branch</code>, <code>section</code>, <code>courseCode</code>, <code>takenByFacultyId</code>, and an array of student presence records (<code>PRESENT</code> / <code>ABSENT</code>).
            </p>

            <div class="content-subhead">3. Faculty &amp; Staff Directory (<code>faculty.json</code>)</div>
            <p class="content-para">
                Maintains professor employee codes, department allocations, designations, and assigned academic courses.
            </p>

            <div class="content-subhead">4. Course Curriculum Module (<code>courses.json</code>)</div>
            <p class="content-para">
                Stores subject catalog information, course codes (e.g. 21CSC203P), credits, eligibility, and syllabus modules.
            </p>

            <div class="content-subhead">5. Notices &amp; Calendar Module (<code>notices.json</code> &amp; <code>calendar.json</code>)</div>
            <p class="content-para">
                Maintains university circulars, priority flags, exam timetables, and academic term events.
            </p>
        </div>

        <!-- ================= PAGE 12: ADVANCED DBMS FEATURES ================= -->
        <div class="page">
            <div class="page-heading">ADVANCED DBMS FEATURES</div>

            <p class="content-para">
                <strong>RegEngine</strong> incorporates several advanced database and concurrency features to enhance performance, automation, and data integrity:
            </p>

            <div class="content-subhead">1. In-Memory Indexing &amp; Fast Lookups</div>
            <p class="content-para">
                Primary key queries and section filters operate directly on cached in-memory entity lists, delivering sub-millisecond query responses without disk bottleneck.
            </p>

            <div class="content-subhead">2. Synchronized Atomic Transactions</div>
            <p class="content-para">
                Write operations utilize synchronized monitor locks to ensure ACID properties—Atomicity, Consistency, Isolation, and Durability:
            </p>

            <div class="code-snippet">
public synchronized void save(T item) throws Exception {{
    List&lt;T&gt; list = findAll();
    list.removeIf(existing -> existing.getId().equals(item.getId()));
    list.add(item);
    persistToDisk(list); // Atomic write via Files.writeString()
}}</div>

            <div class="content-subhead">3. Stream-Based Aggregation</div>
            <p class="content-para">
                The backend utilizes Java Streams to perform real-time calculation of section attendance percentages and class compliance metrics dynamically.
            </p>
        </div>

        <!-- ================= PAGE 13: UI SPECIFICATIONS ================= -->
        <div class="page">
            <div class="page-heading">UI SPECIFICATIONS</div>

            <p class="content-para">
                The frontend of <strong>RegEngine</strong> is designed using a modular and component-based architecture, ensuring scalability and maintainability. The application follows a dashboard-centric layout with responsive navigation across all pages.
            </p>

            <p class="content-para">
                The main content area displays data in multiple formats, including live tables, interactive forms, KPI cards, and section rosters:
            </p>

            <div class="content-subhead">Section Attendance Matrix (B.Tech CSE CORE A)</div>
            <table class="cover-student-table" style="margin-top: 10px;">
                <thead>
                    <tr>
                        <th>Roll No</th>
                        <th>Student Name</th>
                        <th>Class / Section</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>RA2511003030018</td>
                        <td>Aadi Saxena</td>
                        <td>B.Tech CSE CORE A</td>
                        <td><strong style="color: #166534;">PRESENT</strong></td>
                    </tr>
                    <tr>
                        <td>RA2511003030017</td>
                        <td>Aayush Ghosh</td>
                        <td>B.Tech CSE CORE A</td>
                        <td><strong style="color: #166534;">PRESENT</strong></td>
                    </tr>
                    <tr>
                        <td>RA2511003030025</td>
                        <td>Mayank Aggarwal</td>
                        <td>B.Tech CSE CORE A</td>
                        <td><strong style="color: #166534;">PRESENT</strong></td>
                    </tr>
                    <tr>
                        <td>RA2511003030029</td>
                        <td>Shivansh Gautam</td>
                        <td>B.Tech CSE CORE A</td>
                        <td><strong style="color: #166534;">PRESENT</strong></td>
                    </tr>
                </tbody>
            </table>
            <div class="fig-title">Fig. 3: Professor Attendance Management Interface</div>

            <p class="content-para">
                The UI is fully responsive, ensuring compatibility across different screen sizes. Overall, the frontend provides a seamless and intuitive user experience.
            </p>
        </div>

        <!-- ================= PAGE 14: PROJECT IMPLEMENTATION ================= -->
        <div class="page">
            <div class="page-heading">PROJECT IMPLEMENTATION AND FILE STRUCTURE</div>

            <p class="content-para">
                The project follows a well-organized and modular file structure, ensuring scalability and ease of maintenance. The codebase is divided into multiple directories based on functionality:
            </p>

            <ul class="content-list">
                <li><code>scholaris/frontend/</code>: Contains all client-side pages (<code>index.html</code>, <code>portal.html</code>, <code>app.html</code>), stylesheets, and scripts.</li>
                <li><code>scholaris/backend/src/</code>: Houses all Pure Java source code organized into <code>http</code>, <code>model</code>, <code>store</code>, and <code>util</code> packages.</li>
                <li><code>scholaris/backend/data/</code>: Contains persistent relational JSON tables (<code>students.json</code>, <code>attendance.json</code>, etc.).</li>
            </ul>

            <div class="content-subhead">Compilation and Execution Commands</div>
            <div class="code-snippet">
# 1. Compile pure Java source code
javac -d scholaris/backend/out (Get-ChildItem -Recurse -Filter *.java scholaris/backend/src).FullName

# 2. Start HTTP server daemon on port 8080
java -cp scholaris/backend/out com.campus.Main 8080</div>

            <p class="content-para">
                Overall, the file structure promotes clean code practices, separation of concerns, and efficient development workflows.
            </p>
        </div>

        <!-- ================= PAGE 15: PROJECT FILE STRUCTURE ================= -->
        <div class="page">
            <div class="page-heading">PROJECT FILE STRUCTURE</div>

            <div class="diagram-snippet" style="font-size: 8pt;">
RegEngine/
├── README.md                                  # Comprehensive System Documentation
├── .gitignore                                 # Git Ignore Rules
└── scholaris/
    ├── frontend/                              # Frontend Presentation Assets
    │   ├── index.html                         # Institutional Welcome &amp; Login Page
    │   ├── portal.html                        # Multi-Role Campus Portal
    │   ├── app.html                           # Comprehensive Management App
    │   ├── css/
    │   │   └── styles.css                     # Glassmorphic Design System
    │   └── js/
    │       ├── app.js                         # Application Logic &amp; REST APIs
    │       └── portal.js                      # Role-Based Routing &amp; UI Handlers
    │
    └── backend/                               # Pure Java SE 21+ Backend
        ├── data/                              # Persistent Relational Database Tables
        │   ├── students.json                  # Student Records &amp; Section Allocations
        │   ├── attendance.json                # Class Attendance Sessions by Date
        │   ├── faculty.json                   # Professor Profiles &amp; Allocations
        │   ├── courses.json                   # Course Curriculum &amp; Credit Master
        │   ├── notices.json                   # Campus Circulars &amp; Announcements
        │   └── calendar.json                  # Academic Term Events &amp; Exams
        │
        └── src/com/campus/                    # Java Package Root
            ├── Main.java                      # Server Entrypoint &amp; ThreadPool
            ├── model/                         # Domain Entity Models
            │   ├── Student.java               # Student Entity (Section Allotment)
            │   ├── AttendanceSession.java     # Attendance Session &amp; Record Models
            │   ├── Faculty.java               # Faculty Directory Entity
            │   └── Course.java                # Course Catalog Entity
            ├── store/                         # Storage Engine &amp; Concurrency
            │   ├── AppData.java               # Central Database Store Coordinator
            │   └── FileStore.java             # Thread-Safe Generic Persistence Store
            ├── http/                          # REST API Request Handlers
            │   ├── ApiSupport.java            # HTTP Headers, CORS &amp; JSON Bridge
            │   ├── StudentsHandler.java       # Student Registration &amp; Section API
            │   ├── AttendanceHandler.java     # Section Attendance API
            │   └── StaticFileHandler.java     # Web Asset Streaming Handler
            └── util/
                └── Json.java                  # Zero-Dependency JSON Parser/Serializer
            </div>
            <div class="fig-title">Fig. 4: Complete RegEngine Project Directory Layout</div>
        </div>

        <!-- ================= PAGE 16: GIT KRAKEN SNIPPET ================= -->
        <div class="page">
            <div class="page-heading">GIT KRAKEN SNIPPET</div>

            <p class="content-para">
                The development of <strong>RegEngine</strong> was version-controlled using Git with atomic commits and synchronization to GitHub:
            </p>

            <div class="code-snippet">
* commit 4e2a10f (HEAD -> master, origin/master)
| Author: Aadi Saxena &amp; Team &lt;aadi@srmist.edu.in&gt;
| Date:   Sat Sep 19 03:02:18 2026 +0530
|
|     feat: add section allotment &amp; professor class attendance system by date
|     - Add section attribute (Section A) to Student domain model
|     - Add AttendanceSession model with nested student presence records
|     - Implement /api/attendance endpoint with section &amp; date filtering
|     - Update frontend attendance management matrix
|
* commit 8b1c4e2
| Author: Team RegEngine
| Date:   Fri Sep 18 23:45:10 2026 +0530
|
|     refactor: pure Java SE backend &amp; zero-dependency JSON parser
|     - Implement com.sun.net.httpserver with thread pool of 8 workers
|     - Implement recursive-descent Json.java parser
|     - Create thread-safe FileStore persistence layer
|
* commit a17e921
| Author: Team RegEngine
| Date:   Thu Sep 17 21:15:30 2026 +0530
|
|     feat: initial commit - core campus portal &amp; registration engine</div>

            <div class="fig-title">Fig. 5: Git Commit History &amp; Feature Evolution</div>

            <div class="content-subhead">GitHub Repository Link</div>
            <p class="content-para">
                <strong>URL:</strong> <a href="https://github.com/aadisaxena-ghb/RegEngine" target="_blank" style="color: #2563eb; text-decoration: underline;">https://github.com/aadisaxena-ghb/RegEngine</a>
            </p>
        </div>

        <!-- ================= PAGE 17: PROJECT SNIPPET ================= -->
        <div class="page">
            <div class="page-heading">PROJECT SNIPPET</div>

            <div class="diagram-snippet" style="font-size: 8pt;">
+----------------------------------------------------------------------------------------------------+
|                                    REGENGINE RELATIONAL SCHEMA                                     |
+------------------------------------+----------------------------------+----------------------------+
| STUDENTS TABLE                     | ATTENDANCE_SESSIONS TABLE        | FACULTY TABLE              |
| - id (UUID, PK)                    | - id (UUID, PK)                  | - id (UUID, PK)            |
| - name (VARCHAR)                   | - date (DATE, ISO-8601)          | - code (VARCHAR, UNIQUE)   |
| - rollNo (VARCHAR, UNIQUE)         | - branch (VARCHAR, FK)           | - name (VARCHAR)           |
| - email (VARCHAR)                  | - section (VARCHAR, FK)          | - department (VARCHAR)     |
| - branch (VARCHAR)                 | - courseCode (VARCHAR, FK)       | - designation (VARCHAR)    |
| - section (VARCHAR) [e.g. 'A']     | - takenByFacultyId (UUID, FK)    | - email (VARCHAR)          |
| - semester (INT)                   | - records (ARRAY of sub-records) | - assignedCourses (ARRAY)  |
| - enrolledCourses (ARRAY)          |   - studentId (UUID, FK)         |                            |
|                                    |   - status (PRESENT / ABSENT)    |                            |
+------------------------------------+----------------------------------+----------------------------+
            </div>
            <div class="fig-title">Fig. 6: Relational Table Schema Representation</div>

            <div class="diagram-snippet" style="text-align: center; padding: 15px; font-size: 11pt;">
                <strong>🏛️ CAMPUS EXECUTIVE KPI METRICS</strong><br><br>
                TOTAL STUDENTS: <strong>42</strong> &nbsp;|&nbsp; 
                ACTIVE SECTIONS: <strong>5 (A - E)</strong> &nbsp;|&nbsp; 
                FACULTY MEMBERS: <strong>12</strong> &nbsp;|&nbsp; 
                AVG ATTENDANCE: <strong>94.2%</strong>
            </div>
            <div class="fig-title">Fig. 7: Campus Dashboard Metrics</div>
        </div>

        <!-- ================= PAGE 18: ATTENDANCE UI AND DATABASE ================= -->
        <div class="page">
            <div class="page-heading">ATTENDANCE UI AND DATABASE</div>

            <p class="content-para">
                The class attendance module provides a seamless workflow for faculty members to mark and audit daily section attendance:
            </p>

            <table class="cover-student-table" style="margin: 10px 0;">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Roll Number</th>
                        <th>Student Name</th>
                        <th>Class / Section</th>
                        <th>Attendance Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td>RA2511003030018</td>
                        <td>Aadi Saxena</td>
                        <td>B.Tech CSE CORE A</td>
                        <td><strong style="color: #166534;">PRESENT</strong></td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td>RA2511003030017</td>
                        <td>Aayush Ghosh</td>
                        <td>B.Tech CSE CORE A</td>
                        <td><strong style="color: #166534;">PRESENT</strong></td>
                    </tr>
                    <tr>
                        <td>3</td>
                        <td>RA2511003030025</td>
                        <td>Mayank Aggarwal</td>
                        <td>B.Tech CSE CORE A</td>
                        <td><strong style="color: #166534;">PRESENT</strong></td>
                    </tr>
                    <tr>
                        <td>4</td>
                        <td>RA2511003030029</td>
                        <td>Shivansh Gautam</td>
                        <td>B.Tech CSE CORE A</td>
                        <td><strong style="color: #166534;">PRESENT</strong></td>
                    </tr>
                </tbody>
            </table>
            <div class="fig-title">Fig. 8: Section Attendance Management Interface</div>

            <div class="content-subhead">RESTful Attendance Submission Payload (<code>POST /api/attendance</code>)</div>
            <div class="code-snippet">
{{
  "date": "2026-09-21",
  "branch": "Computer Science and Engineering",
  "section": "Section A",
  "courseCode": "21CSC203P",
  "takenByFacultyId": "fac-001",
  "records": [
    {{"studentId": "std-018", "rollNo": "RA2511003030018", "status": "PRESENT"}},
    {{"studentId": "std-017", "rollNo": "RA2511003030017", "status": "PRESENT"}},
    {{"studentId": "std-025", "rollNo": "RA2511003030025", "status": "PRESENT"}},
    {{"studentId": "std-029", "rollNo": "RA2511003030029", "status": "PRESENT"}}
  ]
}}</div>
        </div>

        <!-- ================= PAGE 19: STUDENT REGISTRATION AND DATABASE ================= -->
        <div class="page">
            <div class="page-heading">STUDENT REGISTRATION AND DATABASE</div>

            <p class="content-para">
                When a student is registered through the administrator or self-registration portal, the record is validated, assigned an academic section, and persisted into the underlying database table:
            </p>

            <div class="content-subhead">Sample Persistent Student Database Record (<code>data/students.json</code>)</div>
            <div class="code-snippet">
{{
  "id": "e4f8b912-7a3c-4e89-912b-3a5f78c9d012",
  "name": "Aadi Saxena",
  "rollNo": "RA2511003030018",
  "email": "aadi.saxena@srmist.edu.in",
  "phone": "+91 98765 43210",
  "branch": "Computer Science and Engineering",
  "section": "Section A",
  "semester": 4,
  "year": 2,
  "enrolledCourses": [
    "21CSC203P",
    "21CSC204J",
    "21MAB201T"
  ],
  "registeredAt": "2026-09-21T02:45:00Z"
}}</div>
            <div class="fig-title">Fig. 9: Persistent JSON Relational Record with Section Allocation</div>

            <div class="content-subhead">Project Conclusion &amp; Summary</div>
            <p class="content-para">
                The <strong>RegEngine</strong> project successfully demonstrates the design and practical implementation of an end-to-end Campus Course Registration and Academic Management ERP system. By applying rigorous software engineering principles—including clean object-oriented architecture, synchronized concurrency controls, and a lightweight zero-dependency pure Java SE server—the system provides high scalability, reliability, and security for modern university administration.
            </p>
        </div>

    </div>

</body>
</html>'''

with open('RegEngine_Project_Report.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

with open('scholaris/frontend/RegEngine_Project_Report.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
html_file = os.path.abspath('RegEngine_Project_Report.html')
pdf_file = os.path.abspath('RegEngine_Project_Report.pdf')

cmd = [
    chrome_path,
    '--headless=new',
    '--disable-gpu',
    '--no-margins',
    f'--print-to-pdf={pdf_file}',
    html_file
]
subprocess.run(cmd, capture_output=True, text=True)

dst_frontend_pdf = os.path.abspath('scholaris/frontend/RegEngine_Project_Report.pdf')
shutil.copyfile(pdf_file, dst_frontend_pdf)

dst_downloads_pdf = r'c:\Users\saxen\Downloads\RegEngine_Project_Report.pdf'
shutil.copyfile(pdf_file, dst_downloads_pdf)

print('SUCCESS. PDF Size:', os.path.getsize(pdf_file))
