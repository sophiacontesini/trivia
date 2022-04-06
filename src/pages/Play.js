import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Header from './components/Header';
import { getTokenAction } from '../redux/actions';
import Timer from './components/Timer';

class Play extends React.Component {
  constructor() {
    super();
    this.state = {
      questions: [],
      index: 0,
      timer: {
        id: 0,
        time: 0,
      },
    };
  }

  componentDidMount = async () => {
    const { token } = this.props;
    const response = await fetch(`https://opentdb.com/api.php?amount=5&token=${token}`);
    const result = await response.json();
    const TRES = 3;
    if (result.response_code === TRES) {
      this.updateToken();
    }
    this.setState({
      questions: result.results,
      index: 0,
    });
    this.enableTimer();
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
      if (time === 0) this.disableTimer();
    });
  }

  mountQuestions = (questions) => {
    const arrayAnswers = questions.incorrect_answers.map((answers, indexAnswers) => (
      <button
        key={ indexAnswers }
        type="button"
        name="alternative"
        data-testid={ `wrong-answer-${indexAnswers}` }
      >
        { answers }
      </button>
    ));
    arrayAnswers.push(
      <button
        key={ arrayAnswers.length }
        type="button"
        name="alternative"
        data-testid="correct-answer"
      >
        { questions.correct_answer }
      </button>,
    );
    const randomAnswers = [];

    const index = () => Math.floor(Math.random() * arrayAnswers.length);
    while (arrayAnswers.length > 0) {
      const randomIndex = index();
      randomAnswers.push(arrayAnswers[randomIndex]);
      arrayAnswers.splice(randomIndex, 1);
    }
    return randomAnswers;
  }

  render() {
    const { questions, index, timer: { time } } = this.state;
    return (
      <>
        <Header />
        <Timer time={ time } />
        { questions[index] !== undefined
          && (
            <div>
              <p data-testid="question-category">{ questions[index].category}</p>
              <p data-testid="question-text">{ questions[index].question }</p>
              <div data-testid="answer-options">
                { questions[index].type === 'boolean'
                && this.mountQuestions(questions[index]) }

                { questions[index].type === 'multiple'
                && this.mountQuestions(questions[index]) }
              </div>

            </div>
          )}
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  token: state.token,
});

const mapDispatchToProps = (dispatch) => ({
  updateToken: () => dispatch(getTokenAction()),
});

Play.propTypes = {
  token: PropTypes.string.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(Play);
