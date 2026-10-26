# Mosaico

Um aplicativo para Windows que transforma um monitor em um painel de páginas web interativas. Divida a tela, ajuste o tamanho de cada página e apresente tudo em tela cheia, sem abas ou barra de endereço do navegador.

O navegador integrado usa **Chromium, por meio do Electron**, a mesma base do Google Chrome. Não é necessário instalar o Chrome separadamente.

## O que você pode fazer

- Abrir várias páginas e continuar usando cliques, formulários e login.
- Dividir qualquer painel lado a lado ou em cima e embaixo, e arrastar as divisórias para redimensionar.
- Ajustar o título, a URL, o zoom e o intervalo de atualização de cada página.
- Alternar entre a edição do layout e a exibição em tela cheia.
- Restaurar o layout e as sessões ao reabrir o aplicativo.
- Escolher em qual monitor o aplicativo deve abrir.
- Iniciar automaticamente ao entrar no Windows, com opção de desativação.
- Exportar e importar o layout em JSON.

Mais páginas consomem mais memória e processamento. O número de divisões viável depende dos sites, da resolução do monitor e do computador.

## Usar no Windows

O alvo de distribuição é **Windows 10 ou 11, de 64 bits**. Gere o instalador com as instruções abaixo ou obtenha o artefato de uma execução bem-sucedida do workflow `Windows` do repositório.

1. Execute `Mosaico-Setup-1.0.1.exe` e abra o aplicativo.
2. Adicione a primeira página, informando o endereço do site.
3. Selecione um painel para dividi-lo ou alterar suas configurações.
4. Arraste as divisórias para ajustar o layout e inicie a exibição.
5. Use `Ctrl+Shift+E` para voltar à edição.

A versão instalada pode iniciar automaticamente na sessão do usuário do Windows. A versão portátil permite testar o aplicativo, mas não oferece início automático: seu executável interno é extraído para uma pasta temporária. Veja [instalação, uso e verificações no Windows](docs/WINDOWS.md).

## Atalhos

| Atalho | Ação |
| --- | --- |
| `Ctrl+Shift+E` | Voltar à edição do layout |
| `Esc` | Voltar à edição |
| `F11` | Alternar entre edição e exibição |

O modo de exibição oculta os controles do Mosaico. Uma pequena faixa na borda da tela permite revelar o acesso à edição; os atalhos também funcionam quando uma página está em foco. Os menus e elementos que fazem parte do próprio site continuam sendo exibidos.

## Desenvolvimento

Requisitos: Node.js 24 e npm. O código usa TypeScript, React, Vite e Electron. As páginas são abertas em `WebContentsView` nativas; não dependem de incorporação em `iframe`.

```sh
npm ci
npm run dev
```

O `postinstall` baixa automaticamente o runtime do Electron 45 para a plataforma atual. A instalação das dependências precisa de acesso ao registro npm e aos servidores de download do Electron; não é necessário baixar o Chromium à parte.

O aplicativo precisa de uma sessão gráfica. Abrir somente a interface no navegador não fornece o navegador integrado nem a integração com o Windows.

```sh
npm run typecheck
npm test
npm run build
```

Os testes de integração do aplicativo têm comando separado:

```sh
npm run test:e2e
```

## Gerar o instalador

No Windows, na raiz do projeto:

```powershell
npm ci
npm run dist:win
```

Os artefatos são gravados em `release/`:

- `Mosaico-Setup-1.0.1.exe`: instalador recomendado.
- `Mosaico-Portable-1.0.1.exe`: execução portátil, sem início automático.

O workflow [Windows](.github/workflows/windows.yml) executa verificações, gera os executáveis e anexa os arquivos e seus hashes SHA-256 à execução do GitHub Actions. Ele não publica uma release automaticamente. A geração do instalador não substitui os testes manuais de instalação e inicialização no Windows.

Os executáveis de desenvolvimento não possuem assinatura digital. O Windows pode apresentar um aviso do SmartScreen. Para distribuição pública, configure um certificado de assinatura antes de publicar o instalador.

## Dados e compatibilidade

O layout e o perfil de navegação são armazenados localmente, no diretório de dados do aplicativo do usuário. O Mosaico não utiliza nem importa automaticamente o perfil do Google Chrome. A exportação do layout contém endereços e configurações dos painéis; não inclui cookies, senhas ou sessões de login.

Sites continuam sujeitos às próprias políticas de autenticação e reprodução de mídia. Serviços com DRM, extensões do Chrome ou provedores que recusam navegadores incorporados podem não funcionar. O aplicativo mantém a validação de certificados HTTPS e não remove as proteções de segurança dos sites.

Não há servidor de aplicação, conta Mosaico ou credencial externa obrigatória para usar o aplicativo. Cada página precisa ter acesso à sua rede e, quando necessário, às credenciais do próprio site.

## Pacote ZIP para Windows

O pacote `release/Mosaico-Windows-1.0.1.zip` contém o aplicativo completo. Extraia a pasta **Mosaico** para um local permanente, por exemplo `Documentos\Mosaico`, e execute `Mosaico.exe`. Mantenha os arquivos juntos e não execute dentro do ZIP. Essa versão permite **Abrir com o Windows**; não mova a pasta após ativar a opção.

Em **Configurações → Monitor ao iniciar com o Windows**, selecione o monitor. A escolha é salva, aplicada imediatamente e restaurada na próxima abertura. Se o monitor não estiver conectado, o principal é usado.

Validação nesta entrega: TypeScript, 25 testes unitários e seis testes de integração Electron passaram no Linux. As páginas reais foram verificadas em display virtual, inclusive arraste e restauração de sessões/monitor. Os testes gráficos usam sandbox desativado somente no contêiner de testes por limitação de namespaces; a aplicação distribuída mantém o sandbox habilitado. Inicialização após login, múltiplos monitores físicos e instalação NSIS ainda precisam da validação Windows descrita no guia.
