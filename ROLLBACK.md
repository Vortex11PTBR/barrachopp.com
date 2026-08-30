# Plano de Rollback — Barra Chopp

Como reverter rapidamente uma publicação errada no site.

## Método rápido (preferido): Rollback no Cloudflare Pages

1. **Cloudflare dashboard** → **Workers & Pages** → projeto `barrachopp.com`
2. Aba **Deployments**
3. Identifique o deploy anterior que estava bom → botão **⋯** → **Rollback to this deployment**
4. O site volta em segundos.

> O GitHub continua na versão atual — o rollback no painel não altera o código.

## Método no código: `git revert`

Use quando a correção também precisa voltar no repositório:

1. `git checkout -b revert-hotfix main`
2. `git revert <sha-do-commit-ruim>`
3. `git push origin revert-hotfix` e **abrir PR**
4. A action `validate` roda automaticamente
5. Aprovar o PR → merge na `main` → deploy automático

## Tempos de recuperação

| Método | Tempo | Risco |
|---|---|---|
| Rollback no painel Cloudflare | ~1 minuto | Zero (não mexe no código) |
| `git revert` via PR | ~10 minutos | Baixo (validação roda antes) |

## Como saber que algo quebrou

- **Cloudflare Web Analytics** cai para zero ou dispara alerta
- Visita manual no site (PC + celular)
- O CI `validate` do GitHub fica vermelho no último commit

## Regra de ouro

Nunca corrigir "no susto" direto na `main`. Se for urgente, use o rollback do painel primeiro (volta o site ao normal) e depois corrige o código com calma via PR.
