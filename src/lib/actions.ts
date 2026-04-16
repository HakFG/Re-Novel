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