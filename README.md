# Retro TV — app para Android TV

Interface de TV ao vivo (lista de canais, player, guia de programação, favoritos) feita para controle remoto.
Testado em layout para **Grundig 43 GFU 7800B (Android 11)**.

## 1. Gerar o APK (escolha UMA opção)

### Opção A — GitHub (sem instalar nada no PC)
1. Crie um repositório no GitHub e envie todo o conteúdo desta pasta.
2. Abra a aba **Actions > Build APK > Run workflow**.
3. Quando terminar (uns 3 minutos), baixe o artefato **RetroTV-apk** → dentro dele está o `app-debug.apk`.

### Opção B — Android Studio
1. Instale o Android Studio e abra esta pasta (`File > Open`).
2. Espere o Gradle sincronizar.
3. `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
4. O arquivo fica em `app/build/outputs/apk/debug/app-debug.apk`.

## 2. Instalar na TV

### Pelo pendrive
1. Copie o `app-debug.apk` para um pendrive (FAT32/exFAT) e coloque na TV.
2. Na TV, instale um gerenciador de arquivos pela Play Store (ex.: *File Commander* ou *X-plore*).
3. Quando pedir, permita **"Instalar apps de fontes desconhecidas"** para o gerenciador.
4. Abra o pendrive, selecione o APK e instale.

### Pelo app Downloader
1. Instale o app **Downloader** na TV e permita fontes desconhecidas para ele.
2. Coloque o APK num link seu (Drive/Dropbox com link direto) e baixe/instale.

### Por ADB (Wi‑Fi)
1. Na TV: `Configurações > Preferências do dispositivo > Sobre`, clique 7x em "Compilação" para liberar o modo desenvolvedor.
2. Ative **Depuração USB / de rede** e anote o IP da TV.
3. No PC: `adb connect IP_DA_TV:5555` e depois `adb install app-debug.apk`.

O app aparece na tela inicial da Android TV como **Retro TV**.

## 3. Colocar seus canais

Os canais que vêm no app são **demonstração** (nomes da imagem, mas com vídeos de teste).
Para ver canais reais:

1. Abra o app, vá no ícone de **engrenagem** (topo direito).
2. Cole a URL da sua lista **M3U/M3U8** e escolha **Salvar e carregar**.
3. A lista fica guardada e é recarregada toda vez que o app abre.

Use apenas listas e streams que você tem direito de assistir.

## Controles

| Botão | Ação |
|---|---|
| Setas | navegar |
| OK | tocar o canal; OK de novo em tela cheia |
| Segurar OK (1 s) | favoritar / desfavoritar |
| Voltar | sai da tela cheia, volta ao topo, depois fecha o app |
| Canal +/- ou ↑/↓ em tela cheia | trocar de canal |
| Números | ir direto para o canal (ex.: 6) |

## Editar o visual

Tudo da interface está em `app/src/main/assets/` (`index.html`, `style.css`, `app.js`, `channels.js`).
Depois de mudar, gere o APK de novo.
