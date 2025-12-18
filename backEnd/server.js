
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// PostgreSQL Connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'clearcity',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error(' Error connecting to database:', err.stack);
  } else {
    console.log(' Database connected successfully');
    release();
  }
});

// File Upload Configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = file.fieldname === 'profileImage' ? 'uploads/profiles' : 'uploads/reports';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token.' });
    }
    req.user = user;
    next();
  });
};

// Admin Middleware
const isAdmin = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};


// AI Classification Function 
const classifyImage = async (imagePath) => {
  const ROBOFLOW_API_KEY = "GP7hlirAXz5tp5fL7h3k";
  const ROBOFLOW_MODEL_URL = "https://serverless.roboflow.com/trash-detection-ujrn0/1";

  // Confidence and overlap thresholds (50%)
  const CONFIDENCE_THRESHOLD = 0.50;
  const OVERLAP_THRESHOLD = 0.50;

  try {
    // Read the image file as base64
    const image = await fs.readFile(imagePath, { encoding: "base64" });

    // Call Roboflow Inference API with thresholds
    const response = await axios({
      method: "POST",
      url: ROBOFLOW_MODEL_URL,
      params: {
        api_key: ROBOFLOW_API_KEY,
        confidence: CONFIDENCE_THRESHOLD,
        overlap: OVERLAP_THRESHOLD
      },
      data: image,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    const predictions = response.data.predictions;

    // Log predictions in the exact format requested
    console.log("\n========== TRASH DETECTION RESULTS ==========");
    console.log(`Confidence Threshold: ${CONFIDENCE_THRESHOLD * 100}%`);
    console.log(`Overlap Threshold: ${OVERLAP_THRESHOLD * 100}%`);
    console.log("\n" + JSON.stringify({ predictions: predictions }, null, 2));
    console.log("==============================================\n");

    if (!predictions || predictions.length === 0) {
      console.log("No trash detected in this image.");
      return {
        isWaste: false,
        wasteType: 'Unknown',
        confidence: 0,
        timestamp: new Date().toISOString()
      };
    }

    // Get the highest confidence prediction
    const bestPrediction = predictions.sort((a, b) => b.confidence - a.confidence)[0];

    // Check if confidence meets the 50% threshold
    const isReliable = bestPrediction.confidence >= CONFIDENCE_THRESHOLD;

    return {
      isWaste: isReliable,
      wasteType: bestPrediction.class,
      confidence: bestPrediction.confidence,
      allPredictions: predictions, // Include all predictions for reference
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("AI Classification Error:", error.response ? error.response.data : error.message);
    return {
      isWaste: false,
      wasteType: 'Error',
      confidence: 0,
      timestamp: new Date().toISOString()
    };
  }
};

// AUTH ROUTES

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, location, latitude, longitude } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, password, location, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, level, xp, profile_image, location',
      [name, email, hashedPassword, location || null, latitude || null, longitude || null]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// REPORTS ROUTES

// Get all reports (cu filtare)
app.get('/api/reports', async (req, res) => {
  try {
    const { status, userId, type } = req.query;
    let query = `
      SELECT r.*, u.name as user_name, u.profile_image as user_image
      FROM reports r 
      LEFT JOIN users u ON r.user_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`r.status = $${params.length + 1}`);
      params.push(status);
    }

    if (userId) {
      conditions.push(`r.user_id = $${params.length + 1}`);
      params.push(userId);
    }

    if (type) {
      conditions.push(`r.type = $${params.length + 1}`);
      params.push(type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY r.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Error fetching reports' });
  }
});

// Create report with AI classification
app.post('/api/reports', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { latitude, longitude, description, location_name } = req.body;
    const userId = req.user.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location is required' });
    }

    let imageUrl = null;
    let aiClassification = null;

    if (req.file) {
      imageUrl = `/uploads/reports/${req.file.filename}`;
      aiClassification = await classifyImage(req.file.path);

      if (!aiClassification.isWaste) {
        await fs.unlink(req.file.path);
        return res.status(400).json({
          error: 'Image does not appear to contain waste',
          classification: aiClassification
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO reports (user_id, latitude, longitude, location_name, type, description, image_url, ai_classification, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        userId,
        latitude,
        longitude,
        location_name || null,
        aiClassification?.wasteType || 'Unclassified',
        description,
        imageUrl,
        JSON.stringify(aiClassification),
        'pending'
      ]
    );

    // Update user XP and check for achievements
    await pool.query('UPDATE users SET xp = xp + 10 WHERE id = $1', [userId]);

    // Check if first report (achievement)
    const reportCount = await pool.query('SELECT COUNT(*) FROM reports WHERE user_id = $1', [userId]);
    if (parseInt(reportCount.rows[0].count) === 1) {
      await pool.query(
        'INSERT INTO user_achievements (user_id, achievement_id, achievement_title, achievement_description) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [userId, 1, 'Primul Pas', 'Trimite prima ta sesizare']
      );
    }

    res.status(201).json({
      report: result.rows[0],
      classification: aiClassification
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Error creating report' });
  }
});

// Get single report
app.get('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT r.*, u.name as user_name, u.profile_image as user_image
       FROM reports r 
       LEFT JOIN users u ON r.user_id = u.id 
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Error fetching report' });
  }
});

// Update report status
app.patch('/api/reports/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    let query = 'UPDATE reports SET status = $1, updated_at = CURRENT_TIMESTAMP';
    const params = [status, id];

    if (status === 'resolved') {
      query += ', resolved_at = CURRENT_TIMESTAMP, resolved_by = $3';
      params.push(req.user.id);
    }

    query += ' WHERE id = $2 RETURNING *';

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Error updating report' });
  }
});

// Delete report
app.delete('/api/reports/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const report = await pool.query('SELECT * FROM reports WHERE id = $1', [id]);

    if (report.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check ownership or admin
    const user = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (report.rows[0].user_id !== userId && user.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this report' });
    }

    if (report.rows[0].image_url) {
      const imagePath = path.join(__dirname, report.rows[0].image_url);
      try {
        await fs.unlink(imagePath);
      } catch (err) {
        console.error('Error deleting image file:', err);
      }
    }

    await pool.query('DELETE FROM reports WHERE id = $1', [id]);

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Error deleting report' });
  }
});

// USER ROUTES
// Get user profile
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.level, u.xp, u.profile_image, u.location, u.latitude, u.longitude, u.created_at,
       (SELECT COUNT(*) FROM reports WHERE user_id = u.id) as total_reports,
       (SELECT COUNT(*) FROM reports WHERE user_id = u.id AND status = 'resolved') as resolved_reports,
       (SELECT COUNT(*) FROM reports WHERE user_id = u.id AND status = 'pending') as pending_reports
       FROM users u WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const achievements = await pool.query(
      'SELECT achievement_id, achievement_title, achievement_description, unlocked_at FROM user_achievements WHERE user_id = $1 ORDER BY unlocked_at DESC',
      [req.user.id]
    );

    res.json({
      ...result.rows[0],
      achievements: achievements.rows
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

// Update profile
app.patch('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { name, location, latitude, longitude } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (location) {
      updates.push(`location = $${paramCount++}`);
      values.push(location);
    }
    if (latitude) {
      updates.push(`latitude = $${paramCount++}`);
      values.push(latitude);
    }
    if (longitude) {
      updates.push(`longitude = $${paramCount++}`);
      values.push(longitude);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.user.id);
    const query = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING id, name, email, role, level, xp, profile_image, location, latitude, longitude`;

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Upload profile image
app.post('/api/users/profile/image', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    // Delete old image if exists
    const oldImage = await pool.query('SELECT profile_image FROM users WHERE id = $1', [req.user.id]);
    if (oldImage.rows[0].profile_image && oldImage.rows[0].profile_image.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, oldImage.rows[0].profile_image);
      try {
        await fs.unlink(oldPath);
      } catch (err) {
        console.error('Error deleting old image:', err);
      }
    }

    const result = await pool.query(
      'UPDATE users SET profile_image = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, profile_image',
      [imageUrl, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ error: 'Error uploading profile image' });
  }
});

// Get leaderboard
app.get('/api/users/leaderboard', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leaderboard');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Error fetching leaderboard' });
  }
});

// ADMIN ROUTES

// Get statistics (Admin only)
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Total users
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['user']);

    // Total reports
    const totalReports = await pool.query('SELECT COUNT(*) FROM reports');

    // Reports by status
    const reportsByStatus = await pool.query(
      'SELECT status, COUNT(*) as count FROM reports GROUP BY status'
    );

    // Reports by type
    const reportsByType = await pool.query(
      'SELECT type, COUNT(*) as count FROM reports GROUP BY type ORDER BY count DESC'
    );

    // Recent activity (last 7 days)
    const recentActivity = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM reports 
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY DATE(created_at)
       ORDER BY date`
    );

    // Average resolution time
    const avgResolutionTime = await pool.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_hours
       FROM reports 
       WHERE resolved_at IS NOT NULL`
    );

    res.json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      totalReports: parseInt(totalReports.rows[0].count),
      reportsByStatus: reportsByStatus.rows,
      reportsByType: reportsByType.rows,
      recentActivity: recentActivity.rows,
      avgResolutionTime: avgResolutionTime.rows[0].avg_hours ? parseFloat(avgResolutionTime.rows[0].avg_hours).toFixed(1) : 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});

// Get all users (Admin only)
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_stats ORDER BY xp DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ERROR HANDLING

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// START SERVER

// ============================================
// ADMIN MANAGEMENT ROUTES (ADAUGĂ ÎNAINTE DE "START SERVER")
// ============================================

// Get all admins
app.get('/api/admin/admins', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
      ['admin']
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Error fetching admins' });
  }
});

// Promote user to admin
app.post('/api/admin/promote/:email', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { email } = req.params;

    const result = await pool.query(
      'UPDATE users SET role = $1, level = $2, xp = $3 WHERE email = $4 RETURNING id, name, email, role',
      ['admin', 99, 9999, email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error promoting user:', error);
    res.status(500).json({ error: 'Error promoting user' });
  }
});

// Demote admin to user
app.post('/api/admin/demote/:email', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { email } = req.params;

    // Check that it's not the last admin
    const adminCount = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['admin']);
    if (parseInt(adminCount.rows[0].count) <= 1) {
      return res.status(400).json({ error: 'Cannot demote the last admin' });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE email = $2 RETURNING id, name, email, role',
      ['user', email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error demoting admin:', error);
    res.status(500).json({ error: 'Error demoting admin' });
  }
});



app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` API available at http://localhost:${PORT}/api`);
});

module.exports = app;