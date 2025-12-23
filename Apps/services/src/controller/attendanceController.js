const { processAttendance } = require('../services/attendanceService');
const prisma = require('../config/prisma');

const markAttendance = async (req, res) => {
  const { scheduleId } = req.body;
  const file = req.file;

  if (!file || !scheduleId) {
    return res.status(400).json({ error: 'Image and scheduleId are required' });
  }

  try {
    const result = await processAttendance(file.path, scheduleId);
    res.json(result);
  } catch (error) {
    const msg = error.message;
    if (msg.includes('not found') || msg.includes('not enrolled')) {
      return res.status(404).json({ error: msg });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAttendanceRecapBySchedule = async (req, res) => {
  const { scheduleId } = req.params;

  if (!scheduleId) {
    return res.status(400).json({
      error: "scheduleId is required",
    });
  }

  try {
    // 1️⃣ Get schedule + course
    const schedule = await prisma.sessionSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            courseId: true,
          },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({
        error: "Session schedule not found",
      });
    }

    // 2️⃣ Get ALL students enrolled in the course
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: schedule.session.courseId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // 3️⃣ Get attendance records for this schedule
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        scheduleId,
      },
    });

    // 4️⃣ Map student → attendance
    const attendanceMap = new Map();
    attendanceRecords.forEach((a) => {
      attendanceMap.set(a.studentId, {
        status: a.status,
        recordedAt: a.recordedAt,
      });
    });

    // 5️⃣ Build response (DEFAULT = ABSENT)
    const studentsAttendance = enrollments
      .filter(e => e.student.role === "STUDENT")
      .map((e) => {
        const attendance = attendanceMap.get(e.student.id);

        return {
          studentId: e.student.id,
          name: e.student.name,
          email: e.student.email,
          status: attendance ? attendance.status : "ABSENT",
          recordedAt: attendance ? attendance.recordedAt : null,
        };
      });

    res.json({
      scheduleId: schedule.id,
      sessionId: schedule.session.id,
      sessionTitle: schedule.session.title,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      students: studentsAttendance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};



module.exports = { markAttendance, getAttendanceRecapBySchedule};