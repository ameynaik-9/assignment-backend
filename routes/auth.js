require("dotenv").config();
const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetchuser')
const JWT_SECRET = process.env.JWT_SECRET;

// Create a User using: POST "/api/auth/createuser". No login required
router.post('/createuser', [
    body('name', 'Enter a valid name').isLength({ min: 3 }),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password must be atleast 5 characters').isLength({ min: 5 }),
], async (req, res) => {
    // If there are errors, return Bad request and the errors
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({success, errors: errors.array() });
    }
    try { 
        // Check whether the user with this email exists already
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(400).json({success, error: "Sorry a user with this email already exists" })
        }
        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.password, salt);

        // Create a new user
        user = await User.create({
            name: req.body.name,
            password: secPass,
            email: req.body.email,
        });
        const data = {
            user: {
                id: user.id
            }
        }
        const authtoken = jwt.sign(data, JWT_SECRET);


        // res.json(user)
        success=true;//yaha tak aagya matlb sab sahi hi hoga
        res.json({success, authtoken })
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

// Authenticate a User using: POST "/api/auth/login". No login required
router.post('/login', [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password cannot be blank').exists(),
], async (req, res) => {
    let success = false;
    // If there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    //   Here we used destructuring to pull out the email and password from req.body
    const { email, password } = req.body;

    // using try catch and promises
    try {
        let user = await User.findOne({ email });
        if (!user) {
            success=false;
            return res.status(400).json({success, error: "Please try to login with correct credentials" });
        }

        // Internally matches the hash of inputed pwd
        const passwordCompare = await bcrypt.compare(password, user.password);
        if (!passwordCompare) {
            success=false;
            return res.status(400).json({ success,error: "Please try to login with correct credentials" });
        }

        const data = {
            user: {
                id: user.id
            }
        }
        const authtoken = jwt.sign(data, JWT_SECRET);
        success=true;
        res.json({ success,authtoken })

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})



// Route:3 Get loggedin uSer Details using: POST "/api/auth/getuser".Login required
router.post('/getuser',fetchuser,async(req,res)=>{
    try {
        userId=req.user.id;
        const user = await User.findById(userId).select("-password")
        res.send(user)
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

module.exports = router