const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function checkPassword() {
  try {
    const email = 'alirezajoodi1399@gmail.com';
    const testPassword = 'Admin@123';

    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log('❌ کاربر پیدا نشد');
      return;
    }

    console.log('✅ کاربر پیدا شد:', user.email);
    console.log('📦 passwordHash:', user.passwordHash);

    const isValid1 = await user.comparePassword(testPassword);
    console.log('🔐 نتیجه comparePassword:', isValid1);

    const isValid2 = await bcrypt.compare(testPassword, user.passwordHash);
    console.log('🔐 نتیجه bcrypt.compare:', isValid2);

    process.exit(0);
  } catch (error) {
    console.error('❌ خطا:', error);
    process.exit(1);
  }
}

checkPassword();
