# NearTask

NearTask is a local service marketplace app with a Spring Boot backend and a React frontend.

## What You Need

- Java 17
- Node.js 18 or newer
- npm
- MySQL Server

## Database Setup

Create a MySQL database named `Neartask_db`.

The backend uses these default settings in `neartask-backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/Neartask_db
spring.datasource.username=root
spring.datasource.password=your password
server.port=9000
```

If your MySQL username or password is different, update that file before starting the backend.

## Run the Backend

Open a terminal in the project root and run:

```bash
cd neartask-backend
./mvnw spring-boot:run
```

On Windows, use:

```powershell
cd neartask-backend
.\mvnw.cmd spring-boot:run
```

The backend runs at `http://localhost:9000`.

## Run the Frontend

Open a second terminal in the project root and run:

```bash
cd neartask-frontend
npm install
npm start
```

The frontend runs at `http://localhost:3000`.

## Start Order

1. Start MySQL.
2. Start the backend.
3. Start the frontend.
4. Open `http://localhost:3000` in your browser.

## Troubleshooting

- Make sure port `9000` is free for the backend.
- Make sure port `3000` is free for the frontend.
- Confirm the database name is `Neartask_db`.
- Confirm the MySQL password matches the value in `application.properties`.

## Main API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/tasks | Get all open tasks |
| POST | /api/tasks | Create a task |
| PUT | /api/tasks/{id}/complete | Complete a task |
| GET | /api/users/nearby | Get nearby workers |
| POST | /api/bookings/accept | Accept a task |