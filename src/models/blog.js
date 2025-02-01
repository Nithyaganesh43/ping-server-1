const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String },
  coverImgUrl: { type: String },
  description: { type: String },
  author: [
    {
      UserId: String,
      fullName: String,
      userName: String,
      profileUrl: String,
    },
  ],
  content: { type: String },
  processedContent: { type: String },
  comments: [
    {
      user: [
        {
          UserId: String,
          fullName: String,
          userName: String,
          profileUrl: String,
        },
      ],
      text: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Blog', blogSchema);
