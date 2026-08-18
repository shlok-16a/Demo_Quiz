const QUIZ = {
    title: "Cricket Quiz",
    rules: [
        { icon: "🏏", text: "Play fairly and follow all match rules." },
        { icon: "⚡", text: "Respect opponents and teammates throughout the game." },
        { icon: "🚫", text: "No cheating, exploiting, or unfair gameplay." },
        { icon: "⏱️", text: "Be ready and join the match on time." },
        { icon: "🏆", text: "Accept the final result and play with sportsmanship." }
    ],
    correctPoints: 10,
    wrongPoints: -5,
    bonusPointsPerSecond: 1,
    questionTimerSeconds: 10,
    interQuestionCountdownSeconds: 3,
    startCountdownSeconds: 5,
    questions: [
        {
            questionText: "How many runs are scored for hitting the ball over the boundary on the full?",
            option1: "5",
            option2: "6",
            option3: "4",
            correctOption: 2
        },
        {
            questionText: "How many players from a team are on the field during play?",
            option1: "9",
            option2: "10",
            option3: "11",
            correctOption: 3
        },
        {
            questionText: "What is a batter's score of zero called?",
            option1: "Duck",
            option2: "Goose",
            option3: "Owl",
            correctOption: 1
        },
        {
            questionText: "How many legal deliveries make up a standard over?",
            option1: "4",
            option2: "6",
            option3: "8",
            correctOption: 2
        },
        {
            questionText: "Which format is played with 50 overs per side?",
            option1: "T20",
            option2: "Test",
            option3: "ODI",
            correctOption: 3
        }
    ]
};
