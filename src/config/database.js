const mongoose = require("mongoose"); 

const connectToDataBase = async () => {
    await mongoose.connect(process.env.CONNECTION);

};

module.exports = connectToDataBase; 