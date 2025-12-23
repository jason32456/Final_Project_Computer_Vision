const express = require('express');
const multer = require('multer');
const { markAttendance, getAttendanceRecapBySchedule } = require('../controller/attendanceController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post(
  '/mark',
  (req, res, next) => {
    console.log("🔥 HIT /attendance/mark");
    next();
  },
  upload.single('image'),
  markAttendance
);

router.get("/schedule/:scheduleId", getAttendanceRecapBySchedule);

module.exports = router;