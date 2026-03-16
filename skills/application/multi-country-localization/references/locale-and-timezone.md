# Localidade e fuso horário

## Regra de localização

- o back-end persiste timestamp em UTC;
- o front-end renderiza data e hora no fuso horário local;
- rótulo pode variar por localidade, mas chave técnica permanece estável;
- formatação de data, número e moeda segue a localidade ativa.

## Regra de texto multilíngue

- o texto exibido ao usuário deve ser resolvido no momento da exibição;
- a chave técnica do texto permanece estável, independentemente do idioma apresentado;
- a resolução do texto deve distinguir rótulo de domínio, rótulo de apresentação e mensagem de UX;
- quando houver variação contextual de texto, o fallback oficial deve seguir esta ordem: país, local, usuário.

## Regra de fallback

1. país: aplica texto padrão do país quando houver necessidade de terminologia nacional, idioma dominante ou convenção regulatória;
2. local: sobrescreve o texto do país quando a operação local exigir vocabulário próprio;
3. usuário: sobrescreve país e local apenas para preferência de exibição individual, sem alterar contexto operacional persistido.

## Regra operacional

- o grão de negócio continua diário;
- visão semanal existe apenas como opção de relatório;
- não há necessidade de controle semanal específico por país.
