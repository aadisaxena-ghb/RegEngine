const CURRICULUM = [
  {
    courseCode: "CSE-CORE",
    courseTitle: "B.Tech Computer Science & Engineering (Core)",
    duration: "4 Years (8 Semesters)",
    totalCredits: "160 Credits",
    subjects: [
      {
        code: "21CS101J",
        title: "Programming for Problem Solving using C/C++",
        structure: "3-0-2-4",
        semester: "Semester 1",
        description: "Foundations of structured programming, pointers, recursion, data structures, and memory management.",
        units: [
          "Unit 1: Algorithmic Thinking & C Basics",
          "Unit 2: Control Structures & Functions",
          "Unit 3: Arrays, Strings & Pointers",
          "Unit 4: Structures, Unions & Dynamic Memory",
          "Unit 5: File Handling & Preprocessor"
        ],
        textbooks: "Balagurusamy (McGraw Hill), Kernighan & Ritchie (Prentice Hall)"
      },
      {
        code: "21MA101T",
        title: "Calculus & Linear Algebra",
        structure: "3-1-0-4",
        semester: "Semester 1",
        description: "Matrix eigenvalue analysis, multivariable differential calculus, vector spaces, and Fourier series.",
        units: [
          "Unit 1: Matrices & Linear Systems",
          "Unit 2: Eigenvalues & Cayley-Hamilton",
          "Unit 3: Differential Calculus & Mean Value",
          "Unit 4: Partial Derivatives & Jacobians",
          "Unit 5: Vector Calculus & Integrals"
        ],
        textbooks: "B.S. Grewal (Khanna Publishers), Erwin Kreyszig (Wiley)"
      },
      {
        code: "21CS201J",
        title: "Data Structures and Algorithms",
        structure: "3-0-2-4",
        semester: "Semester 3",
        description: "Linear and non-linear data structures, asymptotic notation, balanced trees, graph traversal, dynamic programming.",
        units: [
          "Unit 1: Stacks, Queues & Linked Lists",
          "Unit 2: Trees, AVL & Red-Black Trees",
          "Unit 3: Graphs, BFS, DFS & Shortest Path",
          "Unit 4: Sorting, Searching & Hashing",
          "Unit 5: Greedy Algorithms & Dynamic Programming"
        ],
        textbooks: "Cormen, Leiserson, Rivest, Stein (MIT Press), Mark Allen Weiss"
      },
      {
        code: "21CS202T",
        title: "Object Oriented Analysis & Design (Java)",
        structure: "3-0-0-3",
        semester: "Semester 3",
        description: "Encapsulation, inheritance, polymorphism, design patterns, UML class modeling, multi-threading.",
        units: [
          "Unit 1: Java Fundamentals & OOP",
          "Unit 2: Inheritance & Interfaces",
          "Unit 3: Exception Handling & Collections",
          "Unit 4: Multithreading & Concurrency",
          "Unit 5: UML Diagrams & Gang-of-Four Patterns"
        ],
        textbooks: "Herbert Schildt (Oracle Press), Craig Larman (Pearson)"
      },
      {
        code: "21CS301J",
        title: "Operating Systems & Kernel Architecture",
        structure: "3-0-2-4",
        semester: "Semester 5",
        description: "Process management, CPU scheduling, thread synchronization, deadlocks, virtual memory paging, file systems.",
        units: [
          "Unit 1: OS Structures & System Calls",
          "Unit 2: Process Scheduling & IPC",
          "Unit 3: Synchronization & Deadlocks",
          "Unit 4: Memory Management & Paging",
          "Unit 5: Storage & Linux Kernel Internals"
        ],
        textbooks: "Silberschatz, Galvin, Gagne (Wiley), Andrew Tanenbaum"
      },
      {
        code: "21CS302J",
        title: "Database Management Systems (DBMS)",
        structure: "3-0-2-4",
        semester: "Semester 5",
        description: "Relational algebra, SQL, normalization (1NF to BCNF), transaction ACID properties, indexing, NoSQL.",
        units: [
          "Unit 1: ER Modeling & Relational Model",
          "Unit 2: SQL & Complex Querying",
          "Unit 3: Normalization & Functional Dependencies",
          "Unit 4: Concurrency Control & Recovery",
          "Unit 5: B+ Trees & MongoDB"
        ],
        textbooks: "Elmasri & Navathe (Pearson), Raghu Ramakrishnan (McGraw Hill)"
      }
    ]
  },
  {
    courseCode: "CSE-AIML",
    courseTitle: "B.Tech CSE (Artificial Intelligence & Machine Learning)",
    duration: "4 Years (8 Semesters)",
    totalCredits: "160 Credits",
    subjects: [
      {
        code: "21AI201J",
        title: "Foundations of Artificial Intelligence",
        structure: "3-0-2-4",
        semester: "Semester 3",
        description: "State space search, A* heuristic, minimax with alpha-beta pruning, constraint satisfaction, propositional logic.",
        units: [
          "Unit 1: Intelligent Agents & Problem Formulation",
          "Unit 2: Informed & Uninformed Search",
          "Unit 3: Adversarial Search & Games",
          "Unit 4: Knowledge Representation & Logic",
          "Unit 5: Planning & Probabilistic Reasoning"
        ],
        textbooks: "Stuart Russell & Peter Norvig (Pearson)"
      },
      {
        code: "21AI301J",
        title: "Supervised and Unsupervised Machine Learning",
        structure: "3-0-2-4",
        semester: "Semester 5",
        description: "Linear/logistic regression, SVM, decision trees, random forests, k-means clustering, PCA, gradient descent.",
        units: [
          "Unit 1: Regression Models & Optimization",
          "Unit 2: Classification, Naive Bayes & SVM",
          "Unit 3: Ensemble Learning & XGBoost",
          "Unit 4: Unsupervised Clustering & PCA",
          "Unit 5: Model Evaluation & Regularization"
        ],
        textbooks: "Tom Mitchell (McGraw Hill), Christopher Bishop (Springer)"
      },
      {
        code: "21AI401J",
        title: "Deep Learning & Neural Architectures",
        structure: "3-0-2-4",
        semester: "Semester 7",
        description: "Backpropagation, CNNs for computer vision, RNNs, LSTMs, Transformers, Attention mechanisms, PyTorch.",
        units: [
          "Unit 1: Deep Feedforward Networks",
          "Unit 2: Convolutional Neural Networks (CNN)",
          "Unit 3: Sequence Modeling & LSTM",
          "Unit 4: Transformers & Attention Mechanisms",
          "Unit 5: Generative Models (GANs & Diffusion)"
        ],
        textbooks: "Ian Goodfellow, Yoshua Bengio, Aaron Courville (MIT Press)"
      }
    ]
  },
  {
    courseCode: "BCA",
    courseTitle: "Bachelor of Computer Applications (BCA)",
    duration: "3 Years (6 Semesters)",
    totalCredits: "120 Credits",
    subjects: [
      {
        code: "BCA101",
        title: "Computer Fundamentals & Office Automation",
        structure: "3-0-0-3",
        semester: "Semester 1",
        description: "Hardware architecture, boolean algebra, operating system basics, word processing and spreadsheet analysis.",
        units: [
          "Unit 1: Computer Generations & Architecture",
          "Unit 2: Number Systems & Logic Gates",
          "Unit 3: OS Concepts & Utilities",
          "Unit 4: Office Productivity Tools",
          "Unit 5: Internet Technologies & Protocols"
        ],
        textbooks: "P.K. Sinha (BPB Publications)"
      },
      {
        code: "BCA201J",
        title: "Web Technology & Full Stack JavaScript",
        structure: "3-0-2-4",
        semester: "Semester 3",
        description: "HTML5 semantic markup, CSS3 Flexbox/Grid, Vanilla JavaScript, DOM API, Node.js and Express REST APIs.",
        units: [
          "Unit 1: HTML5 & CSS3 Layouts",
          "Unit 2: JavaScript ES6+ Core Concepts",
          "Unit 3: DOM Manipulation & Event Handling",
          "Unit 4: Node.js, Express & Routing",
          "Unit 5: REST APIs & MongoDB Integration"
        ],
        textbooks: "Jon Duckett (Wiley), David Flanagan (O'Reilly)"
      }
    ]
  },
  {
    courseCode: "MCA-AI",
    courseTitle: "Master of Computer Applications (MCA - Gen AI)",
    duration: "2 Years (4 Semesters)",
    totalCredits: "88 Credits",
    subjects: [
      {
        code: "MCA101J",
        title: "Advanced Data Structures & Algorithms",
        structure: "3-0-2-4",
        semester: "Semester 1",
        description: "Amortized analysis, binomial heaps, network flows, NP-completeness, randomized algorithms.",
        units: [
          "Unit 1: Algorithm Complexity & Recurrences",
          "Unit 2: Advanced Heaps & Trees",
          "Unit 3: Graph Algorithms & Network Flow",
          "Unit 4: Dynamic Programming & Greedy Strategies",
          "Unit 5: NP-Completeness & Approximation"
        ],
        textbooks: "Cormen et al. (MIT Press)"
      },
      {
        code: "MCA202J",
        title: "Cloud Microservices & Generative AI Systems",
        structure: "3-0-2-4",
        semester: "Semester 3",
        description: "Docker containers, Kubernetes orchestration, LLM orchestration, LangChain, vector databases (Pinecone, Chroma).",
        units: [
          "Unit 1: Microservices Architecture & Docker",
          "Unit 2: Kubernetes Cluster Management",
          "Unit 3: LLMs & Prompt Engineering",
          "Unit 4: Retrieval Augmented Generation (RAG)",
          "Unit 5: Vector Databases & Deployment"
        ],
        textbooks: "Sam Newman (O'Reilly), Aurélien Géron"
      }
    ]
  },
  {
    courseCode: "MBA",
    courseTitle: "Master of Business Administration (MBA)",
    duration: "2 Years (4 Semesters)",
    totalCredits: "96 Credits",
    subjects: [
      {
        code: "MBA101",
        title: "Management Principles & Organizational Behavior",
        structure: "3-0-0-3",
        semester: "Semester 1",
        description: "Organizational culture, motivation theories, leadership dynamics, team conflict resolution, change management.",
        units: [
          "Unit 1: Management Evolution & Schools of Thought",
          "Unit 2: Individual Behavior & Personality",
          "Unit 3: Motivation & Leadership Styles",
          "Unit 4: Group Dynamics & Conflict",
          "Unit 5: Organizational Change & Culture"
        ],
        textbooks: "Stephen Robbins & Timothy Judge (Pearson)"
      },
      {
        code: "MBA201",
        title: "Financial Management & Corporate Valuation",
        structure: "3-0-0-3",
        semester: "Semester 2",
        description: "Time value of money, capital budgeting (NPV, IRR), cost of capital, working capital optimization, dividend policy.",
        units: [
          "Unit 1: Financial System & Objectives",
          "Unit 2: Time Value & Risk-Return Tradeoff",
          "Unit 3: Capital Budgeting & Cash Flows",
          "Unit 4: Capital Structure Theories",
          "Unit 5: Working Capital & Valuation Models"
        ],
        textbooks: "Prasanna Chandra (McGraw Hill), I.M. Pandey"
      }
    ]
  }
];

module.exports = {
  CURRICULUM: CURRICULUM
};
