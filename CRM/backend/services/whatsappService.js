// backend/services/whatsappService.js

// ========================================
// GENERATE WHATSAPP LINK
// ========================================
// Ye function sirf ek wa.me link banata hai — koi API call nahi hoti,
// koi message actually send nahi hota. Staff ko is link pe click karke
// WhatsApp Web/App khulega with message pre-filled, aur unhe manually
// "Send" dabana padega.

const generateWhatsAppLink = (user) => {
  if (!user.contactNo) {
    throw new Error("contactNo is missing, cannot generate WhatsApp link");
  }

  // contactNo already 10-digit validated hai schema mein (e.g. 9876543210)
  // Indian WhatsApp format ke liye "91" prefix chahiye
  const formattedNumber = `91${user.contactNo}`;

  const message = `Hello ${user.fullName},\n\nWelcome to MatriMatch CRM! Thank you for registering with us. Our team will reach out to you soon regarding suitable matches.\n\nRegards,\nMatriMatch CRM Team`;

  const encodedMessage = encodeURIComponent(message);

  const whatsappLink = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;

  return whatsappLink;
};

module.exports = {
  generateWhatsAppLink,
};