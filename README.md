# Consórcios Abençoada

Painel dos consórcios Randon, com grupos, cotas, contemplações, parcelas e composição dos custos.

## Arquivos

- index.html contém a tela de acesso e a estrutura do painel.
- styles.css contém os estilos e a adaptação para celular e impressão.
- app.js contém o login, filtros, gráficos e detalhes.
- vault.js contém os dados criptografados.
- assets contém as logos fornecidas pela Abençoada.

## Acesso

A senha é entregue ao responsável pelo painel em canal separado. O navegador deriva a chave com PBKDF2-SHA-256 e abre os dados com AES-256-GCM. A chave permanece na sessão da página. O botão Sair recarrega a página e volta à tela de acesso.

Este painel usa um acesso compartilhado. Para trocar a senha ou atualizar os dados, é necessário gerar novamente o arquivo vault.js e publicar a nova versão.

## Fontes

Resumo de Consórcios Randon - Financeiro Atualizado.xlsx, com dados cadastrais do Financeiro. Taxas, composição financeira, histórico e plano de cobrança extraídos do extrato Randon de 12/11/2026.
