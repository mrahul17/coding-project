const { Availability, Event, EventAttendee } = require("../models");
const moment = require("moment-timezone");
const { Op } = require("sequelize");
const { get } = require("../app");

exports.setAvailability = async (
  userId,
  startTime,
  endTime,
  dayOfWeek,
  timezone
) => {
  return await Availability.create({
    userId,
    startTime,
    endTime,
    dayOfWeek,
    timezone,
  });
};

// Fetch booked events for both users
const getBookedEventsForUsers = async (userId1, userId2, date) => {
  const startOfDay = date + "T00:00:00+00:00";
  const endOfDay = date + "T23:59:59+00:00";

  return await Event.findAll({
    where: {
      startTime: {
        [Op.between]: [startOfDay, endOfDay],
      },
    },
    include: [
      {
        model: EventAttendee,
        where: {
          userId: [userId1, userId2],
        },
      },
    ],
  });
};

exports.getCommonTimeSlots = async (userId1, userId2, date) => {
  // 1. Get both users' availability for the given date
  const user1Availability = await Availability.findOne({
    where: { userId: userId1, dayOfWeek: moment(date).day() },
  });

  const user2Availability = await Availability.findOne({
    where: { userId: userId2, dayOfWeek: moment(date).day() },
  });

  if (!user1Availability || !user2Availability) {
    return []; // No availability found
  }

  // 2. Calculate common availability range
  const commonAvailabilityStart = moment.max(
    moment.utc(date + " " + user1Availability.startTime),
    moment.utc(date + " " + user2Availability.startTime)
  );
  const commonAvailabilityEnd = moment.min(
    moment.utc(date + " " + user1Availability.endTime),
    moment.utc(date + " " + user2Availability.endTime)
  );

  // If no overlap in availability, return no slots
  if (commonAvailabilityStart.isAfter(commonAvailabilityEnd)) {
    return [];
  }

  // 3. Get all booked events for both users
  const allBookedEvents = await getBookedEventsForUsers(userId1, userId2, date);

  return getAvailableSlotsFromAvailabilityAndBookedEvents(
    commonAvailabilityStart,
    commonAvailabilityEnd,
    allBookedEvents
  );
};

exports.getTimeSlotsForUser = async (userId, date) => {
  const userAvailability = await Availability.findOne({
    where: { userId, dayOfWeek: moment(date).day() },
  });

  if (!userAvailability) {
    return [];
  }

  const startOfDay = moment.utc(date + "T00:00:00");
  const endOfDay = moment.utc(date + "T23:59:59");

  const allBookedEvents = await Event.findAll({
    where: {
      startTime: {
        [Op.between]: [startOfDay, endOfDay],
      },
    },
    include: [
      {
        model: EventAttendee,
        where: {
          userId,
        },
      },
    ],
  });

  return getAvailableSlotsFromAvailabilityAndBookedEvents(
    moment.utc(date + " " + userAvailability.startTime),
    moment.utc(date + " " + userAvailability.endTime),
    allBookedEvents
  );
};

const getAvailableSlotsFromAvailabilityAndBookedEvents = (
  availabilityStart,
  availabilityEnd,
  bookedEvents
) => {
  let currentStart = availabilityStart;
  const freeSlots = [];
  for (event of bookedEvents) {
    const eventStart = moment(event.dataValues.startTime);
    const eventEnd = moment(event.dataValues.endTime);

    // If there's a free slot before the event, add it
    if (currentStart.isBefore(eventStart)) {
      freeSlots.push({ start: currentStart, end: eventStart });
    }

    // Move the current start to the end of the event (for the next iteration)
    currentStart = moment.max(currentStart, eventEnd);
  }

  // After processing all events, if there's any remaining free time, add it
  if (currentStart.isBefore(availabilityEnd)) {
    freeSlots.push({ start: currentStart, end: availabilityEnd });
  }

  return freeSlots;
};
