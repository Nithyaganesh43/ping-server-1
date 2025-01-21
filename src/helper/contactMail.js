const nodemailer = require('nodemailer');
 
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'contact.markethealers@gmail.com',
    pass: 'sctgoingtdojndda',
  },
});

 
async function sendMailToMh(email, name, message) {
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

        .header h1 {
            color: gold;
            margin: 0;
            font-size: 24px;
            font-weight: bold;
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
            padding: 20px;
            font-size: 14px;
        }

        .footer a {
            color: #4CAF50;
            text-decoration: none;
        }

        .social-icons {
            margin-top: 20px;
        }

        .social-icons a {
            margin: 0 10px;
            display: inline-block;
        }

        .social-icons img {
            width: 24px;
            height: 24px;
            transition: opacity 0.3s;
        }

        .social-icons img:hover {
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="email-container">
         <div class="header">
            <h1>Market Healers</h1>
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
            <p><strong>Market Healers | Empowering Financial Independence</strong></p>
            <p><a href="https://www.markethealers.com" target="_blank">Visit our Website</a></p>
            <div class="social-icons">
                <a href="https://www.linkedin.com/in/market-healers-66a343344/" target="_blank"
                    rel="noopener noreferrer">
                    <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn">
                </a>
                <a href="https://www.whatsapp.com/channel/0029Vb0CJG7KgsNkWnwFHL3s" target="_blank"
                    rel="noopener noreferrer">
                    <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" alt="WhatsApp">
                </a>
                <a href="https://www.instagram.com/market.healers/" target="_blank" rel="noopener noreferrer">
                    <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram">
                </a>
            </div>
        </div>
    </div>
</body>
</html>`;

  await transporter.sendMail({
    from: name,
    to: 'contact.markethealers@gmail.com',
    subject: 'New Notification From ' + name,
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
            margin: 20px auto;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .header {
            background-color: #181818;
            padding: 20px;
            text-align: center;
        }

        .header h1 {
            color: gold;
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        }

        .content {
            padding: 20px;
        }

        .content h1 {
            color: #4CAF50;
            font-size: 22px;
            margin-bottom: 20px;
        }

        .content p {
            margin: 10px 0;
            font-size: 16px;
            line-height: 1.5;
        }

        .content a {
            color: #4CAF50;
            text-decoration: none;
            font-weight: bold;
        }

        .footer {
            background-color: #181818;
            color: #fff;
            text-align: center;
            padding: 20px;
            font-size: 14px;
        }

        .footer a {
            color: #4CAF50;
            text-decoration: none;
        }

        .social-icons {
            margin-top: 20px;
        }

        .social-icons a {
            margin: 0 10px;
            display: inline-block;
        }

        .social-icons img {
            width: 24px;
            height: 24px;
            transition: opacity 0.3s;
        }

        .social-icons img:hover {
            opacity: 0.7;
        }
    </style>
</head>

<body>
    <div class="email-container">
        <div class="header">
            <h1>Market Healers</h1>
        </div>
        <div class="content">
            <h1>Thank You, ${name}!</h1>
            <p>We sincerely appreciate you getting in touch with <strong>Market Healers</strong>.</p>
            <p>Our team has successfully received your message and will respond promptly. Meanwhile, feel free to
                explore our website to learn more about our offerings.</p>
            <p><a href="https://www.markethealers.com" target="_blank">Visit MarketHealers.com</a></p>
            <p>If you have an urgent inquiry, don’t hesitate to reach us directly at
                <strong>markethealers@gmail.com</strong>.</p>
            <p>Thank you for choosing Market Healers. We look forward to assisting you on your journey toward financial
                independence.</p>
            <p>Best regards,</p>
            <p><strong>The Market Healers Team</strong></p>
        </div>
        <div class="footer">
            <p><strong>Market Healers | Empowering Financial Independence</strong></p>
            <p><a href="https://www.markethealers.com" target="_blank">Visit our Website</a></p>
            <div class="social-icons">
                <a href="https://www.linkedin.com/in/market-healers-66a343344/" target="_blank"
                    rel="noopener noreferrer">
                    <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn">
                </a>
                <a href="https://www.whatsapp.com/channel/0029Vb0CJG7KgsNkWnwFHL3s" target="_blank"
                    rel="noopener noreferrer">
                    <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" alt="WhatsApp">
                </a>
                <a href="https://www.instagram.com/market.healers/" target="_blank" rel="noopener noreferrer">
                    <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram">
                </a>
            </div>
        </div>
    </div>
</body>

</html>`;
  await transporter.sendMail({
    from: 'Market Healers',
    to: email,
    subject: 'Thank You For Contacting Us',
    html: htmlContent,
  });
}

module.exports = { sendMailToUser, sendMailToMh };
