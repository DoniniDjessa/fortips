export type Lang = "fr" | "en";

export const t = (lang: Lang, key: string): string => {
  const dict = dictionaries[lang] ?? dictionaries.fr;
  return key.split(".").reduce((acc: any, k) => (acc ? acc[k] : undefined), dict) ?? key;
};

export const dictionaries: Record<Lang, any> = {
  fr: {
    app: {
      name: "Fortips",
    },
    auth: {
      login: "Connexion",
      register: "Inscription",
      emailOrPseudo: "Email ou Pseudo",
      email: "Email",
      pseudo: "Pseudo",
      password: "Mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      signIn: "Se connecter",
      createAccount: "Créer un compte",
      needAccount: "Pas de compte ?",
      haveAccount: "Déjà inscrit ?",
      fillAll: "Veuillez remplir tous les champs",
      requiredEmailOrPseudo: "Email ou pseudo requis",
      pwdsNoMatch: "Les mots de passe ne correspondent pas",
    },
  },
  en: {
    app: {
      name: "Fortips",
    },
    auth: {
      login: "Login",
      register: "Register",
      emailOrPseudo: "Email or Username",
      email: "Email",
      pseudo: "Username",
      password: "Password",
      confirmPassword: "Confirm password",
      signIn: "Sign in",
      createAccount: "Create account",
      needAccount: "No account?",
      haveAccount: "Already have an account?",
      fillAll: "Please fill all fields",
      requiredEmailOrPseudo: "Email or username required",
      pwdsNoMatch: "Passwords do not match",
    },
  },
};


