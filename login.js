document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;
        
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password, role })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Save token and user info
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Show success message
                showSuccess('Login successful! Redirecting to dashboard...');
                
                // Redirect to dashboard
                setTimeout(() => {
                    if(role === 'student'){
                        window.location.href = 'dashboard.html';
                    }else{
                        window.location.href = 'teacher-dashboard.html';
                    }
                }, 1500);
            } else {
                // Show error message
                showError(data.message || 'Login failed');
            }
        } catch (error) {
            showError('Network error. Please try again.');
        }
    });
    
    // Error and Success message functions remain the same as in previous script
    function showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        // Remove any existing error messages
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Insert error message after form
        loginForm.insertAdjacentElement('afterend', errorElement);
        
        // Remove error message after 3 seconds
        setTimeout(() => {
            errorElement.remove();
        }, 3000);
    }
    
    function showSuccess(message) {
        const successElement = document.createElement('div');
        successElement.className = 'success-message';
        successElement.textContent = message;
        
        // Remove any existing messages
        const existingMessage = document.querySelector('.success-message, .error-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Insert success message after form
        loginForm.insertAdjacentElement('afterend', successElement);
    }
});