function Validation(values) {
    let error = {};
    
    // Corrected regex patterns
    const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const password_pattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!values.email.trim()) {
        error.email = "Email should not be empty";
    } else if (!email_pattern.test(values.email)) {
        error.email = "Invalid email format";
    }

    if (!values.password.trim()) {
        error.password = "Password should not be empty";
    } else if (!password_pattern.test(values.password)) {
        error.password = "Password must contain at least 8 characters, including uppercase, lowercase, and a number, At least one special character";
    }

    return error;
}

export default Validation;