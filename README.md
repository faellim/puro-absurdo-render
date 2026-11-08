# Puro Absurdo — Renderizador público

Renderizador independente do projeto privado `faellim/puro-absurdo-videos`.

**Aviso:** este repositório contém código-fonte e dados de um episódio que são deliberadamente públicos. Não adicione segredos, gravações privadas ou arquivos que você não possa compartilhar.

## Como usar (celular)
Abra **Actions → Puro Absurdo - Render 2K → Run workflow**. Primeiro selecione `draft`, depois `final2k`. Baixe o MP4 nos artefatos da execução após todas as verificações passarem.

- `draft`: 540 × 960.
- `fullhd`: 1080 × 1920.
- `final2k`: 1440 × 2560.
- Frame rate do episódio: **30 fps**.

Os trabalhos de renderização usam 16 segmentos paralelizáveis e um job final para montagem, mixagem e auditoria. Runners padrão para repositórios públicos não consomem a franquia de minutos de repositórios privados, mas continuam sujeitos a limites da plataforma.

O código de terceiros em `studio3d/reference/` preserva o aviso original de licença MIT (`studio3d/reference/LICENSE`).
