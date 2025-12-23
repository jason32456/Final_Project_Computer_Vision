const express = require('express');
const { getCourses, getSessions, getEnrolledStudents } = require('../controller/courseController');

const router = express.Router();

// GET /courses
router.get('/', getCourses);

// GET /courses/:courseId/sessions
router.get('/:courseId/sessions', getSessions);

// GET /courses/:courseId/students
router.get('/:courseId/students', getEnrolledStudents);

module.exports = router;