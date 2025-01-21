const nodemailer = require('nodemailer');

 const transporter = nodemailer.createTransport({
   service: 'gmail',
   auth: {
     user: 'contact.markethealers@gmail.com',
     pass: 'sctgoingtdojndda',
   },
 });




async function sendMailToMh(email,name, message) {
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Notification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            background-color: #f4f4f4;
            color: #333;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }
        .header {
            background-color: #181818;
            padding: 20px;
            text-align: center;
        }
        .header img {
            width: 150px;
        }
        .content {
            padding: 20px;
        }
        h1 {
            color: #4CAF50;
            margin-bottom: 20px;
        }
        p {
            margin: 10px 0;
            font-size: 16px;
        }
        .footer {
            background-color: #181818;
            color: #fff;
            text-align: center;
            padding: 10px;
            font-size: 14px;
        }
        .footer a {
            color: #4CAF50;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <img src="https://res.cloudinary.com/dptf0mrro/image/upload/v1735920388/MH__1_1_pjlq6u.png" alt="Market Healers Logo">
        </div>
        <!-- Content -->
        <div class="content">
            <h1>New Notification</h1>
            <p>Dear Team,</p>
            <p>Our user <strong>${name}</strong> has sent a message through the contact form.</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p><em>"${message}"</em></p>
        </div>
        <!-- Footer -->
        <div class="footer">
            <p>Market Healers | Empowering Financial Independence</p>
            <p><a href="https://www.markethealers.com" target="_blank">Visit our Website</a></p>
        </div>
    </div>
</body>
</html>`;


   await transporter.sendMail({
     from: name,
     to: 'contact.markethealers@gmail.com',
     subject: 'New Notification From '+name,
     html: htmlContent,
   });
}

async function sendMailToUser(email, name) {
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You ${name}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            background-color: #f4f4f4;
            color: #333;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }
        .header {
            background-color: #181818;
            padding: 20px;
            text-align: center;
        }
        .header img {
            width: 150px;
        }
        .content {
            padding: 20px;
        }
        h1 {
            color: #4CAF50;
            margin-bottom: 20px;
        }
        p {
            margin: 10px 0;
            font-size: 16px;
        }
        .footer {
            background-color: #181818;
            color: #fff;
            text-align: center;
            padding: 10px;
            font-size: 14px;
        }
        .footer a {
            color: #4CAF50;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <img src="https://res.cloudinary.com/dptf0mrro/image/upload/v1735920388/MH__1_1_pjlq6u.png" alt="Market Healers Logo">
        </div>
        <!-- Content -->
        <div class="content">
            <h1>Thank You, ${name}!</h1>
            <p>We appreciate you reaching out to us at <strong>Market Healers</strong>.</p>
            <p>Our team has received your message and will get back to you shortly. In the meantime, feel free to explore more about us and our services on our website.</p>
            <p><a href="https://www.markethealers.com" target="_blank" style="color: #4CAF50; text-decoration: none;">Visit MarketHealers.com</a></p>
            <p>If you have urgent queries, please contact us directly at <strong>support@markethealers.com</strong>.</p>
            <p>Best regards,</p>
            <p>The Market Healers Team</p>
        </div>
        <!-- Footer -->
        <div class="footer">
            <p>Market Healers | Empowering Financial Independence</p>
            <p><a href="https://www.markethealers.com" target="_blank">Visit our Website</a></p>
        </div>
    </div>
</body>
</html>`;

   await transporter.sendMail({
     from: 'Market Healers',
     to: email,
     subject: "Thank You For Contacting Us",
     html: htmlContent,
   });
}

module.exports = { sendMailToUser, sendMailToMh };
 













 