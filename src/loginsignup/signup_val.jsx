function SignValidation(values) {
    let errors = {};
    
    // Improved regex patterns
    const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const password_pattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!values.name.trim()) {
        errors.name = "Name should not be empty";
    }
    
    if (!values.email.trim()) {
        errors.email = "Email should not be empty";
    } else if (!email_pattern.test(values.email)) {
        errors.email = "Invalid email format";
    }
    
    if (!values.password.trim()) {
        errors.password = "Password should not be empty";
    } else if (!password_pattern.test(values.password)) {
        errors.password = "Password must contain at least 8 characters, including uppercase, lowercase, and a number , At least one special character";
    }
    
    return errors;
}

export default SignValidation;