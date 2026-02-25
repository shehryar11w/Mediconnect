const { getRefreshToken } = require('./generateRefreshToken');

// Get the authorization code from command line argument
const code = process.argv[2];

if (!code) {
  console.log('Please provide the authorization code as an argument');
  console.log('Usage: node getToken.js <authorization_code>');
  process.exit(1);
}

getRefreshToken(code)
  .then(refreshToken => {
    console.log('\nAdd this refresh token to your credentials.json file:');
    console.log(refreshToken);
  })
  .catch(error => {
    console.error('Error getting refresh token:', error);
  }); 