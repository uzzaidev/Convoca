# Runbook iOS - finalizar no Mac

Ultima atualizacao: 2026-06-10.

Este projeto iOS foi gerado no Windows com Capacitor, mas o build, assinatura e envio para App Store Connect precisam acontecer em um Mac.

Requisito atual da Apple: desde 28 de abril de 2026, uploads no App Store Connect precisam ser feitos com Xcode 26 ou mais novo usando SDK iOS/iPadOS 26 ou mais novo.

## Estado ja preparado

- Projeto Xcode criado em `ios/App`.
- Bundle id: `com.convoca.app`.
- Display name: `Convoca`.
- URL scheme: `convoca://`.
- Universal Links previstos:
  - `applinks:convoca.uzzai.com.br`
  - `applinks:convoca.app`
- Push entitlement criado em `ios/App/App/App.entitlements`.
- Permissoes declaradas no `Info.plist`:
  - Camera
  - Photo Library
  - Photo Library Add
  - Face ID
- Background mode para `remote-notification`.
- Deployment target configurado para iOS 15.0.
- Assets iOS gerados a partir de `assets/icon.png` e `assets/splash.png`.

## No Mac

1. Instalar dependencias.

```bash
brew install cocoapods
pnpm install
```

2. Sincronizar o app.

```bash
pnpm build:mobile
pnpm cap:sync
```

3. Instalar pods.

```bash
cd ios/App
pod install
```

4. Abrir no Xcode.

```bash
open App.xcworkspace
```

5. Ajustar Signing & Capabilities no target `App`.

- Team: selecionar a conta Apple Developer.
- Bundle Identifier: `com.convoca.app`.
- Signing: Automatic.
- Capabilities:
  - Push Notifications
  - Associated Domains
  - Background Modes: Remote notifications

6. Firebase/APNs.

- Registrar app iOS `com.convoca.app` no Firebase.
- Baixar `GoogleService-Info.plist`.
- Arrastar `GoogleService-Info.plist` para `ios/App/App` pelo Xcode.
- Confirmar que o arquivo esta no target `App`.
- Criar/subir APNs Auth Key (`.p8`) no Firebase.

7. Associated Domains.

Os dominios precisam servir `apple-app-site-association`.

Template em `docs/mobile-convoca/templates/apple-app-site-association.template.json`.

Substituir `TEAM_ID` pelo Team ID da conta Apple:

```text
TEAM_ID.com.convoca.app
```

8. Build local.

No Xcode:

- Selecionar destino `Any iOS Device (arm64)`.
- Product -> Clean Build Folder.
- Product -> Build.

9. Archive.

No Xcode:

- Product -> Archive.
- Distribute App -> App Store Connect -> Upload.

10. App Store Connect.

- Criar app com bundle `com.convoca.app`.
- Preencher App Privacy.
- Preencher Age Rating.
- Informar conta demo.
- Inserir screenshots.
- Selecionar build enviado.
- Submit for Review.

## Pendencias antes de submeter iOS

- Ter Mac com Xcode 26+.
- Ter Apple Developer Program ativo.
- Configurar Firebase/APNs.
- Publicar `apple-app-site-association` nos dominios.
- Testar login no WebView em device real.
- Testar push em device real.
- Confirmar se pagamentos Stripe no app nao entram em regra de In-App Purchase.
