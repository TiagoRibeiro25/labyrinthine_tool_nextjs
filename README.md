# Labyrinthine Tool

A full-stack web application built with modern web technologies including Next.js, React, Tailwind CSS, and PostgreSQL.

## 🛠 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **UI Library:** [React](https://react.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **Icons:** [React Icons](https://react-icons.github.io/react-icons/)

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- [npm](https://www.npmjs.com/) or another package manager
- [Docker](https://www.docker.com/) and Docker Compose (for the local database)

## 🚀 Getting Started

Follow these steps to set up the project locally.

### 1. Clone the repository and install dependencies

```bash
git clone https://github.com/TiagoRibeiro25/labyrinthine_tool_nextjs
cd labyrinthine_tool
npm install
```

### 2. Set up the Environment Variables

Create a `.env.local` file in the root directory of the project and add the necessary environment variables. You can use the following as a template:

```env
NODE_ENV=development

NEXTAUTH_SECRET=secret
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
STEAM_API_KEY=
# Optional alias for STEAM_API_KEY for compatibility
STEAM_SECRET=

DATABASE_URL=postgresql://labyrinthine_user:labyrinthine_password@localhost:5432/labyrinthine_db
```

### 3. Start the Database

The project includes a `docker-compose.yml` file to quickly spin up a local PostgreSQL database.

```bash
docker-compose up -d
```

### 4. Database Migrations

Once the database is running, you need to push the schema using Drizzle:

```bash
npx drizzle-kit push
```

_Note: Depending on your exact drizzle scripts in `package.json`, you might use `npx drizzle-kit generate` and `npx drizzle-kit migrate` instead._

### 5. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application running.

## 📁 Project Structure

- `/src/app` - Next.js App Router pages and layouts
- `/src/app/api` - API route handlers
- `/src/components` - Reusable React components
- `/src/db` - Database configuration, schema, and Drizzle setup
- `/src/lib` - Utility functions and shared logic
- `/src/data` - Data fetching layers or static data files

## 📜 Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the app for production.
- `npm run start`: Runs the built production application.
- `npm run lint`: Runs ESLint to catch coding errors.
