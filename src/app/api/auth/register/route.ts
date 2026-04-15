import { isTempEmail } from './utils';

async function registerUser(req, res) {
    const { email, password, phone, realName } = req.body;

    // Check for WhatsApp pre-registered users
    if (password === null && (email.endsWith('@speeda.local') || email.startsWith('temp_'))) {
        // Logic to find the user and update their details
        const existingUser = await findUserByPhone(phone);

        if (existingUser) {
            if (existingUser.tempPreReg) {
                // Update user information with real name/email/password/phone
                existingUser.realName = realName;
                existingUser.email = email;
                existingUser.password = password;
                existingUser.phone = phone;
                await updateUser(existingUser);
                return res.status(200).json({ success: true });
            } else {
                return res.status(409).json({ error: 'phone already exists' });
            }
        }
    }

    // Adjust email uniqueness check
    const existingEmailUser = await findUserByEmail(email);
    if (existingEmailUser && existingEmailUser.id !== req.user.id) {
        return res.status(409).json({ error: 'email already exists' });
    }

    // Other unchanged logic (referral, OTP, free trial, n8n sync, sendVerificationEmail)
    // ...

}

function isTempEmail(email) {
    return email.startsWith('temp_') || email.endsWith('@speeda.local');
}

export { registerUser, isTempEmail };