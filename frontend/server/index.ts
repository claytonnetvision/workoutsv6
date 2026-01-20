import express, { Request, Response } from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar pg
let Client: any = null;

// Função para importar pg dinamicamente
async function importPg() {
  try {
    const pg = await import("pg");
    Client = pg.Client;
    console.log("✅ Módulo 'pg' carregado com sucesso");
  } catch (err) {
    console.error("⚠️ Aviso: módulo 'pg' não encontrado. Usando modo sem banco de dados.");
    Client = null;
  }
}

// Configuração do PostgreSQL
let dbClient: any = null;

async function initDatabase() {
  if (!Client) {
    console.log("ℹ️ Banco de dados desabilitado (módulo pg não encontrado)");
    return;
  }

  try {
    dbClient = new Client({
      connectionString:
        "postgresql://neondb_owner:npg_MAFrdzHZ68vs@ep-soft-frost-aculcnam-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    });

    await dbClient.connect();
    console.log("✅ Conectado ao PostgreSQL Neon");
  } catch (err) {
    console.error("❌ Erro ao conectar ao PostgreSQL:", err);
    dbClient = null;
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Middleware
  app.use(express.json());
  app.use(express.static(path.resolve(__dirname, "..", "dist", "public")));

  // ============================================================================
  // ROTAS DE API PARA TREINOS (DEVEM VIR ANTES DA ROTA CATCH-ALL)
  // ============================================================================

  // GET /api/treinos - Recuperar todos os treinos
  app.get("/api/treinos", async (req: Request, res: Response) => {
    try {
      if (!dbClient) {
        return res.status(503).json({ error: "Banco de dados não disponível" });
      }

      const result = await dbClient.query(
        "SELECT * FROM treinos WHERE deletado = false ORDER BY data DESC"
      );
      res.json(result.rows);
    } catch (err: any) {
      console.error("Erro ao recuperar treinos:", err.message);
      res.status(500).json({ error: "Erro ao recuperar treinos" });
    }
  });

  // GET /api/treinos/dia/:dia - Recuperar treino de um dia específico
  // NOTA: Esta rota deve vir ANTES de /api/treinos/:id
  app.get("/api/treinos/dia/:dia", async (req: Request, res: Response) => {
    try {
      if (!dbClient) {
        return res.status(503).json({ error: "Banco de dados não disponível" });
      }

      const { dia } = req.params;

      const result = await dbClient.query(
        "SELECT * FROM treinos WHERE dia_semana = $1 AND deletado = false ORDER BY data DESC LIMIT 1",
        [dia]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Treino não encontrado para este dia" });
      }

      const treino = result.rows[0];

      // Recuperar seções
      const secoesResult = await dbClient.query(
        "SELECT * FROM secoes_treino WHERE treino_id = $1 ORDER BY ordem",
        [treino.id]
      );

      res.json({
        ...treino,
        sections: secoesResult.rows.map((secao: any) => ({
          id: secao.id,
          title: secao.nome_secao,
          durationMinutes: secao.duracao_minutos,
          content: secao.conteudo
            .split("\n")
            .filter((item: string) => item.trim() !== ""),
        })),
      });
    } catch (err: any) {
      console.error("Erro ao recuperar treino do dia:", err.message);
      res.status(500).json({ error: "Erro ao recuperar treino" });
    }
  });

  // GET /api/treinos/:id - Recuperar um treino específico com suas seções
  app.get("/api/treinos/:id", async (req: Request, res: Response) => {
    try {
      if (!dbClient) {
        return res.status(503).json({ error: "Banco de dados não disponível" });
      }

      const { id } = req.params;

      // Recuperar treino
      const treinoResult = await dbClient.query(
        "SELECT * FROM treinos WHERE id = $1 AND deletado = false",
        [id]
      );

      if (treinoResult.rows.length === 0) {
        return res.status(404).json({ error: "Treino não encontrado" });
      }

      const treino = treinoResult.rows[0];

      // Recuperar seções
      const secoesResult = await dbClient.query(
        "SELECT * FROM secoes_treino WHERE treino_id = $1 ORDER BY ordem",
        [id]
      );

      res.json({
        ...treino,
        sections: secoesResult.rows.map((secao: any) => ({
          id: secao.id,
          title: secao.nome_secao,
          durationMinutes: secao.duracao_minutos,
          content: secao.conteudo
            .split("\n")
            .filter((item: string) => item.trim() !== ""),
        })),
      });
    } catch (err: any) {
      console.error("Erro ao recuperar treino:", err.message);
      res.status(500).json({ error: "Erro ao recuperar treino" });
    }
  });

  // POST /api/treinos - Criar novo treino
  app.post("/api/treinos", async (req: Request, res: Response) => {
    try {
      if (!dbClient) {
        return res.status(503).json({ error: "Banco de dados não disponível" });
      }

      const { data, dia_semana, foco_tecnico, sections } = req.body;

      // Validar dados
      if (!data || !dia_semana || !foco_tecnico || !sections) {
        return res.status(400).json({ error: "Dados incompletos" });
      }

      // Inserir treino
      const treinoResult = await dbClient.query(
        "INSERT INTO treinos (data, dia_semana, foco_tecnico) VALUES ($1, $2, $3) RETURNING id",
        [data, dia_semana, foco_tecnico]
      );

      const treinoId = treinoResult.rows[0].id;

      // Inserir seções
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        await dbClient.query(
          "INSERT INTO secoes_treino (treino_id, nome_secao, duracao_minutos, conteudo, ordem) VALUES ($1, $2, $3, $4, $5)",
          [
            treinoId,
            section.title,
            section.durationMinutes,
            section.content.join("\n"),
            i,
          ]
        );
      }

      res.status(201).json({ id: treinoId, message: "Treino criado com sucesso" });
    } catch (err: any) {
      console.error("Erro ao criar treino:", err.message);
      res.status(500).json({ error: "Erro ao criar treino" });
    }
  });

  // PUT /api/treinos/:id - Atualizar treino
  app.put("/api/treinos/:id", async (req: Request, res: Response) => {
    try {
      if (!dbClient) {
        return res.status(503).json({ error: "Banco de dados não disponível" });
      }

      const { id } = req.params;
      const { data, dia_semana, foco_tecnico, sections } = req.body;

      // Atualizar treino
      await dbClient.query(
        "UPDATE treinos SET data = $1, dia_semana = $2, foco_tecnico = $3, atualizado_em = NOW() WHERE id = $4",
        [data, dia_semana, foco_tecnico, id]
      );

      // Deletar seções antigas
      await dbClient.query("DELETE FROM secoes_treino WHERE treino_id = $1", [id]);

      // Inserir novas seções
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        await dbClient.query(
          "INSERT INTO secoes_treino (treino_id, nome_secao, duracao_minutos, conteudo, ordem) VALUES ($1, $2, $3, $4, $5)",
          [
            id,
            section.title,
            section.durationMinutes,
            section.content.join("\n"),
            i,
          ]
        );
      }

      res.json({ message: "Treino atualizado com sucesso" });
    } catch (err: any) {
      console.error("Erro ao atualizar treino:", err.message);
      res.status(500).json({ error: "Erro ao atualizar treino" });
    }
  });

  // DELETE /api/treinos/:id - Deletar treino (soft delete)
  app.delete("/api/treinos/:id", async (req: Request, res: Response) => {
    try {
      if (!dbClient) {
        return res.status(503).json({ error: "Banco de dados não disponível" });
      }

      const { id } = req.params;

      await dbClient.query(
        "UPDATE treinos SET deletado = true, atualizado_em = NOW() WHERE id = $1",
        [id]
      );

      res.json({ message: "Treino deletado com sucesso" });
    } catch (err: any) {
      console.error("Erro ao deletar treino:", err.message);
      res.status(500).json({ error: "Erro ao deletar treino" });
    }
  });

  // ============================================================================
  // ROTA PARA SERVIR A APLICAÇÃO REACT (DEVE SER A ÚLTIMA)
  // ============================================================================

  app.get("*", (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "..", "dist", "public", "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

// Inicializar banco de dados e depois iniciar servidor
async function main() {
  await importPg();
  await initDatabase();
  await startServer();
}

main().catch(console.error);