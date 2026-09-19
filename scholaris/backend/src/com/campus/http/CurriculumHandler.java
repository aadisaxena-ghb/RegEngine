package com.campus.http;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class CurriculumHandler implements HttpHandler {

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (ApiSupport.handledPreflight(exchange)) return;

        String method = exchange.getRequestMethod().toUpperCase();
        if (!"GET".equals(method)) {
            ApiSupport.sendError(exchange, 405, "Method not allowed");
            return;
        }

        try {
            List<Map<String, Object>> list = getCurriculumData();
            ApiSupport.sendJson(exchange, 200, list);
        } catch (Exception e) {
            e.printStackTrace();
            ApiSupport.sendError(exchange, 500, "Internal Server Error: " + e.getMessage());
        }
    }

    public static List<Map<String, Object>> getCurriculumData() {
        List<Map<String, Object>> list = new ArrayList<>();

        // 1. CSE Core
        list.add(createCourseCurriculum(
                "CSE-CORE",
                "B.Tech Computer Science & Engineering (Core)",
                "4 Years (8 Semesters)",
                "160 Credits",
                List.of(
                        createSubject("21CS101J", "Programming for Problem Solving using C/C++", "3-0-2-4", "Semester 1", "Foundations of structured programming, pointers, recursion, data structures, and memory management.", List.of("Unit 1: Algorithmic Thinking & C Basics", "Unit 2: Control Structures & Functions", "Unit 3: Arrays, Strings & Pointers", "Unit 4: Structures, Unions & Dynamic Memory", "Unit 5: File Handling & Preprocessor"), "Balagurusamy (McGraw Hill), Kernighan & Ritchie (Prentice Hall)"),
                        createSubject("21MA101T", "Calculus & Linear Algebra", "3-1-0-4", "Semester 1", "Matrix eigenvalue analysis, multivariable differential calculus, vector spaces, and Fourier series.", List.of("Unit 1: Matrices & Linear Systems", "Unit 2: Eigenvalues & Cayley-Hamilton", "Unit 3: Differential Calculus & Mean Value", "Unit 4: Partial Derivatives & Jacobians", "Unit 5: Vector Calculus & Integrals"), "B.S. Grewal (Khanna Publishers), Erwin Kreyszig (Wiley)"),
                        createSubject("21CS201J", "Data Structures and Algorithms", "3-0-2-4", "Semester 3", "Linear and non-linear data structures, asymptotic notation, balanced trees, graph traversal, dynamic programming.", List.of("Unit 1: Stacks, Queues & Linked Lists", "Unit 2: Trees, AVL & Red-Black Trees", "Unit 3: Graphs, BFS, DFS & Shortest Path", "Unit 4: Sorting, Searching & Hashing", "Unit 5: Greedy Algorithms & Dynamic Programming"), "Cormen, Leiserson, Rivest, Stein (MIT Press), Mark Allen Weiss"),
                        createSubject("21CS202T", "Object Oriented Analysis & Design (Java)", "3-0-0-3", "Semester 3", "Encapsulation, inheritance, polymorphism, design patterns, UML class modeling, multi-threading.", List.of("Unit 1: Java Fundamentals & OOP", "Unit 2: Inheritance & Interfaces", "Unit 3: Exception Handling & Collections", "Unit 4: Multithreading & Concurrency", "Unit 5: UML Diagrams & Gang-of-Four Patterns"), "Herbert Schildt (Oracle Press), Craig Larman (Pearson)"),
                        createSubject("21CS301J", "Operating Systems & Kernel Architecture", "3-0-2-4", "Semester 5", "Process management, CPU scheduling, thread synchronization, deadlocks, virtual memory paging, file systems.", List.of("Unit 1: OS Structures & System Calls", "Unit 2: Process Scheduling & IPC", "Unit 3: Synchronization & Deadlocks", "Unit 4: Memory Management & Paging", "Unit 5: Storage & Linux Kernel Internals"), "Silberschatz, Galvin, Gagne (Wiley), Andrew Tanenbaum"),
                        createSubject("21CS302J", "Database Management Systems (DBMS)", "3-0-2-4", "Semester 5", "Relational algebra, SQL, normalization (1NF to BCNF), transaction ACID properties, indexing, NoSQL.", List.of("Unit 1: ER Modeling & Relational Model", "Unit 2: SQL & Complex Querying", "Unit 3: Normalization & Functional Dependencies", "Unit 4: Concurrency Control & Recovery", "Unit 5: B+ Trees & MongoDB"), "Elmasri & Navathe (Pearson), Raghu Ramakrishnan (McGraw Hill)")
                )
        ));

        // 2. CSE AI & ML
        list.add(createCourseCurriculum(
                "CSE-AIML",
                "B.Tech CSE (Artificial Intelligence & Machine Learning)",
                "4 Years (8 Semesters)",
                "160 Credits",
                List.of(
                        createSubject("21AI201J", "Foundations of Artificial Intelligence", "3-0-2-4", "Semester 3", "State space search, A* heuristic, minimax with alpha-beta pruning, constraint satisfaction, propositional logic.", List.of("Unit 1: Intelligent Agents & Problem Formulation", "Unit 2: Informed & Uninformed Search", "Unit 3: Adversarial Search & Games", "Unit 4: Knowledge Representation & Logic", "Unit 5: Planning & Probabilistic Reasoning"), "Stuart Russell & Peter Norvig (Pearson)"),
                        createSubject("21AI301J", "Supervised and Unsupervised Machine Learning", "3-0-2-4", "Semester 5", "Linear/logistic regression, SVM, decision trees, random forests, k-means clustering, PCA, gradient descent.", List.of("Unit 1: Regression Models & Optimization", "Unit 2: Classification, Naive Bayes & SVM", "Unit 3: Ensemble Learning & XGBoost", "Unit 4: Unsupervised Clustering & PCA", "Unit 5: Model Evaluation & Regularization"), "Tom Mitchell (McGraw Hill), Christopher Bishop (Springer)"),
                        createSubject("21AI401J", "Deep Learning & Neural Architectures", "3-0-2-4", "Semester 7", "Backpropagation, CNNs for computer vision, RNNs, LSTMs, Transformers, Attention mechanisms, PyTorch.", List.of("Unit 1: Deep Feedforward Networks", "Unit 2: Convolutional Neural Networks (CNN)", "Unit 3: Sequence Modeling & LSTM", "Unit 4: Transformers & Attention Mechanisms", "Unit 5: Generative Models (GANs & Diffusion)"), "Ian Goodfellow, Yoshua Bengio, Aaron Courville (MIT Press)")
                )
        ));

        // 3. BCA
        list.add(createCourseCurriculum(
                "BCA",
                "Bachelor of Computer Applications (BCA)",
                "3 Years (6 Semesters)",
                "120 Credits",
                List.of(
                        createSubject("BCA101", "Computer Fundamentals & Office Automation", "3-0-0-3", "Semester 1", "Hardware architecture, boolean algebra, operating system basics, word processing and spreadsheet analysis.", List.of("Unit 1: Computer Generations & Architecture", "Unit 2: Number Systems & Logic Gates", "Unit 3: OS Concepts & Utilities", "Unit 4: Office Productivity Tools", "Unit 5: Internet Technologies & Protocols"), "P.K. Sinha (BPB Publications)"),
                        createSubject("BCA201J", "Web Technology & Full Stack JavaScript", "3-0-2-4", "Semester 3", "HTML5 semantic markup, CSS3 Flexbox/Grid, Vanilla JavaScript, DOM API, Node.js and Express REST APIs.", List.of("Unit 1: HTML5 & CSS3 Layouts", "Unit 2: JavaScript ES6+ Core Concepts", "Unit 3: DOM Manipulation & Event Handling", "Unit 4: Node.js, Express & Routing", "Unit 5: REST APIs & MongoDB Integration"), "Jon Duckett (Wiley), David Flanagan (O'Reilly)")
                )
        ));

        // 4. MCA
        list.add(createCourseCurriculum(
                "MCA-AI",
                "Master of Computer Applications (MCA - Gen AI)",
                "2 Years (4 Semesters)",
                "88 Credits",
                List.of(
                        createSubject("MCA101J", "Advanced Data Structures & Algorithms", "3-0-2-4", "Semester 1", "Amortized analysis, binomial heaps, network flows, NP-completeness, randomized algorithms.", List.of("Unit 1: Algorithm Complexity & Recurrences", "Unit 2: Advanced Heaps & Trees", "Unit 3: Graph Algorithms & Network Flow", "Unit 4: Dynamic Programming & Greedy Strategies", "Unit 5: NP-Completeness & Approximation"), "Cormen et al. (MIT Press)"),
                        createSubject("MCA202J", "Cloud Microservices & Generative AI Systems", "3-0-2-4", "Semester 3", "Docker containers, Kubernetes orchestration, LLM orchestration, LangChain, vector databases (Pinecone, Chroma).", List.of("Unit 1: Microservices Architecture & Docker", "Unit 2: Kubernetes Cluster Management", "Unit 3: LLMs & Prompt Engineering", "Unit 4: Retrieval Augmented Generation (RAG)", "Unit 5: Vector Databases & Deployment"), "Sam Newman (O'Reilly), Aurélien Géron")
                )
        ));

        // 5. MBA
        list.add(createCourseCurriculum(
                "MBA",
                "Master of Business Administration (MBA)",
                "2 Years (4 Semesters)",
                "96 Credits",
                List.of(
                        createSubject("MBA101", "Management Principles & Organizational Behavior", "3-0-0-3", "Semester 1", "Organizational culture, motivation theories, leadership dynamics, team conflict resolution, change management.", List.of("Unit 1: Management Evolution & Schools of Thought", "Unit 2: Individual Behavior & Personality", "Unit 3: Motivation & Leadership Styles", "Unit 4: Group Dynamics & Conflict", "Unit 5: Organizational Change & Culture"), "Stephen Robbins & Timothy Judge (Pearson)"),
                        createSubject("MBA201", "Financial Management & Corporate Valuation", "3-0-0-3", "Semester 2", "Time value of money, capital budgeting (NPV, IRR), cost of capital, working capital optimization, dividend policy.", List.of("Unit 1: Financial System & Objectives", "Unit 2: Time Value & Risk-Return Tradeoff", "Unit 3: Capital Budgeting & Cash Flows", "Unit 4: Capital Structure Theories", "Unit 5: Working Capital & Valuation Models"), "Prasanna Chandra (McGraw Hill), I.M. Pandey")
                )
        ));

        return list;
    }

    private static Map<String, Object> createCourseCurriculum(String code, String title, String duration, String totalCredits, List<Map<String, Object>> subjects) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("courseCode", code);
        m.put("courseTitle", title);
        m.put("duration", duration);
        m.put("totalCredits", totalCredits);
        m.put("subjects", subjects);
        return m;
    }

    private static Map<String, Object> createSubject(String code, String title, String ltp, String sem, String description, List<String> units, String books) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", code);
        m.put("title", title);
        m.put("structure", ltp);
        m.put("semester", sem);
        m.put("description", description);
        m.put("units", units);
        m.put("textbooks", books);
        return m;
    }
}
