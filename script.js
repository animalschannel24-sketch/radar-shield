import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const SUPABASE_URL = "https://grkjvkhukizetjmszllm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_tjMHhHDymhlazNWD8UPr4g_79o03fhZ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const UFS_BRASIL = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]);

let cidadesIBGE = new Set();
let cidadesCarregadas = false;

function getElement(id) {
  return document.getElementById(id);
}

function valorOuNull(id) {
  const elemento = getElement(id);
  if (!elemento) return null;

  const valor = elemento.value?.trim();
  return valor ? valor : null;
}

function textoLimitado(id, maximo) {
  const valor = valorOuNull(id);
  if (!valor) return null;
  return valor.slice(0, maximo);
}

function dataOuNull(id) {
  const valor = valorOuNull(id);
  if (!valor) return null;

  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

function somenteDigitos(valor) {
  return (valor || "").replace(/\D/g, "");
}

function letrasENumerosMaiusculos(valor) {
  return (valor || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function somenteLetrasEspacosHifenAcentos(valor) {
  return (valor || "").replace(/[^a-zA-ZÀ-ÿ\s'-]/g, "");
}

function removerAcentos(valor) {
  return (valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizarTextoComparacao(valor) {
  return removerAcentos(valor)
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function aplicarMaxLength(id, maximo) {
  const campo = getElement(id);
  if (!campo) return;
  campo.maxLength = maximo;
}

function configurarLimitesHTML() {
  aplicarMaxLength("protocolo", 50);
  aplicarMaxLength("canal-entrada", 50);
  aplicarMaxLength("unidade", 100);
  aplicarMaxLength("nome-associado", 120);
  aplicarMaxLength("doc-associado", 14);
  aplicarMaxLength("id-contrato", 50);
  aplicarMaxLength("placa-veiculo", 7);
  aplicarMaxLength("cidade-evento", 80);
  aplicarMaxLength("uf-evento", 2);
  aplicarMaxLength("local-evento", 150);
  aplicarMaxLength("resumo-evento", 1000);
}

async function carregarCidadesIBGE() {
  if (cidadesCarregadas) return;

  try {
    const resposta = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios");
    const dados = await resposta.json();

    cidadesIBGE = new Set(
      dados.map((cidade) => normalizarTextoComparacao(cidade.nome))
    );

    cidadesCarregadas = true;
  } catch (error) {
    console.error("Não foi possível carregar a lista de cidades do IBGE.", error);
  }
}

function placaValida(placa) {
  if (!placa) return false;

  const placaNormal = letrasENumerosMaiusculos(placa);

  const padraoAntigo = /^[A-Z]{3}[0-9]{4}$/;
  const padraoMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

  return padraoAntigo.test(placaNormal) || padraoMercosul.test(placaNormal);
}

function cidadeValida(nomeCidade) {
  if (!nomeCidade) return true;
  if (!cidadesCarregadas) return true;

  return cidadesIBGE.has(normalizarTextoComparacao(nomeCidade));
}

function validarCampo(campo) {
  if (!campo) return true;

  const id = campo.id;
  const valor = campo.value?.trim() || "";
  let mensagem = "";

  if (id === "protocolo" && valor.length > 50) {
    mensagem = "O protocolo pode ter no máximo 50 caracteres.";
  }

  if (id === "doc-associado" && valor) {
    const cpf = somenteDigitos(valor);

    if (cpf.length < 11) {
      mensagem = "O CPF deve ter 11 números.";
    } else if (cpf.length > 11) {
      mensagem = "O CPF deve ter no máximo 11 números.";
    }
  }

  if (id === "placa-veiculo" && valor) {
    if (!placaValida(valor)) {
      mensagem = "A placa deve estar em formato válido, como ABC1234 ou ABC1D23.";
    }
  }

  if (id === "uf-evento" && valor) {
    const uf = valor.toUpperCase();

    if (uf.length !== 2) {
      mensagem = "A UF deve ter exatamente 2 letras.";
    } else if (!UFS_BRASIL.has(uf)) {
      mensagem = "Informe uma sigla de estado válida do Brasil.";
    }
  }

  if (id === "nome-associado" && valor.length > 120) {
    mensagem = "O nome do associado pode ter no máximo 120 caracteres.";
  }

  if (id === "cidade-evento" && valor) {
    if (valor.length > 80) {
      mensagem = "A cidade do evento pode ter no máximo 80 caracteres.";
    } else if (!cidadeValida(valor)) {
      mensagem = "Informe uma cidade brasileira válida.";
    }
  }

  if (id === "local-evento" && valor.length > 150) {
    mensagem = "O local do evento pode ter no máximo 150 caracteres.";
  }

  if (id === "resumo-evento" && valor.length > 1000) {
    mensagem = "O resumo do evento pode ter no máximo 1000 caracteres.";
  }

  campo.setCustomValidity(mensagem);
  return mensagem === "";
}

function normalizarCampo(campo) {
  if (!campo) return;

  if (campo.id === "doc-associado") {
    campo.value = somenteDigitos(campo.value).slice(0, 11);
  }

  if (campo.id === "placa-veiculo") {
    campo.value = letrasENumerosMaiusculos(campo.value).slice(0, 7);
  }

  if (campo.id === "uf-evento") {
    campo.value = (campo.value || "")
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .slice(0, 2);
  }

  if (campo.id === "cidade-evento") {
    campo.value = somenteLetrasEspacosHifenAcentos(campo.value).slice(0, 80);
  }
}

function configurarValidacaoEmTempoReal() {
  const ids = [
    "protocolo",
    "doc-associado",
    "placa-veiculo",
    "uf-evento",
    "nome-associado",
    "cidade-evento",
    "local-evento",
    "resumo-evento"
  ];

  ids.forEach((id) => {
    const campo = getElement(id);
    if (!campo) return;

    campo.addEventListener("input", () => {
      normalizarCampo(campo);
      validarCampo(campo);
    });

    campo.addEventListener("blur", () => {
      normalizarCampo(campo);
      validarCampo(campo);
      campo.reportValidity();
    });
  });
}

function validarFormulario() {
  const ids = [
    "protocolo",
    "doc-associado",
    "placa-veiculo",
    "uf-evento",
    "nome-associado",
    "cidade-evento",
    "local-evento",
    "resumo-evento"
  ];

  for (const id of ids) {
    const campo = getElement(id);
    if (!campo) continue;

    normalizarCampo(campo);
    validarCampo(campo);

    if (!campo.checkValidity()) {
      campo.reportValidity();
      campo.focus();
      return false;
    }
  }

  return true;
}

async function salvarCaso(event) {
  event.preventDefault();

  if (!validarFormulario()) {
    return;
  }

  const docAssociado = somenteDigitos(valorOuNull("doc-associado"));
  const placaVeiculo = letrasENumerosMaiusculos(valorOuNull("placa-veiculo"));
  const ufEvento = valorOuNull("uf-evento")?.trim().toUpperCase() || null;

  const payload = {
    protocolo: textoLimitado("protocolo", 50),
    data_abertura: dataOuNull("data-abertura"),
    canal_entrada: textoLimitado("canal-entrada", 50),
    unidade: textoLimitado("unidade", 100),
    nome_associado: textoLimitado("nome-associado", 120),
    doc_associado: docAssociado || null,
    id_contrato: textoLimitado("id-contrato", 50),
    placa_veiculo: placaVeiculo || null,
    cidade_evento: textoLimitado("cidade-evento", 80),
    uf_evento: ufEvento,
    local_evento: textoLimitado("local-evento", 150),
    resumo_evento: textoLimitado("resumo-evento", 1000),

    case_number: textoLimitado("protocolo", 50),
    origin: textoLimitado("canal-entrada", 50),
    exception_details: textoLimitado("resumo-evento", 1000),
    status: "aberto"
  };

  const { error } = await supabase.from("cases").insert(payload);

  if (error) {
    alert("Erro ao salvar caso: " + error.message);
    return;
  }

  alert("Caso salvo com sucesso!");

  const form = document.querySelector(".case-form");
  if (form) {
    form.reset();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  configurarLimitesHTML();
  await carregarCidadesIBGE();
  configurarValidacaoEmTempoReal();

  const form = document.querySelector(".case-form");
  if (form) {
    form.addEventListener("submit", salvarCaso);
  }
});
