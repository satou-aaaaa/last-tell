// 組み立てたゲームのスクリプト用（開発と設計のベストプラクティス 案2）
// error：止める（文法以外の本当の間違い）／warn：知らせるだけ
import globals from "globals";
export default [{
  files: ["**/*.js"],
  languageOptions: { ecmaVersion: 2022, sourceType: "script", globals: { ...globals.browser } },
  rules: {
    "no-undef": "error", "no-redeclare": "error", "no-dupe-keys": "error", "no-unreachable": "error",
    "no-self-assign": "error", "no-dupe-else-if": "error", "no-func-assign": "off",
    "no-unused-vars": ["warn", { vars: "local", args: "none", caughtErrors: "none" }],
    "no-cond-assign": "warn", "no-fallthrough": "warn"
  }
}];
