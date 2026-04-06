document.addEventListener('DOMContentLoaded', function() {
    // Format the current date
    const formatDate = () => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date();
        document.getElementById('current-date').textContent = today.toLocaleDateString('en-US', options);
    };
    formatDate();

    // Months for x-axis
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user ? user.id : null;

    const fetchAttendanceData = async () => {
        if (!userId) {
            console.error('No user ID found');
            return null;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/students/attendance/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch attendance data');
            }

            const result = await response.json();
            return processAttendanceData(result.data);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            return null;
        }
    };

    const processAttendanceData = (data) => {
        if (!data || data.length === 0) return null;

        // Group data by subject
        const attendanceData = {};

        // Create array of attendance percentages for each subject
        data.forEach(item => {
            if (!attendanceData[item.subject]) {
                attendanceData[item.subject] = new Array(12).fill(0);
            }
            
            // Adjust month index (database month is 1-indexed, array is 0-indexed)
            const monthIndex = item.month - 1;
            if (monthIndex >= 0 && monthIndex < 12) {
                attendanceData[item.subject][monthIndex] = item.avg_attendance
            }
        });

        return attendanceData;
    };



    // Toggle sidebar
    const hamburger = document.querySelector('.hamburger');
    if (hamburger) {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        hamburger.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('full-width');
        });
    }

    // Function to get color based on attendance percentage
    const getAttendanceColor = (percentage) => {
        if (percentage >= 80) {
            return '#4CAF50'; // Green
        } else if (percentage >= 70) {
            return '#FF9800'; // Orange
        } else {
            return '#F44336'; // Red
        }
    };

    // Function to create SVG line graph
    const createGraph = (subject, data) => {
        const graphContainer = document.querySelector(`#graph-${subject} .graph-canvas`);
        if (!graphContainer) {
            console.error(`Graph container for ${subject} not found`);
            return;
        }
        
        graphContainer.innerHTML = ''; // Clear existing content
        
        const svgNS = "http://www.w3.org/2000/svg";
        
        // Create SVG element
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", "0 0 800 400");
        graphContainer.appendChild(svg);
        
        // Graph dimensions
        const padding = 60;
        const graphWidth = 800 - (padding * 2);
        const graphHeight = 400 - (padding * 2);
        
        // Create grid lines
        const grid = document.createElementNS(svgNS, "g");
        grid.setAttribute("class", "grid");
        
        // Horizontal grid lines (10% increments)
        for (let i = 0; i <= 10; i++) {
            const y = padding + (graphHeight - (graphHeight * (i / 10)));
            const line = document.createElementNS(svgNS, "line");
            line.setAttribute("x1", padding);
            line.setAttribute("y1", y);
            line.setAttribute("x2", padding + graphWidth);
            line.setAttribute("y2", y);
            line.setAttribute("stroke", "#e0e0e0");
            line.setAttribute("stroke-width", "1");
            
            grid.appendChild(line);
            
            // Add percentage labels
            const label = document.createElementNS(svgNS, "text");
            label.setAttribute("x", padding - 10);
            label.setAttribute("y", y + 5);
            label.setAttribute("text-anchor", "end");
            label.setAttribute("font-size", "12");
            label.setAttribute("fill", "#666");
            label.textContent = `${i * 10}%`;
            
            grid.appendChild(label);
        }
        
        // Vertical grid lines (for months)
        for (let i = 0; i < months.length; i++) {
            const x = padding + ((graphWidth / (months.length - 1)) * i);
            const line = document.createElementNS(svgNS, "line");
            line.setAttribute("x1", x);
            line.setAttribute("y1", padding);
            line.setAttribute("x2", x);
            line.setAttribute("y2", padding + graphHeight);
            line.setAttribute("stroke", "#e0e0e0");
            line.setAttribute("stroke-width", "1");
            
            grid.appendChild(line);
            
            // Add month labels
            const label = document.createElementNS(svgNS, "text");
            label.setAttribute("x", x);
            label.setAttribute("y", padding + graphHeight + 20);
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("font-size", "12");
            label.setAttribute("fill", "#666");
            label.textContent = months[i];
            
            grid.appendChild(label);
        }
        
        svg.appendChild(grid);
        
        // Create points and line path
        const pointsGroup = document.createElementNS(svgNS, "g");
        pointsGroup.setAttribute("class", "data-points");
        
        let pathData = "";
        let areaData = "";
        const dataPoints = [];
        
        // Generate path for line and area
        for (let i = 0; i < data.length; i++) {
            const x = padding + ((graphWidth / (data.length - 1)) * i);
            const y = padding + (graphHeight - (graphHeight * (data[i] / 100)));
            
            dataPoints.push({x, y, value: data[i]});
            
            if (i === 0) {
                pathData += `M ${x} ${y}`;
                areaData += `M ${x} ${padding + graphHeight} L ${x} ${y}`;
            } else {
                pathData += ` L ${x} ${y}`;
                areaData += ` L ${x} ${y}`;
            }
        }
        
        // Close the area path
        areaData += ` L ${padding + graphWidth} ${padding + graphHeight} Z`;
        
        // Create segments for different colored lines based on attendance percentage
        for (let i = 0; i < dataPoints.length - 1; i++) {
            const startX = dataPoints[i].x;
            const startY = dataPoints[i].y;
            const endX = dataPoints[i+1].x;
            const endY = dataPoints[i+1].y;
            const startValue = dataPoints[i].value;
            const endValue = dataPoints[i+1].value;
            
            // Create line segment
            const lineSegment = document.createElementNS(svgNS, "line");
            lineSegment.setAttribute("x1", startX);
            lineSegment.setAttribute("y1", startY);
            lineSegment.setAttribute("x2", endX);
            lineSegment.setAttribute("y2", endY);
            lineSegment.setAttribute("stroke", getAttendanceColor((startValue + endValue) / 2));
            lineSegment.setAttribute("stroke-width", "3");
            lineSegment.setAttribute("stroke-linecap", "round");
            
            pointsGroup.appendChild(lineSegment);
        }
        
        // Create area path (with gradient opacity)
        const areaPath = document.createElementNS(svgNS, "path");
        areaPath.setAttribute("d", areaData);
        areaPath.setAttribute("fill", "rgba(67, 97, 238, 0.1)");
        
        pointsGroup.appendChild(areaPath);
        
        // Create data points and tooltips
        for (let i = 0; i < dataPoints.length; i++) {
            const point = document.createElementNS(svgNS, "circle");
            point.setAttribute("cx", dataPoints[i].x);
            point.setAttribute("cy", dataPoints[i].y);
            point.setAttribute("r", "6");
            point.setAttribute("class", "data-point");
            point.setAttribute("fill", "white");
            point.setAttribute("stroke", getAttendanceColor(dataPoints[i].value));
            point.setAttribute("stroke-width", "2");
            
            // Create tooltip with attendance value
            const tooltip = document.createElementNS(svgNS, "g");
            tooltip.setAttribute("class", "tooltip");
            tooltip.style.opacity = "0";
            tooltip.style.pointerEvents = "none";
            
            const tooltipRect = document.createElementNS(svgNS, "rect");
            tooltipRect.setAttribute("x", dataPoints[i].x - 30);
            tooltipRect.setAttribute("y", dataPoints[i].y - 40);
            tooltipRect.setAttribute("width", "60");
            tooltipRect.setAttribute("height", "25");
            tooltipRect.setAttribute("rx", "4");
            tooltipRect.setAttribute("fill", "#333");
            
            const tooltipText = document.createElementNS(svgNS, "text");
            tooltipText.setAttribute("x", dataPoints[i].x);
            tooltipText.setAttribute("y", dataPoints[i].y - 25);
            tooltipText.setAttribute("text-anchor", "middle");
            tooltipText.setAttribute("fill", "white");
            tooltipText.setAttribute("font-size", "12");
            tooltipText.textContent = `${dataPoints[i].value}%`;
            
            tooltip.appendChild(tooltipRect);
            tooltip.appendChild(tooltipText);
            
            // Add hover interaction
            point.addEventListener('mouseover', () => {
                point.setAttribute("r", "8");
                point.setAttribute("fill", getAttendanceColor(dataPoints[i].value));
                tooltip.style.opacity = "1";
            });
            
            point.addEventListener('mouseout', () => {
                point.setAttribute("r", "6");
                point.setAttribute("fill", "white");
                tooltip.style.opacity = "0";
            });
            
            pointsGroup.appendChild(point);
            pointsGroup.appendChild(tooltip);
        }
        
        svg.appendChild(pointsGroup);
        
        // Create threshold markers for color ranges
        const thresholds = document.createElementNS(svgNS, "g");
        thresholds.setAttribute("class", "thresholds");
        
        // Add color indicators and legend
        const legendWidth = 200;
        const legendHeight = 80;
        const legendX = 800 - legendWidth - 20;
        const legendY = 20;
        
        const legendBox = document.createElementNS(svgNS, "rect");
        legendBox.setAttribute("x", legendX);
        legendBox.setAttribute("y", legendY);
        legendBox.setAttribute("width", legendWidth);
        legendBox.setAttribute("height", legendHeight);
        legendBox.setAttribute("rx", "5");
        legendBox.setAttribute("fill", "white");
        legendBox.setAttribute("stroke", "#e0e0e0");
        legendBox.setAttribute("stroke-width", "1");
        
        thresholds.appendChild(legendBox);
        
        // Legend title
        const legendTitle = document.createElementNS(svgNS, "text");
        legendTitle.setAttribute("x", legendX + 10);
        legendTitle.setAttribute("y", legendY + 20);
        legendTitle.setAttribute("font-size", "12");
        legendTitle.setAttribute("font-weight", "bold");
        legendTitle.setAttribute("fill", "#333");
        legendTitle.textContent = "Attendance Range";
        
        thresholds.appendChild(legendTitle);
        
        // Create color indicators
        const colorRanges = [
            { label: "80% - 100%", color: "#4CAF50" }, // Green
            { label: "70% - 79.99%", color: "#FF9800" }, // Orange
            { label: "0% - 69.99%", color: "#F44336" }  // Red
        ];
        
        colorRanges.forEach((range, index) => {
            // Color box
            const colorBox = document.createElementNS(svgNS, "rect");
            colorBox.setAttribute("x", legendX + 10);
            colorBox.setAttribute("y", legendY + 30 + (index * 15));
            colorBox.setAttribute("width", "12");
            colorBox.setAttribute("height", "12");
            colorBox.setAttribute("fill", range.color);
            
            // Label
            const label = document.createElementNS(svgNS, "text");
            label.setAttribute("x", legendX + 30);
            label.setAttribute("y", legendY + 40 + (index * 15));
            label.setAttribute("font-size", "11");
            label.setAttribute("fill", "#666");
            label.textContent = range.label;
            
            thresholds.appendChild(colorBox);
            thresholds.appendChild(label);
        });
        
        svg.appendChild(thresholds);
    };

    const initializeGraphs = async () => {
        const attendanceData = await fetchAttendanceData();
        console.log(attendanceData, "attendance data");
    
        if (!attendanceData) {
            console.error('No attendance data available');
            return;
        }
    
        // Mapping of API subject names to display names and card IDs
        const subjectMapping = {
            'OOBJLAB': { 
                displayName: 'OOPJ(Object Oriented Programming Through JAVA) Lab', 
                cardId: 'subject2',
                graphId: 'DSA'
            },
            'COA': { 
                displayName: 'COA (Computer Organization and Architecture)', 
                cardId: 'subject1',
                graphId: 'COA'
            },
            'DBMSLAB': { 
                displayName: 'DBMS (Database Management Systems) Lab', 
                cardId: 'subject3',
                graphId: 'DBMS'
            },
            'TCS': { 
                displayName: 'TCS(Theoretical Computer Science)', 
                cardId: 'subject4',
                graphId: 'OS'
            },
            'MM': { 
                displayName: 'MM (Microprocessor and Microcontroller)', 
                cardId: 'subject5',
                graphId: 'CN'
            },
            'CVT': { 
                displayName: 'CVT (Complex Variable & Transform)', 
                cardId: 'subject6',
                graphId: 'ML'
            },
            'DAA': { 
                displayName: 'DAA (Design And Analysis Of Algorithm)', 
                cardId: 'subject7',
                graphId: 'SE'
            },
            'WP': { 
                displayName: 'WP (Web Programming)', 
                cardId: 'subject8',
                graphId: 'WD'
            },
            'Mathematics': { 
                displayName: 'Mathematics', 
                cardId: 'subject9',
                graphId: 'MA'
            },
            'Physics': { 
                displayName: 'Physics', 
                cardId: 'subject10',
                graphId: 'PY'
            }
        };
    
        // Handle view graph buttons
        const viewGraphBtns = document.querySelectorAll('.view-graph-btn');
        
        viewGraphBtns.forEach(btn => {
            const subject = btn.getAttribute('data-subject');
            const subjectCard = btn.closest('.subject-card');
            
            // Find the matching subject in our mapping
            const mappedSubject = Object.keys(subjectMapping).find(apiSubject => 
                subjectMapping[apiSubject].graphId === subject
            );
    
            // Hide button if no matching data
            if (!mappedSubject || !attendanceData[mappedSubject]) {
                btn.style.display = 'none';
                return;
            }
    
            btn.addEventListener('click', function() {
                // Close any open graphs first
                document.querySelectorAll('.subject-card').forEach(card => {
                    if (card !== subjectCard) {
                        card.classList.remove('expanded');
                        const otherGraphContainer = card.querySelector('.graph-container');
                        if (otherGraphContainer) {
                            otherGraphContainer.style.display = 'none';
                        }
                        const otherBtn = card.querySelector('.view-graph-btn');
                        if (otherBtn) {
                            otherBtn.textContent = 'View Graph';
                        }
                    }
                });
                
                // Toggle current graph
                subjectCard.classList.toggle('expanded');
                const graphContainer = subjectCard.querySelector('.graph-container');
                
                if (subjectCard.classList.contains('expanded')) {
                    graphContainer.style.display = 'block';
                    
                    // Use the mapped subject to get data
                    if (attendanceData[mappedSubject]) {
                        createGraph(subject, attendanceData[mappedSubject]);
                    } else {
                        console.error(`No attendance data found for subject: ${subject}`);
                        // Fallback data
                        createGraph(subject, [80, 85, 82, 78, 75, 80, 85]);
                    }
                    
                    // Smooth scroll to the expanded card
                    setTimeout(() => {
                        subjectCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                    btn.textContent = 'Hide Graph';
                } else {
                    graphContainer.style.display = 'none';
                    btn.textContent = 'View Graph';
                }
            });
        });
    };

    // Logout functionality - corrected version
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Clear any session data
            sessionStorage.clear();
            
            // Redirect to login page without alerts
            window.location.href = 'login.html';
        });
    }

    initializeGraphs();

});