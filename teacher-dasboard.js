document.addEventListener('DOMContentLoaded', function () {
    // User Authentication and Session Management
    const checkUserAuthentication = () => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));

        if (!token || !user || user.role !== 'teacher') {
            window.location.href = 'login.html';
            return null;
        }
        return user;
    };

    const user = checkUserAuthentication();
    if (!user) return;

    // Update User Profile
    const updateUserProfile = () => {
        console.log(user)
        document.getElementById('teacher-name').textContent = user.username;
        document.getElementById('teacher-id').textContent = user.id;
        document.getElementById('welcome-name').textContent = user.username;
    };
    updateUserProfile();

    // Set Current Date
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = today.toLocaleDateString('en-US', options);


    const fetchTeacherCourses = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/teachers/courses', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch courses');
            }

            const courses = await response.json();
            const courseSelect = document.getElementById('course-select');
            const attendanceCourseSSelect = document.getElementById('attendance-course');

            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.course_id;
                option.textContent = `${course.course_id} - ${course.course_name}`;
                courseSelect.appendChild(option.cloneNode(true));
                attendanceCourseSSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching courses:', error);
            alert('Failed to load courses');
        }
    };
    fetchTeacherCourses();


    // Timetable Management
    const timetableForm = document.getElementById('timetable-form');
    const timetableBody = document.getElementById('timetable-body');

    const fetchTimetableEntries = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/teachers/timetable', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch timetable');
            }

            const entries = await response.json();
            entries.forEach(entry => addTimetableRow(entry));
        } catch (error) {
            console.error('Error fetching timetable:', error);
        }
    };
    fetchTimetableEntries();


    timetableForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const course = document.getElementById('course-select').value;
        const day = document.getElementById('day-select').value;
        const timeSlot = document.getElementById('time-slot').value;
        const room = document.getElementById('room').value;

        try {
            const response = await fetch('http://localhost:3000/api/teachers/timetable', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ courseId: course, day, timeSlot, room, teacher:user.username})
            });

            if (!response.ok) {
                throw new Error('Failed to add timetable entry');
            }

            const result = await response.json();
            const newEntry = { id: result.id, course, day, timeSlot, room };
            addTimetableRow(newEntry);
            timetableForm.reset();
        } catch (error) {
            console.error('Error adding timetable entry:', error);
            alert('Failed to add timetable entry');
        }
    });

    function addTimetableRow(entry) {
        const row = document.createElement('tr');
        row.dataset.id = entry.id;
        row.innerHTML = `
            <td>${entry.subject}</td>
            <td>${entry.day}</td>
            <td>${entry.time_slot}</td>
            <td>${entry.room}</td>
            <td class="action-btns">
                <button class="btn-delete">Delete</button>
            </td>
        `;

        row.querySelector('.btn-delete').addEventListener('click', () => deleteTimetableEntry(row));

        timetableBody.appendChild(row);
    }



    async function deleteTimetableEntry(row) {
        const id = row.dataset.id;
        
        try {
            const response = await fetch(`http://localhost:3000/api/teachers/timetable/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete timetable entry');
            }

            row.remove();
        } catch (error) {
            console.error('Error deleting timetable entry:', error);
            alert('Failed to delete timetable entry');
        }
    }


    // Attendance Management
    const attendanceForm = document.getElementById('attendance-form');
    const studentAttendanceList = document.getElementById('student-attendance-list');

    document.getElementById('attendance-course').addEventListener('change', function() {
        const course = this.value;
        if (course) {
            fetchStudentsForCourse(course);
        }
    });

    async function fetchStudentsForCourse(courseId) {
        try {
            const response = await fetch(`http://localhost:3000/api/teachers/students/${courseId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch students');
            }

            const students = await response.json();

            const table = document.createElement('table');
            table.id = 'student-attendance-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Student ID</th>
                        <th>Student Name</th>
                        <th>Attendance</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(student => `
                        <tr>
                            <td>${student.id}</td>
                            <td>${student.name}</td>
                            <td>
                                <div class="attendance-checkbox">
                                    <input type="checkbox" id="attend-${student.id}" name="attendance" value="${student.id}">
                                    <label for="attend-${student.id}">Present</label>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            `;

            studentAttendanceList.innerHTML = '';
            studentAttendanceList.appendChild(table);
        } catch (error) {
            console.error('Error fetching students:', error);
            alert('Failed to load students');
        }
    }



    attendanceForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const course = document.getElementById('attendance-course').value;
        const date = document.getElementById('attendance-date').value;
        
        // Collect attendance data
        const attendanceData = [];
        const allStudents = document.querySelectorAll('input[name="attendance"]'); 
        
        allStudents.forEach(checkbox => {
            attendanceData.push({
                studentId: checkbox.value,
                status: checkbox.checked ? 'present' : 'absent' 
            });
        });
    
        try {
            const response = await fetch('http://localhost:3000/api/teachers/attendance', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    courseId: course,
                    date,
                    attendanceData
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit attendance');
            }

            alert('Attendance submitted successfully!');
            attendanceForm.reset();
            studentAttendanceList.innerHTML = '';
        } catch (error) {
            console.error('Error submitting attendance:', error);
            alert('Failed to submit attendance');
        }

    });

    // Logout Functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }
});