const Biodata = require("../models/Biodata");
const cloudinary = require("../config/cloudinary");
const { generateBiodataPdf } = require("../services/biodataPdfService");
const { logActivity } = require("../services/activityService");


// ========================================
// CREATE BIODATA
// ========================================

const createBiodata = async (req, res) => {
  try {
    const {
      user,
      template,
      displayFields,
      customNote,
      createdBy,
    } = req.body;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User is required",
      });
    }

    const existingBiodata =
      await Biodata.findOne({ user });

    if (existingBiodata) {
      return res.status(400).json({
        success: false,
        message: "Biodata already exists for this user",
      });
    }

    const biodata = await Biodata.create({
      user,
      template,
      displayFields,
      customNote,
      createdBy,
      status: "DRAFT",
    });

        logActivity({
      action: "CREATED",
      module: "BIODATA",
      targetType: "Biodata",
      targetId: biodata._id,
      description: "A new biodata draft was created",
      user: biodata.user,
    });

    const populatedBiodata =
      await Biodata.findById(biodata._id)
        .populate(
          "user",
          "fullName gender dateOfBirth profilePhoto city state district height education jobProfessionBusiness fatherName motherName maritalStatus bloodGroup"
        )
        .populate(
          "createdBy",
          "fullName"
        );

    res.status(201).json({
      success: true,
      message: "Biodata created successfully",
      data: populatedBiodata,
    });
  } catch (error) {
    console.error(
      "Create biodata error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to create biodata",
      error: error.message,
    });
  }
};


// ========================================
// GET ALL BIODATAS
// ========================================

const getBiodatas = async (req, res) => {
  try {
    const biodatas =
      await Biodata.find()
        .populate(
          "user",
          "fullName gender dateOfBirth profilePhoto city state district height education jobProfessionBusiness fatherName motherName maritalStatus bloodGroup"
        )
        .populate(
          "createdBy",
          "fullName"
        )
        .sort({
          createdAt: -1,
        });

    res.status(200).json({
      success: true,
      count: biodatas.length,
      data: biodatas,
    });
  } catch (error) {
    console.error(
      "Get biodatas error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch biodatas",
      error: error.message,
    });
  }
};


// ========================================
// GET BIODATA BY ID
// ========================================

const getBiodataById = async (req, res) => {
  try {
    const biodata =
      await Biodata.findById(
        req.params.id
      )
        .populate(
          "user",
          "fullName gender dateOfBirth profilePhoto city state district height education jobProfessionBusiness fatherName motherName maritalStatus bloodGroup"
        )
        .populate(
          "createdBy",
          "fullName"
        )
        .populate(
          "sharedWith",
          "fullName"
        );

    if (!biodata) {
      return res.status(404).json({
        success: false,
        message: "Biodata not found",
      });
    }

    res.status(200).json({
      success: true,
      data: biodata,
    });
  } catch (error) {
    console.error(
      "Get biodata error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch biodata",
      error: error.message,
    });
  }
};


// ========================================
// GET BIODATA BY USER
// ========================================

const getBiodataByUser = async (req, res) => {
  try {
    const biodata =
      await Biodata.findOne({
        user: req.params.userId,
      })
        .populate(
          "user",
          "fullName gender dateOfBirth profilePhoto city state district height education jobProfessionBusiness fatherName motherName maritalStatus bloodGroup"
        )
        .populate(
          "createdBy",
          "fullName"
        )
        .populate(
          "sharedWith",
          "fullName"
        );

    if (!biodata) {
      return res.status(404).json({
        success: false,
        message: "Biodata not found for this user",
      });
    }

    res.status(200).json({
      success: true,
      data: biodata,
    });
  } catch (error) {
    console.error(
      "Get user biodata error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch user biodata",
      error: error.message,
    });
  }
};


// ========================================
// UPDATE BIODATA
// ========================================

const updateBiodata = async (req, res) => {
  try {
    const {
      template,
      displayFields,
      customNote,
    } = req.body;

    const biodata =
      await Biodata.findById(
        req.params.id
      );

    if (!biodata) {
      return res.status(404).json({
        success: false,
        message: "Biodata not found",
      });
    }

    if (template !== undefined) {
      biodata.template = template;
    }

    if (displayFields !== undefined) {
      biodata.displayFields = displayFields;
    }

    if (customNote !== undefined) {
      biodata.customNote = customNote;
    }

    await biodata.save();

    const updatedBiodata =
      await Biodata.findById(
        biodata._id
      )
        .populate(
          "user",
          "fullName gender dateOfBirth profilePhoto city state district height education jobProfessionBusiness fatherName motherName maritalStatus bloodGroup"
        )
        .populate(
          "createdBy",
          "fullName"
        );

    res.status(200).json({
      success: true,
      message: "Biodata updated successfully",
      data: updatedBiodata,
    });
  } catch (error) {
    console.error(
      "Update biodata error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to update biodata",
      error: error.message,
    });
  }
};


// ========================================
// GENERATE BIODATA
// ========================================

const generateBiodata = async (req, res) => {
  try {
    const biodata = await Biodata.findById(
      req.params.id
    ).populate(
      "user",
      `
        fullName
        gender
        dateOfBirth
        birthPlace
        gotra
        fatherName
        motherName
        fathersFatherName
        mothersMotherName
        height
        complexion
        maritalStatus
        education
        bloodGroup
        jobProfessionBusiness
        salary
        businessWorkplaceAddress
        profilePhoto
        fathersOccupation
        mothersOccupation
        brotherName
        brotherMaritalStatus
        sisterName
        sisterMaritalStatus
        homeAddress
        villageLocality
        tehsil
        district
        city
        state
        maternalGrandfathersName
        maternalGrandmothersName
        maternalUnclesName
        maternalAddress
        maternalVillage
        maternalTehsil
        maternalDistrict
        contactNo
        alternateContactNo
        emailId
        ifInterested
      `
    ).populate(
      "createdBy",
      "fullName"
    );

    if (!biodata) {
      return res.status(404).json({
        success: false,
        message: "Biodata not found",
      });
    }


    // ========================================
    // GENERATE PDF
    // ========================================

    const pdfBuffer =
      await generateBiodataPdf(
        biodata
      );


    // ========================================
    // UPLOAD PDF TO CLOUDINARY
    // ========================================

    const uploadResult =
      await new Promise(
        (resolve, reject) => {

          const uploadStream =
            cloudinary.uploader.upload_stream(
              {
                resource_type: "raw",
                folder: "biodatas",
                public_id:
                  `biodata_${biodata._id}`,
                format: "pdf",
              },

              (error, result) => {

                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }

              }
            );

          uploadStream.end(
            pdfBuffer
          );

        }
      );


    // ========================================
    // UPDATE BIODATA
    // ========================================

    biodata.status = "GENERATED";

    biodata.generatedAt =
      new Date();

    biodata.pdfUrl =
      uploadResult.secure_url;

    biodata.pdfPublicId =
      uploadResult.public_id;

    await biodata.save();

        logActivity({
      action: "UPLOADED",
      module: "BIODATA",
      targetType: "Biodata",
      targetId: biodata._id,
      description: "Biodata PDF was generated",
      user: biodata.user,
    });

    // ========================================
    // RESPONSE
    // ========================================

    const generatedBiodata =
      await Biodata.findById(
        biodata._id
      )
        .populate(
          "user",
          `
            fullName
            gender
            dateOfBirth
            birthPlace
            gotra
            fatherName
            motherName
            fathersFatherName
            mothersMotherName
            height
            complexion
            maritalStatus
            education
            bloodGroup
            jobProfessionBusiness
            salary
            businessWorkplaceAddress
            profilePhoto
            fathersOccupation
            mothersOccupation
            brotherName
            brotherMaritalStatus
            sisterName
            sisterMaritalStatus
            homeAddress
            villageLocality
            tehsil
            district
            city
            state
            maternalGrandfathersName
            maternalGrandmothersName
            maternalUnclesName
            maternalAddress
            maternalVillage
            maternalTehsil
            maternalDistrict
            contactNo
            alternateContactNo
            emailId
            ifInterested
          `
        )
        .populate(
          "createdBy",
          "fullName"
        );


    res.status(200).json({
      success: true,
      message:
        "Biodata PDF generated successfully",
      data: generatedBiodata,
    });

  } catch (error) {

    console.error(
      "Generate biodata error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to generate biodata",
      error: error.message,
    });

  }
};


// ========================================
// DOWNLOAD BIODATA PDF
// (proxies the Cloudinary file through our own
// server with a forced attachment header, so the
// browser always triggers a real download instead
// of opening the PDF inline / a blank cross-origin tab)
// ========================================

const downloadBiodataPdf = async (req, res) => {
  try {

    const biodata =
      await Biodata.findById(
        req.params.id
      ).populate(
        "user",
        "fullName"
      );

    if (!biodata) {
      return res.status(404).json({
        success: false,
        message: "Biodata not found",
      });
    }

    if (!biodata.pdfUrl || !biodata.pdfPublicId) {
      return res.status(400).json({
        success: false,
        message:
          "PDF has not been generated for this biodata yet",
      });
    }

    // Cloudinary blocks public delivery of raw PDF/ZIP files by
    // default on many accounts. A signed URL bypasses that
    // restriction regardless of the account's delivery setting,
    // and expires shortly after (here: 60 seconds) since it's
    // only used server-side, immediately, to fetch the bytes.
    const signedUrl =
      cloudinary.utils.private_download_url(
        biodata.pdfPublicId,
        "pdf",
        {
          resource_type: "raw",
          type: "upload",
          expires_at:
            Math.floor(Date.now() / 1000) + 60,
        }
      );

    const cloudinaryResponse =
      await fetch(signedUrl);

    if (!cloudinaryResponse.ok) {
      console.error(
        "Cloudinary fetch failed:",
        cloudinaryResponse.status,
        cloudinaryResponse.statusText
      );

      return res.status(502).json({
        success: false,
        message:
          "Failed to retrieve the PDF file from storage",
      });
    }

    const arrayBuffer =
      await cloudinaryResponse.arrayBuffer();

    const buffer =
      Buffer.from(arrayBuffer);

    const safeName =
      (biodata.user?.fullName || "biodata")
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .trim()
        .replace(/\s+/g, "_");

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeName || "biodata"}.pdf"`
    );

    res.setHeader(
      "Content-Length",
      buffer.length
    );

    return res.send(buffer);

  } catch (error) {

    console.error(
      "Download biodata pdf error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to download biodata PDF",
      error: error.message,
    });

  }
};


// ========================================
// SHARE BIODATA
// ========================================

const shareBiodata = async (req, res) => {
  try {
    const {
      sharedWith,
    } = req.body;

    const biodata =
      await Biodata.findById(
        req.params.id
      );

    if (!biodata) {
      return res.status(404).json({
        success: false,
        message: "Biodata not found",
      });
    }

    if (
      !Array.isArray(sharedWith) ||
      sharedWith.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one recipient is required",
      });
    }

    biodata.status = "SHARED";
    biodata.sharedAt = new Date();

    sharedWith.forEach((userId) => {
      if (
        !biodata.sharedWith.some(
          (existingId) =>
            existingId.toString() ===
            userId.toString()
        )
      ) {
        biodata.sharedWith.push(
          userId
        );
      }
    });

    await biodata.save();

        logActivity({
      action: "STATUS_CHANGED",
      module: "BIODATA",
      targetType: "Biodata",
      targetId: biodata._id,
      description: "Biodata was shared with other profiles",
      user: biodata.user,
      metadata: { newStatus: "SHARED", sharedCount: sharedWith.length },
    });

    const sharedBiodata =
      await Biodata.findById(
        biodata._id
      )
        .populate(
          "user",
          "fullName gender dateOfBirth profilePhoto city state district height education jobProfessionBusiness fatherName motherName maritalStatus bloodGroup"
        )
        .populate(
          "sharedWith",
          "fullName"
        )
        .populate(
          "createdBy",
          "fullName"
        );

    res.status(200).json({
      success: true,
      message: "Biodata shared successfully",
      data: sharedBiodata,
    });
  } catch (error) {
    console.error(
      "Share biodata error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to share biodata",
      error: error.message,
    });
  }
};


// ========================================
// DELETE BIODATA
// ========================================

const archiveBiodata = async (req, res) => {
  try {
    const biodata =
      await Biodata.findById(
        req.params.id
      );

    if (!biodata) {
      return res.status(404).json({
        success: false,
        message: "Biodata not found",
      });
    }

    biodata.status = "DRAFT";

    await biodata.save();

        logActivity({
      action: "ARCHIVED",
      module: "BIODATA",
      targetType: "Biodata",
      targetId: biodata._id,
      description: "Biodata was reset to draft",
      user: biodata.user,
    });

    res.status(200).json({
      success: true,
      message: "Biodata archived successfully",
      data: biodata,
    });
  } catch (error) {
    console.error(
      "Archive biodata error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to archive biodata",
      error: error.message,
    });
  }
};


module.exports = {
  createBiodata,
  getBiodatas,
  getBiodataById,
  getBiodataByUser,
  updateBiodata,
  generateBiodata,
  downloadBiodataPdf,
  shareBiodata,
  archiveBiodata,
};