// HANDLE: username
export const validateUsername = (username: string) => {
    const fmtUsername = username.trim()
    return fmtUsername.length >= 3 && fmtUsername.length <= 60
}

// HANDLE: email
export const validateEmail = (email: string) => {
    const fmtEmail = email.trim().toLowerCase()
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
    return emailRegex.test(fmtEmail)
}

// HANDLE: password
export const validatePassword = (password: string) => {
    return password.length >= 6 && password.length <= 50
}