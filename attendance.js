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
        
        // Update user dropdown info
        const userInfoDropdown = document.querySelector('.student-info');
        if (userInfoDropdown) {
            userInfoDropdown.innerHTML = `
                <div>
                    <h4>${user.name}</h4>
                    <p>ID: ${user.student_id || 'N/A'}</p>
                </div>
            `;
        }
    };

    // Fetch Subject Attendance Data
    const fetchSubjectAttendance = async () => {
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

            // Fetch detailed subject attendance
            const subjectResponse = await fetch(`http://localhost:3000/api/students/subject-attendance/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!subjectResponse.ok) throw new Error('Failed to fetch subject attendance');

            const subjectAttendance = await subjectResponse.json();
            updateSubjectCards(subjectAttendance, studentData);
        } catch (error) {
            console.error('Error fetching attendance data:', error);
        }
    };

    // Function to create and update subject cards
    const updateSubjectCards = (subjectAttendance, studentData) => {
        const subjectsContainer = document.querySelector('.subjects-container');
        subjectsContainer.innerHTML = ''; // Clear existing cards

        let totalLectures = 0;
        let totalAttended = 0;

        subjectAttendance.forEach(subject => {
            const card = createSubjectCard(subject);
            subjectsContainer.appendChild(card);

            totalLectures += subject.lectures_held;
            totalAttended += subject.lectures_attended;
        });

        // Update overall attendance
        updateOverallAttendance(totalLectures, totalAttended);

        // Apply color coding and warning checks
        applyAttendanceColorCoding();
        checkAttendanceWarnings();
    };

    // Function to create a subject card
    const createSubjectCard = (subject) => {
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.dataset.subject = subject.subject_code;


        card.innerHTML = `
            <div class="subject-header">
                <h3>${subject.subject_code}</h3>
                <span class="attendance-badge">${subject.percentage == null ? 0 : subject.percentage}%</span>
            </div>
            <div class="subject-details">
                <p>Lectures Held: <span>${subject.lectures_held}</span></p>
                <p>Lectures Attended: <span>${subject.lectures_attended}</span></p>
            </div>
            <div class="attendance-bar">
                <div class="progress" style="width: ${subject.percentage == null ? 0 : subject.percentage}%"></div>
            </div>
        `;

        // Add click event for subject details
        card.addEventListener('click', function() {
            this.classList.add('highlight');
            setTimeout(() => {
                this.classList.remove('highlight');
            }, 300);

            alert(`Subject: ${subject.subject_code}\nAttendance: ${attendancePercentage}%`);
        });

        return card;
    };

    // Initialize Dashboard
    const initializeDashboard = async () => {
        // Set current date
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const currentDateElement = document.getElementById('current-date');
        if (currentDateElement) {
            currentDateElement.textContent = today.toLocaleDateString('en-US', options);
        }

        // Fetch and update attendance data
        await fetchSubjectAttendance();
    };

    // Utility Functions (similar to previous implementation)
    const updateOverallAttendance = (totalLectures, totalAttended) => {
        const overallPercentage = ((totalAttended / totalLectures) * 100).toFixed(2);
        
        const existingOverall = document.querySelector('.overall-attendance');
        if (existingOverall) {
            existingOverall.innerHTML = `
                <h3>Overall Attendance: <span class="${getAttendanceColorClass(overallPercentage)}">${overallPercentage}%</span></h3>
                <p>Total Lectures: ${totalLectures} | Attended: ${totalAttended}</p>
            `;
        }
    };

    const applyAttendanceColorCoding = () => {
        const subjectCards = document.querySelectorAll('.subject-card');
        
        subjectCards.forEach(card => {
            const attendanceBadge = card.querySelector('.attendance-badge');
            const attendanceBar = card.querySelector('.attendance-bar .progress');
            const attendanceValue = parseFloat(attendanceBadge.textContent);
            
            // Clear existing classes first
            attendanceBadge.classList.remove('attendance-green', 'attendance-orange', 'attendance-red');
            
            // Apply color class to percentage badge
            const colorClass = getAttendanceColorClass(attendanceValue);
            attendanceBadge.classList.add(colorClass);
            
            // Apply color to progress bar
            attendanceBar.style.backgroundColor = getAttendanceColor(attendanceValue);
        });
    };

    const checkAttendanceWarnings = () => {
        const subjectCards = document.querySelectorAll('.subject-card');
        
        subjectCards.forEach(card => {
            const attendanceText = card.querySelector('.attendance-badge').textContent;
            const attendanceValue = parseFloat(attendanceText);
            
            if (attendanceValue < 75) {
                card.classList.add('warning');
                
                // Add warning icon if it doesn't already exist
                const header = card.querySelector('.subject-header');
                if (!header.querySelector('.warning-icon')) {
                    const warningIcon = document.createElement('i');
                    warningIcon.className = 'fas fa-exclamation-triangle warning-icon';
                    warningIcon.title = 'Attendance below 75%';
                    header.appendChild(warningIcon);
                }
            }
        });
    };

    const getAttendanceColorClass = (percentage) => {
        percentage = parseFloat(percentage);
        if (percentage >= 80) {
            return 'attendance-green';
        } else if (percentage >= 75 && percentage < 80) {
            return 'attendance-orange';
        } else {
            return 'attendance-red';
        }
    };

    const getAttendanceColor = (percentage) => {
        percentage = parseFloat(percentage);
        if (percentage >= 80) {
            return '#28a745'; // Green
        } else if (percentage >= 75 && percentage < 80) {
            return '#ffc107'; // Orange
        } else {
            return '#dc3545'; // Red
        }
    };

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

    // User Dropdown Toggle
    const userDropdown = document.querySelector('.user-dropdown');
    if (userDropdown) {
        userDropdown.addEventListener('click', function(e) {
            this.classList.toggle('active');
            e.stopPropagation();
        });

        // Close dropdown when clicking elsewhere
        document.addEventListener('click', function() {
            userDropdown.classList.remove('active');
        });
    }

    // Initialize the dashboard
    initializeDashboard();
});