// Additive: merges forgot password keys into every locale's auth section.
const fs = require('fs');
const path = require('path');

const KEYS = {
  en: {
    forgotPassword: 'Forgot password?',
    resetTitle: 'Reset your password',
    resetSubtitle: 'Enter your email and we send you a reset code.',
    sendCode: 'Send reset code',
    newPassword: 'New password',
    resetCta: 'Set new password',
    resetFailed: 'Password reset failed. Please try again.',
    backToSignIn: 'Back to sign in',
    passwordTooShort: 'The password must have at least 8 characters.',
  },
  de: {
    forgotPassword: 'Passwort vergessen?',
    resetTitle: 'Passwort zurücksetzen',
    resetSubtitle: 'Geben Sie Ihre E-Mail ein und wir senden Ihnen einen Code.',
    sendCode: 'Code senden',
    newPassword: 'Neues Passwort',
    resetCta: 'Neues Passwort speichern',
    resetFailed: 'Zurücksetzen fehlgeschlagen. Bitte versuchen Sie es erneut.',
    backToSignIn: 'Zurück zur Anmeldung',
    passwordTooShort: 'Das Passwort muss mindestens 8 Zeichen haben.',
  },
  es: {
    forgotPassword: '¿Olvidó su contraseña?',
    resetTitle: 'Restablezca su contraseña',
    resetSubtitle: 'Introduzca su correo y le enviamos un código.',
    sendCode: 'Enviar código',
    newPassword: 'Nueva contraseña',
    resetCta: 'Guardar nueva contraseña',
    resetFailed: 'No se pudo restablecer. Inténtelo de nuevo.',
    backToSignIn: 'Volver a iniciar sesión',
    passwordTooShort: 'La contraseña debe tener al menos 8 caracteres.',
  },
  fr: {
    forgotPassword: 'Mot de passe oublié ?',
    resetTitle: 'Réinitialisez votre mot de passe',
    resetSubtitle: 'Saisissez votre email et nous vous envoyons un code.',
    sendCode: 'Envoyer le code',
    newPassword: 'Nouveau mot de passe',
    resetCta: 'Enregistrer le nouveau mot de passe',
    resetFailed: 'La réinitialisation a échoué. Réessayez.',
    backToSignIn: 'Retour à la connexion',
    passwordTooShort: 'Le mot de passe doit contenir au moins 8 caractères.',
  },
  it: {
    forgotPassword: 'Password dimenticata?',
    resetTitle: 'Reimposta la tua password',
    resetSubtitle: 'Inserisci la tua email e ti inviamo un codice.',
    sendCode: 'Invia codice',
    newPassword: 'Nuova password',
    resetCta: 'Salva la nuova password',
    resetFailed: 'Reimpostazione non riuscita. Riprova.',
    backToSignIn: 'Torna all accesso',
    passwordTooShort: 'La password deve avere almeno 8 caratteri.',
  },
  pl: {
    forgotPassword: 'Nie pamiętasz hasła?',
    resetTitle: 'Zresetuj hasło',
    resetSubtitle: 'Podaj swój email, a my wyślemy Ci kod.',
    sendCode: 'Wyślij kod',
    newPassword: 'Nowe hasło',
    resetCta: 'Zapisz nowe hasło',
    resetFailed: 'Reset nie powiódł się. Spróbuj ponownie.',
    backToSignIn: 'Wróć do logowania',
    passwordTooShort: 'Hasło musi mieć co najmniej 8 znaków.',
  },
  ru: {
    forgotPassword: 'Забыли пароль?',
    resetTitle: 'Сброс пароля',
    resetSubtitle: 'Введите ваш email, и мы отправим вам код.',
    sendCode: 'Отправить код',
    newPassword: 'Новый пароль',
    resetCta: 'Сохранить новый пароль',
    resetFailed: 'Не удалось сбросить пароль. Попробуйте еще раз.',
    backToSignIn: 'Назад ко входу',
    passwordTooShort: 'Пароль должен содержать не менее 8 символов.',
  },
  tr: {
    forgotPassword: 'Şifrenizi mi unuttunuz?',
    resetTitle: 'Şifrenizi sıfırlayın',
    resetSubtitle: 'E postanızı girin, size bir kod gönderelim.',
    sendCode: 'Kod gönder',
    newPassword: 'Yeni şifre',
    resetCta: 'Yeni şifreyi kaydet',
    resetFailed: 'Sıfırlama başarısız oldu. Lütfen tekrar deneyin.',
    backToSignIn: 'Girişe geri dön',
    passwordTooShort: 'Şifre en az 8 karakter olmalıdır.',
  },
  uk: {
    forgotPassword: 'Забули пароль?',
    resetTitle: 'Скидання пароля',
    resetSubtitle: 'Введіть ваш email, і ми надішлемо вам код.',
    sendCode: 'Надіслати код',
    newPassword: 'Новий пароль',
    resetCta: 'Зберегти новий пароль',
    resetFailed: 'Не вдалося скинути пароль. Спробуйте ще раз.',
    backToSignIn: 'Назад до входу',
    passwordTooShort: 'Пароль має містити щонайменше 8 символів.',
  },
};

const dir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
for (const [locale, entries] of Object.entries(KEYS)) {
  const file = path.join(dir, `${locale}.json`);
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  Object.assign(json.auth, entries);
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
  console.log(`${locale}: +${Object.keys(entries).length} keys`);
}
