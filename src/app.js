const express = require("express");
const bodyParser = require("body-parser");
const { Op } = require("sequelize");

const {
  sequelize,
  User,
  Event,
  EventAttendee,
  Availability,
} = require("./models");

const app = express();
app.use(bodyParser.json());
app.set("sequelize", sequelize);

app.post("/api/users/signup", async (req, res) => {
  try {
    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/users/:userId/availability", async (req, res) => {
  const { userId } = req.params;
  const { startTime, endTime, dayOfWeek } = req.body;

  if (!startTime || !endTime || !dayOfWeek) {
    return res.status(400).json({
      message: "startTime, endTime and dayOfWeek are required.",
    });
  }

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const availability = await Availability.create({
      userId,
      startTime,
      endTime,
      dayOfWeek,
    });

    return res.status(201).json({
      message: "User availability created successfully.",
      availability,
    });
  } catch (error) {
    console.error("Error setting availability:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const availabilities = await Availability.findAll({
      where: { userId: req.params.id },
    });

    const events = await EventAttendee.findAll({
      where: { userId: req.params.id },
      include: [{ model: Event }],
    });

    res.json({ ...user.dataValues, availabilities, events });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/events/:id", async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    const attendees = await EventAttendee.findAll({
      where: {
        eventId: req.params.id,
      },
    });
    res.json({ ...event.dataValues, attendees });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/users/:userId/schedule", async (req, res) => {
  const { userId } = req.params;
  const { date } = req.query;
  const AvailabilityService = require("./services/availabilityService");

  if (!date) {
    return res.status(400).json({ message: "date is required" });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const availableSlots = await AvailabilityService.getTimeSlotsForUser(
      userId,
      date
    );

    return res.json({ availableSlots });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

/*
  API to create an event with a host, start time, end time, and guest
  If guest email is passed,  a new user
  and add to attendee
*/
app.post("/api/events", async (req, res) => {
  const { hostId, startTime, endTime, attendees = [], guestEmail } = req.body;

  try {
    if (!hostId || !startTime || !endTime) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!attendees && !guestEmail) {
      return res.status(400).json({
        message:
          "Attendee (user Id of registered user) or guest email is required.",
      });
    }

    // Check if the event times are valid
    if (new Date(startTime) >= new Date(endTime)) {
      return res
        .status(400)
        .json({ message: "Start time must be before end time." });
    }

    const conflictingEvents = await Event.findAll({
      where: {
        [Op.or]: [
          {
            startTime: {
              [Op.lt]: endTime,
            },
            endTime: {
              [Op.gt]: startTime,
            },
          },
        ],
      },
      include: [
        {
          model: EventAttendee,
          where: {
            userId: {
              [Op.in]: attendees || [],
            },
          },
          required: false,
        },
      ],
    });

    if (conflictingEvents.length > 0) {
      return res.status(400).json({
        message:
          "The requested time is already booked. Please choose another time",
      });
    }

    const event = await Event.create({
      hostId,
      startTime,
      endTime,
    });

    // if guest email is provided, create a user and add to attendees
    if (guestEmail) {
      // create user if not exists
      const newUser = await User.create({
        email: guestEmail,
        username: guestEmail.split("@")[0],
      });

      attendees.push(newUser.id);
    }

    const attendeePromises = attendees.map(async (userId) => {
      await EventAttendee.create({
        eventId: event.id,
        userId,
      });
    });

    await Promise.all(attendeePromises);

    return res.status(201).json({ ...event.dataValues, attendees: attendees });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

/*
 Returns the common availability slots for two users on a given date
*/
app.get("/api/common-availability", async (req, res) => {
  const { date, userId1, userId2 } = req.query;
  console.log({ date, userId1, userId2 });
  const AvailabilityService = require("./services/availabilityService");

  try {
    const commonAvailability = await AvailabilityService.getCommonTimeSlots(
      userId1,
      userId2,
      date
    );

    return res.json({ commonAvailability });
  } catch (error) {
    console.error("Error fetching common availability:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = app;
