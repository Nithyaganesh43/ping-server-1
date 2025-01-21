const contact = require('express').Router();
const { sendMailToUser, sendMailToMh } = require('./helper/contactMail');
contact.get('/MarketHealers/contact', async (req, res) => {
  try {
    const { name, message, email } = req.body;
    if (!isEmail(email)) {
      throw new Error('Invalid email');
    } else if (message.length > 1500) {
      throw new Error('Message is too long');
    } else if (name.length > 50) {
      throw new Error('Name is too Long');
    }
 
    await sendMailToUser(email, name);
    await sendMailToMh(email,name, message);
    res.send('ok'); 
  } catch (e) {
    console.log(e.message);
    res.status(400).send(e.message);
  }
});
function isEmail(str) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
}
module.exports = contact;
