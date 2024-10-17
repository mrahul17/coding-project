const e = require("express");
const { User, Event, EventAttendee, Availability } = require("../src/models");

/* WARNING THIS WILL DROP THE CURRENT DATABASE */
seed();

async function seed() {
  // create tables
  await User.sync({ force: true });
  await Event.sync({ force: true });
  await EventAttendee.sync({ force: true });
  await Availability.sync({ force: true });
  //insert data
  await Promise.all([
    User.create({
      username: "foo",
      email: "foo@example.com",
    }),

    User.create({
      username: "bar",
      email: "bar@example.com",
    }),

    User.create({
      username: "baz",
      email: "baz@example.com",
    }),
  ]);

  // user 1 creates availability of 9-5 on weekdays
  await User.findByPk(1).then((user) => {
    [1, 2, 3, 4, 5].forEach((day) => {
      user.createAvailability({
        startTime: "09:00:00",
        endTime: "17:00:00",
        dayOfWeek: day,
      });
    });
  });

  await User.findByPk(2).then((user) => {
    [1, 2, 3, 4, 5].forEach((day) => {
      user.createAvailability({
        startTime: "09:00:00",
        endTime: "15:00:00",
        dayOfWeek: day,
      });
    });
  });

  // create events for user1
  await User.findByPk(1).then((user) => {
    user.createEvent({
      startTime: "2024-10-08T10:00:00+00:00",
      endTime: "2024-10-08T11:00:00+00:00",
    });

    EventAttendee.create({ eventId: 1, userId: 2 });
    EventAttendee.create({ eventId: 1, userId: 1 });
    user.createEvent({
      startTime: "2024-10-09T03:00:00+00:00",
      endTime: "2024-10-09T12:00:00+00:00",
    });
    EventAttendee.create({ eventId: 2, userId: 2 });
    EventAttendee.create({ eventId: 2, userId: 1 });
  });
}
