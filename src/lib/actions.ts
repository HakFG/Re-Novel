'use server'

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Função auxiliar para serializar dados do Prisma
function serializeData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// Criar nova novel
export async function createNovel(formData: FormData) {
  const titulo = formData.get("titulo") as string;
  const genero = formData.get("genero") as string;

  if (!titulo) {
    throw new Error("Título é obrigatório");
  }

  await prisma.novels.create({
    data: {
      titulo,
      genero: genero || "Fantasia",
      status: "Em Planejamento",
      progresso_total: 0,
    },
  });

  revalidatePath("/");
  redirect("/");
}

// Deletar novel
export async function deleteNovel(id: number) {
  await prisma.novels.delete({
    where: { id },
  });

  revalidatePath("/");
  redirect("/");
}

// Atualizar novel (sinopse, status, etc)
export async function updateNovel(id: number, data: {
  titulo?: string;
  sinopse?: string;
  genero?: string;
  status?: string;
}) {
  await prisma.novels.update({
    where: { id },
    data,
  });

  revalidatePath(`/obra/${id}`);
  revalidatePath("/");
}

// Criar capítulo
export async function createCapitulo(novelId: number, titulo: string) {
  const lastCapitulo = await prisma.capitulos.findFirst({
    where: { novel_id: novelId },
    orderBy: { ordem: 'desc' },
  });

  const novaOrdem = (lastCapitulo?.ordem ?? 0) + 1;

  const capitulo = await prisma.capitulos.create({
    data: {
      novel_id: novelId,
      titulo: titulo || `Capítulo ${novaOrdem}`,
      ordem: novaOrdem,
      status: "Rascunho",
      palavras_contagem: 0,
      conteudo_json: { type: "doc", content: [] },
    },
  });

  revalidatePath(`/obra/${novelId}`);
  revalidatePath(`/escrita/${novelId}`);
  
  // Serializar antes de retornar
  return serializeData(capitulo);
}

// Atualizar conteúdo do capítulo
export async function updateCapituloConteudo(capituloId: number, conteudoJson: any, palavrasContagem: number) {
  await prisma.capitulos.update({
    where: { id: capituloId },
    data: {
      conteudo_json: conteudoJson,
      palavras_contagem: palavrasContagem,
      data_ultima_edicao: new Date(),
    },
  });

  revalidatePath(`/escrita/${capituloId}`);
}

// Buscar capítulos da novel (com serialização)
export async function getCapitulos(novelId: number) {
  const capitulos = await prisma.capitulos.findMany({
    where: { novel_id: novelId },
    orderBy: { ordem: 'asc' },
  });
  
  // Serializar antes de retornar
  return serializeData(capitulos);
}

// Deletar capítulo
export async function deleteCapitulo(capituloId: number, novelId: number) {
  await prisma.capitulos.delete({
    where: { id: capituloId },
  });

  revalidatePath(`/obra/${novelId}`);
  revalidatePath(`/escrita/${novelId}`);
}

// Atualizar progresso total da novel
export async function updateNovelProgresso(novelId: number) {
  const capitulos = await prisma.capitulos.findMany({
    where: { novel_id: novelId },
  });
  
  const totalPalavras = capitulos.reduce((sum, cap) => sum + (cap.palavras_contagem ?? 0), 0);
  const mediaPorCapitulo = capitulos.length > 0 ? totalPalavras / capitulos.length : 0;
  
  const metaPorCapitulo = 2000;
  const progresso = capitulos.length > 0 
    ? Math.min(100, Math.floor((mediaPorCapitulo / metaPorCapitulo) * 100))
    : 0;
  
  await prisma.novels.update({
    where: { id: novelId },
    data: {
      progresso_total: progresso,
    },
  });
}

// ============================================
// NOVAS FUNÇÕES ADICIONADAS
// ============================================

// Atualizar título do capítulo
export async function updateCapituloTitulo(capituloId: number, titulo: string) {
  if (!titulo || titulo.trim() === "") {
    throw new Error("Título não pode estar vazio");
  }

  await prisma.capitulos.update({
    where: { id: capituloId },
    data: { titulo: titulo.trim() },
  });

  // Buscar o novel_id para revalidar o caminho correto
  const capitulo = await prisma.capitulos.findUnique({
    where: { id: capituloId },
    select: { novel_id: true },
  });

  if (capitulo?.novel_id) {
    revalidatePath(`/escrita/${capitulo.novel_id}`);
    revalidatePath(`/obra/${capitulo.novel_id}`);
  }
}

// Atualizar status do capítulo
export async function updateCapituloStatus(capituloId: number, status: string) {
  const statusPermitidos = ["Rascunho", "Revisão", "Publicado"];
  if (!statusPermitidos.includes(status)) {
    throw new Error("Status inválido");
  }

  await prisma.capitulos.update({
    where: { id: capituloId },
    data: { status },
  });

  // Buscar o novel_id para revalidar o caminho correto
  const capitulo = await prisma.capitulos.findUnique({
    where: { id: capituloId },
    select: { novel_id: true },
  });

  if (capitulo?.novel_id) {
    revalidatePath(`/escrita/${capitulo.novel_id}`);
    revalidatePath(`/obra/${capitulo.novel_id}`);
  }
}

// Criar menção (para o sistema de backlinks)
export async function createMencao(data: {
  capituloId: number;
  novelId: number;
  personagemId?: number;
  grimorioId?: number;
  tipo: string;
  posicaoInicio: number;
  posicaoFim: number;
  textoMencionado: string;
}) {
  // Validações
  if (!data.capituloId || !data.novelId || !data.tipo) {
    throw new Error("Dados incompletos para criar menção");
  }

  if (data.tipo === "PERSONAGEM" && !data.personagemId) {
    throw new Error("Personagem ID é obrigatório para menção do tipo PERSONAGEM");
  }

  if (data.tipo === "GRIMORIO" && !data.grimorioId) {
    throw new Error("Grimório ID é obrigatório para menção do tipo GRIMORIO");
  }

  // Verificar se a tabela mencoes existe
  // Se não existir ainda, vamos apenas logar e retornar
  try {
    // Tenta criar a menção (quando a tabela existir)
    // Por enquanto, vamos apenas registrar em uma tabela de logs ou console
    console.log("📝 Menção criada:", {
      ...data,
      timestamp: new Date().toISOString(),
    });

    // Quando você criar a tabela mencoes no schema, descomente o código abaixo:
    /*
    await prisma.mencoes.create({
      data: {
        capitulo_id: data.capituloId,
        novel_id: data.novelId,
        personagem_id: data.personagemId,
        grimorio_id: data.grimorioId,
        tipo: data.tipo,
        posicao_inicio: data.posicaoInicio,
        posicao_fim: data.posicaoFim,
        texto_mencionado: data.textoMencionado,
      },
    });

    revalidatePath(`/escrita/${data.novelId}`);
    revalidatePath(`/obra/${data.novelId}`);
    */
  } catch (error) {
    console.error("Erro ao criar menção:", error);
    // Não vamos lançar o erro para não quebrar a experiência do usuário
  }
}

// Buscar menções de um capítulo
export async function getMencaoByCapitulo(capituloId: number) {
  try {
    // Quando a tabela existir, descomente:
    /*
    const mencoes = await prisma.mencoes.findMany({
      where: { capitulo_id: capituloId },
      include: {
        personagem: { select: { id: true, nome: true, papel: true } },
        grimorio: { select: { id: true, titulo: true, categoria: true } },
      },
      orderBy: { posicao_inicio: 'asc' },
    });
    return serializeData(mencoes);
    */
    
    // Retorno vazio enquanto a tabela não existe
    return [];
  } catch (error) {
    console.error("Erro ao buscar menções:", error);
    return [];
  }
}

// Buscar todas as menções de uma novel (para a página da obra)
export async function getMencaoByNovel(novelId: number) {
  try {
    // Quando a tabela existir, descomente:
    /*
    const mencoes = await prisma.mencoes.findMany({
      where: { novel_id: novelId },
      include: {
        capitulo: { select: { id: true, titulo: true, ordem: true } },
        personagem: { select: { id: true, nome: true, papel: true } },
        grimorio: { select: { id: true, titulo: true, categoria: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    return serializeData(mencoes);
    */
    
    // Retorno vazio enquanto a tabela não existe
    return [];
  } catch (error) {
    console.error("Erro ao buscar menções da novel:", error);
    return [];
  }
}

// Buscar referências (personagens e grimório) com paginação e busca
export async function getReferencias(novelId: number, busca?: string, tipo?: 'personagens' | 'grimorio', limite: number = 50) {
  const result: any = {};

  if (!tipo || tipo === 'personagens') {
    const personagens = await prisma.personagens.findMany({
      where: {
        novel_id: novelId,
        ...(busca ? {
          OR: [
            { nome: { contains: busca, mode: 'insensitive' } },
            { papel: { contains: busca, mode: 'insensitive' } }
          ]
        } : {})
      },
      select: { id: true, nome: true, papel: true, descricao_fisica: true },
      orderBy: { nome: 'asc' },
      take: limite,
    });
    result.personagens = serializeData(personagens);
  }

  if (!tipo || tipo === 'grimorio') {
    const grimorio = await prisma.grimorio.findMany({
      where: {
        novel_id: novelId,
        ...(busca ? {
          OR: [
            { titulo: { contains: busca, mode: 'insensitive' } },
            { categoria: { contains: busca, mode: 'insensitive' } }
          ]
        } : {})
      },
      select: { id: true, titulo: true, categoria: true, conteudo: true },
      orderBy: { titulo: 'asc' },
      take: limite,
    });
    result.grimorio = serializeData(grimorio);
  }

  return result;
}

// Exportar novel completa (backup)
export async function exportNovel(novelId: number) {
  const novel = await prisma.novels.findUnique({
    where: { id: novelId },
    include: {
      capitulos: {
        orderBy: { ordem: 'asc' },
        select: {
          id: true,
          titulo: true,
          ordem: true,
          conteudo_json: true,
          status: true,
          palavras_contagem: true,
          data_ultima_edicao: true,
          notas_autor: true,
        }
      },
      personagens: {
        select: {
          id: true,
          nome: true,
          idade: true,
          papel: true,
          objetivo_neste_volume: true,
          descricao_fisica: true,
          personalidade: true,
          tags: true,
        }
      },
      grimorio: {
        select: {
          id: true,
          titulo: true,
          categoria: true,
          conteudo: true,
          tags: true,
          primeira_mencao_capitulo: true,
        }
      },
      timeline: {
        orderBy: { capitulo_estimado: 'asc' },
        select: {
          id: true,
          evento_nome: true,
          descricao: true,
          capitulo_estimado: true,
          importancia: true,
          concluido: true,
        }
      }
    },
  });

  if (!novel) {
    throw new Error("Novel não encontrada");
  }

  // Adicionar metadata da exportação
  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      novelId: novel.id,
      novelTitle: novel.titulo,
    },
    data: serializeData(novel),
  };

  return exportData;
}

export async function updateNovelStatus(formData: FormData, novelId: number) {
  "use server";
  const status = formData.get("status") as string;
  await prisma.novels.update({
    where: { id: novelId },
    data: { status }
  });
  revalidatePath(`/obra/${novelId}`);
}

export async function updateNovelMeta(formData: FormData, novelId: number) {
  "use server";
  const capitulosEstimados = parseInt(formData.get("capitulos_estimados") as string);
  await prisma.novels.update({
    where: { id: novelId },
    data: { capitulos_estimados: capitulosEstimados || 0 }
  });
  revalidatePath(`/obra/${novelId}`);
}

// Importar novel (restaurar backup)
export async function importNovel(exportData: any) {
  try {
    // Validar estrutura do backup
    if (!exportData.metadata || !exportData.data) {
      throw new Error("Arquivo de backup inválido");
    }

    const { data } = exportData;
    
    // Verificar se já existe uma novel com o mesmo título
    const existingNovel = await prisma.novels.findFirst({
      where: { titulo: data.titulo },
    });

    if (existingNovel) {
      throw new Error(`Já existe uma obra com o título "${data.titulo}". Renomeie o arquivo de backup ou a obra existente.`);
    }

    // Criar a novel com todos os relacionamentos
    const newNovel = await prisma.novels.create({
      data: {
        titulo: data.titulo,
        sinopse: data.sinopse,
        genero: data.genero,
        status: data.status,
        progresso_total: data.progresso_total,
        capitulos_estimados: data.capitulos_estimados,
        link_wattpad: data.link_wattpad,
        config_visual: data.config_visual,
        
        // Criar personagens
        personagens: {
          create: data.personagens?.map((p: any) => ({
            nome: p.nome,
            idade: p.idade,
            papel: p.papel,
            objetivo_neste_volume: p.objetivo_neste_volume,
            descricao_fisica: p.descricao_fisica,
            personalidade: p.personalidade,
            tags: p.tags,
          })) || [],
        },
        
        // Criar grimório
        grimorio: {
          create: data.grimorio?.map((g: any) => ({
            titulo: g.titulo,
            categoria: g.categoria,
            conteudo: g.conteudo,
            tags: g.tags,
            primeira_mencao_capitulo: g.primeira_mencao_capitulo,
          })) || [],
        },
        
        // Criar timeline
        timeline: {
          create: data.timeline?.map((t: any) => ({
            evento_nome: t.evento_nome,
            descricao: t.descricao,
            capitulo_estimado: t.capitulo_estimado,
            importancia: t.importancia,
            concluido: t.concluido,
          })) || [],
        },
        
        // Criar capítulos
        capitulos: {
          create: data.capitulos?.map((c: any) => ({
            titulo: c.titulo,
            ordem: c.ordem,
            conteudo_json: c.conteudo_json,
            status: c.status,
            palavras_contagem: c.palavras_contagem,
            notas_autor: c.notas_autor,
          })) || [],
        },
      },
      include: {
        capitulos: true,
        personagens: true,
        grimorio: true,
        timeline: true,
      },
    });

    revalidatePath("/");
    return serializeData(newNovel);
  } catch (error) {
    console.error("Erro ao importar novel:", error);
    throw error;
  }
}

// Obter estatísticas rápidas da novel
export async function getNovelStats(novelId: number) {
  const [totalCapitulos, totalPersonagens, totalGrimorio, totalTimeline, totalPalavras] = await Promise.all([
    prisma.capitulos.count({ where: { novel_id: novelId } }),
    prisma.personagens.count({ where: { novel_id: novelId } }),
    prisma.grimorio.count({ where: { novel_id: novelId } }),
    prisma.timeline.count({ where: { novel_id: novelId } }),
    prisma.capitulos.aggregate({
      where: { novel_id: novelId },
      _sum: { palavras_contagem: true },
    }),
  ]);


  const capitulosPorStatus = await prisma.capitulos.groupBy({
    by: ['status'],
    where: { novel_id: novelId },
    _count: { status: true },
  });

  const stats = {
    totalCapitulos,
    totalPersonagens,
    totalGrimorio,
    totalTimeline,
    totalPalavras: totalPalavras._sum.palavras_contagem || 0,
    capitulosPorStatus: capitulosPorStatus.map(s => ({
      status: s.status,
      count: s._count.status,
    })),
  };

  

  return stats;

  
}