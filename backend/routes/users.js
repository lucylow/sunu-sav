// backend/routes/users.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Mock in-memory storage for demo
let users = [];

router.post('/', async (req, res) => {
  try {
    const { phoneNumber, language = 'fr' } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.phone_number === phoneNumber);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const user = {
      id: uuidv4(),
      phone_number: phoneNumber,
      language,
      created_at: new Date().toISOString()
    };

    users.push(user);
    
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.get('/', async (req, res) => {
  try {
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
