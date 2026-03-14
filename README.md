# AI-Powered Interview Coach 🧠💼

An advanced, interactive web application designed to help job seekers practice and perfect their interview skills. By leveraging generative AI models (Google Gemini) and real-time interaction, this tool provides a personalized, realistic mock interview experience complete with instant feedback and performance tracking.

## ✨ Key Features

- **Personalized Mock Interviews**: The AI interviewer acts as a hiring manager, asking technical, behavioral, and system design questions tailored to your target role and experience.
- **Resume Analysis**: Upload your resume (PDF/DOCX) using the built-in parser. The AI will evaluate your profile, score your market readiness, and highlight skills to improve.
- **Speech-to-Text Integration**: Practice verbal communication natively! Click the microphone button to dictate your answers, seamlessly converting your speech into text.
- **Personality Analyzer**: Input a short paragraph about yourself and the AI will analyze your communication traits and soft skills.
- **Dynamic Question Generator**: Enter a job role or description, and the AI will generate a custom list of practice questions specifically tailored to that position and your profile.
- **Real-time Performance Dashboard**: Track your progress over time with visual charts (using Chart.js) displaying your average scores, practice streaks, and skill distribution.
- **Session History**: Review transcripts of your past mock interviews, including the AI's feedback on your answers, to identify areas for improvement.

## 🛠️ Technology Stack

### Frontend
- **HTML5, CSS3, Vanilla JavaScript**: Lightweight, native web technologies.
- **Chart.js**: For rendering visually appealing performance and skill distribution charts.
- **Web Speech API**: Powers the native microphone/speech-to-text integration.
- **FontAwesome**: For UI icons.
- **Socket.io-client**: Enables real-time, bidirectional communication with the backend.

### Backend
- **Node.js & Express.js**: The core server framework.
- **Socket.io**: Powers the real-time chat infrastructure for mock interviews.
- **MongoDB (Mongoose)**: NoSQL database used to store user profiles, session history, and metrics.
- **Google Generative AI SDK**: Integrates Gemini models for intelligent parsing and conversational responses.
- **JWT (JSON Web Tokens) & bcrypt**: Secure user authentication and password hashing.
- **Multer**: Handles file uploads for resume parsing.
- **pdf-parse & mammoth**: Extracts raw text from uploaded PDF and DOCX files.
- **Tesseract.js**: OCR capabilities for analyzing image-based resumes (optional).

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- A running instance of MongoDB (local or Atlas)
- A Google Gemini API Key

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ai-powered-interview-coach/AI_powered_interview_project
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `AI_powered_interview_project` directory and add the following keys:
   ```env
   # Example .env configuration
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/interview-coach # Or your MongoDB Atlas URI
   GEMINI_API_KEY=your_google_gemini_api_key
   JWT_SECRET=your_super_secret_jwt_key
   ```

4. **Start the server:**
   ```bash
   npm start
   ```
   *The server will typically start on `http://localhost:3000`.*

5. **Access the Application:**
   Open your browser and navigate to `http://localhost:3000`.

## 🎤 How to Use the Microphone Feature
When taking a mock interview or using the Personality Analyzer, ensure your browser has permission to access your microphone. Click the microphone icon next to the text area, speak clearly, and your words will instantly transcribe into the input field! Click it again to stop, or just hit send.

## 📁 Project Structure

```text
├── AI_powered_interview_project/
│   ├── .env                 # Environment variables (do not commit)
│   ├── Server.js            # Main backend Express server
│   ├── aiService.js         # Wrapper for Google Gemini AI integrations
│   ├── package.json         # Node.js dependencies
│   ├── resumeParser.js      # Logic for extracting text from PDF/DOCX
│   └── public/              # Frontend Assets
│       ├── index.html       # Landing and Auth page
│       ├── dashboard.html   # Main application interface
│       ├── styles.css       # Core styling
│       └── drawer_styles.css# Sidebar styling
└── README.md                # Project documentation
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! 

## 📝 License
This project is for educational and portfolio purposes.
