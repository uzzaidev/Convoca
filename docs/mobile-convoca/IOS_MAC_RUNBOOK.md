# Runbook iOS — Build e Deploy via GitHub Actions (sem Mac)

Ultima atualizacao: 2026-06-22.

> **Estratégia atual:** GitHub Actions runner `macos-26` (Xcode 26.5) + fastlane match.
> Não é necessário Mac, Hackintosh ou aluguel de máquina.
>
> Playbook completo com sprints e checklist: `docs/playbooks/ios-ci-sem-mac/README.md`
> Workflow CI pronto: `.github/workflows/ios-release.yml`

---

## Estado já preparado no projeto

- Projeto Xcode em `ios/App`
- Bundle ID: `com.uzzai.convoca`
- Display name: `Convoca`
- URL scheme: `convoca://`
- Universal Links configurados:
  - `applinks:convoca.uzzai.com.br`
  - `applinks:convoca.app`
- Push entitlement em `ios/App/App/App.entitlements` (`aps-environment: production`)
- Permissões no `Info.plist`: Camera, Photo Library, Face ID, Background push
- Deployment target: iOS 15.0
- Assets iOS (ícone e splash) gerados

---

## Como fazer um release iOS

### 1. Pré-requisito único (feito uma vez)

Completar os Sprints iOS-S1 e iOS-S2 do playbook.
Ver `docs/playbooks/ios-ci-sem-mac/README.md`.

### 2. Disparar o workflow

GitHub → Actions → **iOS Release** → Run workflow

Preencher:
- `app_version`: ex. `1.0.0`
- `build_number`: inteiro crescente (ex. `1`, `2`, `3`…)

O CI vai:
1. Rodar no `macos-26` (Xcode 26.5)
2. Instalar certs via `fastlane match`
3. `pnpm build:mobile` → `cap sync ios` → `pod install`
4. `xcodebuild archive`
5. Upload para TestFlight

### 3. Validar no TestFlight

App Store Connect → TestFlight → aguardar processamento (~10–30 min).
Instalar no iPhone → testar login, push, deep link.

### 4. Submeter para revisão

App Store Connect → Convoca → versão → Submit for Review.

---

## Pendências antes do 1º submit

- [ ] Completar Sprints S1–S4 do playbook iOS
- [ ] `apple-app-site-association` publicado na rota pública
- [ ] Screenshots iPhone 6.9" (1320×2868)
- [ ] Confirmar Stripe não entra em IAP (ver playbook S4-6)

---

## Requisito Apple (em vigor desde 28/04/2026)

Todos os uploads ao App Store Connect precisam ser feitos com Xcode 26 ou mais novo,
usando SDK iOS/iPadOS 26 ou mais novo.

O runner `macos-26` do GitHub Actions tem Xcode 26.5 instalado — requisito atendido.
