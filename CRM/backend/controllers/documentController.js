const Document = require("../models/Document");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");
const { logActivity } = require("../services/activityService");

// ========================================
// UPLOAD FILE TO CLOUDINARY (auto = image + pdf support)
// ========================================

const uploadDocumentToCloudinary = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "crm_documents",
        resource_type: "auto",
        public_id: `${Date.now()}-${originalName.split(".")[0]}`,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

// ========================================
// CREATE DOCUMENT
// ========================================

const createDocument = async (req, res) => {
  try {
    const { user, type, remarks } = req.body;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User is required",
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Document type is required",
      });
    }

    const existingUser = await User.findById(user);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    let uploadResult;

    try {
      uploadResult = await uploadDocumentToCloudinary(
        req.file.buffer,
        req.file.originalname
      );
    } catch (uploadError) {
      console.error("Cloudinary upload failed:", uploadError.message);

      return res.status(500).json({
        success: false,
        message: "Failed to upload file. Please try again.",
      });
    }

    let document;

    try {
      document = await Document.create({
        user,
        type,
        remarks: remarks || "",
        fileUrl: uploadResult.secure_url,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
      });
    } catch (dbError) {
      console.error(
        "Document DB save failed after Cloudinary upload succeeded:",
        dbError.message,
        "| Orphan file URL:",
        uploadResult.secure_url
      );

      return res.status(500).json({
        success: false,
        message: "Failed to save document record. Please try again.",
      });
    }
    

    logActivity({
      action: "UPLOADED",
      module: "DOCUMENT",
      targetType: "Document",
      targetId: document._id,
      description: `${document.type.replace(/_/g, " ")} document was uploaded`,
      user: document.user,
      metadata: { documentType: document.type },
    });

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: document,
    });
  } catch (error) {
    console.error("Create document error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to upload document",
      error: error.message,
    });
  }
};

// ========================================
// UPLOAD MY DOCUMENT (SELF-SCOPED, FOR MATRIMONIAL USER)
// ========================================
// Identity comes ONLY from req.user.userId (set by protect middleware
// after verifying JWT) - never from req.body. This prevents a logged-in
// user from uploading a document against someone else's profile.

const uploadMyDocument = async (req, res) => {
  try {
    const myUserId = req.user.userId;
    const { type, remarks } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Document type is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    let uploadResult;

    try {
      uploadResult = await uploadDocumentToCloudinary(
        req.file.buffer,
        req.file.originalname
      );
    } catch (uploadError) {
      console.error("Cloudinary upload failed:", uploadError.message);

      return res.status(500).json({
        success: false,
        message: "Failed to upload file. Please try again.",
      });
    }

    let document;

    try {
      document = await Document.create({
        user: myUserId,
        type,
        remarks: remarks || "",
        fileUrl: uploadResult.secure_url,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
      });
    } catch (dbError) {
      console.error(
        "Document DB save failed after Cloudinary upload succeeded:",
        dbError.message,
        "| Orphan file URL:",
        uploadResult.secure_url
      );

      return res.status(500).json({
        success: false,
        message: "Failed to save document record. Please try again.",
      });
    }

    logActivity({
      action: "UPLOADED",
      module: "DOCUMENT",
      targetType: "Document",
      targetId: document._id,
      description: `${document.type.replace(/_/g, " ")} document was uploaded`,
      user: document.user,
      metadata: { documentType: document.type },
    });

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: document,
    });
  } catch (error) {
    console.error("Upload my document error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to upload document",
      error: error.message,
    });
  }
};

// ========================================
// GET ALL DOCUMENTS (with filters)
// ========================================

const getAllDocuments = async (req, res) => {
  try {
    const { user, type, status } = req.query;

    const query = { archived: false };

    if (user) query.user = user;
    if (type) query.type = type;
    if (status) query.status = status;

    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .populate("user", "fullName contactNo city");

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    console.error("Get documents error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
      error: error.message,
    });
  }
};

// ========================================
// GET SINGLE DOCUMENT
// ========================================

const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).populate(
      "user",
      "fullName contactNo city"
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error("Get document error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch document",
      error: error.message,
    });
  }
};

// ========================================
// GET DOCUMENTS BY USER
// ========================================

const getDocumentsByUser = async (req, res) => {
  try {
    const documents = await Document.find({
      user: req.params.userId,
      archived: false,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    console.error("Get user documents error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user's documents",
      error: error.message,
    });
  }
};

// ========================================
// GET MY DOCUMENTS (SELF-SCOPED, FOR MATRIMONIAL USER)
// ========================================
// Identity comes ONLY from req.user.userId (set by protect middleware).

const getMyDocuments = async (req, res) => {
  try {
    const myUserId = req.user.userId;

    const documents = await Document.find({
      user: myUserId,
      archived: false,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    console.error("Get my documents error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch your documents",
      error: error.message,
    });
  }
};

// ========================================
// UPDATE DOCUMENT STATUS (Verify / Reject)
// ========================================

const updateDocumentStatus = async (req, res) => {
  try {
    const { status, rejectionReason, verifiedBy } = req.body;

    if (!["VERIFIED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either VERIFIED or REJECTED",
      });
    }

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    if (document.status === status) {
      return res.status(400).json({
        success: false,
        message: `Document is already marked as ${status}`,
      });
    }

    if (status === "REJECTED" && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required when rejecting a document",
      });
    }

    document.status = status;

    if (status === "VERIFIED") {
      document.verifiedAt = new Date();
      document.verifiedBy = verifiedBy || "";
      document.rejectionReason = "";
    }

    if (status === "REJECTED") {
      document.rejectionReason = rejectionReason;
      document.verifiedAt = null;
      document.verifiedBy = "";
    }

       await document.save();

    logActivity({
      action: status, // "VERIFIED" or "REJECTED"
      module: "DOCUMENT",
      targetType: "Document",
      targetId: document._id,
      description:
        status === "VERIFIED"
          ? `${document.type.replace(/_/g, " ")} document was verified`
          : `${document.type.replace(/_/g, " ")} document was rejected`,
      user: document.user,
      metadata: status === "REJECTED" ? { rejectionReason } : {},
    });

    res.status(200).json({
      success: true,
      message: `Document ${status.toLowerCase()} successfully`,
      data: document,
    });
  } catch (error) {
    console.error("Update document status error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update document status",
      error: error.message,
    });
  }
};

// ========================================
// ARCHIVE DOCUMENT (soft-delete)
// ========================================

const archiveDocument = async (req, res) => {
  try {
    const document = await Document.findByIdAndUpdate(
      req.params.id,
      { archived: true },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Document archived successfully",
      data: document,
    });
  } catch (error) {
    console.error("Archive document error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to archive document",
      error: error.message,
    });
  }
};

module.exports = {
  createDocument,
  uploadMyDocument,
  getAllDocuments,
  getDocumentById,
  getDocumentsByUser,
  getMyDocuments,
  updateDocumentStatus,
  archiveDocument,
};