const prisma = require('../config/prisma');

const getCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      select: {
        // Columns matching your database screenshot
        id: true,
        code: true,
        title: true,
        description: true,
        teacherId: true, // Explicitly selecting the Foreign Key column
        createdAt: true,
        updatedAt: true,

        // Relations (Must be defined in your schema.prisma to work)
        teacher: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            sessions: true,
            enrollments: true
          }
        }
      }
    });
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

const getSessions = async (req, res) => {
  const { courseId } = req.params;
  try {
    const sessions = await prisma.session.findMany({
      where: { courseId },
      include: {
        schedules: true 
      },
      orderBy: { orderIndex: 'asc' }
    });
    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

const getEnrolledStudents = async (req, res) => {
  const { courseId } = req.params;
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });
    
    // Flatten result to just return the student objects
    const students = enrollments.map(e => e.student);
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

module.exports = { getCourses, getSessions, getEnrolledStudents };