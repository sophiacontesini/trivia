import md5 from 'crypto-js/md5';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import he from 'he';
import {
  getTokenAction, resetScoreboardAction, updateScoreboardAction,
} from '../redux/actions';
import Header from './components/Header';
import Timer from './components/Timer';
import './css/header.css';
import './css/play.css';
import Button from './components/Button';
import Questions from './components/Questions';

const ZERO = 0;
const ONE = 1;
const TWO = 2;
const THREE = 3;
const FOUR = 4;
const FIVE = 5;
const TEN = 10;
const WRONG_ANSWER = 'wrong-answer';
const CORRECT_ANSWER = 'correct-answer';

class Play extends React.Component {
  constructor() {
    super();
    this.state = {
      questions: [],
      alternatives: [],
      currentIndex: 0,
      isAnswered: false,
      timer: { id: 0, time: 0 },
    };
  }

  componentDidMount = async () => {
    const { name, history } = this.props;
    if (!name) history.push('/');
    const { token, updateToken, resetScoreboard, config } = this.props;
    const { category, difficulty, type } = config;
    try {
      const parameters = (category ? `&category=${category}` : '')
      + (difficulty ? `&difficulty=${difficulty}` : '')
      + (type ? `&type=${type}` : '');
      const response = await fetch(`https://opentdb.com/api.php?amount=5&token=${token + parameters}`);
      const result = await response.json();
      if (result.response_code === THREE) updateToken();
      this.setState({
        questions: result.results,
        currentIndex: 0,
      });
      resetScoreboard();
      this.mountRandomQuestions();
      this.enableTimer();
    } catch (error) {
      console.log(error);
    }
  }

  enableTimer = () => {
    const oneSecond = 1000;
    const id = setInterval(this.changeTime, oneSecond);
    this.setState({
      timer: {
        id,
        time: 30,
      },
    });
  }

  disableTimer = () => {
    const { timer: { id } } = this.state;
    window.clearInterval(id);
  }

  changeTime = () => {
    this.setState(({ timer }) => ({
      timer: {
        ...timer,
        time: (timer.time - 1),
      },
    }), () => {
      const { timer: { time } } = this.state;
      if (time === 0) {
        this.disableTimer();
        this.wrongAnswer();
      }
    });
  }

  mountRandomQuestions = () => {
    const { questions, currentIndex } = this.state;
    const answers = questions[currentIndex].incorrect_answers.map((answer) => ({
      answer,
      isTheCorrect: WRONG_ANSWER,
    }));
    answers.push({
      answer: questions[currentIndex].correct_answer,
      isTheCorrect: CORRECT_ANSWER,
    });
    const randomAnswers = [];
    const index = () => Math.floor(Math.random() * answers.length);
    while (answers.length > 0) {
      const randomIndex = index();
      randomAnswers.push(answers[randomIndex]);
      answers.splice(randomIndex, 1);
    }
    this.setState({ alternatives: randomAnswers });
  }

  mountQuestions = () => {
    const { alternatives, isAnswered } = this.state;
    const arrayAnswers = alternatives.map(({ answer, isTheCorrect }, indexAnswers) => (
      <button
        key={ indexAnswers }
        type="button"
        className={ isAnswered ? isTheCorrect : null }
        disabled={ isAnswered }
        data-testid={
          isTheCorrect === WRONG_ANSWER
            ? `${WRONG_ANSWER}-${indexAnswers}`
            : CORRECT_ANSWER
        }
        onClick={ isTheCorrect === WRONG_ANSWER ? this.wrongAnswer : this.rightAnswer }
      >
        <p
          className=" alternativa  text-gray-800 font-semibold
             rounded "
        >
          <p className="testando">
            { he.decode(answer) }
          </p>
        </p>
      </button>
    ));

    return arrayAnswers;
  }

  rightAnswer = () => {
    const { timer, questions, currentIndex } = this.state;
    const { difficulty } = questions[currentIndex];
    let difficultyValue = ZERO;
    if (difficulty === 'hard') {
      difficultyValue = THREE;
    } else if (difficulty === 'medium') {
      difficultyValue = TWO;
    } else if (difficulty === 'easy') {
      difficultyValue = ONE;
    }
    this.setState({ isAnswered: true });
    const score = TEN + (timer.time * difficultyValue);
    const { updateScoreboard } = this.props;
    updateScoreboard(score);
    this.disableTimer();
  }

  wrongAnswer = () => {
    this.setState({ isAnswered: true });
    this.disableTimer();
  }

  saveInLocalStore = () => {
    const { name, score, email } = this.props;
    const hash = md5(email).toString();
    const players = JSON.parse(localStorage.getItem('ranking'));
    if (players !== null) {
      localStorage.setItem('ranking', JSON.stringify([...players, { name, score, picture: `https://www.gravatar.com/avatar/${hash}` }]));
    } else {
      localStorage.setItem('ranking', JSON.stringify([{ name, score, picture: `https://www.gravatar.com/avatar/${hash}` }]));
    }
  }

  changeQuestion = (index) => {
    const { history } = this.props;
    if (index === FOUR) {
      this.saveInLocalStore();
      history.push('/feedback');
    }
    if (index < FIVE) {
      this.setState((prevState) => ({
        currentIndex: prevState.currentIndex + 1,
        isAnswered: false,
      }), () => {
        this.mountRandomQuestions();
        this.enableTimer();
      });
    }
  }

  render() {
    const { questions, currentIndex, timer: { time }, isAnswered } = this.state;
    return (
      <div className="bg">
        <Timer time={ time } />
        { questions[currentIndex] !== undefined
          && (
            <div className="question-form">
              <Header />
              <Questions
                questions={ questions }
                currentIndex={ currentIndex }
                mountQuestions={ this.mountQuestions }
              />
              { isAnswered
                && (
                  <Button
                    changeQuestion={ this.changeQuestion }
                    currentIndex={ currentIndex }
                  />
                )}
            </div>
          )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  token: state.token,
  name: state.player.name,
  score: state.player.score,
  email: state.player.gravatarEmail,
  config: state.config,
});

const mapDispatchToProps = (dispatch) => ({
  updateToken: () => dispatch(getTokenAction()),
  updateScoreboard: (score) => dispatch(updateScoreboardAction(score)),
  resetScoreboard: () => dispatch(resetScoreboardAction()),
});

Play.propTypes = {
  token: PropTypes.string.isRequired,
  updateToken: PropTypes.func.isRequired,
  updateScoreboard: PropTypes.func.isRequired,
  resetScoreboard: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  score: PropTypes.number.isRequired,
  history: PropTypes.shape({ push: PropTypes.func }).isRequired,
  config: PropTypes.shape(
    { category: PropTypes.string, difficulty: PropTypes.string, type: PropTypes.string },
  ).isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(Play);
