1. Tara Fitness Center (TFC365)
Tara Fitness Center is a modern, full-stack (MERN) web application designed to digitize gym operations, improve user engagement, and streamline member management. It provides a premium digital experience for both the gym owner (Admin) and its members (Users).

2. 🌟 Key Features

3. 👤 Member Dashboard (User Portal)
- 3.1 Real-Time Status: View current membership status (Active, Pending, Expired) with countdown timers.
- 3.2 Profile Management: Update personal details and training goals. High-performance profile photo uploads via Cloudinary.
- 3.3 AI SmartNutrition (Groq AI): Generate personalized daily calorie and macro targets based on user metrics.

4. 💳 Membership & Payments
- 4.1 Flexible Plans: Support for various packages (Basic Training, Personal Training, Steam Bath).
- 4.2 Secure Payment Flow: UPI (QR code) and Cash-based purchases.
- 4.3 OCR-based Fraud Protection: Backend verification system to prevent duplicate or falsified submissions.
- 4.4 Admin Verification: Manual administrative approval before memberships are activated.

5. 🛡️ Admin Command Center
- 5.1 Live Analytics: Real-time stats on total members, active memberships, and recent revenue.
- 5.2 User Management: Full control to search, edit, create, or delete user accounts.
- 5.3 Content Management System (CMS): Update live gallery, trainer profiles, and promotional offers.
- 5.4 Real-Time Notifications: Instant synchronization across admin panels using Socket.io.

6. 🔐 Security Layers
- 6.1 Authentication: Email/Password (bcrypt hashed) and Google OAuth.
- 6.2 JWT Protection: Secured private routes and API endpoints.
- 6.3 Role-Based Access Control: Distinct Admin and User privileges.
- 6.4 API Security: Helmet headers, Rate Limiting, strict CORS whitelisting, and NoSQL injection prevention.

7. 🛠️ Tech Stack
7.1 Frontend
- React (Vite)
- Framer Motion (Animations)
- Vanilla CSS
- React Router Dom
- Lucide React (Icons)
7.2 Backend
- Node.js & Express
- MongoDB (Mongoose)
- Socket.io (Real-time events)
- Cloudinary SDK (Image hosting)
- Nodemailer (Emails)

8. 📁 Project Structure
- frontend - Contains the Vite React application.
- backend - Contains the Express server, models, controllers, and routes.
- mobile - Reserved for future mobile application development.

9. 🚀 Future Roadmap
- Mobile App (PWA / Flutter / React Native)
- WhatsApp API Integration (Enrollment & receipts)
- QR Code Attendance Tracking
- Integrated E-commerce Store
---
10 Status: V1.0.0 (Production Live)
