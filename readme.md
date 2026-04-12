## How to Run Locally

### Backend
```bash
cd neartask-backend
./mvnw spring-boot:run
```

### Frontend
```bash
cd neartask-frontend
npm install
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/tasks | Get all open tasks |
| POST | /api/tasks | Create a task |
| PUT | /api/tasks/{id}/complete | Complete a task |
| GET | /api/users/nearby | Get nearby workers |
| POST | /api/bookings/accept | Accept a task |