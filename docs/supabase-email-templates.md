# Supabase 인증 메일 템플릿

Supabase 대시보드 → Authentication → Email Templates 에 붙여넣는 값이다.
코드에서 관리되지 않으므로, 템플릿을 수정하면 이 문서도 함께 갱신한다.

브랜드 색은 `src/app/auth/auth.scss`의 `--auth-brand`(`#3182f6`)와 맞췄다.

## 메일 HTML 작성 규칙

- 스타일은 태그에 인라인으로 넣는다. `<style>` 블록을 제거하는 클라이언트가 많다.
- 레이아웃은 `<table>`로 짠다. flexbox와 grid는 Outlook에서 깨진다.
- 웹폰트는 대부분 무시되므로 시스템 폰트 스택을 쓴다.
- 이미지는 절대 URL이어야 하고, 상당수 클라이언트가 기본 차단하므로 이미지 없이도
  내용이 전달되어야 한다. 아래 템플릿은 이미지를 쓰지 않는다.
- 기본 SMTP를 쓰는 동안에는 Supabase 홍보 문구가 본문 하단에 자동으로 붙는다.
  제거하려면 커스텀 SMTP를 연결해야 한다.

## Reset Password

**Subject**

```
[머니북가계부] 비밀번호 재설정 안내
```

**Message body**

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f9;margin:0;padding:32px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Malgun Gothic','맑은 고딕',AppleSDGothicNeo-Regular,'Apple SD Gothic Neo',sans-serif;">
        <tr>
          <td style="background-color:#3182f6;padding:28px 32px;">
            <span style="display:inline-block;width:28px;height:28px;line-height:28px;background-color:#ffffff;color:#3182f6;font-size:16px;font-weight:700;text-align:center;border-radius:8px;">M</span>
            <span style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:-0.3px;padding-left:8px;vertical-align:middle;">머니북가계부</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px 8px;">
            <h1 style="margin:0 0 12px;color:#191f28;font-size:22px;font-weight:800;letter-spacing:-0.6px;">비밀번호를 재설정해주세요</h1>
            <p style="margin:0;color:#4e5968;font-size:15px;line-height:1.6;">
              아래 버튼을 누르면 새 비밀번호를 설정할 수 있어요.<br />
              <strong style="color:#191f28;">재설정을 요청한 기기의 같은 브라우저</strong>에서 열어주세요.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 8px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td align="center" style="background-color:#3182f6;border-radius:12px;">
                  <a href="{{ .ConfirmationURL }}" style="display:block;padding:15px 24px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:-0.3px;">비밀번호 재설정하기</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 0;">
            <p style="margin:0;color:#8b95a1;font-size:13px;line-height:1.6;">
              버튼이 눌리지 않으면 아래 주소를 복사해 브라우저에 붙여넣어 주세요.
            </p>
            <p style="margin:8px 0 0;word-break:break-all;">
              <a href="{{ .ConfirmationURL }}" style="color:#3182f6;font-size:13px;line-height:1.6;text-decoration:underline;">{{ .ConfirmationURL }}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f9;border-radius:12px;">
              <tr>
                <td style="padding:16px 18px;">
                  <p style="margin:0;color:#4e5968;font-size:13px;line-height:1.7;">
                    · 이 링크는 일정 시간이 지나면 사용할 수 없어요.<br />
                    · 비밀번호를 바꾸면 다른 기기의 로그인은 모두 해제돼요.<br />
                    · 본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다. 비밀번호는 그대로 유지돼요.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 32px;">
            <p style="margin:0;color:#b0b8c1;font-size:12px;line-height:1.6;">
              머니북가계부 · 수입·지출·저축·투자를 한곳에서
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

## Confirm signup

현재 가입 시 이메일 인증은 비활성 상태라 발송되지 않는다. 다시 활성화하는 경우
위 템플릿의 구조를 그대로 쓰고 문구만 아래로 바꾼다.

- 제목: `[머니북가계부] 이메일 인증을 완료해주세요`
- 제목 문구: `이메일 인증을 완료해주세요`
- 본문 문구: `아래 버튼을 누르면 가입이 완료돼요.`
- 버튼 문구: `이메일 인증하기`
- 안내 문구에서 "다른 기기의 로그인은 모두 해제돼요" 줄은 제거한다.
