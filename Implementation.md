### MVP Features

For the MVP, the following features are supported:

- Users can sign up with their email.
- Users can set their availability.
- Users can view their availability.
- Users can view their own schedule, i.e. events they are hosting or attending
- Users can find overlap in schedules between two users, per day, so that a common time can be found.
- User can book an event with another user, as a guest or already signed up user

### Deployment

The app is deployed at:  
[https://coding-project-production-1127.up.railway.app](https://coding-project-production-1127.up.railway.app)

By default, it is seeded with some test data. (See `scripts/seedDb.js` for details.)


### Installation
This is a Node.js application. To run the application, you need to have Node.js installed on your system.
To install the dependencies, run the following command:

```bash
npm install
```
Optionally, to setup the database, you can run the following command:

```bash
npm run seed
```

Finally, to start the API server,
  
```bash
npm src/server.js
```
  
### Supported Endpoints

1. **POST /api/users/signup**

   ```bash
   curl -X POST http://localhost:3001/api/user -H "Content-Type: application/json" -d '{ "username": "rahulm", "email": "testuser@test.com"}'
   ```

2. **POST /api/users/availability**
   Set availability from Monday to Thursday:
   ```bash
    curl -X POST http://localhost:3001/api/users/1/availability -H "Content-Type: application/json" -d '{"startTime": "09:00", "endTime": "12:00", "day": "1"}'
    curl -X POST http://localhost:3001/api/users/1/availability -H "Content-Type: application/json" -d '{"startTime": "09:00", "endTime": "13:00", "day": "2"}'
    curl -X POST http://localhost:3001/api/users/1/availability -H "Content-Type: application/json" -d '{"startTime": "09:00", "endTime": "17:00", "day": "3"}'
    curl -X POST http://localhost:3001/api/users/1/availability -H "Content-Type: application/json" -d '{"startTime": "09:00", "endTime": "15:00", "day": "4"}'
    ```

3. **POST /api/events**
   Create an event. To create event as guest, use `guestEmail` instead of `attendees`.

    ```bash
    curl -X POST http://localhost:3001/api/events -H "Content-Type: application/json" -d '{
      "hostId": 1,
      "startTime": "2024-10-08T10:00:00",
      "endTime": "2024-10-08T11:00:00",
      "attendees": [2]
      }'
    ```

    ```bash
      curl -X POST http://localhost:3001/api/events -H "Content-Type: application/json" -d '{
      "hostId": 1,
      "startTime": "2024-10-08T10:00:00",
      "endTime": "2024-10-08T11:00:00",
      "guestEmail": "anotherTestUser@test.com"
    }'
    ```

4. **GET /api/users/:id/schedule**
    Get schedule for a user.
  
    ```bash
    curl -X GET http://localhost:3001/api/users/1/schedule
    ```

5. **GET api/common-availability**
  GET common availability between two users for a given date.
  
  ```bash
  curl -X GET http://localhost:3001/api/common-availability?date=2024-10-08&userId1=1&userId2=2
  ```

### Trade-offs for MVP

The following trade-offs were made to complete the MVP in a timely manner:

- Timezone support is not implemented.
- Support for only one slot per day in availability. Sometimes people have distributed slots like: 9:00-12:00 and 14:00-17:00
- Common availability checks are only done for a single date.
- No support for event across multiple dates
- No validation for creating event in past date. This was specifically done so I could test APIs with older data.
- Common availability can only be found across 2 people, although this change can be easily made to support more than 2 people.
- No support for updating or deleting events.
- No buffer between events.
- Events can be scheduled at the last minute. This is usually not desirable
- No support for custom recurrence rules, daily, weekly, monthly, etc. Although this can be done with a library like `rrule` (https://jkbrzt.github.io/rrule/)


### Hacks
The seed data is hardcoded in the `scripts/seedDb.js` file. This was done to quickly seed the database with test data. Ideally, we could use a faker library to generate test data.


All of the routes and most implementation are put in app.js. Similarly all models have been added in the same file. In a real world scenario, these would be separated into different files for better organization and maintainability.

