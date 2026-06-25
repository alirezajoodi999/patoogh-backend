const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const { jwt: jwtConfig } = require('../config/auth');

// تولید توکن JWT
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
};

// تولید Refresh Token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// ثبت‌نام کاربر جدید
exports.register = async (req, res, next) => {
  try {
    const { email, password, fullName, department, position } = req.body;

    // بررسی وجود کاربر
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'این ایمیل قبلاً ثبت شده است'
      });
    }

    // تولید توکن تأیید ایمیل
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // ایجاد کاربر جدید (hook مدل رمز عبور را هش می‌کند)
    const user = await User.create({
      email,
      passwordHash: password, // رمز عبور plain را می‌فرستیم، hook آن را هش می‌کند
      fullName,
      department: department || null,
      position: position || null,
      role: 'manager',
      verificationToken,
      verificationTokenExpires,
      emailVerified: false
    });

    // تولید توکن
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      success: true,
      message: 'ثبت‌نام با موفقیت انجام شد. لطفاً ایمیل خود را تأیید کنید',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          emailVerified: user.emailVerified
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// ورود کاربر
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // یافتن کاربر
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'ایمیل یا رمز عبور اشتباه است'
      });
    }

    // بررسی فعال بودن حساب
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'حساب کاربری شما غیرفعال شده است'
      });
    }

    // بررسی رمز عبور
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'ایمیل یا رمز عبور اشتباه است'
      });
    }

    // تولید توکن‌ها
    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken();
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // ذخیره refresh token
    await user.update({
      refreshToken,
      refreshTokenExpires: refreshTokenExpiry,
      lastLogin: new Date()
    });

    res.json({
      success: true,
      message: 'ورود با موفقیت انجام شد',
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          emailVerified: user.emailVerified,
          department: user.department,
          position: user.position,
          avatarUrl: user.avatarUrl
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// خروج کاربر
exports.logout = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    await User.update(
      { refreshToken: null, refreshTokenExpires: null },
      { where: { id: userId } }
    );

    res.json({
      success: true,
      message: 'خروج با موفقیت انجام شد'
    });

  } catch (error) {
    next(error);
  }
};

// تازه‌سازی توکن
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token الزامی است'
      });
    }

    const { Op } = require('sequelize');
    
    // یافتن کاربر با refresh token
    const user = await User.findOne({
      where: {
        refreshToken,
        refreshTokenExpires: { [Op.gt]: new Date() },
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token نامعتبر یا منقضی شده است'
      });
    }

    // تولید توکن‌های جدید
    const newToken = generateToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await user.update({
      refreshToken: newRefreshToken,
      refreshTokenExpires: newRefreshTokenExpiry
    });

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    next(error);
  }
};

// درخواست بازیابی رمز عبور
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      where: { email, isActive: true }
    });

    if (!user) {
      return res.json({
        success: true,
        message: 'اگر این ایمیل در سیستم ثبت شده باشد، لینک بازیابی رمز عبور برای شما ارسال خواهد شد'
      });
    }

    // تولید توکن بازیابی
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await user.update({
      resetToken,
      resetTokenExpires: resetTokenExpiry
    });

    res.json({
      success: true,
      message: 'اگر این ایمیل در سیستم ثبت شده باشد، لینک بازیابی رمز عبور برای شما ارسال خواهد شد'
    });

  } catch (error) {
    next(error);
  }
};

// بازنشانی رمز عبور
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'رمز عبور باید حداقل 8 کاراکتر باشد'
      });
    }

    const { Op } = require('sequelize');

    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpires: { [Op.gt]: new Date() },
        isActive: true
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'توکن بازیابی نامعتبر یا منقضی شده است'
      });
    }

    // hook مدل رمز عبور را هش می‌کند
    await user.update({
      passwordHash: password,
      resetToken: null,
      resetTokenExpires: null
    });

    res.json({
      success: true,
      message: 'رمز عبور با موفقیت تغییر یافت'
    });

  } catch (error) {
    next(error);
  }
};

// تأیید ایمیل
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { Op } = require('sequelize');

    const user = await User.findOne({
      where: {
        verificationToken: token,
        verificationTokenExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'توکن تأیید نامعتبر یا منقضی شده است'
      });
    }

    await user.update({
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpires: null
    });

    res.json({
      success: true,
      message: 'ایمیل شما با موفقیت تأیید شد'
    });

  } catch (error) {
    next(error);
  }
};

// دریافت پروفایل کاربر
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'fullName', 'department', 'position', 
                   'role', 'avatarUrl', 'emailVerified', 'createdAt', 'lastLogin']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    next(error);
  }
};

// به‌روزرسانی پروفایل
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { fullName, department, position, avatarUrl } = req.body;

    await User.update(
      {
        fullName,
        department: department || null,
        position: position || null,
        avatarUrl: avatarUrl || null
      },
      { where: { id: userId } }
    );

    res.json({
      success: true,
      message: 'پروفایل با موفقیت به‌روزرسانی شد'
    });

  } catch (error) {
    next(error);
  }
};

// تغییر رمز عبور
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'رمز عبور جدید باید حداقل 8 کاراکتر باشد'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد'
      });
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'رمز عبور فعلی اشتباه است'
      });
    }

    // hook مدل رمز عبور را هش می‌کند
    await user.update({ passwordHash: newPassword });

    res.json({
      success: true,
      message: 'رمز عبور با موفقیت تغییر یافت'
    });

  } catch (error) {
    next(error);
  }
};
