
# Amuse Ke - Children's Nature Camp Platform

## About Amuse Ke

Amuse Ke is a comprehensive digital platform designed for a children's nature camp located in Kenya's beautiful Karura Forest. Our platform connects families with exceptional outdoor educational experiences, offering nature-based summer programs that inspire environmental stewardship and personal growth in children.

## Key Features

### For Parents and Visitors
- **Informative Landing Page**
  - Introduction to the camp and its philosophy
  - Program highlights and seasonal offerings
  - Age-specific camp activities
  - Parent testimonials
  - Team introduction
  - Contact form

- **Program Registration**
  - Online registration for summer camp programs
  - Detailed program information
  - Age group selection
  - Payment processing

- **Calendar and Events**
  - View upcoming camp sessions
  - Special events and workshops

### For Administrators
- **Admin Dashboard**
  - Manage camp programs and schedules
  - View and process registrations
  - Content management (announcements, team members, gallery)
  - Calendar management
  - Feature flag controls

## Technology Stack

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: 
  - Tailwind CSS for utility-first styling
  - Shadcn UI component library
- **State Management**: 
  - React Query for server state
  - Local state hooks
- **Routing**: React Router Dom
- **UI Components**:
  - Radix UI primitives
  - Custom components built on Radix
- **Form Handling**: React Hook Form with Zod validation
- **Data Visualization**: Recharts
- **Date Handling**: date-fns
- **Toast Notifications**: Sonner
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Web Framework**: Express
- **Database**: MongoDB with Mongoose ORM
- **Authentication**: 
  - JWT (JSON Web Tokens)
  - bcrypt for password hashing
- **Validation**: express-validator
- **Email Services**: Nodemailer
- **Payment Processing**: Integration with payment gateways
- **Security**: 
  - Rate limiting with express-rate-limit
  - Proper error handling
- **Logging**: Custom audit logging system

## Architecture
- **Frontend**: Single Page Application (SPA)
- **Backend**: RESTful API
- **State Management**: Client-server model with optimistic updates

## Development Approach
- Component-based architecture
- Responsive design principles
- Progressive enhancement
- Feature flag management for controlled rollouts

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- MongoDB database

### Installation

1. Clone the repository:
```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. Install dependencies:
```sh
npm install
```

3. Set up environment variables:
- Copy `.env.example` to `.env` in the server directory
- Configure your MongoDB connection string
- Set up email service credentials
- Configure payment gateway settings

4. Start the development server:
```sh
npm run dev
```

### Deployment

This application can be deployed to various hosting platforms:
- **Frontend**: Netlify, Vercel, or any static hosting service
- **Backend**: Heroku, Railway, or any Node.js hosting platform
- **Database**: MongoDB Atlas or self-hosted MongoDB instance

For production deployment:
1. Build the frontend: `npm run build`
2. Configure environment variables for production
3. Set up your MongoDB database
4. Deploy both frontend and backend to your chosen platforms

## File Structure Overview

- `/src` - Main source code directory
  - `/components` - React components
    - `/ui` - Reusable UI components from shadcn
    - `/gallery` - Gallery-related components
    - `/calendar` - Calendar and event management components
    - `/team` - Team member components
    - `/announcements` - Announcement components
  - `/hooks` - Custom React hooks
  - `/lib` - Utility functions and shared code
  - `/pages` - Main page components
  - `/services` - API services and data handling
  - `/types` - TypeScript type definitions

- `/server` - Backend Express server code
  - `/controllers` - API endpoint controllers
  - `/middleware` - Express middleware
  - `/models` - MongoDB schema models
  - `/routes` - API route definitions
  - `/utils` - Server utility functions

## License

This project is proprietary and confidential.
