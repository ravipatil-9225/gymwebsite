/**
 * Quick password hash generator
 * Run: node hashPassword.js <yourPassword>
 * Copy the output hash and paste it into Atlas.
 */
const bcrypt = require('bcryptjs');
const password = process.argv[2];
if (!password) { console.error('Usage: node hashPassword.js <password>'); process.exit(1); }
bcrypt.genSalt(8).then(salt => bcrypt.hash(password, salt)).then(hash => {
    console.log('\n✅ Your bcrypt hash (copy this):\n');
    console.log(hash);
    console.log('');
}).catch(e => { console.error(e); process.exit(1); });
