import nodemailer from 'nodemailer';

// Initialize the transporter with your email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Using Gmail as the SMTP service
  auth: {
    user: process.env.EMAIL_USER,  // Your email address (e.g., 'your-email@gmail.com')
    pass: process.env.EMAIL_PASS,  // Your email password or app-specific password
  },
});

// Function to generate a 6-digit OTP
export const generateOtp = () => {
  const otpLength = 6;
  let otp = '';

  // Generate a 6-digit OTP
  for (let i = 0; i < otpLength; i++) {
    otp += Math.floor(Math.random() * 10);  // Generate a random digit (0-9)
  }

  return otp;
};

// Function to send OTP to user's email
export const sendOtp = async (email, otp) => {
  try {
    // Set up the email options
    const mailOptions = {
      from: process.env.EMAIL_USER,  // Sender email address
      to: email,                    // Recipient's email address
      subject: 'Your OTP Code',      // Email subject
      text: `Your OTP code is: ${otp}\nIt will expire in 10 minutes.`,  // Email body
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    console.log(`OTP sent to ${email}: ${info.response}`);
    return { success: true, message: 'OTP sent successfully.' };
  } catch (err) {
    console.error('Error sending OTP:', err);
    throw new Error('Failed to send OTP.');
  }
};