// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Update current date
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user ? user.id : null;
    if (!userId) {
        console.error('No user ID found');
        return null;
    }

    const currentDateElement = document.getElementById('current-date');
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateElement.textContent = today.toLocaleDateString('en-US', options);
    
    // Subjects mapping to course IDs
    const subjectCourseIds = {
        'oobjlab': 'OOBJLAB',
        'tcs': 'TCS',
        'mm': 'MM',
        'wp': 'WP',
        'cvt': 'CVT',
        'dbmslab': 'DBMSLAB',
        'coa': 'COA',
        'daa': 'DAA',
        'mathematics': 'MATHEMATICS',
        'physics': 'PHYSICS'
    };

    async function fetchSubjectsData() {
        try {
            const response = await fetch(`http://localhost:3000/api/students/lecture-information/${userId}`);
            const result = await response.json();
            
            if (result.success && result.data) {
                return result.data;
            }
            
            throw new Error('Failed to fetch subjects data');
        } catch (error) {
            console.error('API Error:', error);
            return [];
        }
    }

    // Function to fetch attendance projection from API
    async function fetchAttendanceProjection(courseId, nextLectures) {
        try {
            const response = await fetch(`http://localhost:3000/api/students/attendance-projection/${userId}?courseId=${courseId}&next_lectures=${nextLectures}`);
            const result = await response.json();
            console.log(result)
            if (result.success && result.data.length > 0) {
                return result.data[0];
            }
            
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    }
    
    async function initializeAttendanceTracking() {
        // Fetch subjects data dynamically
        const subjects = await fetchSubjectsData();
        console.log(subjects);

        // Add event listeners and calculate percentages for each subject
        const projectionPromises = subjects.map(async subject => {
            const subjectKey = Object.keys(subjectCourseIds).find(
                key => key.toUpperCase() === subject.subject.toUpperCase()
            );
            
            if (!subjectKey) {
                console.warn(`No mapping found for subject: ${subject.subject}`);
                return;
            }

            const domSubjectId = subjectCourseIds[subjectKey].toLowerCase();
            
            // Update total and attended lectures
            const totalLecturesElement = document.getElementById(`${domSubjectId}-total`);
            const attendedLecturesElement = document.getElementById(`${domSubjectId}-attended`);
            const attendanceBadgeElement = document.querySelector(`[data-subject="${subject.subject.toUpperCase()}"] .attendance-badge`);
            
            if (totalLecturesElement) totalLecturesElement.textContent = subject.total_lectures;
            if (attendedLecturesElement) attendedLecturesElement.textContent = subject.lectures_attended;
            
            // Set current attendance percentage from API data
            const percentage = subject.total_lectures > 0 
                ? ((subject.lectures_attended / subject.total_lectures) * 100).toFixed(0)
                : '0';
            
            if (attendanceBadgeElement) attendanceBadgeElement.textContent = `${percentage}%`;

            // Fetch initial projection for next 1 lecture
            const courseId = subjectCourseIds[subjectKey];
            const nextLectures = 1;
            const attendResultElement = document.getElementById(`${domSubjectId}-attend-result`);
            const notAttendResultElement = document.getElementById(`${domSubjectId}-not-attend-result`);

            // Set up initial projection input
            const nextLecturesInput = document.getElementById(`${domSubjectId}-next`);
            if (nextLecturesInput) {
                nextLecturesInput.value = nextLectures;
            }

            try {
                const projectionData = await fetchAttendanceProjection(courseId, nextLectures);
                
                if (projectionData) {
                    if (attendResultElement) {
                        attendResultElement.textContent = `${projectionData.attendance_if_next_lectures_attended.toFixed(1)}%`;
                    }
                    if (notAttendResultElement) {
                        notAttendResultElement.textContent = `${projectionData.attendance_if_next_lectures_not_attended.toFixed(1)}%`;
                    }
                }
            } catch (error) {
                console.error('Error updating initial attendance projection:', error);
            }

            // Add event listener for next lectures input
            if (nextLecturesInput) {
                nextLecturesInput.addEventListener('change', async function() {
                    const nextLectures = parseInt(this.value);

                    try {
                        const projectionData = await fetchAttendanceProjection(courseId, nextLectures);
                        
                        if (projectionData) {
                            if (attendResultElement) {
                                attendResultElement.textContent = `${projectionData.attendance_if_next_lectures_attended.toFixed(1)}%`;
                            }
                            if (notAttendResultElement) {
                                notAttendResultElement.textContent = `${projectionData.attendance_if_next_lectures_not_attended.toFixed(1)}%`;
                            }
                        }
                    } catch (error) {
                        console.error('Error updating attendance projection:', error);
                    }
                });
            }
        });

        // Wait for all initial projections to complete
        await Promise.all(projectionPromises);
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            sessionStorage.clear();
            window.location.href = 'login.html';
        });
    }
    
    // User dropdown menu toggle
    const userDropdown = document.querySelector('.user-dropdown');
    
    userDropdown.addEventListener('click', function(e) {
        this.classList.toggle('active');
        e.stopPropagation();
    });
    
    // Close dropdown when clicking elsewhere
    document.addEventListener('click', function() {
        const dropdowns = document.querySelectorAll('.user-dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    });

    // Call the initialization function
    initializeAttendanceTracking();
});