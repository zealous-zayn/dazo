let Email = (email) => {
    let emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if (email.match(emailRegex)) {
        return email
    } else {
        return false;
    }
}

let Password = (password) => {
    let passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (password.match(passwordRegex)) {
        return password
    } else {
        throw new Error("password must have one uppercase, one lowercase, one special character with minimum length of eight characters")
    }
}

module.exports = {
    Email: Email,
    Password: Password
}