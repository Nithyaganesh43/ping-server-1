 
const blog = require('express').Router();
const Blog = require('../models/blog');
const { auth } = require('../middlewares/loginAuth');  


blog.get('/getAllBlogs', async (req, res) => {
  try {
    const blogs = await Blog.find({});
    res.json(blogs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


blog.use(auth);

blog.post('/addLikeBlog', async (req, res) => {
  try {
    const { blogId } = req.body; 
    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    const userId = req.user._id;

    if (blog.likes.includes(userId)) {
      blog.likes = blog.likes.filter((id) => !id.equals(userId));
      await blog.save();
      return res.json({ message: 'Like removed' });
    }

    blog.likes.push(userId);
    await blog.save();
    res.json({ message: 'Liked' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

blog.get('/getMyInfo', async (req, res) => {
  try {
    res.json({
      UserId: req.user._id,
      fullName: req.user.fullName,
      userName: req.user.userName,
      profileUrl: req.user.profileUrl,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

blog.post('/createBlog', async (req, res) => {
  try {
    const { title, coverImgUrl, description, content, processedContent } =
      req.body;
    if (!title || !description || !content)
      return res.status(400).json({ message: 'Missing fields' });
    const newBlog = new Blog({
      title,
      coverImgUrl,
      processedContent,
      description,
      content,
      author: [
        {
          UserId: req.user._id,
          fullName: req.user.fullName,
          userName: req.user.userName,
          profileUrl: req.user.profileUrl,
        },
      ],
      comments: [],
      likes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await newBlog.save(); 
    res.status(201).json({ message: 'Blog created' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

blog.post('/getOneFullBlog', async (req, res) => {
  try {
    const { blogId } = req.body; 
    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

blog.post('/addCommentBlog', async (req, res) => {
  try {
    const { blogId, message } = req.body; 
    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    blog.comments.push({
      user: [
        {
          UserId: req.user._id,
          fullName: req.user.fullName,
          userName: req.user.userName,
          profileUrl: req.user.profileUrl,
        },
      ],
      text: message,
      createdAt: new Date(),
    });
    await blog.save();
    res.json({
      user: [
        {
          UserId: req.user._id,
          fullName: req.user.fullName,
          userName: req.user.userName,
          profileUrl: req.user.profileUrl,
        },
      ],
      text: message,
      createdAt: new Date(),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

blog.post('/deleteCommentBlog', async (req, res) => {
  try {
    const { blogId, commentId } = req.body;
    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    blog.comments = blog.comments.filter(
      (c) => new Date(c.createdAt).getTime() !== new Date(commentId).getTime()
    );

    await blog.save();
    res.json({ message: 'Comment deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

blog.post('/updateBlog', async (req, res) => {
  try {
    const {
      blogId,
      title,
      coverImgUrl,
      description,
      content,
      processedContent,
    } = req.body; 
    const blog = await Blog.findOneAndUpdate(
      { _id: blogId },
      {
        title,
        coverImgUrl,
        description,
        content,
        updatedAt: new Date(),
        processedContent,
      },
      { new: true }
    );
    if (!blog)
      return res
        .status(403)
        .json({ message: 'Unauthorized or blog not found' });
    res.json({ message: 'Blog updated' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

blog.post('/deleteBlog', async (req, res) => {
  try {
    const { blogId } = req.body; 
    const blog = await Blog.findOneAndDelete({
      _id: blogId,
    });

    if (!blog)
      return res
        .status(403)
        .json({ message: 'Unauthorized or blog not found' });
    res.json({ message: 'Blog deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

blog.post('/getMyBlogs', async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user._id });
    res.json(blogs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = blog;
