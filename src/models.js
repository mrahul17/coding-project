const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const Event = sequelize.define(
  "Event",
  {
    hostId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("scheduled", "canceled", "completed"),
      allowNull: false,
      defaultValue: "scheduled",
    },
  },
  {
    timestamps: true,
  }
);

const EventAttendee = sequelize.define(
  "EventAttendee",
  {
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Event,
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    timestamps: true,
  }
);

const Availability = sequelize.define("Availability", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  startTime: {
    // e.g., "09:00:00"
    type: DataTypes.TIME,
    allowNull: false,
  },
  endTime: {
    // e.g., "17:00:00"
    type: DataTypes.TIME,
    allowNull: false,
  },
  dayOfWeek: {
    // 0 for Sunday, 6 for Saturday
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

User.hasMany(Availability, { foreignKey: "userId", as: "availabilities" });
Availability.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Event, { foreignKey: "hostId", as: "events" });
Event.belongsTo(User, { foreignKey: "hostId", as: "host" });

Event.hasMany(EventAttendee, { foreignKey: "eventId" });
EventAttendee.belongsTo(Event, { foreignKey: "eventId" });

module.exports = { User, Event, EventAttendee, Availability };
