import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const SUPABASE_URL = "https://grkjvkhukizetjmszllm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_tjMHhHDymhlazNWD8UPr4g_79o03fhZ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  aplicarMaxLength("placa-veiculo", 8);
  aplicarMaxLength("cidade-evento", 80);
  aplicarMaxLength("uf-evento", 2);
  aplicarMaxLength("local-evento", 150);
  aplicarMaxLength("resumo-evento", 1000);
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
    const placa = letrasENumerosMaiusculos(valor);

    if (placa.length < 7) {
      mensagem = "A placa deve ter 7 caracteres.";
    } else if (placa.length > 7) {
      mensagem = "A placa deve ter exatamente 7 caracteres.";
    }
  }

  if (id === "uf-evento" && valor) {
    const uf = valor.toUpperCase();

    if (uf.length !== 2) {
      mensagem = "A UF deve ter exatamente 2 letras.";
    } else if (!/^[A-Z]{2}$/.test(uf)) {
      mensagem = "A UF deve conter apenas letras.";
    }
  }

  if (id === "nome-associado" && valor.length > 120) {
    mensagem = "O nome do associado pode ter no máximo 120 caracteres.";
  }

  if (id === "cidade-evento" && valor.length > 80) {
    mensagem = "A cidade do evento pode ter no máximo 80 caracteres.";
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

document.addEventListener("DOMContentLoaded", () => {
  configurarLimitesHTML();
  configurarValidacaoEmTempoReal();

  const form = document.querySelector(".case-form");
  if (form) {
    form.addEventListener("submit", salvarCaso);
  }
});
