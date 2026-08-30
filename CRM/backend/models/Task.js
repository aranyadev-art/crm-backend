const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    // =========================
    // BASIC INFO
    // =========================

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // =========================
    // OPTIONAL RELATIONSHIPS
    // =========================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    shortlist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shortlist",
      default: null,
    },

    communication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Communication",
      default: null,
    },

    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      default: null,
    },

    outcome: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Outcome",
      default: null,
    },

    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      default: null,
    },

    // =========================
    // PRIORITY / STATUS
    // =========================

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },

    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "TODO",
    },

    // =========================
    // DATES
    // =========================

    dueDate: {
      type: Date,
      default: null,
    },

    // =========================
    // ASSIGNMENT (plain string — no Staff model exists)
    // =========================

    assignedTo: {
      type: String,
      trim: true,
      default: "",
    },

    // =========================
    // COMPLETION TRACKING
    // =========================

    completedAt: {
      type: Date,
      default: null,
    },

    completedBy: {
      type: String,
      trim: true,
      default: "",
    },

    // =========================
    // MISC
    // =========================

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    archived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// =========================
// INDEXES
// =========================

taskSchema.index({ user: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ archived: 1 });

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;