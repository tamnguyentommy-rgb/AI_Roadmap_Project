# 🚀 Routex

> Personalized learning path system for high school students (Grades 10–12) (Only supported Vietnamese)

---

## 📌 Overview

Routex is a system designed to generate **personalized study roadmaps** based on user performance and learning goals. It focuses on optimizing study efficiency through adaptive planning and continuous evaluation.

The system supports the following subjects:

* Mathematics
* Physics
* Chemistry
* Biology
Works for the following grades
* 10
* 11
* 12
---

## 🧠 Core Features

### 🎯 Personalized Learning Path

* Generates study plans based on user input (grade, subject, goal, time)
* Prioritizes weak topics using performance data

### 📝 Mini Test System

* Weekly tests to evaluate understanding
* Questions mapped directly to specific topics

### 📊 Progress Tracking

* Analyze strengths and weaknesses per topic
* Visual dashboard (planned)

### 🔁 Adaptive Learning Loop

* Study → Test → Evaluate → Adjust
* Automatically updates learning priorities

### 🧩 Prerequisite Graph

* Topics linked via dependencies
* Ensures logical learning progression

---

## 🏗️ System Workflow

```
User Input 
   ↓
Generate Learning Plan
   ↓
Study Topics
   ↓
Weekly Mini Test
   ↓
Performance Analysis
   ↓
Adjust Plan (priority + time)
   ↺ (loop continues)
```

---

## ⚙️ Tech Stack

### Frontend

* React / Next.js
* HTML / CSS

### Backend

* Node.js / Express
* REST API

### Data Layer

* JSON / Database for:

  * Topics
  * Questions
  * Prerequisite relationships

### Core Logic

* Priority scoring algorithm
* Topic dependency resolution

---

## 📂 Project Structure

```
Routex/
├── frontend/              # UI layer
├── backend/               # API + logic
├── data/                  # Static data (topics, questions)
│   ├── topics.json
│   └── questions.json
├── docs/                  # Documentation
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone repository

```bash
git clone https://github.com/tamnguyentommy-rgb/Routex.git
cd Routex
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run project

```bash
npm run dev
```

---

## 🧪 Example Use Case

**Input:**

* Subject: Math
* Grade: 11
* Mode: Exam Preparation
* Study Time: 2 hours/day

**System Output:**

* Personalized topic list
* Priority ranking based on difficulty
* Weekly study schedule

**After 1 week:**

* Mini test evaluation
* Weak topics identified
* Learning plan adjusted automatically

---

## 📈 Future Improvements

* AI-powered recommendation engine
* Smarter topic prioritization (ML-based)
* Full analytics dashboard
* Real-time progress tracking
* Integration with external learning resources

---

## ⚠️ Current Limitations
* Limited dataset for questions/topics

---

## 👤 Author

* Tommy (tamnguyentommy-rgb)

---

## 📄 License

This project is licensed under the MIT License.
