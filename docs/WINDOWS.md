# Mosaico no Windows

## Instalação

Use Windows 10 ou 11 de 64 bits e o instalador `Mosaico-Setup-1.0.0.exe`. O Chromium acompanha o aplicativo; não é preciso instalar o Google Chrome nem configurar um servidor.

O instalador é a opção recomendada para um monitor permanente. A distribuição portátil `Mosaico-Portable-1.0.0.exe` serve para executar o aplicativo sem instalação, mas não oferece início automático com o Windows.

Se o arquivo não estiver assinado digitalmente, o SmartScreen poderá exibir um aviso. Para distribuir o aplicativo publicamente, assine os executáveis com um certificado de publicação. O arquivo `SHA256SUMS.txt` do workflow permite conferir se o download corresponde ao artefato gerado; ele não equivale a uma assinatura digital.

## Montar o painel

1. Abra o Mosaico e adicione uma página com um endereço HTTP ou HTTPS.
2. Para criar outro espaço, selecione um painel e escolha a divisão lado a lado ou em cima e embaixo.
3. Arraste a divisória entre os painéis para definir os tamanhos. O layout pode combinar divisões em diferentes direções.
4. Configure título, endereço, zoom e atualização automática para cada painel. Confirme a alteração no formulário antes de continuar.
5. Escolha o monitor nas configurações e inicie a exibição.

As páginas permanecem interativas: é possível fazer login, clicar em links e preencher formulários. O modo de exibição remove os controles do aplicativo, mas não modifica os cabeçalhos, menus ou barras desenhados pelo próprio site.

Para voltar à edição, use `Ctrl+Shift+E` ou `Esc`. `F11` alterna os modos. Também há um acesso à edição que pode ser revelado pela faixa na borda da tela. O aplicativo permanece em tela cheia nos dois modos.

Para encerrar, use a ação de saída do aplicativo. A área de notificação do Windows também oferece acesso ao Mosaico.

## Início automático

Na versão instalada, a opção de iniciar com o Windows é habilitada por padrão na primeira configuração e pode ser desligada no aplicativo. A inicialização ocorre **quando o usuário entra na própria sessão do Windows**, não antes da tela de login. O aplicativo abre em tela cheia e restaura os painéis configurados; sem páginas, abre o editor.

O Mosaico também respeita a desativação feita em **Gerenciador de Tarefas → Aplicativos de inicialização**. Se não abrir com o Windows, confira essa opção, a configuração do aplicativo e se a versão usada é a instalada.

Não mova manualmente o executável instalado. Se mudar a pasta de instalação, reinstale o aplicativo para atualizar o caminho usado na inicialização.

## Layout, sessões e monitores

O layout é salvo localmente à medida que as alterações são confirmadas. Ao abrir novamente, o aplicativo recupera os endereços, tamanhos e configurações. Cookies e sessões ficam no perfil local do Mosaico; um site ainda pode exigir novo login por expiração ou por política própria.

Exportar o layout gera um JSON com os endereços e as configurações das páginas. Esse arquivo não leva cookies nem senhas, mas URLs podem conter informações particulares. Importe apenas layouts cuja origem você conhece e revise os endereços antes de compartilhar uma exportação.

Use o seletor de monitor quando houver mais de uma tela conectada. Se o monitor escolhido não estiver disponível, o aplicativo utiliza um monitor disponível. Ao trocar resolução ou escala de exibição do Windows, confira se o tamanho de cada painel e o zoom continuam adequados.

## Diagnóstico rápido

| Situação | O que conferir |
| --- | --- |
| Página não carrega | Endereço, conexão à rede, VPN exigida pelo site e validade do certificado HTTPS. Tente recarregar o painel. |
| Site recusa login | Políticas do serviço para navegadores incorporados. O perfil do Mosaico é separado do Google Chrome. |
| Vídeo protegido não toca | Compatibilidade do serviço com Chromium incorporado e suas exigências de DRM. |
| Aplicativo lento | Número de páginas, conteúdo animado, memória disponível e frequência de atualização automática. |
| Não inicia com o Windows | Versão instalada, opção no Mosaico e permissão em Aplicativos de inicialização do Windows. |
| Controles desapareceram | Use `Ctrl+Shift+E` ou `Esc` para abrir a edição. |

Não desative a validação de certificados ou as proteções de segurança do navegador para contornar falhas de um site.

## Verificação manual antes de distribuir

Esta lista documenta verificações que exigem uma sessão real do Windows. A existência do instalador ou um build bem-sucedido não significa que esses testes já foram executados.

- [ ] Instalar em Windows 10/11 x64 e abrir pelo atalho criado.
- [ ] Adicionar dois sites HTTP/HTTPS, navegar e preencher um formulário em cada um.
- [ ] Fazer login em um site e verificar o comportamento da sessão após reiniciar o aplicativo.
- [ ] Criar divisões nas duas direções, redimensionar, remover um painel e conferir a persistência.
- [ ] Entrar no modo de exibição e confirmar que não há abas nem barra de endereço.
- [ ] Voltar à edição por teclado enquanto uma página está em foco.
- [ ] Testar zoom, atualização automática e recarga após uma falha de rede.
- [ ] Exportar, importar e validar um layout; conferir a mensagem ao importar JSON inválido.
- [ ] Ativar o início automático, sair da sessão do Windows, entrar novamente e conferir o layout restaurado.
- [ ] Desativar o início automático no aplicativo e no Gerenciador de Tarefas, conferindo que a preferência é respeitada.
- [ ] Selecionar outro monitor, reiniciar e testar desconexão do monitor escolhido.
- [ ] Conferir escala de exibição do Windows em 100%, 125% e 150%.
- [ ] Testar a versão portátil e confirmar que ela não oferece início automático.
- [ ] Encerrar, reabrir, atualizar e desinstalar o aplicativo.
