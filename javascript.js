let currentQuestionIndex = 0;
let score = 0;
let questions = [];
let userResponses = {};
let timeLeft = 300;
document.addEventListener('DOMContentLoaded', function () {
    const questionContainer = document.getElementById('question-container');
    const submitButton = document.getElementById('submit-btn');
    const feedbackContainer = document.getElementById('feedback');
    const timerDisplay = document.getElementById('timer');


    const backButton = document.getElementById('back-btn');
    

    backButton.addEventListener('click', function () {

        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion();
        }
    });

    const startButton = document.getElementById('start-quiz');

    startButton.addEventListener('click', function(){
        fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            questions = data;
            questions = shuffleArray(questions);
            showQuestion();
            startTimer();
            document.querySelector('.start-quiz-area').style.display = 'none';
            document.querySelector('.quiz').style.display = 'initial';
        });
    });

    


    function startTimer() {
        const timerInterval = setInterval(() => {
            if (currentQuestionIndex === questions.length) {
                clearInterval(timerInterval);
                showResults();
            } else {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
    
                if (minutes === 0) {
                    timerDisplay.textContent = `Temps restant: ${seconds} secondes`;
                } else {
                    timerDisplay.textContent = `Temps restant: ${minutes} minutes ${seconds} secondes`;
                }
                
                if (timeLeft === 0) {
                    clearInterval(timerInterval);
                    showResults();
                } else {
                    timeLeft--;
                }
            }
        }, 1000);
    }
    

    function updateProgressBar() {
        const progress = (currentQuestionIndex + 1) / questions.length * 100;
        document.getElementById('progress-bar').style.width = `${progress}%`;
    }

    function showQuestion() {

        document.getElementById('nb-questions-left').innerText = (questions.length - currentQuestionIndex)+' questions restantes';

        questionContainer.innerHTML = '';
        if (currentQuestionIndex > 0) {
            backButton.style.display = 'block';
        } else {
            backButton.style.display = 'none';
        }
        updateProgressBar();
        const currentQuestion = questions[currentQuestionIndex];
        let value = typeof userResponses[currentQuestionIndex] !== "undefined" ? userResponses[currentQuestionIndex] : '';

        if (typeof currentQuestion.answer === 'string') {
         
            questionContainer.innerHTML = `
                        <h2>${currentQuestion.question}</h2>
                        <input type="text" id="write-answer" value="${value}">
                    `;
        } else {
            let checkedValues = typeof userResponses[currentQuestionIndex] !== "undefined" ? userResponses[currentQuestionIndex] : [];

            
            const optionsHtml = currentQuestion.options.map((option, index) => {
                if (Array.isArray(currentQuestion.answer)) {
                    return `
                                <li>
                                    <input type="checkbox" id="option${index}" name="option" value="${index}" ${checkedValues.includes(index) ? 'checked' : ''}>
                                    <label for="option${index}">${escapeHtml(option)}</label>
                                </li>
                            `;
                } else {
                    if (typeof value === "string") {
                        value = undefined;
                    }

                    return `
                                <li>
                                    <input type="radio" id="option${index}" name="option" value="${index}" ${value == index ? 'checked' : ''}>
                                    <label for="option${index}">${escapeHtml(option)}</label>
                                </li>
                            `;
                }
            }).join('');
            questionContainer.innerHTML = `
                        <h2>${currentQuestion.question}</h2>
                        <ul>
                            ${optionsHtml}
                        </ul>
                    `;
        }
    }


    function saveUserResponse(response, currentQuestionIndex) {
        userResponses[currentQuestionIndex] = response;
    }

    submitButton.addEventListener('click', function () {
        const currentQuestion = questions[currentQuestionIndex];
        feedbackContainer.textContent = '';
        if (typeof currentQuestion.answer === 'string') {
            
            const writeAnswerInput = document.getElementById('write-answer');
            const userAnswer = writeAnswerInput.value.trim().toLowerCase();
            if (userAnswer == '') {
                feedbackContainer.textContent = 'Le champs est obligatoire.';
                return;
            }
            saveUserResponse(userAnswer, currentQuestionIndex); // Save user response
        } else {
           
            const selectedOptions = document.querySelectorAll('input[name="option"]:checked');
            if (selectedOptions.length === 0) {
                feedbackContainer.textContent = 'Veuillez sélectionner au moins une option.';
                return;
            }
            const answerIndices = Array.from(selectedOptions).map(option => parseInt(option.value));
            saveUserResponse(answerIndices, currentQuestionIndex); // Save user response
        }

        currentQuestionIndex++;

        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            showResults();
        }
    });

    function showResults() {
        backButton.style.display = 'none';
        questionContainer.innerHTML = '';
        submitButton.style.display = 'none';
        let resultHTML = '';
        let score = 0; 
        resultHTML += '<ul>';
        for (index = 0; index < questions.length; index++) {
            var question = questions[index];
            
            resultHTML += '<li>';
            resultHTML += `<h2>Question ${index + 1}: ${question.question}</h2>`;
            resultHTML += '<p><strong>Votre réponse:</strong>';
            if (userResponses[index] === undefined) {
                resultHTML += "undefined"
                resultHTML += '</p>';
                resultHTML += '<p><i>Réponse correcte:';
                resultHTML += typeof question.answer === 'string' ?
                    escapeHtml(question.answer) :
                    Array.isArray(question.answer) ?
                        question.answer.map(correctIndex => question.options[correctIndex]).join(', ') :
                        escapeHtml(question.options[question.answer])
                        + '</i>'
            }
            else {
                if (typeof question.answer === 'string') {
                    resultHTML += escapeHtml(userResponses[index]);
                  
                    if (userResponses[index] === question.answer) {
                        score++; 
                    } else {
                        resultHTML += '</p>';
                        resultHTML += '<p><i>Réponse correcte:';
                        resultHTML += escapeHtml(question.answer) + '</i>'
                    }
                } else if (Array.isArray(question.answer)) {
                    // Sort both user response array and correct answer array before comparison
                    const sortedUserResponse = userResponses[index].slice().sort();
                    const sortedCorrectAnswer = question.answer.slice().sort();
                    // Check if sorted user response array matches sorted correct answer array
                    const userResponseText = userResponses[index].map(responseIndex => question.options[responseIndex]).join(', ');
                    resultHTML += userResponseText;
                    if (arraysEqual(sortedUserResponse, sortedCorrectAnswer)) {
                        score++;
                    } else {

                        resultHTML += '</p>';
                        resultHTML += '<p><i>Réponse correcte:';
                        resultHTML += question.answer.map(correctIndex => question.options[correctIndex]).join(', ') + '</i>';
                    }

                } else {
                    resultHTML += escapeHtml(question.options[userResponses[index]]);
                   
                    if (userResponses[index] == question.answer) {
                        score++; 
                    } else {
                        resultHTML += '</p>';
                        resultHTML += '<p><i>Réponse correcte:';
                        resultHTML += escapeHtml(question.options[question.answer]) + '</i>';
                    }
                }
            }
            resultHTML += '</p>';
            resultHTML += '</li><br>';
        };
        resultHTML += '</ul>';

        resultHTML = `<p>Vous avez obtenu ${score} sur ${questions.length} questions.</p>` + resultHTML;
        feedbackContainer.innerHTML = resultHTML;
        console.log("User Responses:", userResponses); 



    }

    function arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }


    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    const escapeHtml = (unsafe) => {
        return unsafe + "".replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    };
});
