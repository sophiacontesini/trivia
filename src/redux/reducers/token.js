import { SAVE_TOKEN } from '../actions';

const INITIAL_STATE = {
  token: '',
};

const token = (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case SAVE_TOKEN: {
    return action.payLoad.token;
  }
  default:
    return state;
  }
};

export default token;
