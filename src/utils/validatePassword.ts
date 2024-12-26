import passwordValidator from 'password-validator';
import { isNull } from 'util';

const passwordSchema = new passwordValidator();

passwordSchema
    .is().min(8)                                    // Minimum length 8
    .is().max(100)                                  // Maximum length 100
    .has().uppercase()                              // Must have uppercase letters
    .has().lowercase()                              // Must have lowercase letters
    .has().digits(1)                                // Must have at least 2 digits
    .has().not().spaces()                           // Should not have spaces

const validatePassword = (inputPassword: string): boolean => {
    if (isNull(inputPassword)) return false; 
    const result = passwordSchema.validate(inputPassword);    
    return Array.isArray(result) ? result.length === 0 : result === true; // length =0 : false
};

export default validatePassword;
