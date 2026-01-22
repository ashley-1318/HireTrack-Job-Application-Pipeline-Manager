# 🚀 HireTrack - AI-Powered Recruitment & ATS Platform

<div align="center">

![HireTrack Logo](https://img.shields.io/badge/HireTrack-AI%20Hiring-blue?style=for-the-badge)
[![Live Demo](https://img.shields.io/badge/Live-Demo-success?style=for-the-badge)](https://hiretrack-job-application-ai.web.app/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

**An end-to-end hiring automation system powered by AI for intelligent resume screening, multi-stage pipeline management, and automated candidate communication.**

[Live Demo](https://hiretrack-job-application-ai.web.app/) • [Documentation](#-documentation) • [Report Bug](https://github.com/ashley-1318/hiretrack/issues) • [Request Feature](https://github.com/ashley-1318/hiretrack/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Demo](#-demo)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🎯 Overview

HireTrack is a production-grade **Applicant Tracking System (ATS)** that leverages **AI and automation** to transform the hiring process. Built with modern cloud-native architecture, it streamlines everything from resume screening to candidate pipeline management.

### 💡 The Problem

Traditional recruitment faces critical challenges:
- 📊 **High Volume**: Hundreds of applications per job posting
- ⏰ **Time-Consuming**: Manual resume screening takes hours
- 📉 **Inconsistent Evaluation**: Human bias and fatigue affect decisions
- 🔄 **Poor Tracking**: Candidates get lost in email threads
- 📧 **No Automation**: Every status update requires manual work

### ✅ The Solution

HireTrack automates the entire hiring workflow:
- 🤖 **AI-Powered Screening**: Llama 3.3-70B evaluates resumes semantically
- ⚡ **Instant Processing**: Analyze 100 resumes in minutes, not hours
- 📈 **Structured Pipeline**: Track candidates through customizable stages
- 📬 **Auto-Notifications**: Email candidates at every stage transition
- 📊 **Analytics Dashboard**: Data-driven insights for better decisions

---

## ✨ Key Features

### 🎨 **Candidate Experience**
- ✅ Public job listings with detailed descriptions
- ✅ Simple application form (name, email, resume upload, cover note)
- ✅ Support for PDF, DOC, DOCX, TXT resume formats
- ✅ Instant email confirmation upon application
- ✅ Automated status updates throughout the hiring process

### 🧠 **AI-Powered Intelligence**
- ✅ **Semantic Resume Analysis** using Groq's Llama 3.3-70B model
- ✅ **Multi-Dimensional Scoring**:
  - Skill Match Percentage
  - Experience Match Percentage
  - Keyword Relevance
  - Education Match
- ✅ **Structured AI Output** with reasoning and recommendations
- ✅ **Context-Aware Evaluation** beyond simple keyword matching

### 📊 **HR Admin Dashboard**
- ✅ Centralized candidate management interface
- ✅ Real-time pipeline visualization (Applied → Screening → Interview → Offer → Hired)
- ✅ One-click stage transitions with automated notifications
- ✅ Resume preview and ATS score breakdown
- ✅ Analytics: total jobs, candidates, stage distribution
- ✅ Activity logs and audit trail

### 🔧 **Technical Excellence**
- ✅ **Serverless Architecture** with auto-scaling
- ✅ **Multi-Layer Resume Parsing** (pdf2json → pdf-parse → mammoth)
- ✅ **Cloud Storage** with Cloudinary CDN
- ✅ **Email Automation** via Nodemailer
- ✅ **End-to-End Testing** with Playwright
- ✅ **Type-Safe** with TypeScript
- ✅ **Responsive UI** with Tailwind CSS

---

## 🎬 Demo

### 🌐 Live Application
**Visit**: [https://hiretrack-job-application-ai.web.app/](https://hiretrack-job-application-ai.web.app/)

### 📸 Screenshots

<details>
<summary>Click to view screenshots</summary>

#### Public Job Listings
![Job Listings](https://via.placeholder.com/800x400?text=Job+Listings+Page)

#### Candidate Application Form
![Application Form](https://via.placeholder.com/800x400?text=Application+Form)

#### Admin Dashboard
![Admin Dashboard](https://via.placeholder.com/800x400?text=Admin+Dashboard)

#### AI Scoring Breakdown
![ATS Score](https://via.placeholder.com/800x400?text=AI+Score+Breakdown)

</details>

### 🎥 Video Walkthrough
*Coming soon*

---

## 🛠 Tech Stack

### **Frontend**
| Technology | Purpose | Why? |
|------------|---------|------|
| ![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB) | UI Framework | Component-based architecture, industry standard |
| ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white) | Type Safety | Eliminates runtime errors, better IDE support |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) | Build Tool | Ultra-fast dev server, optimized production builds |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind-38B2AC?logo=tailwind-css&logoColor=white) | Styling | Rapid UI development, consistent design system |
| ![Firebase Hosting](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black) | Hosting | Global CDN, HTTPS by default, zero config |

### **Backend**
| Technology | Purpose | Why? |
|------------|---------|------|
| ![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white) | Runtime | JavaScript everywhere, massive ecosystem |
| ![Express.js](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white) | Web Framework | Simple routing, middleware flexibility |
| ![Firebase Functions](https://img.shields.io/badge/Cloud_Functions-FFCA28?logo=firebase&logoColor=black) | Serverless | Auto-scaling, pay-per-execution, no ops |
| ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white) | Database | Flexible schemas, scalable, ideal for variable data |
| ![Mongoose](https://img.shields.io/badge/Mongoose-880000?logo=mongoose&logoColor=white) | ODM | Schema validation, elegant MongoDB integration |

### **AI & Automation**
| Technology | Purpose | Why? |
|------------|---------|------|
| ![Groq](https://img.shields.io/badge/Groq-FF6B6B?logo=ai&logoColor=white) | AI Inference | Ultra-low latency, Llama 3.3-70B access |
| Llama 3.3-70B | LLM Model | Semantic understanding, structured outputs |
| pdf2json | PDF Parsing | Extract text from standard PDFs |
| pdf-parse | PDF Parsing | Fallback for complex PDFs |
| mammoth | DOCX Parsing | Microsoft Word document processing |

### **Infrastructure**
| Technology | Purpose | Why? |
|------------|---------|------|
| ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?logo=cloudinary&logoColor=white) | File Storage | Secure CDN, handles raw files, fast delivery |
| ![Nodemailer](https://img.shields.io/badge/Nodemailer-0F9D58?logo=gmail&logoColor=white) | Email Service | SMTP integration, template support |
| ![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white) | E2E Testing | Cross-browser testing, auto-waiting |

---

## 🏗 Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CANDIDATE                               │
│                  (Public Web Interface)                         │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FIREBASE HOSTING (CDN)                        │
│              React + TypeScript + Tailwind UI                   │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ REST API
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│             FIREBASE CLOUD FUNCTIONS (Gen 2)                    │
│                   Express.js Backend                            │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐ │
│  │   Job API    │ Candidate API│  Pipeline API│  Email API   │ │
│  └──────────────┴──────────────┴──────────────┴──────────────┘ │
└───────┬────────────────┬────────────────┬──────────────────────┘
        │                │                │
        │                │                │
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   MongoDB    │ │  Cloudinary  │ │ Groq AI API  │
│    Atlas     │ │     CDN      │ │ (Llama 3.3)  │
│              │ │              │ │              │
│ • Jobs       │ │ • Resumes    │ │ • Scoring    │
│ • Candidates │ │ • Documents  │ │ • Analysis   │
│ • Logs       │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
        │
        │ Trigger
        ▼
┌──────────────────────────────────┐
│     EMAIL AUTOMATION             │
│   (Nodemailer + Gmail SMTP)      │
│                                  │
│ • Application Confirmation       │
│ • Stage Change Notifications     │
│ • Offer Letters                  │
└──────────────────────────────────┘
```

### Data Flow: Resume Processing Pipeline

```
1. Candidate Uploads Resume
   │
   ▼
2. Multipart Upload → Cloudinary Storage
   │
   ▼
3. Resume Parsing (Fallback Strategy)
   ├─ Try: pdf2json (text-layer PDFs)
   ├─ Fallback: pdf-parse (complex PDFs)
   └─ Fallback: mammoth (DOCX files)
   │
   ▼
4. AI Analysis (Groq + Llama 3.3-70B)
   │ Input: Resume text + Job description
   │ Output: {
   │   skillMatch: 85%,
   │   experienceMatch: 70%,
   │   keywordMatch: 90%,
   │   educationMatch: 100%,
   │   totalScore: 86.25%,
   │   decision: "QUALIFIED",
   │   reasoning: "..."
   │ }
   │
   ▼
5. Save to MongoDB
   │ • Candidate profile
   │ • ATS scores
   │ • Pipeline stage: "Applied"
   │
   ▼
6. Trigger Email Notification
   │ • Confirmation email
   │ • Next steps
   │
   ▼
7. Admin Dashboard Update (Real-time)
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **Firebase CLI** - Install via `npm install -g firebase-tools`

### System Requirements

- **OS**: Windows 10+, macOS 10.14+, or Linux
- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: 500MB free space

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/hiretrack.git
cd hiretrack
```

### 2. Install Dependencies

#### Frontend
```bash
cd frontend
npm install
```

#### Backend
```bash
cd ../backend
npm install
```

### 3. Set Up Environment Variables

#### Frontend `.env`
```env
VITE_API_URL=http://localhost:5001/your-project-id/us-central1/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

#### Backend `.env`
```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hiretrack

# Groq AI
GROQ_API_KEY=your_groq_api_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password

# JWT
JWT_SECRET=your_super_secret_key_min_32_characters

# Environment
NODE_ENV=development
```

### 4. Firebase Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select:
# - Functions (Cloud Functions)
# - Hosting (Firebase Hosting)
# - Use existing project
# - Select your Firebase project
```

---

## ⚙️ Configuration

### MongoDB Setup

1. Create a free MongoDB Atlas account: [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Add your IP address to the whitelist (or allow from anywhere: `0.0.0.0/0`)
4. Create a database user
5. Get your connection string and add it to `.env`

### Groq API Setup

1. Sign up at [https://console.groq.com](https://console.groq.com)
2. Generate an API key
3. Add to `.env` as `GROQ_API_KEY`

### Cloudinary Setup

1. Create account at [https://cloudinary.com](https://cloudinary.com)
2. Get your credentials from the dashboard
3. Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` to `.env`

### Gmail SMTP Setup

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App Passwords
   - Generate a password for "Mail"
3. Add the 16-character password to `.env` as `GMAIL_APP_PASSWORD`

---

## 💻 Usage

### Development Mode

#### Start Backend (Cloud Functions Locally)
```bash
cd backend
npm run serve
# Backend runs on http://localhost:5001
```

#### Start Frontend
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

### Production Build

#### Build Frontend
```bash
cd frontend
npm run build
```

#### Deploy to Firebase
```bash
# Deploy everything
firebase deploy

# Or deploy separately
firebase deploy --only hosting  # Frontend only
firebase deploy --only functions  # Backend only
```

---

## 📚 API Documentation

### Base URL
```
Production: https://us-central1-your-project.cloudfunctions.net/api
Development: http://localhost:5001/your-project/us-central1/api
```

### Endpoints

#### **Jobs**

<details>
<summary><code>GET /api/jobs</code> - Get all active jobs</summary>

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Senior Software Engineer",
      "department": "Engineering",
      "location": "Remote",
      "type": "Full-time",
      "description": "We are looking for...",
      "requirements": ["5+ years experience", "React", "Node.js"],
      "pipelineStages": ["Applied", "Screening", "Interview", "Offer", "Hired"],
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```
</details>

<details>
<summary><code>POST /api/jobs</code> - Create new job (Admin only)</summary>

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "title": "Senior Software Engineer",
  "department": "Engineering",
  "location": "Remote",
  "type": "Full-time",
  "description": "Job description here...",
  "requirements": ["5+ years", "React", "Node.js"],
  "pipelineStages": ["Applied", "Screening", "Interview", "Offer", "Hired"]
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* created job */ },
  "message": "Job created successfully"
}
```
</details>

#### **Applications**

<details>
<summary><code>POST /api/apply</code> - Submit job application</summary>

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `name` (string, required)
- `email` (string, required)
- `phone` (string, required)
- `jobId` (string, required)
- `coverNote` (string, optional)
- `resume` (file, required) - PDF, DOC, DOCX, or TXT

**Response:**
```json
{
  "success": true,
  "data": {
    "candidateId": "507f1f77bcf86cd799439011",
    "atsScore": {
      "skillMatch": 85,
      "experienceMatch": 70,
      "keywordMatch": 90,
      "educationMatch": 100,
      "totalScore": 86.25,
      "decision": "QUALIFIED",
      "reasoning": "Strong technical background with relevant experience..."
    }
  },
  "message": "Application submitted successfully"
}
```
</details>

#### **Candidates**

<details>
<summary><code>GET /api/candidates</code> - Get all candidates (Admin only)</summary>

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `jobId` (optional) - Filter by job
- `stage` (optional) - Filter by pipeline stage
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "candidates": [ /* array of candidates */ ],
    "pagination": {
      "total": 150,
      "page": 1,
      "pages": 8,
      "limit": 20
    }
  }
}
```
</details>

<details>
<summary><code>PATCH /api/candidates/:id/stage</code> - Update candidate stage (Admin only)</summary>

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "newStage": "Interview",
  "notes": "Moving to technical interview round"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated candidate */ },
  "message": "Candidate moved to Interview stage"
}
```
</details>

### Authentication

HireTrack uses **JWT (JSON Web Tokens)** for authentication.

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@hiretrack.com",
  "password": "your_password"
}
```

#### Use Token
```bash
GET /api/candidates
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🧪 Testing

### Run End-to-End Tests

```bash
cd frontend
npm run test:e2e
```

### Test Coverage

Current test coverage:
- ✅ Job listing page load
- ✅ Job application form submission
- ✅ Resume upload functionality
- ✅ Admin dashboard authentication
- ✅ Candidate stage transitions

### Manual Testing Checklist

- [ ] Candidate can view job listings
- [ ] Candidate can submit application with resume
- [ ] Email confirmation is sent
- [ ] Resume is parsed correctly (test PDF, DOCX, TXT)
- [ ] AI scoring generates valid results
- [ ] Admin can log in to dashboard
- [ ] Admin can view candidates by stage
- [ ] Admin can move candidates through pipeline
- [ ] Stage change triggers email notification
- [ ] Analytics display correct numbers

---

## 🚢 Deployment

### Deploy to Firebase

#### 1. Build Frontend
```bash
cd frontend
npm run build
```

#### 2. Deploy
```bash
# From project root
firebase deploy

# Or deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
```

#### 3. Set Environment Variables in Firebase
```bash
firebase functions:config:set \
  groq.api_key="your_groq_key" \
  mongodb.uri="your_mongodb_uri" \
  cloudinary.cloud_name="your_cloud" \
  cloudinary.api_key="your_key" \
  cloudinary.api_secret="your_secret" \
  gmail.user="your_email" \
  gmail.password="your_app_password" \
  jwt.secret="your_jwt_secret"
```

#### 4. Deploy Functions with New Config
```bash
firebase deploy --only functions
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `GROQ_API_KEY` | Groq AI API key | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ |
| `GMAIL_USER` | Gmail email address | ✅ |
| `GMAIL_APP_PASSWORD` | Gmail app password | ✅ |
| `JWT_SECRET` | Secret for signing JWT tokens | ✅ |

---

## 🗺 Roadmap

### ✅ Phase 1 - MVP (Completed)
- [x] Public job listings
- [x] Candidate application form
- [x] AI-powered resume screening
- [x] Multi-stage hiring pipeline
- [x] Email automation
- [x] Admin dashboard
- [x] Analytics

### 🚧 Phase 2 - Enhancements (In Progress)
- [ ] Candidate self-service portal
- [ ] Advanced search and filtering
- [ ] Bulk candidate operations
- [ ] Custom email templates
- [ ] Interview scheduling integration
- [ ] Mobile responsive improvements

### 📋 Phase 3 - Advanced Features (Planned)
- [ ] AI interview question generator
- [ ] Drag-and-drop Kanban board
- [ ] Video interview integration
- [ ] Offer letter automation
- [ ] Chrome extension for LinkedIn sourcing
- [ ] WhatsApp/SMS notifications
- [ ] Multi-language support

### 🚀 Phase 4 - Enterprise (Future)
- [ ] Multi-tenant SaaS architecture
- [ ] RBAC (Role-Based Access Control)
- [ ] SSO integration (Google, Okta)
- [ ] Advanced analytics & reporting
- [ ] API rate limiting
- [ ] GDPR compliance tools
- [ ] Audit logs & compliance

---

## 🤝 Contributing

Contributions are what make the open-source community amazing! Any contributions you make are **greatly appreciated**.

### How to Contribute

1. **Fork the Project**
2. **Create your Feature Branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your Changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the Branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

### Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` file for more information.

---

## 📧 Contact


**Project Link**: [https://github.com/yourusername/hiretrack](https://github.com/ashley-1318/hiretrack)

**Live Demo**: [https://hiretrack-job-application-ai.web.app/](https://hiretrack-job-application-ai.web.app/)

---

## 🙏 Acknowledgments

Special thanks to:

- [React](https://reactjs.org/) - UI framework
- [Firebase](https://firebase.google.com/) - Backend infrastructure
- [Groq](https://groq.com/) - AI inference platform
- [MongoDB](https://www.mongodb.com/) - Database
- [Cloudinary](https://cloudinary.com/) - File storage
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Playwright](https://playwright.dev/) - E2E testing
- All open-source contributors

---

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/ashley-1318/hiretrack?style=social)
![GitHub forks](https://img.shields.io/github/forks/ashley-1318/hiretrack?style=social)
![GitHub issues](https://img.shields.io/github/issues/ashley-1318/hiretrack)
![GitHub pull requests](https://img.shields.io/github/issues-pr/ashley-1318/hiretrack)
![GitHub last commit](https://img.shields.io/github/last-commit/ashley-1318/hiretrack)

---

<div align="center">

### ⭐ If you find this project useful, please consider giving it a star!

**Made with ❤️ by Ashley Josco(https://github.com/ashley-1318)**

</div>
