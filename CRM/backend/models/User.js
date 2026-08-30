const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // =========================
    // PERSONAL DETAILS
    // =========================

    fullName: {
  type: String,
  required: [true, "Full Name is required"],
  trim: true,
  minlength: [2, "Full Name must be at least 2 characters"],
  match: [
    /^[A-Za-z\s]+$/,
    "Full Name can contain only letters and spaces",
  ],
},
gender: {
  type: String,
  required: [true, "Gender is required"],
  enum: ["Male", "Female"],
},

    dateOfBirth: {
      type: Date,
     
    },

    birthPlace: {
      type: String,
     
      trim: true,
    },

    gotra: {
      type: String,
     
      trim: true,
    },

    fatherName: {
      type: String,
     
      trim: true,
    },

    motherName: {
      type: String,
    
      trim: true,
    },

    fathersFatherName: {
      type: String,
   
      trim: true,
    },

    mothersMotherName: {
      type: String,
      trim: true,
    },

    height: {
      type: String,
    },

    complexion: {
      type: String,
      trim: true,
    },

  maritalStatus: {
  type: String,
  required: [true, "Marital Status is required"],
},

   education: {
  type: String,
  required: [true, "Education is required"],
},

    bloodGroup: {
      type: String,
  
    },

    jobProfessionBusiness: {
      type: String,
      trim: true,
    },

  salary: {
  type: String,
  trim: true,
  match: [
    /^$|^\d+$/,
    "Salary must contain numbers only",
  ],
},

    businessWorkplaceAddress: {
      type: String,
      trim: true,
    },

    profilePhoto: {
      type: String,
    },


    // =========================
    // FAMILY DETAILS
    // =========================

    fathersOccupation: {
      type: String,
      trim: true,
    },

    mothersOccupation: {
      type: String,
      trim: true,
    },

    brotherName: {
      type: String,
      trim: true,
    },

    brotherMaritalStatus: {
      type: String,
    },

    sisterName: {
      type: String,
      trim: true,
    },

    sisterMaritalStatus: {
      type: String,
    },


    // =========================
    // ADDRESS DETAILS
    // =========================

    homeAddress: {
      type: String,
      trim: true,
    },

    villageLocality: {
      type: String,
      trim: true,
    },

    tehsil: {
      type: String,
      trim: true,
    },

    district: {
      type: String,
      trim: true,
    },
      city: {
      type: String,
       required: [true, "please enter city"],
      trim: true,
    },
    
    state: {
      type: String,
        required: [true, "please enter state"],
      trim: true,
    },

    maternalGrandfathersName: {
      type: String,
      trim: true,
    },

    maternalGrandmothersName: {
      type: String,
      trim: true,
    },

    maternalUnclesName: {
      type: String,
      trim: true,
    },

    maternalAddress: {
      type: String,
      trim: true,
    },

    maternalVillage: {
      type: String,
      trim: true,
    },

    maternalTehsil: {
      type: String,
      trim: true,
    },

    maternalDistrict: {
      type: String,
      trim: true,
    },


    // =========================
    // CONTACT DETAILS
    // =========================

contactNo: {
  type: String,
  required: [true, "Contact number is required"],
  trim: true,
  match: [
    /^[6-9]\d{9}$/,
    "Please enter a valid 10-digit mobile number",
  ],
},

   alternateContactNo: {
  type: String,
  trim: true,
  match: [
    /^$|^[6-9]\d{9}$/,
    "Please enter a valid 10-digit mobile number",
  ],
},
   emailId: {
  type: String,
  trim: true,
  lowercase: true,
  match: [
    /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    "Please enter a valid email address",
  ],
},

    ifInterested: {
      type: String,
      trim: true,
    },


    // =========================
    // AUTHENTICATION DETAILS
    // =========================

     username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "staff", "user"],
      default: "user",
    },

      // =========================
    // ONLINE PRESENCE
    // =========================

    onlineStatus: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    lastSeen: {
      type: Date,
      default: null,
    },


    // =========================
    // NOTIFICATION PREFERENCES
    // =========================

    notificationPreferences: {
      email: {
        type: Boolean,
        default: true,
      },
      whatsapp: {
        type: Boolean,
        default: true,
      },
      matches: {
        type: Boolean,
        default: true,
      },
      messages: {
        type: Boolean,
        default: true,
      },
      meetings: {
        type: Boolean,
        default: true,
      },
    },


    // =========================
    // PRIVACY SETTINGS
    // =========================

    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ["visible", "hidden"],
        default: "visible",
      },
      showContact: {
        type: Boolean,
        default: false,
      },
      showEmail: {
        type: Boolean,
        default: false,
      },
      allowMessages: {
        type: Boolean,
        default: true,
      },
    },


    // =========================
    // PASSWORD RESET (Forgot Password OTP)
    // =========================
    // Code hamesha hashed store hoga, kabhi plain text nahi.
    // select: false rakha hai — normal queries mein ye fields
    // kabhi accidentally response mein nahi jaayenge.

    passwordResetCode: {
      type: String,
      select: false,
      default: null,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;