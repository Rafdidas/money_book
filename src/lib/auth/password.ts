export const PASSWORD_MIN_LENGTH = 8;

// bcrypt 계열 해시가 72바이트를 넘는 입력을 잘라내므로 그 앞에서 막는다.
export const PASSWORD_MAX_BYTES = 72;

export const PASSWORD_RULE_MESSAGE =
  "비밀번호는 8자 이상이며 영문과 숫자를 모두 포함해야 합니다.";
export const PASSWORD_TOO_LONG_MESSAGE =
  "비밀번호가 너무 깁니다. 더 짧게 입력해주세요.";
export const PASSWORD_MISMATCH_MESSAGE = "비밀번호가 일치하지 않습니다.";

const hasLetter = /[A-Za-z]/;
const hasDigit = /[0-9]/;

export const getPasswordError = (password: string) => {
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return PASSWORD_TOO_LONG_MESSAGE;
  }

  if (
    password.length < PASSWORD_MIN_LENGTH ||
    !hasLetter.test(password) ||
    !hasDigit.test(password)
  ) {
    return PASSWORD_RULE_MESSAGE;
  }

  return "";
};
