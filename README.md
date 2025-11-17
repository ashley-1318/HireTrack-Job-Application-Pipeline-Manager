## 🚀 HireTrack – AI-Powered Job Application Pipeline Manager

HireTrack is a full-stack, AI-enabled Job Application Tracking System designed to simplify and automate the hiring workflow.
It allows candidates to apply for jobs online, enables companies to manage job postings, and includes an AI-powered ATS screening engine that automatically evaluates resumes against job descriptions.

This project is built with React + Vite, Node.js + Express, MongoDB, Cloudinary, and Groq Llama 3.1, offering a modern, scalable, end-to-end hiring management solution.

## ✨ Key Features

🧑‍💼 Candidate Portal
  🔍 Browse all open job positions
  📝 Apply for jobs with:
      Name, Email, Phone
      Resume Upload (PDF/DOCX)
      Cover Note
  📤 Resume uploaded to Cloudinary
  📬 Automatically processed by ATS on submission
  
## 🤖 AI-Powered ATS Screening

Automated candidate evaluation using Groq Llama 3.1 (70B)
📄 Extracts text from resumes (PDF/DOCX)
🔍 Compares resume with job description
📊 Generates ATS Score (0–100)
🧠 Decision: Screening or Rejected
📝 Provides explanation + breakdown
✔ Stored in MongoDB with candidate record

ATS Breakdown Includes:
  Skill Match
  Experience Match
  Education Match
  Keyword Match

🛠️ Admin Dashboard
  📋 View all candidates + ATS score
  🔗 Open resume directly from Cloudinary
  🟢 Screening / 🔴 Rejected tagging
  📊 View full ATS insights & explanation
  🛑 Manual override options
  🏢 Manage job postings

## 🏗️ Backend API Services
  REST APIs built in Express.js
  Resume extraction (pdf-parse, mammoth)
  Cloudinary integration
  ATS scoring via Groq API
  Secure candidate/job routes
  Stage history & pipeline tracking

## 🧩 Tech Stack
🎨 Frontend
  React
  TypeScript
  Vite
  Tailwind CSS
  shadcn/ui
  React Router
  Axios
  Lucide Icons
  
Backend
  Node.js
  Express.js
  Mongoose
  Cloudinary SDK
  pdf-parse (PDF text extraction)
  mammoth (DOCX extraction)
  CORS & Middleware

🗄️ Database

  MongoDB Atlas (cloud NoSQL database)

🤖 AI Engine

Groq API – Llama 3.1 70B Versatile
Used for:
Resume-JD matching
ATS scoring
Explanation generation

☁️ Storage

Cloudinary (Resume file storage)

🚀 Deployment

GitHub Pages / Firebase Hosting → Frontend

Render / Vercel → Backend

MongoDB Atlas → Cloud DB

## 📂 Project Structure
Frontend
hiretrack-ui/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Screens & pages
│   ├── admin/          # Admin dashboard UI
│   ├── hooks/          # Custom utility hooks
│   ├── lib/            # Axios & configs
│   └── ...
├── public/
├── vite.config.ts
├── package.json
└── ...

Backend
hiretrack-api/
├── controllers/
│   ├── candidate.controller.js
│   ├── job.controller.js
│   └── ats.controller.js
├── routes/
├── models/
│   ├── Candidate.js
│   ├── Job.js
│   └── History.js
├── services/
│   ├── groqAtsService.js
│   ├── resumeParser.js
│   └── cloudinaryService.js
├── utils/
├── server.js
└── package.json

## 🛠️ Installation & Setup
1️⃣ Clone the Repository
git clone https://github.com/ashley-1318/hiretrack-ui.git
cd hiretrack-ui

## 🔧 Frontend Setup
cd hiretrack-ui
npm install
npm run dev


Runs at:

http://localhost:5173

## 🖥️ Backend Setup
cd hiretrack-api
npm install
npm start


Runs at:

http://localhost:5000

## 🔐 Environment Variables
Backend .env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx
GROQ_API_KEY=xxxx
JWT_SECRET=xxxx (optional)

## 📌 ATS Algorithm (How It Works)

User applies for a job
Resume uploaded → Cloudinary
Backend extracts text using:
pdf-parse
mammoth
Job description loaded from MongoDB
Backend sends both to Groq Llama 3.1
Model returns:
  skill_match
  experience_match
  education_match
  keyword_match
  total_score
  explanation
  Decision logic:
      if total_score >= 60 → Screening
      else → Rejected
Updated in candidate record
Shown in Admin Dashboard

## 🌐 API Endpoints
Apply for Job
POST /api/apply

Fetch All Candidates (Admin)
GET /api/admin/candidates

Override ATS Decision
PATCH /api/admin/candidates/:id/override

## 🚀 Build Scripts
Frontend
npm run dev
npm run build
npm run preview

Backend
npm start

## 📈 Future Enhancements

Automated interview scheduling
Email notifications for candidates
Multi-stage customizable pipeline
Analytics dashboard for HR
JD generator using AI
Chatbot for candidate queries

## License

This project is licensed under the MIT License.

## Contact

Project Link: [https://github.com/ashley-1318/HireTrack-Job-Application-Pipeline-Manager](https://github.com/ashley-1318/HireTrack-Job-Application-Pipeline-Manager)
