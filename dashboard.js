document.addEventListener('DOMContentLoaded', function () {
    // User Authentication and Session Management
    const checkUserAuthentication = () => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));

        if (!token || !user) {
            window.location.href = 'login.html';
            return null;
        }
        return user;
    };

    const user = checkUserAuthentication();
    if (!user) return;

    // Update User Profile Dynamically
    const updateUserProfile = (user) => {
        if (!user) return;
        
        // Update name in welcome section and navbar
        const studentNameElement = document.getElementById('student-name');
        if (studentNameElement) {
            studentNameElement.textContent = user.name || 'Student';
        }

        // Update user dropdown info
        const userInfoDropdown = document.querySelector('.student-info');
        if (userInfoDropdown) {
            userInfoDropdown.innerHTML = `
                <div>
                    <h4>${user.name}</h4>
                    <p>ID: ${user.id || 'N/A'}</p>
                </div>
            `;
        }
    };

    // Fetch Real-time Student Data
    const fetchStudentData = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/auth/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch student data');

            const studentData = await response.json();
            console.log(studentData, "student data");

            // Update user profile
            updateUserProfile(studentData);

            // Update attendance
            const attendanceElement = document.querySelector('.quick-stats .stat-card .stat-info h3');
            if (attendanceElement) {
                attendanceElement.textContent = `${studentData.attendance }%`;
            }

            // Dynamically load additional stats
            const quickStatsContainer = document.querySelector('.quick-stats');
            if (quickStatsContainer) {
                quickStatsContainer.innerHTML += `
                    <div class="stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-book"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${studentData.total_courses }</h3>
                            <p>Courses</p>
                        </div>
                    </div>
                    
                `;
            }

        } catch (error) {
            console.error('Error fetching student data:', error);
        }
    };

    // Enhanced Timetable Loading
    const loadTimetable = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/students/timetable/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch timetable');

            const timetableData = await response.json();
            
            const timetableBody = document.querySelector('#timetable tbody');
            timetableBody.innerHTML = '';

            timetableData.forEach(item => {
                const row = document.createElement('tr');
                
                ['time_slot', 'subject', 'room', 'teacher'].forEach(key => {
                    const cell = document.createElement('td');
                    cell.textContent = item[key] || '---';
                    row.appendChild(cell);
                });

                timetableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading timetable:', error);
            const timetableBody = document.querySelector('#timetable tbody');
            if (timetableBody) {
                timetableBody.innerHTML = '<tr><td colspan="4">Unable to load timetable</td></tr>';
            }
        }
    };

    // Initialize Dashboard
    const initializeDashboard = async () => {
        await fetchStudentData();  // Ensure student data is loaded first
        await loadTimetable();

        // Set current date
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const currentDateElement = document.getElementById('current-date');
        if (currentDateElement) {
            currentDateElement.textContent = today.toLocaleDateString('en-US', options);
        }

        // Set day display
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayElement = document.getElementById('day-display');
        if (currentDayElement) {
            currentDayElement.textContent = dayNames[today.getDay()];
        }
    };

    // Call initialization
    initializeDashboard();

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
