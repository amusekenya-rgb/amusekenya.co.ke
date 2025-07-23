
# Amuse Ke - Children's Nature Camp Platform

## Project Overview

Amuse Ke is a comprehensive web platform for a children's nature camp based in Kenya's Karura Forest. The platform provides parents with information about summer programs, camp activities, and facilitates program registration.

## Project Info

**URL**: https://lovable.dev/projects/92601e35-7fdd-439f-9870-89512bd7cbd2

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

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/92601e35-7fdd-439f-9870-89512bd7cbd2) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/92601e35-7fdd-439f-9870-89512bd7cbd2) and click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

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
