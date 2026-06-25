// فایل موقت برای تست - test-routes.js
console.log('Testing route imports...\n');

try {
  const authRoutes = require('./routes/auth');
  console.log('✅ authRoutes:', typeof authRoutes);
} catch (e) {
  console.log('❌ authRoutes ERROR:', e.message);
}

try {
  const competencyRoutes = require('./routes/competencies');
  console.log('✅ competencyRoutes:', typeof competencyRoutes);
} catch (e) {
  console.log('❌ competencyRoutes ERROR:', e.message);
}

try {
  const contentRoutes = require('./routes/content');
  console.log('✅ contentRoutes:', typeof contentRoutes);
} catch (e) {
  console.log('❌ contentRoutes ERROR:', e.message);
}

try {
  const evaluationRoutes = require('./routes/evaluations');
  console.log('✅ evaluationRoutes:', typeof evaluationRoutes);
} catch (e) {
  console.log('❌ evaluationRoutes ERROR:', e.message);
}

try {
  const progressRoutes = require('./routes/progress');
  console.log('✅ progressRoutes:', typeof progressRoutes);
} catch (e) {
  console.log('❌ progressRoutes ERROR:', e.message);
}

try {
  const reminderRoutes = require('./routes/reminders');
  console.log('✅ reminderRoutes:', typeof reminderRoutes);
} catch (e) {
  console.log('❌ reminderRoutes ERROR:', e.message);
}

try {
  const suggestionRoutes = require('./routes/suggestions');
  console.log('✅ suggestionRoutes:', typeof suggestionRoutes);
} catch (e) {
  console.log('❌ suggestionRoutes ERROR:', e.message);
}

try {
  const notificationRoutes = require('./routes/notifications');
  console.log('✅ notificationRoutes:', typeof notificationRoutes);
} catch (e) {
  console.log('❌ notificationRoutes ERROR:', e.message);
}

try {
  const adminRoutes = require('./routes/admin');
  console.log('✅ adminRoutes:', typeof adminRoutes);
} catch (e) {
  console.log('❌ adminRoutes ERROR:', e.message);
}
