const { ContentQuiz, QuizResponse, UserProgress } = require('../models');

exports.createQuiz = async (req, res) => {
  try {
    const { contentId, title, questions, passingScore, timeLimit } = req.body;

    // Check if quiz already exists for this content
    const existing = await ContentQuiz.findOne({ where: { contentId } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Quiz already exists for this content'
      });
    }

    const quiz = await ContentQuiz.create({
      contentId,
      title: title || 'Quick Assessment',
      questions,
      passingScore: passingScore || 70,
      timeLimit,
      createdBy: req.user.id,
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getQuiz = async (req, res) => {
  try {
    const { contentId } = req.params;

    const quiz = await ContentQuiz.findOne({
      where: { contentId, isActive: true }
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found for this content'
      });
    }

    // Don't send correct answers to user
    const sanitizedQuiz = quiz.toJSON();
    sanitizedQuiz.questions = sanitizedQuiz.questions.map(q => ({
      ...q,
      correctAnswer: undefined
    }));

    res.status(200).json({
      success: true,
      data: sanitizedQuiz
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { answers, timeSpent } = req.body;
    const userId = req.user.id;

    const quiz = await ContentQuiz.findOne({
      where: { contentId, isActive: true }
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user already submitted
    const existing = await QuizResponse.findOne({
      where: { quizId: quiz.id, userId }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this quiz'
      });
    }

    // Calculate score
    let correctCount = 0;
    const answerDetails = quiz.questions.map((q, index) => {
      const userAnswer = answers[index] !== undefined ? answers[index] : -1;
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        questionIndex: index,
        selectedOption: userAnswer,
        isCorrect
      };
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const isPassed = score >= quiz.passingScore;

    const response = await QuizResponse.create({
      quizId: quiz.id,
      userId,
      answers: answerDetails,
      score,
      isPassed,
      timeSpent,
      completedAt: new Date(),
      startedAt: new Date(Date.now() - (timeSpent || 0) * 1000)
    });

    // Update user progress: add completed content
    // This is a simplified version; you may need to update UserProgress accordingly.
    // For now, just create/update an entry.

    res.status(200).json({
      success: true,
      data: {
        score,
        isPassed,
        correctCount,
        totalQuestions: quiz.questions.length,
        passingScore: quiz.passingScore
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};