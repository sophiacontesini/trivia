import { LOGIN, RESET_SCORE, UPDATE_SCORE } from '../actions';

const INITIAL_STATE = {
  name: '',
  assertions: 0,
  score: 0,
  gravatarEmail: '',
};

const player = (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case LOGIN: {
    return {
      ...state,
      name: action.name,
      gravatarEmail: action.email,
    };
  }
  case UPDATE_SCORE: {
    return {
      ...state,
      score: state.score + action.score,
      assertions: state.assertions + 1,
    };
  }
  case RESET_SCORE: {
    return {
      ...state,
      score: 0,
      assertions: 0,
    };
  }
  default:
    return state;
  }
};

export default player;
