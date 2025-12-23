const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const prisma = require('../config/prisma'); // Import the JS file above

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000/predict';

const processAttendance = async (filePath, scheduleId) => {
  try {
    // 1. Call FastAPI
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    const aiResponse = await axios.post(FASTAPI_URL, formData, {
      headers: { ...formData.getHeaders() },
    });

    // Clean up file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const identifiedName = aiResponse.data.prediction;
    if (!identifiedName) throw new Error('Face not recognized by AI');

    // 2. Find Student
    const student = await prisma.user.findFirst({
      where: { name: identifiedName, role: 'STUDENT' }
    });

    if (!student) throw new Error(`Student '${identifiedName}' not found in database`);

    // 3. Get Schedule
    const schedule = await prisma.sessionSchedule.findUnique({
      where: { id: scheduleId },
      include: { session: { include: { course: true } } }
    });

    if (!schedule) throw new Error('Schedule not found');

    // 4. Verify Enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: student.id,
          courseId: schedule.session.courseId
        }
      }
    });

    if (!enrollment) throw new Error('Student is not enrolled in this course');

    // 5. 50-Minute Rule
    const now = new Date();
    const startTime = new Date(schedule.startTime);
    const diffMs = now.getTime() - startTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    let status = 'ABSENT';

    if (diffMinutes <= 50) {
      status = 'PRESENT';
  
    } else {
      status = 'LATE';
    
    }

    // 6. Save
    const attendance = await prisma.attendance.upsert({
      where: {
        scheduleId_studentId: {
          scheduleId: schedule.id,
          studentId: student.id
        }
      },
      update: { status, recordedAt: now },
      create: {
        scheduleId: schedule.id,
        studentId: student.id,
        status,
        recordedAt: now
      }
    });

    return {
      success: true,
      student: student.name,
      status,
      timeDifference: `${diffMinutes} minutes`,
      data: attendance
    };

  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw error;
  }
};

module.exports = { processAttendance };