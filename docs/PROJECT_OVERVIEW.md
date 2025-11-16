# 📊 Puppy CRM - Project Overview

## 🎯 Project Name
**Puppy CRM** - Modern Customer Relationship Management System

## 📝 Description
A full-stack CRM platform inspired by Pipedrive, designed to help businesses manage their customer relationships, track deals, and streamline sales processes. The system provides both web and mobile interfaces for seamless access across devices.

## 🛠️ Tech Stack

### Backend
- **Framework**: Django 5.0
- **Database**: PostgreSQL
- **API**: Django REST Framework 3.14.0
- **Authentication**: JWT (djangorestframework-simplejwt 5.3.1)
- **CORS**: django-cors-headers 4.3.1
- **Environment**: python-decouple 3.8

### Frontend (Web)
- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.2
- **Routing**: react-router-dom 7.1.19
- **HTTP Client**: axios 1.13.2
- **Icons**: react-icons
- **Styling**: CSS Modules with glass morphism effects

### Mobile
- **Framework**: React Native 0.81.5
- **Platform**: Expo SDK 54
- **Navigation**: @react-navigation/native 7.1.19
- **HTTP Client**: axios
- **Environment**: react-native-dotenv
- **Icons**: @expo/vector-icons

## ✨ Key Features

### Phase 1 (Completed)
- ✅ Health check API endpoint
- ✅ Professional landing pages (web & mobile)
- ✅ Glass morphism UI design
- ✅ Responsive navigation
- ✅ Backend status monitoring

### Planned Features
- 🔐 **Authentication System** - JWT-based login/signup with Google OAuth
- 👥 **User Management** - Role-based access control (Admin, Manager, User)
- 📈 **Lead Management** - Track and convert leads
- 💼 **Deal Pipeline** - Visual deal tracking with stages
- 👤 **Customer Profiles** - Comprehensive customer data
- 🏢 **Organization Management** - Company relationship tracking
- 📞 **Communication Hub** - Call and email integration
- 📊 **Analytics Dashboard** - Real-time insights and reports
- 🔔 **Notifications** - Real-time updates and alerts
- 🐛 **Issue Tracking** - Bug and task management

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├──────────────────────────┬──────────────────────────────────┤
│   Web Frontend (React)   │   Mobile App (React Native)      │
│   - Vite Dev Server      │   - Expo                         │
│   - React Router         │   - React Navigation             │
│   - Axios HTTP Client    │   - Axios HTTP Client            │
│   Port: 5173 (dev)       │   Platform: iOS/Android          │
└───────────────┬──────────┴──────────────┬───────────────────┘
                │                         │
                │    HTTP/REST API        │
                └────────────┬────────────┘
                             ▼
                ┌────────────────────────┐
                │    API GATEWAY         │
                │  (Django REST)         │
                │  - CORS Enabled        │
                │  - JWT Auth            │
                │  Port: 8000            │
                └────────────┬───────────┘
                             ▼
                ┌────────────────────────┐
                │   BACKEND LAYER        │
                │   (Django 5.0)         │
                │   - Business Logic     │
                │   - ORM Models         │
                │   - Authentication     │
                └────────────┬───────────┘
                             ▼
                ┌────────────────────────┐
                │   DATABASE LAYER       │
                │   (PostgreSQL)         │
                │   - User Data          │
                │   - CRM Data           │
                │   - Relationships      │
                └────────────────────────┘
                             ▼
                ┌────────────────────────┐
                │  EXTERNAL SERVICES     │
                ├────────────────────────┤
                │  - Gmail SMTP          │
                │  - Twilio (Calls)      │
                │  - GitHub Issues API   │
                │  - Google OAuth        │
                └────────────────────────┘
```

## 👥 Target Users

### B2B (Business-to-Business)
- **Companies** - Businesses managing B2B relationships
  - Sales teams tracking enterprise deals
  - Account managers maintaining client relationships
  - Business development teams prospecting new clients

### B2C (Business-to-Consumer)
- **Customers** - End users accessing customer portal
  - View their account information
  - Track support tickets
  - Access resources and documentation

### User Roles
1. **Admin** - Full system access, user management, configuration
2. **Manager** - Team oversight, reporting, advanced features
3. **User** - Standard CRM access, lead/deal management
4. **Customer** - Limited portal access, self-service features

## 📦 Project Structure

```
puppy_crm/
├── backend/              # Django backend
│   ├── config/          # Project settings
│   ├── apps/            # Django apps (future)
│   ├── manage.py
│   └── requirements.txt
├── frontend-web/         # React web app
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Route pages
│   │   └── services/    # API services
│   ├── public/
│   └── package.json
├── mobile-app/          # React Native app
│   ├── src/
│   │   ├── screens/     # App screens
│   │   ├── components/  # Reusable components
│   │   └── navigation/  # Navigation config
│   ├── App.js
│   └── package.json
└── docs/                # Documentation
    ├── PROJECT_OVERVIEW.md
    ├── PROJECT_PLAN.md
    ├── DEVELOPMENT_PROGRESS.md
    ├── API_BLUEPRINT.md
    ├── DATABASE_SCHEMA.md
    └── THIRD_PARTY_APIS.md
```

## 🚀 Getting Started

### Backend
```bash
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Web Frontend
```bash
cd frontend-web
npm install
npm run dev
```

### Mobile App
```bash
cd mobile-app
npm install
npm start
# Press 'a' for Android or 'i' for iOS
```

## 📄 License
This project is proprietary software.

## 👨‍💻 Development Team
Built with ❤️ using modern web technologies
