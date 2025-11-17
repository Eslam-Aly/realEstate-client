import reducer, {
  signInStart,
  signInSuccess,
  signInFailure,
  updateUserStart,
  updateUserSuccess,
  updateUserFaliure,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFaliure,
  signOutStart,
  signOutSuccess,
  signOutFaliure,
} from "../../../../src/redux/user/userSlice.js";

const initial = {
  currentUser: null,
  user: null,
  error: null,
  loading: false,
};

describe("user slice reducers", () => {
  it("handles sign in lifecycle", () => {
    const loadingState = reducer(initial, signInStart());
    expect(loadingState.loading).toBe(true);

    const user = { id: "u1", email: "test@example.com" };
    const successState = reducer(loadingState, signInSuccess(user));
    expect(successState.loading).toBe(false);
    expect(successState.currentUser).toEqual(user);
    expect(successState.error).toBeNull();

    const failureState = reducer(successState, signInFailure("boom"));
    expect(failureState.loading).toBe(false);
    expect(failureState.error).toBe("boom");
  });

  it("handles update lifecycle", () => {
    const startState = reducer(initial, updateUserStart());
    expect(startState.loading).toBe(true);
    const updatedUser = { id: "u2", name: "Jane" };
    const successState = reducer(startState, updateUserSuccess(updatedUser));
    expect(successState.currentUser).toEqual(updatedUser);
    expect(successState.loading).toBe(false);
    expect(successState.error).toBeNull();

    const failure = reducer(successState, updateUserFaliure("oops"));
    expect(failure.loading).toBe(false);
    expect(failure.error).toBe("oops");
  });

  it("handles delete lifecycle", () => {
    const start = reducer(
      { ...initial, currentUser: { id: "u1" } },
      deleteUserStart()
    );
    expect(start.loading).toBe(true);
    const success = reducer(start, deleteUserSuccess());
    expect(success.currentUser).toBeNull();
    expect(success.error).toBeNull();
    expect(success.loading).toBe(false);

    const failure = reducer(success, deleteUserFaliure("fail"));
    expect(failure.error).toBe("fail");
    expect(failure.loading).toBe(false);
  });

  it("handles sign out lifecycle", () => {
    const start = reducer(
      { ...initial, currentUser: { id: "u1" } },
      signOutStart()
    );
    expect(start.loading).toBe(true);
    const success = reducer(start, signOutSuccess());
    expect(success.currentUser).toBeNull();
    expect(success.error).toBeNull();
    expect(success.loading).toBe(false);

    const failure = reducer(success, signOutFaliure("error"));
    expect(failure.error).toBe("error");
    expect(failure.loading).toBe(false);
  });
});
