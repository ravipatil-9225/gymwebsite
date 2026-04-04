# Product Requirements Document (PRD): Tara Fitness Center

## 1. **Project Overview**
**Tara Fitness Center** is a modern, full-stack (MERN) web application designed to digitize gym operations, improve user engagement, and streamline member management. It provides a premium digital experience for both the gym owner (Admin) and its members (Users).

---

## 2. **Target Audience**
- **Members (Users)**: Accessing membership plans, tracking their status, generating AI nutrition plans, and managing profiles.
- **Gym Owner (Admin)**: Managing users, verifying payments, updating content (gallery, trainers), and viewing business analytics.

---

## 3. **Core Features**

### 🔐 **Authentication & Security**
- **Email/Password Authentication**: Secure login and registration with hashed passwords (bcrypt).
- **Google OAuth**: Fast login via Google.
- **Password Recovery**: Secure 'Forgot Password' flow with expiring reset tokens sent via email.
- **JWT Protection**: All private routes and API endpoints are protected using JSON Web Tokens.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `Admin` and `User` roles.

### 👤 **Member Dashboard (User Portal)**
- **Real-Time Status**: View current membership status (Active, Pending, Expired) with countdown timers.
- **Profile Management**: Update name, contact details, date of birth, and training goals.
- **Cloudinary Image Upload**: High-performance profile photo uploads with automatic compression and Cloudinary storage.
- **AI SmartNutrition (Groq AI)**: Generate personalized daily calorie and macro targets based on age, weight, height, activity level, and goals.

### 💳 **Membership & Payments**
- **Flexible Plans**: Separate categories for Basic Training, Personal Training, and Steam Bath packages.
- **Secure Payment Flow**: Support for UPI (QR code) and Cash-based membership purchases.
- **OCR-based Fraud Protection**: Backend verification system that checks transaction details (image/text) to prevent duplicate or falsified submissions.
- **Admin Verification**: All payments require final administrative approval before memberships are activated.

### 🛡️ **Admin Command Center**
- **Live Analytics**: Real-time stats on total members, active memberships, and recent revenue.
- **User Management**: Search, edit, and manually create/delete user accounts.
- **Content Management System (CMS)**:
    - **Live Gallery**: Upload and manage gym photos.
    - **Trainer Profiles**: Add/Edit trainers with certifications and Instagram links.
    - **Offer Management**: Post and update the latest gym discounts.
- **Real-Time Notifications**: Integrated with Socket.io for instant database change updates across all admin panels.

### 🏢 **Public Branding & Engagement**
- **Responsive Landing Page**: Sleek, dark-themed design using Framer Motion animations.
- **Interactive Trainer Gallery**: Showcase professional staff.
- **Package Browsing**: Explore different gym plans before signing up.
- **Dynamic Reviews**: High-rated feedback automatically pulled into the testimonial section.
- **Enquiry System**: Integrated WhatsApp-ready contact forms.

---

## 4. **Technical Stack**

### **Frontend**
- **React (Vite)**: Core framework for a fast, modern UI.
- **Vanilla CSS / Inline Styles**: Custom, premium dark-theme design.
- **Framer Motion**: Smooth entry animations and micro-interactions.
- **Lucide React**: Vector icons and visual indicators.
- **React Router Dom**: Dynamic client-side routing.

### **Backend**
- **Node.js & Express**: High-performance RESTful API.
- **Socket.io**: Real-time bi-directional events for dashboard synchronization.
- **Mongoose (MongoDB)**: Scalable, document-oriented database.
- **Cloudinary SDK**: Modern cloud-based image handling.
- **Nodemailer**: Transactional and recovery emails.

### **Security Layers**
- **Helmet**: 15+ secure HTTP headers configured.
- **Rate Limiter**: Brute-force protection for Auth routes and AI generation limiters.
- **CORS Whitelisting**: Strict origin controls (only allowing tfc365.com).
- **Express-Mongo-Sanitize**: Prevention of NoSQL injection attacks.
- **Global Error Handling**: Production-safe error concealment (NODE_ENV=production).

---

## 5. **Internal Infrastructure**
- **Environment Management**: Strict `.env` configuration for sensitive keys (MongoDB URI, JWT Secret, Groq API Key).
- **Deployment Strategy**:
    - **Frontend**: Vercel (Production) with custom domain `tfc365.com`.
    - **Backend**: Render (Production) for server-side logic and database persistence.
- **Automated Workflows**: Cron jobs for membership expiration checks and reminders.

---

## 6. **Future Roadmap**
- **Mobile App**: PWA conversion or Flutter/React Native application.
- **WhatsApp API Integration**: Automated enrollment and payment receipt messages.
- **Attendance Tracking**: QR code scanning system at the gym entrance.
- **E-commerce**: Integrated store for supplements and equipment.

---
**Status**: V1.0.0 (Production Live)
**Last Updated**: April 3, 2026
