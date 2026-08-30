const puppeteer = require("puppeteer");


// ========================================
// SHARED DATA PREP
// Builds a template-agnostic content model
// (sections + rows) once, so all three
// renderers stay in sync with displayFields
// and never drift from each other in content.
// ========================================

const buildBiodataSections = (biodata) => {

  const user = biodata.user || {};
  const displayFields = biodata.displayFields || {};

  const sections = [];

  // ---- Personal Details ----

  if (displayFields.personalDetails) {

    const rows = [
      ["Gender", user.gender],
      [
        "Date of Birth",
        user.dateOfBirth
          ? new Date(user.dateOfBirth).toLocaleDateString()
          : null,
      ],
      ["Birth Place", user.birthPlace],
      ["Gotra", user.gotra],
      ["Height", user.height],
      ["Complexion", user.complexion],
      ["Marital Status", user.maritalStatus],
      ["Blood Group", user.bloodGroup],
    ].filter(([, value]) => Boolean(value));

    if (rows.length > 0) {
      sections.push({ title: "Personal Details", rows });
    }

  }

  // ---- Education ----

  if (displayFields.education && user.education) {
    sections.push({
      title: "Education",
      rows: [["Education", user.education]],
    });
  }

  // ---- Profession ----

  if (displayFields.profession && user.jobProfessionBusiness) {

    const rows = [
      ["Profession", user.jobProfessionBusiness],
      ["Salary", user.salary],
    ].filter(([, value]) => Boolean(value));

    sections.push({ title: "Profession", rows });

  }

  // ---- Family Details ----

  if (displayFields.familyDetails) {

    const rows = [
      ["Father", user.fatherName],
      ["Mother", user.motherName],
      ["Father's Occupation", user.fathersOccupation],
      ["Mother's Occupation", user.mothersOccupation],
      ["Brother", user.brotherName],
      ["Sister", user.sisterName],
    ].filter(([, value]) => Boolean(value));

    if (rows.length > 0) {
      sections.push({ title: "Family Details", rows });
    }

  }

  // ---- Address ----

  if (displayFields.address) {

    const rows = [
      ["Address", user.homeAddress],
      ["City", user.city],
      ["State", user.state],
    ].filter(([, value]) => Boolean(value));

    if (rows.length > 0) {
      sections.push({ title: "Address", rows });
    }

  }

  // ---- Contact Details ----

  if (displayFields.contactDetails) {

    const rows = [
      ["Contact", user.contactNo],
      ["Email", user.emailId],
    ].filter(([, value]) => Boolean(value));

    if (rows.length > 0) {
      sections.push({ title: "Contact Details", rows });
    }

  }

  return {
    fullName: user.fullName || "Biodata",
    sections,
    customNote: biodata.customNote || "",
  };

};


// ========================================
// ESCAPE HELPER
// (basic guard against markup in user-entered data)
// ========================================

const escapeHtml = (value) => {

  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

};


// ========================================
// TEMPLATE: CLASSIC
// Traditional, formal, bordered layout.
// ========================================

const renderClassicHtml = (data) => {

  const sectionsHtml = data.sections.map((section) => `
    <div class="section">
      <div class="section-title">${escapeHtml(section.title)}</div>
      ${section.rows.map(([label, value]) => `
        <div class="row">
          <div class="label">${escapeHtml(label)}</div>
          <div class="value">${escapeHtml(value)}</div>
        </div>
      `).join("")}
    </div>
  `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Biodata - ${escapeHtml(data.fullName)}</title>
      <style>
        * { box-sizing: border-box; }

        body {
          margin: 0;
          padding: 40px;
          font-family: Georgia, "Times New Roman", serif;
          background: #ffffff;
          color: #1e293b;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #cbd5e1;
          padding: 30px;
        }

        .header {
          text-align: center;
          border-bottom: 3px double #334155;
          padding-bottom: 18px;
          margin-bottom: 25px;
        }

        .name {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 6px;
          letter-spacing: 0.5px;
        }

        .subtitle {
          font-size: 13px;
          color: #64748b;
          font-style: italic;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .section { margin-top: 22px; }

        .section-title {
          font-size: 15px;
          font-weight: bold;
          background: #f1f5f9;
          padding: 8px 12px;
          margin-bottom: 8px;
          border-left: 4px solid #4f46e5;
          font-family: Arial, sans-serif;
        }

        .row {
          display: flex;
          padding: 6px 4px;
          border-bottom: 1px solid #f1f5f9;
          font-family: Arial, sans-serif;
        }

        .label { width: 35%; font-weight: bold; color: #475569; font-size: 13px; }
        .value { width: 65%; color: #1e293b; font-size: 13px; }

        .note {
          margin-top: 22px;
          padding: 14px;
          background: #f8fafc;
          font-size: 13px;
          line-height: 1.6;
          font-family: Arial, sans-serif;
          border-left: 3px solid #cbd5e1;
        }

        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #94a3b8;
          font-family: Arial, sans-serif;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="name">${escapeHtml(data.fullName)}</div>
          <div class="subtitle">Matrimonial Biodata</div>
        </div>
        ${sectionsHtml}
        ${data.customNote ? `<div class="note">${escapeHtml(data.customNote)}</div>` : ""}
        <div class="footer">Generated via MyCRM</div>
      </div>
    </body>
    </html>
  `;

};


// ========================================
// TEMPLATE: MODERN
// Clean, minimal, whitespace-driven, card grid.
// ========================================

const renderModernHtml = (data) => {

  const sectionsHtml = data.sections.map((section) => `
    <div class="section">
      <div class="section-title">${escapeHtml(section.title)}</div>
      <div class="grid">
        ${section.rows.map(([label, value]) => `
          <div class="card">
            <div class="label">${escapeHtml(label)}</div>
            <div class="value">${escapeHtml(value)}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Biodata - ${escapeHtml(data.fullName)}</title>
      <style>
        * { box-sizing: border-box; }

        body {
          margin: 0;
          padding: 48px;
          font-family: "Helvetica Neue", Arial, sans-serif;
          background: #ffffff;
          color: #0f172a;
        }

        .container { max-width: 800px; margin: 0 auto; }

        .header { margin-bottom: 36px; }

        .name {
          font-size: 30px;
          font-weight: 700;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }

        .subtitle {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: 600;
        }

        .divider {
          height: 2px;
          width: 48px;
          background: #4f46e5;
          margin-top: 14px;
        }

        .section { margin-top: 28px; }

        .section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #4f46e5;
          margin-bottom: 12px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .card {
          background: #f8fafc;
          border-radius: 8px;
          padding: 10px 14px;
        }

        .label {
          font-size: 10px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 3px;
        }

        .value { font-size: 13px; color: #0f172a; font-weight: 500; }

        .note {
          margin-top: 28px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 10px;
          font-size: 13px;
          line-height: 1.7;
          color: #334155;
        }

        .footer {
          margin-top: 36px;
          font-size: 10px;
          color: #cbd5e1;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="name">${escapeHtml(data.fullName)}</div>
          <div class="subtitle">Matrimonial Biodata</div>
          <div class="divider"></div>
        </div>
        ${sectionsHtml}
        ${data.customNote ? `<div class="note">${escapeHtml(data.customNote)}</div>` : ""}
        <div class="footer">Generated via MyCRM</div>
      </div>
    </body>
    </html>
  `;

};


// ========================================
// TEMPLATE: PREMIUM
// Rich header band, gold accent, elegant type.
// ========================================

const renderPremiumHtml = (data) => {

  const sectionsHtml = data.sections.map((section, index) => `
    <div class="section ${index % 2 === 1 ? "alt" : ""}">
      <div class="section-title">
        <span class="dot"></span>
        ${escapeHtml(section.title)}
      </div>
      ${section.rows.map(([label, value]) => `
        <div class="row">
          <div class="label">${escapeHtml(label)}</div>
          <div class="value">${escapeHtml(value)}</div>
        </div>
      `).join("")}
    </div>
  `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Biodata - ${escapeHtml(data.fullName)}</title>
      <style>
        * { box-sizing: border-box; }

        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          background: #ffffff;
          color: #1e293b;
        }

        .container { max-width: 800px; margin: 0 auto; }

        .header {
          background: #1e293b;
          padding: 44px 40px 32px;
          text-align: center;
          position: relative;
        }

        .gold-line {
          height: 3px;
          width: 70px;
          background: #d4af37;
          margin: 0 auto 18px;
        }

        .name {
          font-family: Georgia, serif;
          font-size: 30px;
          font-weight: bold;
          color: #ffffff;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .subtitle {
          font-size: 12px;
          color: #d4af37;
          text-transform: uppercase;
          letter-spacing: 3px;
        }

        .body { padding: 32px 40px 40px; }

        .section { padding: 16px 18px; border-radius: 10px; margin-bottom: 12px; }
        .section.alt { background: #faf8f2; }

        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #d4af37;
          display: inline-block;
        }

        .row {
          display: flex;
          padding: 6px 0;
          border-bottom: 1px solid #f1e9d2;
        }

        .row:last-child { border-bottom: none; }

        .label { width: 35%; font-weight: bold; color: #92722a; font-size: 12.5px; }
        .value { width: 65%; color: #1e293b; font-size: 12.5px; }

        .note {
          margin-top: 18px;
          padding: 16px 18px;
          background: #1e293b;
          color: #f1f5f9;
          border-radius: 10px;
          font-size: 13px;
          line-height: 1.7;
        }

        .footer {
          margin-top: 28px;
          text-align: center;
          font-size: 10px;
          color: #cbd5e1;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="gold-line"></div>
          <div class="name">${escapeHtml(data.fullName)}</div>
          <div class="subtitle">Matrimonial Biodata</div>
        </div>
        <div class="body">
          ${sectionsHtml}
          ${data.customNote ? `<div class="note">${escapeHtml(data.customNote)}</div>` : ""}
          <div class="footer">Generated via MyCRM</div>
        </div>
      </div>
    </body>
    </html>
  `;

};


// ========================================
// GENERATE BIODATA PDF
// Picks the renderer based on biodata.template
// ========================================

const generateBiodataPdf = async (biodata) => {

  let browser;

  try {

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });

    const page = await browser.newPage();

    const data = buildBiodataSections(biodata);

    const template =
      (biodata.template || "CLASSIC").toUpperCase();

    let html;

    switch (template) {

      case "MODERN":
        html = renderModernHtml(data);
        break;

      case "PREMIUM":
        html = renderPremiumHtml(data);
        break;

      case "CLASSIC":
      default:
        html = renderClassicHtml(data);
        break;

    }

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });

    return pdfBuffer;

  } catch (error) {

    console.error("PDF generation error:", error);

    throw new Error("Failed to generate biodata PDF");

  } finally {

    if (browser) {
      await browser.close();
    }

  }

};


module.exports = {
  generateBiodataPdf,
};
