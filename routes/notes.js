const express = require('express');
const router = express.Router();
const fetchuser = require('../middleware/fetchuser');
const Note = require('../models/Note');
const { body, validationResult } = require('express-validator');

// ROUTE 1: Get All the note using: GET "/api/auth/getuser". Login required
router.get('/fetchallnotes', fetchuser, async (req, res) => {
    try {
        const note = await Note.find({ user: req.user.id });
        res.json(note)
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

// ROUTE 2: Add a new Note using: POST "/api/auth/addnote". Login required
router.post('/addnote', fetchuser, [
    body('title', 'Enter a valid Amount').isLength({ min: 1 }),
    body('description', 'Description must be appropriate').isLength({ min: 1 })], async (req, res) => {
        try {

            const { title, description, tag } = req.body;

            // If there are errors, return Bad request and the errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const note = new Note({
                title, description, tag, user: req.user.id
            })
            const savedNote = await note.save()

            res.json(savedNote)

        } catch (error) {
            console.error(error.message);
            res.status(500).send("Internal Server Error");
        }
    })

// Route:3 Update an existing note : PUT request
// using the middleware to verify that just logged in person is viewing
router.put('/updatenote/:id', fetchuser, async (req, res) => {
    try { 
        const { title, description, tag } = req.body;
        // Create a newNote object
        const newNote = {};
        if (title) { newNote.title = title };
        if (description) { newNote.description = description };
        if (tag) { newNote.tag = tag };

        // Find the note to be updated and update it
        let note = await Note.findById(req.params.id);
        if (!note) { return res.status(404).send("Not found") }

        if (note.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }

        note = await Note.findByIdAndUpdate(req.params.id, { $set: newNote }, { new: true })
        res.json({ note });
    }
    catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})


// Route:4 Delete existing note :
// using the middleware to verify that just logged in person is delting 
// jo logged in hai wohi delte kar raha hai note kisi aur ka nahi kar raha hai
router.delete('/deletenote/:id', fetchuser, async (req, res) => {
    try {
      
        // Find the note to be deleted
        let note = await Note.findById(req.params.id);
        if (!note) { return res.status(404).send("Not found") }

        // Allowing deletion only if user owns this note
        if (note.user.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }

        note = await Note.findByIdAndDelete(req.params.id)
        res.json({ "Success": "Note has been deleted", note: note });
    }
    catch {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})
module.exports = router