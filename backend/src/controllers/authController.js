const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');

exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, role = 'CUSTOMER' } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, phone, and password are required.' });
    }

    const existingUser = db.users.findOne(u => u.phone === phone || (email && u.email === email));
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this phone or email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const newUser = {
      id: `USER-${Date.now().toString().slice(-4)}`,
      name,
      phone,
      email: email || `${phone}@corridorx.in`,
      password_hash,
      role: ['CUSTOMER', 'AMBULANCE'].includes(role) ? role : 'CUSTOMER',
      createdAt: new Date().toISOString()
    };

    db.users.insert(newUser);

    const token = jwt.sign(
      { id: newUser.id, role: newUser.role, name: newUser.name },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const { password_hash: _, ...safeUser } = newUser;
    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('[Auth Error]', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or phone

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Identifier (email/phone) and password are required.' });
    }

    const user = db.users.findOne(u => u.email === identifier || u.phone === identifier);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const { password_hash: _, ...safeUser } = user;
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('[Auth Error]', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

exports.getMe = async (req, res) => {
  const { password_hash: _, ...safeUser } = req.user;
  return res.status(200).json({ success: true, user: safeUser });
};
