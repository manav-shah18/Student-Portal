const bcrypt = require('bcryptjs');

// Function to generate a hashed password
function generateHashedPassword(plainTextPassword) {
  // Generate a salt - higher number means more secure but slower
  const salt = bcrypt.genSaltSync(10);
  
  // Hash the password
  const hashedPassword = bcrypt.hashSync(plainTextPassword, salt);
  
  return hashedPassword;
}

// Example usage
const plainTextPassword = 'nidhi';
const hashedPassword = generateHashedPassword(plainTextPassword);

console.log('Plain Text Password:', plainTextPassword);
console.log('Hashed Password:', hashedPassword);

